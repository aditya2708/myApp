import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

import ActivityCard from '../../components/ActivityCard';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { deleteAktivitas } from '../../redux/aktivitasSlice';
import { aktivitasApi } from '../../api/aktivitasApi';
import {
  selectIsQuickFlowActive,
  selectQuickFlowActivityId,
  selectQuickFlowStep,
  updateQuickFlowStep,
} from '../../redux/quickFlowSlice';

const ITEMS_PER_PAGE = 20;

const ActivitiesListScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const quickFlowActive = useSelector(selectIsQuickFlowActive);
  const quickFlowStep = useSelector(selectQuickFlowStep);
  const quickFlowActivityId = useSelector(selectQuickFlowActivityId);
  const quickFlowNavigatedRef = useRef(false);

  const { filterDate: routeFilterDate, filterType: navFilterType } = route?.params || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filterType, setFilterType] = useState(navFilterType || 'all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    routeFilterDate ? new Date(routeFilterDate) : new Date()
  );
  const [isDateFilterActive, setIsDateFilterActive] = useState(!!routeFilterDate);
  const [specificDate, setSpecificDate] = useState(routeFilterDate ?? null);

  useEffect(() => {
    if (routeFilterDate) {
      setIsDateFilterActive(true);
      setSpecificDate(routeFilterDate);
      setSelectedMonth(new Date(routeFilterDate));
    } else if (routeFilterDate === null) {
      setSpecificDate(null);
    }
  }, [routeFilterDate]);

  // Auto-refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Refresh data when screen is focused to ensure we have the latest data
      const refreshData = async () => {
        try {
          await queryClient.invalidateQueries({ queryKey: ['adminShelterAktivitasList'] });
        } catch (error) {
          console.warn('Failed to refresh data on focus:', error);
        }
      };

      // Small delay to ensure navigation is complete
      const timeoutId = setTimeout(refreshData, 100);
      
      return () => clearTimeout(timeoutId);
    }, [queryClient])
  );

  const trimmedSearch = useMemo(() => appliedSearch.trim(), [appliedSearch]);
  const monthKey = useMemo(
    () => format(selectedMonth, 'yyyy-MM'),
    [selectedMonth]
  );
  const effectiveSpecificDate = isDateFilterActive ? specificDate : null;

  const {
    data,
    error,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      'adminShelterAktivitasList',
      {
        search: trimmedSearch || null,
        filterType,
        isDateFilterActive,
        specificDate: effectiveSpecificDate,
        month: isDateFilterActive ? monthKey : null,
      },
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        per_page: ITEMS_PER_PAGE,
      };

      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      if (filterType && filterType !== 'all') {
        params.jenis_kegiatan = filterType;
      }

      if (isDateFilterActive) {
        if (effectiveSpecificDate) {
          params.date_from = effectiveSpecificDate;
          params.date_to = effectiveSpecificDate;
        } else {
          params.date_from = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
          params.date_to = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
        }
      }

      const response = await aktivitasApi.getAllAktivitas(params);
      const payload = response?.data || {};

      if (payload.success === false) {
        throw new Error(payload.message || 'Gagal memuat aktivitas');
      }

      const activitiesData = payload.data || [];
      const meta = payload.meta || payload.pagination || {};

      return {
        data: activitiesData,
        meta,
      };
    },
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta || {};
      const current =
        meta.current_page ??
        meta.currentPage ??
        meta.page ??
        1;
      const last =
        meta.last_page ??
        meta.lastPage ??
        meta.total_pages ??
        meta.totalPages ??
        1;

      if (Number(current) < Number(last)) {
        return Number(current) + 1;
      }

      if (!meta || (Array.isArray(lastPage?.data) && lastPage.data.length === 0)) {
        return undefined;
      }

      return undefined;
    },
  });

  const activities = useMemo(() => {
    if (!data?.pages?.length) {
      return [];
    }

    return data.pages.flatMap(page => page?.data || []);
  }, [data]);

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }

    if (typeof error?.message === 'string') {
      return error.message;
    }

    return 'Gagal memuat aktivitas. Silakan coba lagi.';
  }, [error]);

  const isQuickFlow = (route?.params?.quickFlow || quickFlowActive) && !!(route?.params?.targetActivityId || quickFlowActivityId);
  const targetActivityId = route?.params?.targetActivityId || quickFlowActivityId || null;

  useEffect(() => {
    if (quickFlowStep === 'activitiesList') {
      quickFlowNavigatedRef.current = false;
    }
  }, [quickFlowStep]);

  useEffect(() => {
    if (!isQuickFlow) {
      return;
    }

    if (quickFlowStep && quickFlowStep !== 'activitiesList') {
      return;
    }

    const targetId = targetActivityId;
    if (!targetId || quickFlowNavigatedRef.current) {
      return;
    }

    const found = activities.find(item => item.id_aktivitas === targetId);
    if (!found) {
      return;
    }

    quickFlowNavigatedRef.current = true;
    dispatch(updateQuickFlowStep('manualAttendance'));
    navigation.navigate('ManualAttendance', {
      id_aktivitas: targetId,
      quickFlow: true,
      activityName: found?.jenis_kegiatan,
      activityType: found?.jenis_kegiatan,
      activityDateRaw: found?.tanggal || null,
      kelompokId: found?.kelompok_id || found?.kelompokId || null,
      kelompokIds: Array.isArray(found?.kelompok_ids) ? found.kelompok_ids.filter(Boolean) : [],
      kelompokName: found?.nama_kelompok || null,
      activityStatus: found?.status || null,
    });
  }, [
    activities,
    dispatch,
    isQuickFlow,
    navigation,
    quickFlowStep,
    targetActivityId,
  ]);

  const handleSearch = () => {
    setAppliedSearch(searchQuery.trim());
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleSelectActivity = (activity) => {
    navigation.navigate('ActivityDetail', {
      id_aktivitas: activity.id_aktivitas,
    });
  };

  const handleCreateActivity = () => {
    navigation.navigate('ActivityForm');
  };

  const handleEditActivity = (activity) => {
    navigation.navigate('ActivityForm', { activity });
  };

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
              await dispatch(deleteAktivitas({ id, queryClient })).unwrap();
              Alert.alert('Berhasil', 'Aktivitas berhasil dihapus');
            } catch (err) {
              const message =
                err?.response?.data?.message ||
                err?.message ||
                'Gagal menghapus aktivitas';
              Alert.alert('Error', message);
              
              // Fallback: If Redux action fails, try to refresh React Query directly
              try {
                await queryClient.invalidateQueries({ queryKey: ['adminShelterAktivitasList'] });
              } catch (fallbackError) {
                console.warn('Fallback refresh failed:', fallbackError);
              }
            }
          },
        },
      ]
    );
  };

  const renderActivityItem = ({ item }) => (
    <ActivityCard
      activity={item}
      onPress={() => handleSelectActivity(item)}
      onEdit={() => handleEditActivity(item)}
      onDelete={() => handleDeleteActivity(item.id_aktivitas)}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#bdc3c7" />
      <Text style={styles.emptyText}>Tidak Ada Aktivitas Yang Ditemukan</Text>
      <Text style={styles.emptySubText}>
        {trimmedSearch || filterType !== 'all' || isDateFilterActive
          ? 'Coba ubah pencarian atau filter Anda'
          : 'Ketuk tombol + untuk membuat aktivitas'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footerLoader}>
        <Text style={styles.loadingMoreText}>Memuat Lebih Banyak...</Text>
      </View>
    );
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setSelectedMonth(subMonths(selectedMonth, 1));
    } else {
      const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1);
      setSelectedMonth(nextMonth);
    }
  };

  const applyDateFilter = () => {
    setShowDateFilter(false);
    setIsDateFilterActive(true);
    setSpecificDate(null);
    if (navigation?.setParams) {
      navigation.setParams({ filterDate: null });
    }
  };

  const clearDateFilter = () => {
    const resetMonth = new Date();
    setIsDateFilterActive(false);
    setSelectedMonth(resetMonth);
    setSpecificDate(null);
    setShowDateFilter(false);
    if (navigation?.setParams) {
      navigation.setParams({ filterDate: null });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
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
            <Ionicons name="calendar" size={20} color={isDateFilterActive ? '#fff' : '#3498db'} />
          </TouchableOpacity>
        </View>

        {isDateFilterActive && (
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>
              Filter:{' '}
              {effectiveSpecificDate
                ? format(new Date(effectiveSpecificDate), 'dd MMMM yyyy', { locale: id })
                : format(selectedMonth, 'MMMM yyyy', { locale: id })}
            </Text>
            <TouchableOpacity onPress={clearDateFilter}>
              <Ionicons name="close-circle" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'all' && styles.activeFilterTab]}
            onPress={() => handleFilterChange('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterType === 'all' && styles.activeFilterTabText
              ]}
            >
              Semua
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filterType === 'Bimbel' && styles.activeFilterTab]}
            onPress={() => handleFilterChange('Bimbel')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterType === 'Bimbel' && styles.activeFilterTabText
              ]}
            >
              Bimbel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filterType === 'Kegiatan' && styles.activeFilterTab]}
            onPress={() => handleFilterChange('Kegiatan')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterType === 'Kegiatan' && styles.activeFilterTabText
              ]}
            >
              Kegiatan
            </Text>
          </TouchableOpacity>
        </View>

        {errorMessage && (
          <ErrorMessage
            message={errorMessage}
            onRetry={handleRefresh}
          />
        )}

        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id_aktivitas.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={['#3498db']}
            />
          }
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateActivity}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

        {isLoading && !isRefetching && activities.length === 0 && (
          <LoadingSpinner fullScreen />
        )}

        <Modal
          visible={showDateFilter}
          animationType="slide"
          transparent
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
