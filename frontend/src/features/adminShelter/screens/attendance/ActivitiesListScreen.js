import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

// Components
import ActivityCard from '../../components/ActivityCard';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

// Redux
import {
  fetchAllAktivitas,
  deleteAktivitas,
  selectAktivitasList,
  selectAktivitasLoading,
  selectAktivitasError,
  selectAktivitasPagination,
  selectIsLoadingMore,
  resetAktivitasError
} from '../../redux/aktivitasSlice';

const ActivitiesListScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  
  // Redux state
  const activities = useSelector(selectAktivitasList);
  const loading = useSelector(selectAktivitasLoading);
  const error = useSelector(selectAktivitasError);
  const pagination = useSelector(selectAktivitasPagination);
  const isLoadingMore = useSelector(selectIsLoadingMore);
  
  // Get navigation params
  const { filterDate, filterType: navFilterType } = route?.params || {};
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(navFilterType || 'all'); // 'all', 'Bimbel', 'Kegiatan'
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    filterDate ? new Date(filterDate) : new Date()
  );
  const [isDateFilterActive, setIsDateFilterActive] = useState(!!filterDate);
  
  // Load activities on mount
  useEffect(() => {
    fetchActivities(1);
    
    return () => {
      dispatch(resetAktivitasError());
    };
  }, [dispatch]);
  
  // Fetch activities data with pagination
  const fetchActivities = async (page = 1, overrides = {}) => {
    const params = {
      page,
      per_page: 20
    };

    const effectiveSearch = overrides.searchQuery ?? searchQuery;
    if (effectiveSearch) {
      params.search = effectiveSearch;
    }

    const effectiveFilterType = overrides.filterType ?? filterType;
    if (effectiveFilterType !== 'all') {
      params.jenis_kegiatan = effectiveFilterType;
    }

    const effectiveDateFilterActive =
      overrides.isDateFilterActive !== undefined ? overrides.isDateFilterActive : isDateFilterActive;

    const effectiveFilterDate =
      overrides.filterDate !== undefined ? overrides.filterDate : filterDate;

    const effectiveSelectedMonth = overrides.selectedMonth ?? selectedMonth;

    if (effectiveDateFilterActive) {
      if (effectiveFilterDate) {
        // If filtering by specific date, use exact date
        params.date_from = effectiveFilterDate;
        params.date_to = effectiveFilterDate;
      } else {
        // If filtering by month, use month range
        params.date_from = format(startOfMonth(effectiveSelectedMonth), 'yyyy-MM-dd');
        params.date_to = format(endOfMonth(effectiveSelectedMonth), 'yyyy-MM-dd');
      }
    }

    try {
      await dispatch(fetchAllAktivitas(params)).unwrap();
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities(1);
  };
  
  // Handle search
  const handleSearch = () => {
    fetchActivities(1);
  };
  
  // Handle type filter
  const handleFilterChange = (type) => {
    setFilterType(type);
    fetchActivities(1, { filterType: type });
  };
  
  // Handle date filter
  const applyDateFilter = () => {
    setShowDateFilter(false);
    setIsDateFilterActive(true);
    if (navigation?.setParams) {
      navigation.setParams({ filterDate: null });
    }
    fetchActivities(1, { isDateFilterActive: true, filterDate: null });
  };
  
  // Clear date filter
  const clearDateFilter = () => {
    const resetMonth = new Date();
    setIsDateFilterActive(false);
    setSelectedMonth(resetMonth);
    setShowDateFilter(false);
    if (navigation?.setParams) {
      navigation.setParams({ filterDate: null });
    }
    fetchActivities(1, { isDateFilterActive: false, filterDate: null, selectedMonth: resetMonth });
  };
  
  // Handle load more
  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.currentPage < pagination.lastPage) {
      fetchActivities(pagination.currentPage + 1);
    }
  };
  
  // Handle activity selection
  const handleSelectActivity = (activity) => {
    navigation.navigate('ActivityDetail', { 
      id_aktivitas: activity.id_aktivitas
    });
  };
  
  // Handle create new activity
  const handleCreateActivity = () => {
    navigation.navigate('ActivityForm');
  };
  
  // Handle edit activity
  const handleEditActivity = (activity) => {
    navigation.navigate('ActivityForm', { activity });
  };
  
  // Handle delete activity
  const handleDeleteActivity = (id) => {
    Alert.alert(
      'Hapus Aktivitas',
      'Apakah Anda yakin ingin menghapus aktivitas ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteAktivitas(id)).unwrap();
              Alert.alert('Berhasil', 'Aktivitas berhasil dihapus');
              handleRefresh();
            } catch (err) {
              Alert.alert('Error', err || 'Gagal menghapus aktivitas');
            }
          }
        }
      ]
    );
  };
  
  // Render activity item
  const renderActivityItem = ({ item }) => (
    <ActivityCard
      activity={item}
      onPress={() => handleSelectActivity(item)}
      onEdit={() => handleEditActivity(item)}
      onDelete={() => handleDeleteActivity(item.id_aktivitas)}
    />
  );
  
  // Render empty list
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#bdc3c7" />
      <Text style={styles.emptyText}>Tidak Ada Aktivitas Yang Ditemukan</Text>
      <Text style={styles.emptySubText}>
        {searchQuery || filterType !== 'all' || isDateFilterActive
          ? 'Coba ubah pencarian atau filter Anda' 
          : 'Ketuk tombol + untuk membuat aktivitas'}
      </Text>
    </View>
  );
  
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <Text style={styles.loadingMoreText}>Memuat Lebih Banyak...</Text>
      </View>
    );
  };
  
  // Month navigation
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setSelectedMonth(subMonths(selectedMonth, 1));
    } else {
      setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#7f8c8d" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari berdasarkan materi..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, isDateFilterActive && styles.activeFilterButton]} 
            onPress={() => setShowDateFilter(true)}
          >
            <Ionicons name="calendar" size={20} color={isDateFilterActive ? "#fff" : "#3498db"} />
          </TouchableOpacity>
        </View>
        
        {/* Active Date Filter Indicator */}
        {isDateFilterActive && (
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>
              Filter: {filterDate ? 
                format(new Date(filterDate), 'dd MMMM yyyy', { locale: id }) : 
                format(selectedMonth, 'MMMM yyyy', { locale: id })
              }
            </Text>
            <TouchableOpacity onPress={clearDateFilter}>
              <Ionicons name="close-circle" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'all' && styles.activeFilterTab
            ]}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={[
              styles.filterTabText,
              filterType === 'all' && styles.activeFilterTabText
            ]}>
              Semua
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'Bimbel' && styles.activeFilterTab
            ]}
            onPress={() => handleFilterChange('Bimbel')}
          >
            <Text style={[
              styles.filterTabText,
              filterType === 'Bimbel' && styles.activeFilterTabText
            ]}>
              Bimbel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'Kegiatan' && styles.activeFilterTab
            ]}
            onPress={() => handleFilterChange('Kegiatan')}
          >
            <Text style={[
              styles.filterTabText,
              filterType === 'Kegiatan' && styles.activeFilterTabText
            ]}>
              Kegiatan
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Error Message */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => fetchActivities(1)}
          />
        )}
        
        {/* Activities List */}
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id_aktivitas.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3498db']}
            />
          }
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
        
        {/* Create Activity Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleCreateActivity}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
        
        {/* Loading Overlay */}
        {loading && !refreshing && activities.length === 0 && (
          <LoadingSpinner fullScreen />
        )}
        
        {/* Date Filter Modal */}
        <Modal
          visible={showDateFilter}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDateFilter(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Berdasarkan Bulan</Text>
                <TouchableOpacity onPress={() => setShowDateFilter(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.monthSelector}>
                <TouchableOpacity 
                  style={styles.monthNavButton}
                  onPress={() => navigateMonth('prev')}
                >
                  <Ionicons name="chevron-back" size={24} color="#3498db" />
                </TouchableOpacity>
                
                <Text style={styles.monthText}>
                  {format(selectedMonth, 'MMMM yyyy', { locale: id })}
                </Text>
                
                <TouchableOpacity 
                  style={styles.monthNavButton}
                  onPress={() => navigateMonth('next')}
                  disabled={selectedMonth >= new Date()}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color={selectedMonth >= new Date() ? '#ccc' : '#3498db'} 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.clearButton]}
                  onPress={clearDateFilter}
                >
                  <Text style={styles.clearButtonText}>Hapus Filter</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.applyButton]}
                  onPress={applyDateFilter}
                >
                  <Text style={styles.applyButtonText}>Terapkan Filter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#3498db',
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: 8,
  },
  filterButton: {
    backgroundColor: '#ecf0f1',
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: '#3498db',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d1e7ed',
  },
  activeFilterText: {
    color: '#2c88a6',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    zIndex: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  filterTabText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  activeFilterTabText: {
    color: '#3498db',
    fontWeight: '500',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  monthNavButton: {
    padding: 10,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ecf0f1',
    marginRight: 8,
  },
  clearButtonText: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#3498db',
    marginLeft: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default ActivitiesListScreen;
