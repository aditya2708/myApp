import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import AchievementReportFilters from '../../components/AchievementReportFilters';
import { useAchievementReports, useJenisKegiatanOptions } from '../../hooks/useAchievementReports';

const INITIAL_FILTERS = {
  startDate: null,
  endDate: null,
  jenisKegiatan: null
};

const formatNilai = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
};

const ChildAchievementReportScreen = () => {
  const navigation = useNavigation();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { 
    data: reportsData, 
    isLoading, 
    isError, 
    error, 
    isFetching, 
    refetch 
  } = useAchievementReports(filters, currentPage);

  const { data: jenisOptions = [{ value: null, label: 'Semua Jenis' }] } = useJenisKegiatanOptions();

  const records = reportsData?.data ?? [];
  const meta = reportsData?.meta ?? {};

  const hasActiveFilters = useMemo(() => (
    Boolean(filters.startDate || filters.endDate || filters.jenisKegiatan)
  ), [filters.endDate, filters.jenisKegiatan, filters.startDate]);

  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (isFetching) return;
    
    const current = meta.current_page ?? 1;
    const last = meta.last_page ?? 1;
    
    if (current < last) {
      setCurrentPage(current + 1);
    }
  }, [isFetching, meta.current_page, meta.last_page]);

  const handleApplyFilters = useCallback((nextFilters) => {
    setFilters({
      startDate: nextFilters.start_date ?? null,
      endDate: nextFilters.end_date ?? null,
      jenisKegiatan: nextFilters.jenis_kegiatan ?? null
    });
    setCurrentPage(1);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback((defaults) => {
    const resolved = defaults ?? {};
    setFilters({
      startDate: resolved.start_date ?? INITIAL_FILTERS.startDate,
      endDate: resolved.end_date ?? INITIAL_FILTERS.endDate,
      jenisKegiatan: resolved.jenis_kegiatan ?? INITIAL_FILTERS.jenisKegiatan
    });
    setCurrentPage(1);
    setShowFilters(false);
  }, []);

  const handleCardPress = useCallback((item) => {
    navigation.navigate('ChildAchievementDetail', { item });
  }, [navigation]);

  const resolveKelompokName = (record) => {
    const rawName = record?.kelompok?.nama
      ?? record?.anak?.nama_kelompok
      ?? null;

    if (typeof rawName !== 'string') {
      return null;
    }

    const trimmed = rawName.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons name="bar-chart-outline" size={24} color="#1e88e5" />
        <Text style={styles.summaryTitle}>Total Pencapaian</Text>
      </View>
      <Text style={styles.summaryValue}>{meta.total ?? 0}</Text>
      <Text style={styles.summarySubtitle}>
        {hasActiveFilters ? 'Dengan filter aktif' : 'Semua periode'}
      </Text>
    </View>
  );

  const renderCard = (item) => {
    const groupName = resolveKelompokName(item);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.childName}>{item?.anak?.nama ?? 'Tanpa Nama'}</Text>
            {groupName && (
              <View style={styles.groupBadge}>
                <Ionicons name="people-outline" size={12} color="#1e88e5" />
                <Text style={styles.groupBadgeText}>{groupName}</Text>
              </View>
            )}
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreValue}>{formatNilai(item?.nilai)}</Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.dateText}>{item?.tanggal_penilaian ?? '-'}</Text>
          {item?.jenis_kegiatan && (
            <View style={styles.activityBadge}>
              <Text style={styles.activityBadgeText}>{item.jenis_kegiatan}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Ionicons name="chevron-forward" size={16} color="#9aa5b1" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecord = ({ item }) => renderCard(item);

  if (isLoading && records.length === 0 && !isError) {
    return (
      <View style={styles.centeredContainer}>
        <LoadingSpinner message="Memuat laporan pencapaian anak..." />
      </View>
    );
  }

  if (isError && records.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ErrorMessage
          message={error?.message || 'Terjadi kesalahan saat memuat laporan.'}
          onRetry={handleRefresh}
        />
        <AchievementReportFilters
          visible={showFilters}
          filters={{
            start_date: filters.startDate,
            end_date: filters.endDate,
            jenis_kegiatan: filters.jenisKegiatan
          }}
          defaultFilters={INITIAL_FILTERS}
          onClose={() => setShowFilters(false)}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          jenisOptions={jenisOptions}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Section */}
      <View style={styles.summarySection}>
        {renderSummaryCard()}
      </View>

      {/* List Section */}
      <FlatList
        data={records}
        keyExtractor={(item, index) => (
          item?.id_penilaian ? String(item.id_penilaian) : `temp-${index}`
        )}
        renderItem={renderRecord}
        contentContainerStyle={
          records.length === 0
            ? styles.emptyContent
            : styles.listContent
        }
        refreshControl={(
          <RefreshControl
            refreshing={isFetching && currentPage === 1}
            onRefresh={handleRefresh}
            colors={['#1e88e5']}
            tintColor="#1e88e5"
          />
        )}
        onEndReachedThreshold={0.2}
        onEndReached={handleLoadMore}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color="#9aa5b1" />
            <Text style={styles.emptyTitle}>Belum ada pencapaian</Text>
            <Text style={styles.emptySubtitle}>
              Coba sesuaikan rentang tanggal atau jenis kegiatan untuk melihat data lainnya.
            </Text>
          </View>
        )}
        ListFooterComponent={(
          isFetching && currentPage > 1 ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color="#1e88e5" />
              <Text style={styles.footerLoadingText}>Memuat data tambahan...</Text>
            </View>
          ) : null
        )}
      />

      <AchievementReportFilters
        visible={showFilters}
        filters={{
          start_date: filters.startDate,
          end_date: filters.endDate,
          jenis_kegiatan: filters.jenisKegiatan
        }}
        defaultFilters={INITIAL_FILTERS}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        jenisOptions={jenisOptions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb'
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
    padding: 16
  },
  summarySection: {
    padding: 16,
    paddingBottom: 8
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1f2933',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#52606d'
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e88e5',
    marginBottom: 4
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#7b8794'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1f2933',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 6
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    alignSelf: 'flex-start'
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e88e5'
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e88e5'
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  dateText: {
    fontSize: 13,
    color: '#52606d',
    fontWeight: '500'
  },
  activityBadge: {
    backgroundColor: 'rgba(30, 136, 229, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  activityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e88e5'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#52606d'
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7b8794',
    textAlign: 'center',
    lineHeight: 20
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerLoadingText: {
    marginTop: 6,
    fontSize: 13,
    color: '#7b8794'
  }
});

export default ChildAchievementReportScreen;
