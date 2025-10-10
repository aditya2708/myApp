import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import SearchBar from '../../../../common/components/SearchBar';
import {
  ChildAttendanceBarChart,
  ChildAttendanceCard,
  ChildAttendanceDetailModal,
  ChildAttendanceFilterSheet,
  ChildAttendanceSummarySection,
} from '../../../components/reports/child';
import useChildAttendanceReportList from '../../../hooks/reports/child/useChildAttendanceReportList';
import useChildAttendanceReportDetail from '../../../hooks/reports/child/useChildAttendanceReportDetail';

const AdminCabangChildReportScreen = () => {
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [isDetailVisible, setDetailVisible] = useState(false);

  const {
    summary,
    children,
    shelterChart,
    availableFilters,
    filters,
    params,
    pagination,
    isLoading,
    isRefreshing,
    errorMessage,
    setSearch,
    setBand,
    setShelter,
    setGroup,
    setDateRange,
    setPage,
    resetFilters,
    refresh,
  } = useChildAttendanceReportList();

  const numberFormatter = useMemo(() => new Intl.NumberFormat('id-ID'), []);
  const hasChildren = children.length > 0;
  const hasMore = pagination.page < pagination.totalPages;

  const focusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusRef.current) {
        refresh();
      } else {
        focusRef.current = true;
      }
    }, [refresh]),
  );

  const {
    child: detailChild,
    monthlyBreakdown,
    timeline,
    isLoading: isDetailLoading,
    fetch: fetchChildDetail,
    refresh: refreshChildDetail,
  } = useChildAttendanceReportDetail(selectedChildId, {
    autoFetch: false,
    enabled: Boolean(selectedChildId),
    params: {
      band: filters?.band ?? null,
      shelterId: filters?.shelterId ?? null,
      groupId: filters?.groupId ?? null,
      startDate: filters?.startDate ?? null,
      endDate: filters?.endDate ?? null,
    },
  });

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) || null,
    [children, selectedChildId],
  );

  useEffect(() => {
    if (selectedChildId && isDetailVisible) {
      fetchChildDetail({}, { initial: true });
    }
  }, [fetchChildDetail, isDetailVisible, selectedChildId]);

  const handleSearchChange = useCallback(
    (text) => {
      setSearch(text);
    },
    [setSearch],
  );

  const handleOpenFilters = useCallback(() => {
    setFilterVisible(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setFilterVisible(false);
  }, []);

  const handleApplyFilters = useCallback(
    (nextFilters) => {
      setSearch(nextFilters?.search ?? '');
      setBand(nextFilters?.band ?? null);
      setShelter(nextFilters?.shelterId ?? null);
      setGroup(nextFilters?.groupId ?? null);
      setDateRange({
        start: nextFilters?.startDate ?? null,
        end: nextFilters?.endDate ?? null,
      });
    },
    [setBand, setDateRange, setGroup, setSearch, setShelter],
  );

  const handleResetFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleEndReached = useCallback(() => {
    if (!isLoading && !isRefreshing && hasMore) {
      setPage(pagination.page + 1);
    }
  }, [hasMore, isLoading, isRefreshing, pagination.page, setPage]);

  const handleCardPress = useCallback(
    (child) => {
      if (!child?.id) {
        return;
      }

      setSelectedChildId(child.id);
      setDetailVisible(true);
    },
    [],
  );

  const handleCloseDetail = useCallback(() => {
    setDetailVisible(false);
    setSelectedChildId(null);
  }, []);

  const handleRetry = useCallback(() => {
    refresh();
  }, [refresh]);

  const hasActiveFilters = useMemo(() => {
    if (!filters) {
      return false;
    }

    return Boolean(
      (filters.band && filters.band !== null) ||
        (filters.shelterId && filters.shelterId !== null) ||
        (filters.groupId && filters.groupId !== null) ||
        filters.startDate ||
        filters.endDate ||
        (params?.search && params.search.trim().length > 0),
    );
  }, [filters, params?.search]);

  const summaryStats = useMemo(() => {
    const totalChildrenValue = summary?.totalChildren ?? 0;
    const activeChildrenValue = summary?.activeChildren ?? 0;
    const totalSessionsValue = summary?.totalSessions ?? summary?.totals?.totalSessions ?? 0;
    const attendanceRateLabel = summary?.attendanceRate?.label ?? '0%';

    return {
      totalChildren: numberFormatter.format(totalChildrenValue),
      activeChildren: numberFormatter.format(activeChildrenValue),
      totalSessions: numberFormatter.format(totalSessionsValue),
      attendanceRateLabel,
    };
  }, [numberFormatter, summary]);

  const renderListHeader = useMemo(() => {
    if (!hasChildren && isLoading) {
      return null;
    }

    return (
      <View style={styles.headerContainer}>
        <View style={styles.summaryMeta}>
          <View style={styles.summaryMetaItem}>
            <Ionicons name="people" size={18} color="#2d3436" style={styles.summaryMetaIcon} />
            <Text style={styles.summaryMetaLabel}>Total Anak</Text>
            <Text style={styles.summaryMetaValue}>{summaryStats.totalChildren}</Text>
          </View>
          <View style={styles.summaryMetaItem}>
            <Ionicons name="star-outline" size={18} color="#2d3436" style={styles.summaryMetaIcon} />
            <Text style={styles.summaryMetaLabel}>Aktif</Text>
            <Text style={styles.summaryMetaValue}>{summaryStats.activeChildren}</Text>
          </View>
          <View style={styles.summaryMetaItem}>
            <Ionicons name="time-outline" size={18} color="#2d3436" style={styles.summaryMetaIcon} />
            <Text style={styles.summaryMetaLabel}>Total Sesi</Text>
            <Text style={styles.summaryMetaValue}>{summaryStats.totalSessions}</Text>
          </View>
          <View style={styles.summaryMetaItem}>
            <Ionicons name="stats-chart" size={18} color="#2d3436" style={styles.summaryMetaIcon} />
            <Text style={styles.summaryMetaLabel}>Rata-rata Kehadiran</Text>
            <Text style={styles.summaryMetaValue}>{summaryStats.attendanceRateLabel}</Text>
          </View>
        </View>
        <ChildAttendanceSummarySection summary={summary} loading={isLoading && !hasChildren} />
        <ChildAttendanceBarChart data={shelterChart} loading={isLoading && !hasChildren} />
      </View>
    );
  }, [hasChildren, isLoading, shelterChart, summary, summaryStats]);

  const renderItem = useCallback(
    ({ item }) => (
      <ChildAttendanceCard child={item} onPress={() => handleCardPress(item)} />
    ),
    [handleCardPress],
  );

  const keyExtractor = useCallback((item, index) => {
    const key = item?.id ?? item?.identifier ?? item?.code ?? `child-${index}`;
    return String(key);
  }, []);

  const renderListFooter = useMemo(() => {
    if (!hasChildren) {
      return null;
    }

    if (isRefreshing && pagination.page > 1) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator color="#0984e3" />
          <Text style={styles.footerLoadingText}>Memuat data...</Text>
        </View>
      );
    }

    if (!hasMore) {
      return (
        <View style={styles.footerEnd}>
          <Text style={styles.footerEndText}>Seluruh data telah ditampilkan.</Text>
        </View>
      );
    }

    return null;
  }, [hasChildren, hasMore, isRefreshing, pagination.page]);

  if (isLoading && !hasChildren) {
    return <LoadingSpinner fullScreen message="Memuat laporan kehadiran anak..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <SearchBar
          value={params?.search ?? ''}
          onChangeText={handleSearchChange}
          placeholder="Cari nama anak"
          style={styles.searchBar}
        />
        <TouchableOpacity style={styles.filterButton} onPress={handleOpenFilters}>
          <Ionicons
            name="filter"
            size={20}
            color={hasActiveFilters ? '#9b59b6' : '#2d3436'}
          />
          {hasActiveFilters ? <View style={styles.filterIndicator} /> : null}
        </TouchableOpacity>
      </View>

      {errorMessage ? <ErrorMessage message={errorMessage} onRetry={handleRetry} /> : null}

      <FlatList
        data={children}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, !hasChildren && styles.listContentEmpty]}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Belum ada data anak"
              message="Coba ubah filter atau segarkan halaman untuk melihat data terbaru."
              onRetry={handleRetry}
              retryButtonText="Muat Ulang"
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing && pagination.page === 1}
            onRefresh={handleRefresh}
            colors={["#0984e3"]}
          />
        }
        onEndReachedThreshold={0.3}
        onEndReached={handleEndReached}
      />

      <ChildAttendanceFilterSheet
        visible={isFilterVisible}
        onClose={handleCloseFilters}
        filters={{
          ...filters,
          search: params?.search ?? '',
        }}
        shelters={availableFilters?.shelters ?? []}
        groups={availableFilters?.groups ?? []}
        bands={availableFilters?.bands ?? []}
        loading={isLoading && !hasChildren}
        onApply={(appliedFilters) => {
          handleApplyFilters(appliedFilters);
          handleCloseFilters();
        }}
        onReset={() => {
          handleResetFilters();
          handleCloseFilters();
        }}
      />

      <ChildAttendanceDetailModal
        visible={isDetailVisible}
        onClose={handleCloseDetail}
        child={detailChild || selectedChild}
        monthlyBreakdown={monthlyBreakdown}
        timeline={timeline}
        loading={isDetailLoading}
        onRefresh={refreshChildDetail}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    padding: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    marginRight: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9b59b6',
  },
  headerContainer: {
    paddingBottom: 16,
  },
  summaryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    padding: 12,
  },
  summaryMetaItem: {
    width: '50%',
    padding: 8,
  },
  summaryMetaIcon: {
    marginBottom: 6,
  },
  summaryMetaLabel: {
    fontSize: 12,
    color: '#636e72',
  },
  summaryMetaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerLoadingText: {
    marginTop: 8,
    color: '#636e72',
    fontSize: 14,
  },
  footerEnd: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerEndText: {
    fontSize: 13,
    color: '#95a5a6',
  },
});

export default AdminCabangChildReportScreen;
