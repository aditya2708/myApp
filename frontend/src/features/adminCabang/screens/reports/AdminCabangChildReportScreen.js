import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '../../../../common/components/EmptyState';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import ChildAttendanceSummarySection from '../../components/reports/child/ChildAttendanceSummarySection';
import ChildAttendanceBarChart from '../../components/reports/child/ChildAttendanceBarChart';
import ChildAttendanceCard from '../../components/reports/child/ChildAttendanceCard';
import ChildAttendanceFilterSheet from '../../components/reports/child/ChildAttendanceFilterSheet';
import ChildAttendanceDetailModal from '../../components/reports/child/ChildAttendanceDetailModal';
import { useChildAttendanceReportList } from '../../hooks/reports/child/useChildAttendanceReportList';
import { useChildAttendanceReportDetail } from '../../hooks/reports/child/useChildAttendanceReportDetail';

const extractChildId = (child) => {
  if (!child) return null;

  return (
    child.id ??
    child.childId ??
    child.child_id ??
    child.attendanceId ??
    child.attendance_id ??
    child.identifier ??
    child.code ??
    child.childCode ??
    null
  );
};

const normalizeFilters = (filters = {}, params = {}) => {
  const resolve = (...candidates) => {
    for (const value of candidates) {
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
  };

  const normalized = {
    search: resolve(filters.search, filters.keyword, filters.q, params.search, params.keyword, params.q, ''),
    shelterId: resolve(filters.shelterId, filters.shelter_id, params.shelterId, params.shelter_id),
    groupId: resolve(filters.groupId, filters.group_id, params.groupId, params.group_id),
    band: resolve(
      filters.band,
      filters.attendanceBand,
      filters.attendance_band,
      params.band,
      params.attendanceBand,
      params.attendance_band,
    ),
    startDate: resolve(filters.startDate, filters.start_date, params.startDate, params.start_date),
    endDate: resolve(filters.endDate, filters.end_date, params.endDate, params.end_date),
  };

  if (normalized.search === null) {
    normalized.search = '';
  }

  return normalized;
};

const getFilterOptions = (options = {}, available = {}) => {
  const source = options && Object.keys(options).length ? options : available;

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (value.items) return toArray(value.items);
    if (value.data) return toArray(value.data);
    return [];
  };

  return {
    shelters: toArray(
      source.shelters ??
        source.shelter ??
        source.shelterOptions ??
        source.shelter_options ??
        source.availableShelters,
    ),
    groups: toArray(
      source.groups ??
        source.group ??
        source.groupOptions ??
        source.group_options ??
        source.availableGroups,
    ),
    bands:
      toArray(
        source.bands ??
          source.bandOptions ??
          source.band_options ??
          source.attendanceBands ??
          source.attendance_band_options,
      ) || [],
    loading: Boolean(source.loading ?? source.isLoading ?? source.fetching),
  };
};

const countActiveFilters = (filters) => {
  if (!filters) return 0;

  let count = 0;

  if (filters.search && String(filters.search).trim()) count += 1;
  if (filters.shelterId) count += 1;
  if (filters.groupId) count += 1;
  if (filters.band) count += 1;
  if (filters.startDate) count += 1;
  if (filters.endDate) count += 1;

  return count;
};

const AdminCabangChildReportScreen = () => {
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [selectedChildMeta, setSelectedChildMeta] = useState(null);
  const [isDetailVisible, setDetailVisible] = useState(false);

  const reportState = useChildAttendanceReportList?.() || {};

  const {
    summary,
    children = [],
    pagination,
    params = {},
    filters: rawFilters = {},
    chartData: chartDataFromHook,
    shelterAttendanceChart,
    shelterBreakdown,
    lastRefreshedAt,
    generatedAt,
    period,
    isLoading = false,
    isInitialLoading,
    isRefreshing = false,
    isFetchingMore = false,
    error,
    errorMessage,
    hasNextPage,
    refresh,
    refetch,
    loadMore,
    fetchNextPage,
    applyFilters,
    availableFilters,
    filterOptions,
    resetFilters,
    clearFilters,
    setSearch,
    setShelterId,
    setGroupId,
    setBand,
    setDateRange,
    setStartDate,
    setEndDate,
  } = reportState;

  const normalizedFilters = useMemo(
    () => normalizeFilters(rawFilters, params),
    [rawFilters, params],
  );

  const { shelters, groups, bands, loading: isFilterLoading } = useMemo(
    () => getFilterOptions(filterOptions, availableFilters),
    [availableFilters, filterOptions],
  );

  const activeFiltersCount = useMemo(
    () => countActiveFilters(normalizedFilters),
    [normalizedFilters],
  );

  const listContentStyle = useMemo(() => {
    if (children && children.length) {
      return styles.listContent;
    }

    return [styles.listContent, styles.listContentEmpty];
  }, [children]);

  const chartData = useMemo(() => {
    const sources = [
      chartDataFromHook,
      shelterAttendanceChart,
      shelterBreakdown,
      reportState?.shelter_attendance_chart,
      reportState?.shelter_breakdown,
      summary?.shelterBreakdown,
    ];

    for (const source of sources) {
      if (Array.isArray(source) && source.length) {
        return source;
      }
    }

    return [];
  }, [chartDataFromHook, reportState, shelterAttendanceChart, shelterBreakdown, summary]);

  const currentPagination = useMemo(() => {
    if (!pagination) return null;

    if (pagination.page || pagination.perPage || pagination.totalPages !== undefined) {
      return pagination;
    }

    return {
      page: pagination.current_page ?? pagination.page ?? 1,
      perPage: pagination.per_page ?? pagination.perPage ?? 10,
      total: pagination.total ?? pagination.total_items ?? 0,
      totalPages: pagination.total_pages ?? pagination.totalPages ?? pagination.last_page ?? 1,
    };
  }, [pagination]);

  const effectiveHasNextPage = useMemo(() => {
    if (typeof hasNextPage === 'boolean') return hasNextPage;
    if (!currentPagination) return false;
    const totalPages = currentPagination.totalPages ?? currentPagination.last_page ?? 1;
    const currentPage = currentPagination.page ?? currentPagination.current_page ?? 1;
    return currentPage < totalPages;
  }, [currentPagination, hasNextPage]);

  const isListInitialLoading = useMemo(() => {
    if (typeof isInitialLoading === 'boolean') {
      return isInitialLoading;
    }
    return isLoading && (!children || children.length === 0);
  }, [children, isInitialLoading, isLoading]);

  const topErrorMessage = useMemo(() => {
    if (typeof errorMessage === 'string' && errorMessage.trim()) return errorMessage;
    if (error?.message) return error.message;
    return null;
  }, [error, errorMessage]);

  const handleOpenFilters = useCallback(() => setFilterVisible(true), []);
  const handleCloseFilters = useCallback(() => setFilterVisible(false), []);

  const handleApplyFilters = useCallback(
    (nextFilters = {}) => {
      if (typeof applyFilters === 'function') {
        applyFilters(nextFilters);
        return;
      }

      const { search, shelterId, groupId, band, startDate, endDate } = nextFilters;

      if (setSearch) {
        setSearch(search ?? '');
      }

      setShelterId?.(shelterId ?? null);
      setGroupId?.(groupId ?? null);
      setBand?.(band ?? null);

      if (setDateRange) {
        setDateRange({ startDate: startDate ?? null, endDate: endDate ?? null });
      } else {
        setStartDate?.(startDate ?? null);
        setEndDate?.(endDate ?? null);
      }

      if (typeof refresh === 'function') {
        refresh();
      } else if (typeof refetch === 'function') {
        refetch();
      }
    },
    [
      applyFilters,
      refetch,
      refresh,
      setBand,
      setDateRange,
      setEndDate,
      setGroupId,
      setSearch,
      setShelterId,
      setStartDate,
    ],
  );

  const handleResetFilters = useCallback(() => {
    if (typeof resetFilters === 'function') {
      resetFilters();
    } else if (typeof clearFilters === 'function') {
      clearFilters();
    } else {
      setSearch?.('');
      setShelterId?.(null);
      setGroupId?.(null);
      setBand?.(null);
      if (setDateRange) {
        setDateRange({ startDate: null, endDate: null });
      } else {
        setStartDate?.(null);
        setEndDate?.(null);
      }
    }

    if (typeof refresh === 'function') {
      refresh();
    } else if (typeof refetch === 'function') {
      refetch();
    }
  }, [
    clearFilters,
    refetch,
    refresh,
    resetFilters,
    setBand,
    setDateRange,
    setEndDate,
    setGroupId,
    setSearch,
    setShelterId,
    setStartDate,
  ]);

  const handleRefresh = useCallback(async () => {
    const refresher = refresh || refetch;
    if (!refresher) return;

    try {
      await refresher();
    } catch (err) {
      // noop - errors handled by hook state
    }
  }, [refresh, refetch]);

  const handleLoadMore = useCallback(() => {
    if (!effectiveHasNextPage || isLoading || isFetchingMore) return;

    if (typeof loadMore === 'function') {
      loadMore();
      return;
    }

    if (typeof fetchNextPage === 'function') {
      fetchNextPage();
    }
  }, [effectiveHasNextPage, fetchNextPage, isFetchingMore, isLoading, loadMore]);

  const handleSelectChild = useCallback((child) => {
    const childId = extractChildId(child);
    if (!childId) {
      return;
    }

    setSelectedChildMeta({ id: childId, fallback: child });
    setDetailVisible(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailVisible(false);
  }, []);

  const selectedChildId = selectedChildMeta?.id ?? null;

  const detailState = useChildAttendanceReportDetail({
    childId: selectedChildId,
    filters: {
      startDate: normalizedFilters.startDate,
      endDate: normalizedFilters.endDate,
    },
    enabled: isDetailVisible && Boolean(selectedChildId),
  });

  const {
    child: detailChild,
    monthlyBreakdown,
    timeline,
    isLoading: isDetailLoading = false,
    error: detailError,
    errorMessage: detailErrorMessage,
    refresh: refreshDetail,
    refetch: refetchDetail,
  } = detailState || {};

  const detailRefreshHandler = useCallback(() => {
    if (typeof refreshDetail === 'function') {
      return refreshDetail();
    }
    if (typeof refetchDetail === 'function') {
      return refetchDetail();
    }
    return Promise.resolve();
  }, [refreshDetail, refetchDetail]);

  const combinedDetailChild = detailChild || selectedChildMeta?.fallback || null;

  const listHeader = useMemo(() => {
    return (
      <View>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderTextWrapper}>
            <Text style={styles.pageTitle}>Laporan Kehadiran Anak</Text>
            <Text style={styles.pageSubtitle}>
              Pantau performa kehadiran anak binaan di seluruh shelter cabang Anda.
            </Text>
            {lastRefreshedAt ? (
              <Text style={styles.pageMetaText}>Terakhir diperbarui: {lastRefreshedAt}</Text>
            ) : null}
            {period?.label ? (
              <Text style={styles.pageMetaText}>Periode: {period.label}</Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.filterButton} onPress={handleOpenFilters}>
            <Ionicons name="filter" size={20} color="#ffffff" />
            {activeFiltersCount ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <ChildAttendanceSummarySection
          summary={summary}
          loading={isListInitialLoading}
          reportDate={generatedAt}
          periodLabel={period?.label}
        />

        <ChildAttendanceBarChart data={chartData} loading={isLoading && !chartData.length} />

        {children && children.length ? (
          <Text style={styles.sectionTitle}>Daftar Anak</Text>
        ) : null}
      </View>
    );
  }, [
    activeFiltersCount,
    chartData,
    children,
    generatedAt,
    handleOpenFilters,
    isListInitialLoading,
    isLoading,
    lastRefreshedAt,
    period?.label,
    summary,
  ]);

  const listEmptyComponent = useMemo(() => {
    if (isListInitialLoading) {
      return (
        <View style={styles.skeletonContainer}>
          {[0, 1, 2].map((index) => (
            <ChildAttendanceCard key={`skeleton-${index}`} loading style={styles.skeletonCard} />
          ))}
        </View>
      );
    }

    return (
      <EmptyState
        icon="people-outline"
        title="Belum ada data kehadiran"
        message="Data kehadiran anak akan muncul setelah laporan berhasil dimuat."
        onRetry={handleRefresh}
      />
    );
  }, [handleRefresh, isListInitialLoading]);

  const listFooterComponent = useMemo(() => {
    if (!isFetchingMore) return null;

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator color="#0984e3" />
      </View>
    );
  }, [isFetchingMore]);

  const keyExtractor = useCallback((item, index) => {
    const childId = extractChildId(item);
    if (!childId) return `child-${index}`;
    return String(childId);
  }, []);

  const renderChildItem = useCallback(
    ({ item }) => (
      <ChildAttendanceCard
        child={item}
        onPress={() => handleSelectChild(item)}
        onViewDetail={() => handleSelectChild(item)}
        actionLabel="Detail"
      />
    ),
    [handleSelectChild],
  );

  return (
    <View style={styles.container}>
      {topErrorMessage ? (
        <ErrorMessage message={topErrorMessage} onRetry={handleRefresh} />
      ) : null}

      <FlatList
        data={children}
        renderItem={renderChildItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={listContentStyle}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        refreshControl={
          <RefreshControl refreshing={Boolean(isRefreshing)} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />

      <ChildAttendanceFilterSheet
        visible={isFilterVisible}
        onClose={handleCloseFilters}
        filters={normalizedFilters}
        shelters={shelters}
        groups={groups}
        bands={bands}
        loading={isFilterLoading}
        onApply={handleApplyFilters}
        onReset={() => {
          handleResetFilters();
          handleCloseFilters();
        }}
      />

      <ChildAttendanceDetailModal
        visible={isDetailVisible}
        onClose={handleCloseDetail}
        child={combinedDetailChild}
        monthlyBreakdown={monthlyBreakdown}
        timeline={timeline}
        loading={isDetailLoading}
        onRefresh={detailRefreshHandler}
      />

      {isDetailVisible && (detailError || detailErrorMessage) ? (
        <View style={styles.detailErrorBanner}>
          <Text style={styles.detailErrorText}>
            {detailErrorMessage || detailError?.message || 'Gagal memuat detail kehadiran anak.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listContent: {
    paddingBottom: 48,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pageHeaderTextWrapper: {
    flex: 1,
    paddingRight: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
  },
  pageMetaText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 6,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0984e3',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 4,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 12,
    marginTop: 8,
  },
  skeletonContainer: {
    paddingVertical: 24,
  },
  skeletonCard: {
    marginBottom: 12,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  detailErrorBanner: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  detailErrorText: {
    color: '#c0392b',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default AdminCabangChildReportScreen;
