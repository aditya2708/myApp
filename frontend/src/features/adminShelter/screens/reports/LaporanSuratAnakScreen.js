import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import SuratItemCard from '../../components/SuratItemCard';
import SuratFilterSection from '../../components/SuratFilterSection';

import {
  selectStatistics,
  selectShelterDetail,
  selectLoading,
  selectShelterDetailLoading,
  selectError,
  selectInitializingPage,
  selectRefreshingAll,
  selectRefreshAllError,
  selectFilters,
  selectHasActiveFilters,
  setSearch,
  resetFilters,
  clearAllErrors
} from '../../redux/laporanSuratSlice';

import {
  fetchLaporanSurat,
  fetchShelterDetail,
  initializeLaporanSuratPage,
  updateFiltersAndRefreshAll
} from '../../redux/laporanSuratThunks';

const LaporanSuratAnakScreen = () => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [shelterId, setShelterId] = useState(null);

  // Redux state
  const statistics = useSelector(selectStatistics);
  const shelterDetail = useSelector(selectShelterDetail);
  const loading = useSelector(selectLoading);
  const shelterDetailLoading = useSelector(selectShelterDetailLoading);
  const error = useSelector(selectError);
  const initializingPage = useSelector(selectInitializingPage);
  const refreshingAll = useSelector(selectRefreshingAll);
  const refreshAllError = useSelector(selectRefreshAllError);
  const filters = useSelector(selectFilters);
  const hasActiveFilters = useSelector(selectHasActiveFilters);

  // Initialize page
  useEffect(() => {
    dispatch(clearAllErrors());
    initializePage();
  }, [dispatch]);

  const initializePage = async () => {
    try {
      // Initialize filter options and get summary
      await dispatch(initializeLaporanSuratPage()).unwrap();
      
      // Get shelter ID from statistics and load initial data
      const result = await dispatch(fetchLaporanSurat()).unwrap();
      if (result.shelter_stats && result.shelter_stats.length > 0) {
        const shelterIdFromStats = result.shelter_stats[0].id_shelter;
        setShelterId(shelterIdFromStats);
        
        // Load initial surat list
        loadSuratList(shelterIdFromStats, 1);
      }
    } catch (error) {
      console.error('Failed to initialize page:', error);
    }
  };

  const loadSuratList = async (targetShelterId, page = 1) => {
    if (!targetShelterId) return;

    try {
      await dispatch(fetchShelterDetail({
        shelterId: targetShelterId,
        page,
        ...filters,
        search: searchText
      })).unwrap();
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load surat list:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (shelterId) {
        await dispatch(updateFiltersAndRefreshAll({
          newFilters: filters,
          shelterId,
          page: 1
        })).unwrap();
        setCurrentPage(1);
      } else {
        await dispatch(fetchLaporanSurat(filters));
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Handle filter changes (MAIN IMPROVEMENT - using combined thunk)
  const handleFilterChange = async (newFilters) => {
    try {
      if (shelterId) {
        await dispatch(updateFiltersAndRefreshAll({
          newFilters,
          shelterId,
          page: 1
        })).unwrap();
        setCurrentPage(1);
      } else {
        // Fallback if no shelterId yet
        await dispatch(fetchLaporanSurat(newFilters));
      }
    } catch (error) {
      console.error('Failed to apply filters:', error);
    }
    setShowFilters(false);
  };

  const handleClearFilters = async () => {
    dispatch(resetFilters());
    setSearchText(''); // Clear search text as well
    try {
      if (shelterId) {
        await dispatch(updateFiltersAndRefreshAll({
          newFilters: { search: '' }, // Explicitly clear search
          shelterId,
          page: 1
        })).unwrap();
        setCurrentPage(1);
      } else {
        await dispatch(fetchLaporanSurat({}));
      }
    } catch (error) {
      console.error('Failed to clear filters:', error);
    }
    setShowFilters(false);
  };

  // Handle search (UPDATED - using unified refresh logic)
  const handleSearch = async () => {
    if (!searchText.trim()) return;
    
    try {
      if (shelterId) {
        await dispatch(updateFiltersAndRefreshAll({
          newFilters: { ...filters, search: searchText.trim() },
          shelterId,
          page: 1
        })).unwrap();
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Failed to search:', error);
    }
  };

  const handleLoadMore = () => {
    if (shelterDetail.pagination && 
        currentPage < shelterDetail.pagination.last_page && 
        !shelterDetailLoading && !refreshingAll) {
      loadSuratList(shelterId, currentPage + 1);
    }
  };

  // Handle surat item press
  const handleSuratPress = (surat) => {
    // TODO: Navigate to surat detail or handle action
    console.log('Surat pressed:', surat.id_surat);
  };

  // Render summary statistics
  const renderSummary = () => {
    if (!statistics) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Ringkasan</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{statistics.total_surat}</Text>
            <Text style={styles.summaryLabel}>Total Surat</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#4caf50' }]}>
              {statistics.total_terbaca}
            </Text>
            <Text style={styles.summaryLabel}>Terbaca</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#f44336' }]}>
              {statistics.total_belum_terbaca}
            </Text>
            <Text style={styles.summaryLabel}>Belum Baca</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Laporan Surat Anak</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
          disabled={refreshingAll}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={hasActiveFilters ? '#9b59b6' : '#666'} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama anak atau pesan..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          editable={!refreshingAll}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch} 
          disabled={refreshingAll || !searchText.trim()}
        >
          <Text style={[
            styles.searchButtonText,
            (!searchText.trim() || refreshingAll) && styles.searchButtonTextDisabled
          ]}>
            Cari
          </Text>
        </TouchableOpacity>
      </View>

      {(hasActiveFilters || searchText.trim()) && (
        <TouchableOpacity 
          style={styles.clearFiltersButton}
          onPress={() => {
            if (searchText.trim()) {
              setSearchText('');
            }
            handleClearFilters();
          }}
          disabled={refreshingAll}
        >
          <Ionicons name="close-circle" size={16} color="#9b59b6" />
          <Text style={styles.clearFiltersText}>
            {searchText.trim() ? 'Hapus Pencarian' : 'Hapus Filter'}
          </Text>
        </TouchableOpacity>
      )}

      {refreshingAll && (
        <View style={styles.refreshingIndicator}>
          <LoadingSpinner size="small" />
          <Text style={styles.refreshingText}>Memperbarui data...</Text>
        </View>
      )}

      {shelterDetail.pagination && (
        <Text style={styles.resultCount}>
          {shelterDetail.pagination.total} surat ditemukan
        </Text>
      )}
    </View>
  );

  const renderSuratItem = ({ item }) => (
    <SuratItemCard
      surat={item}
      onPress={() => handleSuratPress(item)}
    />
  );

  const renderFooter = () => {
    if (!shelterDetailLoading || currentPage === 1) return null;
    return <LoadingSpinner />;
  };

  // Loading state
  if (initializingPage) {
    return <LoadingSpinner fullScreen message="Memuat laporan surat..." />;
  }

  // Error state
  if ((error || refreshAllError) && !refreshing) {
    return (
      <View style={styles.container}>
        <ErrorMessage 
          message={error || refreshAllError} 
          onRetry={() => dispatch(fetchLaporanSurat(filters))}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shelterDetail.surat_list}
        renderItem={renderSuratItem}
        keyExtractor={(item) => item.id_surat.toString()}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            {renderSummary()}
          </View>
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#9b59b6']}
            tintColor="#9b59b6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !shelterDetailLoading && !refreshingAll ? (
            <EmptyState
              icon="mail-outline"
              title="Tidak Ada Surat"
              message="Tidak ada data surat untuk shelter ini"
              actionButtonText="Refresh"
              onActionPress={handleRefresh}
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <SuratFilterSection
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={handleFilterChange}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },
  searchButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    opacity: 1
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  searchButtonTextDisabled: {
    opacity: 0.5
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f8f4ff',
    marginBottom: 8
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '500',
    marginLeft: 4
  },
  refreshingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f4ff',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  refreshingText: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '500',
    marginLeft: 8
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9b59b6'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20
  }
});

export default LaporanSuratAnakScreen;