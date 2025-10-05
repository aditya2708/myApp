import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import ChildReportSummary from '../../components/reports/ChildReportSummary';
import ChildReportListItem from '../../components/reports/ChildReportListItem';
import ChildReportFilterModal from '../../components/reports/ChildReportFilterModal';
import {
  clearError,
  resetFilters,
  selectReportAnakChildren,
  selectReportAnakError,
  selectReportAnakFilterOptions,
  selectReportAnakFilters,
  selectReportAnakHasFetched,
  selectReportAnakHasMore,
  selectReportAnakLoadingStates,
  selectReportAnakPagination,
  selectReportAnakSummary,
  setDateRange,
  setFilters,
  setJenisKegiatan,
  setSearch,
  setShelter,
  setWilayahBinaan,
} from '../../redux/reportAnakSlice';
import {
  fetchMoreReportAnak,
  fetchReportAnakList,
  fetchShelterOptionsByWilayah,
  initializeReportAnak,
} from '../../redux/reportAnakThunks';
import { formatDateToIndonesian } from '../../../../common/utils/dateFormatter';

const AdminCabangChildReportScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const children = useSelector(selectReportAnakChildren);
  const summary = useSelector(selectReportAnakSummary);
  const pagination = useSelector(selectReportAnakPagination);
  const hasMore = useSelector(selectReportAnakHasMore);
  const filters = useSelector(selectReportAnakFilters);
  const filterOptions = useSelector(selectReportAnakFilterOptions);
  const { loading, loadingMore, initializing } = useSelector(selectReportAnakLoadingStates);
  const error = useSelector(selectReportAnakError);
  const hasFetched = useSelector(selectReportAnakHasFetched);

  const [searchText, setSearchText] = useState(filters.search || '');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    dispatch(clearError());
    dispatch(initializeReportAnak());
  }, [dispatch]);

  useEffect(() => {
    setSearchText(filters.search || '');
  }, [filters.search]);

  const shelterOptions = useMemo(() => {
    if (!filters.wilayahBinaan) {
      return [];
    }

    return filterOptions.sheltersByWilayah?.[filters.wilayahBinaan] || [];
  }, [filterOptions.sheltersByWilayah, filters.wilayahBinaan]);

  const clearSearchDebounce = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, []);

  const triggerSearch = useCallback(
    (value, { force = false } = {}) => {
      const trimmed = value.trim();
      const nextFilters = { ...filters, search: trimmed };

      dispatch(setSearch(trimmed));

      if (!hasFetched && !force) {
        return;
      }

      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    },
    [dispatch, filters, hasFetched],
  );

  const handleSearch = useCallback(() => {
    clearSearchDebounce();
    triggerSearch(searchText);
  }, [clearSearchDebounce, triggerSearch, searchText]);

  useEffect(() => {
    if (!hasFetched) {
      return () => {
        clearSearchDebounce();
      };
    }

    const trimmed = searchText.trim();

    if ((filters.search || '') === trimmed) {
      return () => {
        clearSearchDebounce();
      };
    }

    clearSearchDebounce();

    searchDebounceRef.current = setTimeout(() => {
      triggerSearch(searchText);
      searchDebounceRef.current = null;
    }, 450);

    return () => {
      clearSearchDebounce();
    };
  }, [searchText, filters.search, triggerSearch, clearSearchDebounce, hasFetched]);

  const handleClearSearch = () => {
    clearSearchDebounce();
    setSearchText('');
    triggerSearch('');
  };

  const handleApplyFilters = (updatedFilters) => {
    clearSearchDebounce();

    const trimmedSearch = searchText.trim();
    const nextFilters = {
      ...filters,
      ...updatedFilters,
      search: trimmedSearch,
    };

    dispatch(setFilters(nextFilters));
    dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    clearSearchDebounce();
    dispatch(resetFilters());
    setSearchText('');
    setFilterModalVisible(false);
  };

  const handleRefresh = async () => {
    if (!hasFetched) {
      return;
    }

    setRefreshing(true);
    await dispatch(fetchReportAnakList({ filters, page: 1 }));
    setRefreshing(false);
  };

  const handleRemoveDateRange = useCallback(() => {
    const nextFilters = { ...filters, start_date: null, end_date: null };

    dispatch(setDateRange({ start_date: null, end_date: null }));

    if (hasFetched) {
      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    }
  }, [dispatch, filters, hasFetched]);

  const handleRemoveJenis = useCallback(() => {
    const nextFilters = { ...filters, jenisKegiatan: null };

    dispatch(setJenisKegiatan(null));

    if (hasFetched) {
      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    }
  }, [dispatch, filters, hasFetched]);

  const handleRemoveWilayah = useCallback(() => {
    const nextFilters = { ...filters, wilayahBinaan: null, shelter: null };

    dispatch(setWilayahBinaan(null));

    if (hasFetched) {
      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    }
  }, [dispatch, filters, hasFetched]);

  const handleRemoveShelter = useCallback(() => {
    const nextFilters = { ...filters, shelter: null };

    dispatch(setShelter(null));

    if (hasFetched) {
      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    }
  }, [dispatch, filters, hasFetched]);

  const handleRemoveSearch = useCallback(() => {
    clearSearchDebounce();
    setSearchText('');
    triggerSearch('');
  }, [clearSearchDebounce, triggerSearch]);

  const getOptionLabel = useCallback((options, value) => {
    if (!value || !Array.isArray(options)) {
      return null;
    }

    const stringValue = String(value);
    const match = options.find((option) => {
      const optionValue = option?.value ?? option?.id ?? option?.slug ?? option?.key ?? option;
      return String(optionValue) === stringValue;
    });

    if (!match) {
      return null;
    }

    return match?.label ?? match?.name ?? match?.nama ?? match;
  }, []);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (filters.start_date || filters.end_date) {
      const formattedStart = filters.start_date ? formatDateToIndonesian(filters.start_date) : null;
      const formattedEnd = filters.end_date ? formatDateToIndonesian(filters.end_date) : null;

      let label = 'Rentang Tanggal';
      if (formattedStart && formattedEnd) {
        label = `Rentang: ${formattedStart} - ${formattedEnd}`;
      } else if (formattedStart) {
        label = `Mulai: ${formattedStart}`;
      } else if (formattedEnd) {
        label = `Selesai: ${formattedEnd}`;
      }

      chips.push({ key: 'date_range', label, onRemove: handleRemoveDateRange });
    }

    const jenisLabel = getOptionLabel(filterOptions.jenisKegiatan, filters.jenisKegiatan);
    if (jenisLabel) {
      chips.push({ key: 'jenis', label: `Jenis: ${jenisLabel}`, onRemove: handleRemoveJenis });
    }

    const wilayahLabel = getOptionLabel(filterOptions.wilayahBinaan, filters.wilayahBinaan);
    if (wilayahLabel) {
      chips.push({ key: 'wilayah', label: `Wilayah: ${wilayahLabel}`, onRemove: handleRemoveWilayah });
    }

    const sheltersByWilayah = filterOptions.sheltersByWilayah?.[filters.wilayahBinaan] || [];
    const shelterLabel = getOptionLabel(sheltersByWilayah, filters.shelter);
    if (shelterLabel) {
      chips.push({ key: 'shelter', label: `Shelter: ${shelterLabel}`, onRemove: handleRemoveShelter });
    }

    if (filters.search) {
      chips.push({ key: 'search', label: `Cari: "${filters.search}"`, onRemove: handleRemoveSearch });
    }

    return chips;
  }, [
    filters,
    filterOptions,
    getOptionLabel,
    handleRemoveDateRange,
    handleRemoveJenis,
    handleRemoveShelter,
    handleRemoveSearch,
    handleRemoveWilayah,
  ]);

  const handleLoadMore = () => {
    if (!hasFetched || !hasMore || loadingMore) return;

    const nextPage = (pagination?.current_page || 1) + 1;
    dispatch(fetchMoreReportAnak({ filters, page: nextPage }));
  };

  const handleChildPress = (child) => {
    const childId = child.id_anak || child.id || child.child_id;
    if (!childId) return;

    navigation.navigate('AdminCabangChildDetail', {
      childId,
      childName: child.full_name || child.name || child.nama,
    });
  };

  const handleWilayahFetch = (wilayahId) => {
    if (!wilayahId) {
      return;
    }

    const existingOptions =
      filterOptions.sheltersByWilayah?.[wilayahId] || filterOptions.sheltersByWilayah?.[String(wilayahId)];

    if (Array.isArray(existingOptions) && !filterOptions.sheltersError) {
      return;
    }

    dispatch(fetchShelterOptionsByWilayah(wilayahId));
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Laporan Anak Binaan</Text>
          <Text style={styles.subtitle}>Pantau perkembangan anak binaan di seluruh shelter cabang.</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter" size={20} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TouchableOpacity
          onPress={handleSearch}
          style={styles.searchIconButton}
          accessibilityRole="button"
          accessibilityLabel="Cari"
        >
          <Ionicons name="search" size={18} color="#7f8c8d" />
        </TouchableOpacity>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Cari anak binaan"
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close-circle" size={18} color="#bdc3c7" />
          </TouchableOpacity>
        )}
      </View>

      {activeFilterChips.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          {activeFilterChips.map((chip) => (
            <View key={chip.key} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{chip.label}</Text>
              <TouchableOpacity
                onPress={chip.onRemove}
                style={styles.filterChipRemove}
                accessibilityRole="button"
                accessibilityLabel={`Hapus filter ${chip.label}`}
              >
                <Ionicons name="close" size={14} color="#7f8c8d" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {hasFetched && summary && <ChildReportSummary summary={summary} />}

      {error && (
        <View style={styles.errorWrapper}>
          <ErrorMessage message={error} />
        </View>
      )}
    </View>
  );

  const showReloadingOverlay = loading && !initializing && !loadingMore;

  return (
    <View style={styles.container}>
      {initializing && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}

      {showReloadingOverlay && (
        <View style={styles.reloadingOverlay}>
          <LoadingSpinner />
        </View>
      )}

      <FlatList
        data={children}
        keyExtractor={(item, index) => `${item.id_anak || item.id || item.child_id || index}`}
        renderItem={({ item }) => <ChildReportListItem child={item} onPress={handleChildPress} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !loading && !initializing ? (
            hasFetched ? (
              <EmptyState
                title="Belum ada data laporan"
                description="Silakan ubah filter atau segarkan halaman untuk melihat data terbaru."
              />
            ) : (
              <EmptyState title="Pilih filter untuk menampilkan laporan" />
            )
          ) : null
        }
        ListFooterComponent={loadingMore ? <LoadingSpinner size="small" /> : null}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2980b9" />
        }
      />

      <ChildReportFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        jenisOptions={filterOptions.jenisKegiatan}
        wilayahOptions={filterOptions.wilayahBinaan}
        shelterOptions={shelterOptions}
        shelterLoading={filterOptions.sheltersLoading}
        shelterError={filterOptions.sheltersError}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onWilayahFetch={handleWilayahFetch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  listHeader: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
    maxWidth: 260,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    marginBottom: 16,
  },
  searchIconButton: {
    marginRight: 8,
    padding: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  filterChipRemove: {
    marginLeft: 6,
    padding: 2,
  },
  errorWrapper: {
    marginTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  reloadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

export default AdminCabangChildReportScreen;
