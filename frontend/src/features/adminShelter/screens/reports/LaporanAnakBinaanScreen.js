import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import ChildAttendanceCard from '../../components/ChildAttendanceCard';
import ChildSummaryCard from '../../components/ChildSummaryCard';
import AnakBinaanFilterSection from '../../components/AnakBinaanFilterSection';

import {
  fetchLaporanAnakBinaan,
  initializeLaporanPage,
  updateFiltersAndRefreshAll,
} from '../../redux/laporanThunks';

import {
  selectChildren,
  selectSummary,
  selectPagination,
  selectFilterOptions,
  selectFilters,
  selectExpandedCards,
  selectLoading,
  selectInitializingPage,
  selectRefreshingAll,
  selectError,
  selectRefreshAllError,
  selectHasActiveFilters,
  setSearch,
  resetFilters,
  toggleCardExpanded,
  clearAllErrors
} from '../../redux/laporanSlice';

const LaporanAnakBinaanScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Redux state
  const children = useSelector(selectChildren);
  const summary = useSelector(selectSummary);
  const pagination = useSelector(selectPagination);
  const filterOptions = useSelector(selectFilterOptions);
  const filters = useSelector(selectFilters);
  const expandedCards = useSelector(selectExpandedCards);
  const loading = useSelector(selectLoading);
  const initializingPage = useSelector(selectInitializingPage);
  const refreshingAll = useSelector(selectRefreshingAll);
  const error = useSelector(selectError);
  const refreshAllError = useSelector(selectRefreshAllError);
  const hasActiveFilters = useSelector(selectHasActiveFilters);

  // Initialize page
  useEffect(() => {
    dispatch(clearAllErrors());
    initializePage();
  }, [dispatch]);

  const initializePage = async () => {
    try {
      await dispatch(initializeLaporanPage()).unwrap();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to initialize page:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(updateFiltersAndRefreshAll({
        newFilters: { ...filters, search: searchText },
        page: 1
      })).unwrap();
      setCurrentPage(1);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = async (newFilters) => {
    try {
      await dispatch(updateFiltersAndRefreshAll({
        newFilters,
        page: 1
      })).unwrap();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to apply filters:', error);
    }
    setShowFilters(false);
  };

  const handleClearFilters = async () => {
    dispatch(resetFilters());
    setSearchText('');
    try {
      await dispatch(updateFiltersAndRefreshAll({
        newFilters: { 
          start_date: null,
          end_date: null,
          jenisKegiatan: null,
          search: '' 
        },
        page: 1
      })).unwrap();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to clear filters:', error);
    }
    setShowFilters(false);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchText.trim()) return;
    
    try {
      await dispatch(updateFiltersAndRefreshAll({
        newFilters: { ...filters, search: searchText.trim() },
        page: 1
      })).unwrap();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to search:', error);
    }
  };

  const handleLoadMore = () => {
    if (pagination && 
        currentPage < pagination.last_page && 
        !loading && !refreshingAll) {
      loadMoreData();
    }
  };

  const loadMoreData = async () => {
    try {
      await dispatch(fetchLaporanAnakBinaan({
        start_date: filters.start_date,
        end_date: filters.end_date,
        jenisKegiatan: filters.jenisKegiatan,
        search: searchText,
        page: currentPage + 1
      })).unwrap();
      setCurrentPage(currentPage + 1);
    } catch (error) {
      console.error('Failed to load more data:', error);
    }
  };

  // Handle child item press
  const handleChildPress = (child) => {
    navigation.navigate('AnakDetail', {
      childId: child.id_anak,
      filters: { ...filters, search: searchText },
    });
  };

  // Handle card expand/collapse
  const handleCardToggle = (childId) => {
    dispatch(toggleCardExpanded(childId));
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Laporan Anak Binaan</Text>
        <View style={styles.headerButtons}>
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
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama anak..."
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

      {pagination && (
        <Text style={styles.resultCount}>
          {pagination.total} anak binaan ditemukan
        </Text>
      )}
    </View>
  );

  const renderChildItem = ({ item }) => (
    <ChildAttendanceCard
      child={item}
      isExpanded={expandedCards.includes(item.id_anak)}
      onToggle={() => handleCardToggle(item.id_anak)}
      onChildPress={handleChildPress}
    />
  );

  const renderFooter = () => {
    if (!loading || currentPage === 1) return null;
    return <LoadingSpinner />;
  };

  // Loading state
  if (initializingPage) {
    return <LoadingSpinner fullScreen message="Memuat laporan anak binaan..." />;
  }

  // Error state
  if ((error || refreshAllError) && !refreshing) {
    return (
      <View style={styles.container}>
        <ErrorMessage 
          message={error || refreshAllError} 
          onRetry={() => dispatch(fetchLaporanAnakBinaan(filters))}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={children}
        renderItem={renderChildItem}
        keyExtractor={(item) => item.id_anak.toString()}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            <ChildSummaryCard summary={summary} />
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
          !loading && !refreshingAll ? (
            <EmptyState
              icon="people-outline"
              title="Tidak Ada Data"
              message="Tidak ada data anak binaan untuk filter yang dipilih"
              actionButtonText="Refresh"
              onActionPress={handleRefresh}
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <AnakBinaanFilterSection
        visible={showFilters}
        filters={filters}
        filterOptions={filterOptions}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20
  }
});

export default LaporanAnakBinaanScreen;