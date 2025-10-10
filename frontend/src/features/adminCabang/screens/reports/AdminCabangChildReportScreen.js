import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import SearchBar from '../../../../common/components/SearchBar';
import {
  ChildAttendanceBarChart,
  ChildAttendanceCard,
  ChildAttendanceDetailModal,
  ChildAttendanceFilterSheet,
  ChildAttendanceSummarySection,
} from '../../../components/reports/child';
import useChildAttendanceReportDetail from '../../../hooks/reports/child/useChildAttendanceReportDetail';
import useChildAttendanceReportList from '../../../hooks/reports/child/useChildAttendanceReportList';

const AdminCabangChildReportScreen = () => {
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [searchText, setSearchText] = useState('');
  const isFirstSearchRef = useRef(true);

  const {
    summary,
    period,
    children,
    chartData,
    distribution,
    availableFilters,
    filters,
    lastRefreshedAt,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    loadMore,
    applyFilters,
    resetFilters,
    updateSearch,
  } = useChildAttendanceReportList();

  const {
    child: detailChild,
    summary: detailSummary,
    monthlyBreakdown,
    timeline,
    verificationSummary,
    streaks: detailStreaks,
    loading: detailLoading,
  } = useChildAttendanceReportDetail(selectedChild?.id ?? null);

  useEffect(() => {
    setSearchText(filters?.search ?? '');
  }, [filters?.search]);

  useEffect(() => {
    if (isFirstSearchRef.current) {
      isFirstSearchRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      updateSearch(searchText);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchText, updateSearch]);

  const handleOpenFilter = useCallback(() => setFilterVisible(true), []);
  const handleCloseFilter = useCallback(() => setFilterVisible(false), []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore) {
      return;
    }

    loadMore();
  }, [loadMore, loadingMore]);

  const handleCardPress = useCallback((child) => {
    setSelectedChild(child);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedChild(null);
  }, []);

  const keyExtractor = useCallback((item) => String(item?.id ?? Math.random()), []);

  const renderItem = useCallback(
    ({ item }) => <ChildAttendanceCard child={item} onPress={handleCardPress} />,
    [handleCardPress],
  );

  const distributionSummary = useMemo(() => {
    const high = distribution?.high ?? 0;
    const medium = distribution?.medium ?? 0;
    const low = distribution?.low ?? 0;

    const total = high + medium + low;

    return { high, medium, low, total };
  }, [distribution]);

  const listHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      <ChildAttendanceSummarySection
        summary={summary}
        period={period}
        lastRefreshedAt={lastRefreshedAt}
      />
      <ChildAttendanceBarChart data={chartData} />
      <View style={styles.distributionContainer}>
        <View style={[styles.distributionItem, { backgroundColor: '#eaf7f0' }]}>
          <Text style={styles.distributionLabel}>Baik</Text>
          <Text style={styles.distributionValue}>{distributionSummary.high} anak</Text>
        </View>
        <View style={[styles.distributionItem, { backgroundColor: '#fff6e6' }]}>
          <Text style={styles.distributionLabel}>Cukup</Text>
          <Text style={styles.distributionValue}>{distributionSummary.medium} anak</Text>
        </View>
        <View style={[styles.distributionItem, { backgroundColor: '#fdecea' }]}>
          <Text style={styles.distributionLabel}>Rendah</Text>
          <Text style={styles.distributionValue}>{distributionSummary.low} anak</Text>
        </View>
      </View>
      <Text style={styles.distributionSummaryText}>
        Total anak dipantau: {distributionSummary.total} anak
      </Text>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daftar Anak Binaan</Text>
        <TouchableOpacity style={styles.filterButton} onPress={handleOpenFilter}>
          <Ionicons name="options" size={18} color="#0984e3" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [summary, period, lastRefreshedAt, chartData, distributionSummary, handleOpenFilter]);

  const listFooter = useMemo(() => {
    if (!loadingMore) {
      return <View style={styles.listFooterSpacing} />;
    }

    return <LoadingSpinner message="Memuat data tambahan..." />;
  }, [loadingMore]);

  const showEmptyState = !loading && !children.length;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Cari nama anak atau kelompok"
        />
        <TouchableOpacity style={styles.iconButton} onPress={handleOpenFilter}>
          <Ionicons name="funnel" size={20} color="#0984e3" />
        </TouchableOpacity>
      </View>

      {error ? <ErrorMessage message={error} onRetry={handleRefresh} /> : null}

      {loading && !children.length ? (
        <LoadingSpinner fullScreen message="Memuat laporan kehadiran anak..." />
      ) : (
        <FlatList
          data={children}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReachedThreshold={0.35}
          onEndReached={handleLoadMore}
          ListEmptyComponent={
            showEmptyState ? (
              <EmptyState
                title="Belum ada data"
                message="Tidak ditemukan anak sesuai filter yang dipilih."
              />
            ) : null
          }
        />
      )}

      <ChildAttendanceFilterSheet
        visible={filterVisible}
        onClose={handleCloseFilter}
        filters={filters}
        availableFilters={availableFilters}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      <ChildAttendanceDetailModal
        visible={!!selectedChild}
        onClose={handleCloseDetail}
        child={detailChild || selectedChild}
        summary={detailSummary}
        monthlyBreakdown={monthlyBreakdown}
        timeline={timeline}
        verificationSummary={verificationSummary}
        streaks={detailStreaks}
        loading={detailLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  distributionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  distributionItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  distributionSummaryText: {
    fontSize: 12,
    color: '#57606f',
    marginBottom: 16,
    marginLeft: 4,
  },
  distributionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
  },
  distributionValue: {
    marginTop: 6,
    fontSize: 14,
    color: '#2d3436',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e272e',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e9f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0984e3',
  },
  listContent: {
    paddingBottom: 32,
  },
  listFooterSpacing: {
    height: 32,
  },
});

export default AdminCabangChildReportScreen;
