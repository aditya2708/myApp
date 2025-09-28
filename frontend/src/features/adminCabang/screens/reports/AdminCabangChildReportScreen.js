import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  selectReportAnakHasMore,
  selectReportAnakLoadingStates,
  selectReportAnakPagination,
  selectReportAnakSummary,
  setFilters,
  setSearch,
} from '../../redux/reportAnakSlice';
import {
  fetchMoreReportAnak,
  fetchReportAnakList,
  fetchShelterOptionsByWilayah,
  initializeReportAnak,
} from '../../redux/reportAnakThunks';

const AdminCabangChildReportScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const children = useSelector(selectReportAnakChildren);
  const summary = useSelector(selectReportAnakSummary);
  const filters = useSelector(selectReportAnakFilters);
  const filterOptions = useSelector(selectReportAnakFilterOptions);
  const { loading, loadingMore, initializing } = useSelector(selectReportAnakLoadingStates);
  const hasMore = useSelector(selectReportAnakHasMore);
  const error = useSelector(selectReportAnakError);
  const pagination = useSelector(selectReportAnakPagination);

  const [searchText, setSearchText] = useState(filters.search || '');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleSearch = useCallback(() => {
    const trimmed = searchText.trim();
    dispatch(setSearch(trimmed));
    dispatch(fetchReportAnakList({ filters: { ...filters, search: trimmed }, page: 1 }));
  }, [dispatch, filters, searchText]);

  const handleClearSearch = () => {
    setSearchText('');
    dispatch(setSearch(''));
    dispatch(fetchReportAnakList({ filters: { ...filters, search: '' }, page: 1 }));
  };

  const handleApplyFilters = (updatedFilters) => {
    const nextFilters = { ...filters, ...updatedFilters };
    dispatch(setFilters(nextFilters));
    dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
    setSearchText('');
    dispatch(fetchReportAnakList({ filters: { search: '' }, page: 1 }));
    setFilterModalVisible(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchReportAnakList({ filters, page: 1 }));
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;

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
    if (wilayahId) {
      dispatch(fetchShelterOptionsByWilayah(wilayahId));
    }
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Laporan Anak Binaan</Text>
          <Text style={styles.subtitle}>Pantau perkembangan anak binaan di seluruh shelter cabang.</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#7f8c8d" style={styles.searchIcon} />
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

      <ChildReportSummary summary={summary} />

      {error && (
        <View style={styles.errorWrapper}>
          <ErrorMessage message={error} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {initializing && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}

      <FlatList
        data={children}
        keyExtractor={(item, index) => `${item.id_anak || item.id || item.child_id || index}`}
        renderItem={({ item }) => (
          <ChildReportListItem child={item} onPress={handleChildPress} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !loading && !initializing ? (
            <EmptyState
              title="Belum ada data laporan"
              description="Silakan ubah filter atau segarkan halaman untuk melihat data terbaru."
            />
          ) : null
        }
        ListFooterComponent={loadingMore ? <LoadingSpinner size="small" /> : null}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2980b9"
          />
        )}
      />

      <ChildReportFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        jenisOptions={filterOptions.jenisKegiatan}
        wilayahOptions={filterOptions.wilayahBinaan}
        shelterOptions={shelterOptions}
        shelterLoading={filterOptions.sheltersLoading}
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
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
});

export default AdminCabangChildReportScreen;
