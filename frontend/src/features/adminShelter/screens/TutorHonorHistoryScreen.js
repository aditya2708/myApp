import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import HonorHistoryItem from '../components/HonorHistoryItem';
import HonorPeriodFilter from '../components/HonorPeriodFilter';
import HonorStatisticsSummary from '../components/HonorStatisticsSummary';
import PaymentSystemIndicator from '../components/PaymentSystemIndicator';
import { formatRupiah } from '../../../utils/currencyFormatter';

import {
  fetchHonorHistory,
  fetchHonorStatistics,
  fetchCurrentSettings,
  resetHistoryError,
  resetStatisticsError,
  clearHonorHistory,
  setHistoryFilters,
  selectHonorHistory,
  selectHonorStatistics,
  selectHistoryLoading,
  selectStatisticsLoading,
  selectHistoryError,
  selectStatisticsError,
  selectHistoryPagination,
  selectHistoryFilters,
  selectCurrentSettings
} from '../redux/tutorHonorSlice';

const TutorHonorHistoryScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const { tutorId, tutorName } = route.params;

  const honorHistory = useSelector(selectHonorHistory);
  const honorStatistics = useSelector(selectHonorStatistics);
  const loading = useSelector(selectHistoryLoading);
  const statisticsLoading = useSelector(selectStatisticsLoading);
  const error = useSelector(selectHistoryError);
  const statisticsError = useSelector(selectStatisticsError);
  const pagination = useSelector(selectHistoryPagination);
  const filters = useSelector(selectHistoryFilters);
  const currentSettings = useSelector(selectCurrentSettings);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'statistics'

  useEffect(() => {
    loadData();
    loadStatistics();
    dispatch(fetchCurrentSettings());
  }, [dispatch, tutorId, filters]);

  const loadData = (page = 1, shouldRefresh = false) => {
    if (shouldRefresh) {
      dispatch(clearHonorHistory());
    }
    
    dispatch(fetchHonorHistory({
      tutorId,
      filters: { ...filters, page, per_page: 10 }
    }));
  };

  const loadStatistics = () => {
    dispatch(fetchHonorStatistics({
      tutorId,
      filters
    }));
  };

  const handleRefresh = () => {
    if (currentView === 'list') {
      loadData(1, true);
    }
    loadStatistics();
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'statistics' && !honorStatistics) {
      loadStatistics();
    }
  };

  const handleLoadMore = () => {
    if (!loading && !isLoadingMore && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      loadData(pagination.current_page + 1);
      setIsLoadingMore(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    dispatch(setHistoryFilters(newFilters));
  };

  const handleApplyFilters = () => {
    loadData(1, true);
    loadStatistics();
  };

  const handleClearFilters = () => {
    loadData(1, true);
    loadStatistics();
  };

  const getFilterSummary = () => {
    const activeParts = [];
    
    if (filters.start_date || filters.end_date) {
      const start = filters.start_date ? new Date(filters.start_date).toLocaleDateString('id-ID') : '';
      const end = filters.end_date ? new Date(filters.end_date).toLocaleDateString('id-ID') : '';
      
      if (start && end) {
        activeParts.push(`${start} - ${end}`);
      } else if (start) {
        activeParts.push(`Dari ${start}`);
      } else if (end) {
        activeParts.push(`Sampai ${end}`);
      }
    }
    
    if (filters.status) {
      const statusText = {
        draft: 'Draft',
        approved: 'Disetujui',
        paid: 'Dibayar'
      };
      activeParts.push(statusText[filters.status] || filters.status);
    }
    
    if (filters.year) {
      activeParts.push(`Tahun ${filters.year}`);
    }
    
    return activeParts.length > 0 ? activeParts.join(' • ') : null;
  };

  const isFiltered = () => {
    return filters.start_date || filters.end_date || filters.status || filters.year;
  };

  const handleHonorItemPress = (honor) => {
    navigation.navigate('TutorHonorDetail', {
      tutorId,
      tutorName,
      month: honor.bulan,
      year: honor.tahun
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#f39c12';
      case 'approved': return '#27ae60';
      case 'paid': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'approved': return 'Disetujui';
      case 'paid': return 'Dibayar';
      default: return 'Unknown';
    }
  };

  const getPaymentSystemName = (paymentSystem) => {
    const systems = {
      'flat_monthly': 'Honor Bulanan Tetap',
      'per_session': 'Per Sesi/Pertemuan',
      'per_student_category': 'Per Kategori Siswa',
      'session_per_student_category': 'Per Sesi + Per Kategori Siswa'
    };
    return systems[paymentSystem] || paymentSystem;
  };

  const renderHonorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.honorItem}
      onPress={() => handleHonorItemPress(item)}
    >
      <View style={styles.honorHeader}>
        <Text style={styles.monthText}>{item.bulan_nama} {item.tahun}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.honorDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.total_aktivitas} aktivitas</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.total_siswa_hadir} siswa hadir</Text>
        </View>
        {item.payment_system_used && (
          <View style={styles.detailRow}>
            <Ionicons name="settings-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {getPaymentSystemName(item.payment_system_used)}
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.honorAmount}>{formatRupiah(item.total_honor)}</Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.viewButton}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.viewButtonText}>Lihat Detail</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <LoadingSpinner size="small" />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#e0e0e0" />
      <Text style={styles.emptyTitle}>Belum Ada Riwayat Honor</Text>
      <Text style={styles.emptySubtitle}>
        Tutor belum memiliki riwayat honor
      </Text>
    </View>
  );

  if (loading && honorHistory.length === 0) {
    return <LoadingSpinner fullScreen message="Memuat riwayat honor..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.tutorName}>{tutorName}</Text>
          <Text style={styles.totalRecords}>
            {currentView === 'list' 
              ? `${pagination.total} riwayat honor`
              : 'Statistik & analisis'
            }
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              isFiltered() && styles.filterButtonActive
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={isFiltered() ? "#fff" : "#3498db"} 
            />
            {isFiltered() && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>•</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment System Context */}
      <PaymentSystemIndicator 
        settings={currentSettings}
        style={styles.paymentSystemIndicator}
      />

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, currentView === 'list' && styles.toggleButtonActive]}
          onPress={() => handleViewChange('list')}
        >
          <Ionicons 
            name="list" 
            size={18} 
            color={currentView === 'list' ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.toggleText,
            currentView === 'list' && styles.toggleTextActive
          ]}>
            Daftar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, currentView === 'statistics' && styles.toggleButtonActive]}
          onPress={() => handleViewChange('statistics')}
        >
          <Ionicons 
            name="stats-chart" 
            size={18} 
            color={currentView === 'statistics' ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.toggleText,
            currentView === 'statistics' && styles.toggleTextActive
          ]}>
            Statistik
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Status */}
      {isFiltered() && (
        <View style={styles.filterStatus}>
          <Ionicons name="funnel" size={16} color="#3498db" />
          <Text style={styles.filterStatusText}>
            {getFilterSummary()}
          </Text>
          <TouchableOpacity
            onPress={() => {
              dispatch(setHistoryFilters({
                start_date: null,
                end_date: null,
                status: '',
                year: null
              }));
            }}
            style={styles.clearFilterButton}
          >
            <Ionicons name="close-circle" size={16} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      )}

      {error && currentView === 'list' && (
        <ErrorMessage
          message={error}
          onRetry={() => {
            dispatch(resetHistoryError());
            handleRefresh();
          }}
        />
      )}

      {statisticsError && currentView === 'statistics' && (
        <ErrorMessage
          message={statisticsError}
          onRetry={() => {
            dispatch(resetStatisticsError());
            loadStatistics();
          }}
        />
      )}

      {/* Content */}
      {currentView === 'list' ? (
        <FlatList
          data={honorHistory}
          renderItem={renderHonorItem}
          keyExtractor={(item) => `${item.bulan}_${item.tahun}`}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <HonorStatisticsSummary
          statistics={honorStatistics}
          loading={statisticsLoading}
          onRefresh={loadStatistics}
        />
      )}

      {/* Filter Modal */}
      <HonorPeriodFilter
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  paymentSystemIndicator: {
    margin: 0,
    marginBottom: 8,
    borderRadius: 0
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 4
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  toggleButtonActive: {
    backgroundColor: '#3498db'
  },
  toggleText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  toggleTextActive: {
    color: '#fff'
  },
  headerContent: {
    flex: 1
  },
  tutorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  totalRecords: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    position: 'relative'
  },
  filterButtonActive: {
    backgroundColor: '#3498db'
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c'
  },
  filterBadgeText: {
    fontSize: 8,
    color: '#fff'
  },
  filterStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebf3fd',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db'
  },
  filterStatusText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  },
  clearFilterButton: {
    padding: 4
  },
  listContainer: {
    padding: 16
  },
  honorItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  honorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  honorDetails: {
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  detailText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666'
  },
  honorAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 12
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  viewButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666'
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8
  }
});

export default TutorHonorHistoryScreen;