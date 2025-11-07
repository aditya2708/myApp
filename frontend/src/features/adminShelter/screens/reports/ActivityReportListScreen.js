import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import ActivityReportFilters from '../../components/ActivityReportFilters';
import { activityReportApi } from '../../api/activityReportApi';
import { kegiatanApi } from '../../api/kegiatanApi';

const INITIAL_FILTERS = {
  startDate: null,
  endDate: null,
  jenisKegiatanId: null
};

const DEFAULT_JENIS_OPTION = {
  id: null,
  label: 'Semua Jenis'
};

const PER_PAGE = 10;

const ActivityReportListScreen = () => {
  const navigation = useNavigation();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });
  const [jenisOptions, setJenisOptions] = useState([DEFAULT_JENIS_OPTION]);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadJenisOptions = async () => {
      try {
        const response = await kegiatanApi.getAllKegiatan();
        const payload = response?.data?.data ?? [];
        const mapped = payload.map(item => ({
          id: item.id_kegiatan,
          label: item.nama_kegiatan
        }));

        if (isMounted && mapped.length > 0) {
          setJenisOptions([DEFAULT_JENIS_OPTION, ...mapped]);
        }
      } catch {
        // ignore filter options error to keep screen usable
      }
    };

    loadJenisOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasActiveFilters = useMemo(() => (
    Boolean(filters.startDate || filters.endDate || filters.jenisKegiatanId)
  ), [filters.endDate, filters.jenisKegiatanId, filters.startDate]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerFilterButton}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={hasActiveFilters ? 'filter' : 'filter-outline'}
            size={22}
            color={hasActiveFilters ? '#d35400' : '#1f2933'}
          />
          {hasActiveFilters ? <View style={styles.filterDot} /> : null}
        </TouchableOpacity>
      )
    });
  }, [navigation, hasActiveFilters]);

  const fetchReports = useCallback(async ({ page = 1, append = false } = {}) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    const params = {
      page,
      per_page: PER_PAGE
    };

    if (filters.startDate) {
      params.start_date = filters.startDate;
    }

    if (filters.endDate) {
      params.end_date = filters.endDate;
    }

    if (filters.jenisKegiatanId) {
      params.jenis_kegiatan_id = filters.jenisKegiatanId;
    }

    try {
      const response = await activityReportApi.listReports(params);
      const items = response?.data ?? [];
      const meta = response?.meta ?? {};

      setPagination({
        current_page: meta.current_page ?? page,
        last_page: meta.last_page ?? page,
        total: meta.total ?? items.length
      });

      setReports(prev => {
        if (append) {
          const knownIds = new Set(prev.map(item => item.id));
          const merged = [...prev];
          items.forEach(item => {
            if (!knownIds.has(item.id)) {
              merged.push(item);
            }
          });
          return merged;
        }

        return items;
      });
    } catch (err) {
      const message = err?.response?.data?.message || 'Terjadi kesalahan saat memuat laporan.';
      setError(message);
      if (!append) {
        setReports([]);
      }
      throw err;
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchReports({ page: 1 }).catch(() => {});
  }, [fetchReports]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports({ page: 1 })
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [fetchReports]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore) {
      return;
    }

    if ((pagination.current_page ?? 1) >= (pagination.last_page ?? 1)) {
      return;
    }

    const nextPage = (pagination.current_page ?? 1) + 1;
    fetchReports({ page: nextPage, append: true }).catch(() => {});
  }, [fetchReports, loading, loadingMore, pagination.current_page, pagination.last_page]);

  const handleApplyFilters = useCallback((appliedFilters) => {
    setFilters({
      startDate: appliedFilters.start_date ?? null,
      endDate: appliedFilters.end_date ?? null,
      jenisKegiatanId: appliedFilters.jenis_kegiatan_id ?? null
    });
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback((clearedFilters) => {
    setFilters({
      startDate: clearedFilters?.start_date ?? INITIAL_FILTERS.startDate,
      endDate: clearedFilters?.end_date ?? INITIAL_FILTERS.endDate,
      jenisKegiatanId: clearedFilters?.jenis_kegiatan_id ?? INITIAL_FILTERS.jenisKegiatanId
    });
    setShowFilters(false);
  }, []);

  const renderReportItem = useCallback(({ item }) => {
    const images = [item.foto_1, item.foto_2, item.foto_3].filter(Boolean);

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle} numberOfLines={2}>
            {item.nama_kegiatan || 'Tanpa nama kegiatan'}
          </Text>
          <Text style={styles.reportDate}>
            {item.tanggal || '-'}
          </Text>
        </View>

        {item.nama_tutor ? (
          <Text style={styles.tutorName}>
            Tutor: {item.nama_tutor}
          </Text>
        ) : null}

        {item.jenis_kegiatan ? (
          <View style={styles.jenisBadge}>
            <Ionicons name="pricetag-outline" size={14} color="#1d4e89" />
            <Text style={styles.jenisBadgeText}>{item.jenis_kegiatan}</Text>
          </View>
        ) : null}

        {images.length > 0 ? (
          <View style={styles.imageRow}>
            {images.map((uri, index) => (
              <Image
                key={`${item.id}-${index}`}
                source={{ uri }}
                style={[
                  styles.reportImage,
                  index !== images.length - 1 && styles.reportImageSpacing
                ]}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.noImageText}>Tidak ada foto kegiatan.</Text>
        )}
      </View>
    );
  }, []);

  const renderListEmpty = useCallback(() => {
    if (loading && !error) {
      return (
        <View style={styles.emptyState}>
          <LoadingSpinner message="Memuat laporan kegiatan..." />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <ErrorMessage
            message={error}
            onRetry={() => fetchReports({ page: 1 })}
            retryText="Coba Lagi"
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="images-outline" size={42} color="#a0aec0" />
        <Text style={styles.emptyTitle}>Belum ada laporan kegiatan</Text>
        <Text style={styles.emptySubtitle}>
          Ketika laporan kegiatan dibuat, data akan muncul di sini. Gunakan filter untuk mempersempit pencarian.
        </Text>
      </View>
    );
  }, [error, fetchReports, loading]);

  const renderListFooter = useCallback(() => {
    if (!loadingMore) {
      return null;
    }

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.footerLoadingText}>Memuat laporan lainnya...</Text>
      </View>
    );
  }, [loadingMore]);

  return (
    <View style={styles.container}>
      {error && reports.length > 0 ? (
        <ErrorMessage
          message={error}
          onRetry={() => fetchReports({ page: 1 })}
          retryText="Coba Lagi"
          style={styles.inlineError}
        />
      ) : null}

      <FlatList
        data={reports}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : `report-${index}`)}
        renderItem={renderReportItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.25}
        showsVerticalScrollIndicator={false}
      />

      <ActivityReportFilters
        visible={showFilters}
        filters={{
          start_date: filters.startDate,
          end_date: filters.endDate,
          jenis_kegiatan_id: filters.jenisKegiatanId
        }}
        defaultFilters={{
          start_date: INITIAL_FILTERS.startDate,
          end_date: INITIAL_FILTERS.endDate,
          jenis_kegiatan_id: INITIAL_FILTERS.jenisKegiatanId
        }}
        jenisOptions={jenisOptions}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb'
  },
  inlineError: {
    marginHorizontal: 16,
    marginTop: 16
  },
  headerFilterButton: {
    marginRight: 16,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#1f2933',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e67e22'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1f2933',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  reportTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2933',
    marginRight: 12
  },
  reportDate: {
    fontSize: 12,
    color: '#52606d'
  },
  tutorName: {
    marginTop: 6,
    fontSize: 14,
    color: '#2f3a4c',
    fontWeight: '500'
  },
  jenisBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2ff',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10
  },
  jenisBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#1d4e89',
    fontWeight: '600'
  },
  imageRow: {
    flexDirection: 'row',
    marginTop: 12
  },
  reportImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#eef2f7'
  },
  reportImageSpacing: {
    marginRight: 12
  },
  noImageText: {
    marginTop: 12,
    fontSize: 13,
    color: '#7b8794'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    color: '#52606d',
    fontWeight: '600'
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#7b8794',
    textAlign: 'center',
    lineHeight: 20
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerLoadingText: {
    marginTop: 6,
    fontSize: 13,
    color: '#7b8794'
  }
});

export default ActivityReportListScreen;
