import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import EmptyState from '../../../common/components/EmptyState';
import SearchBar from '../../../common/components/SearchBar';
import DonaturCard from '../components/DonaturCard';
import { adminCabangDonaturApi } from '../api/adminCabangDonaturApi';

const AdminCabangDonaturListScreen = () => {
  const navigation = useNavigation();
  const [donatur, setDonatur] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    id_wilbin: '',
    id_shelter: '',
    diperuntukan: ''
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchDonatur = async (page = 1, isRefresh = false) => {
    try {
      if (page === 1) {
        setError(null);
      }

      const params = {
        page,
        per_page: 15,
        search: searchQuery,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await adminCabangDonaturApi.getDonatur(params);
      const { data, current_page, last_page, total } = response.data.data;

      if (page === 1 || isRefresh) {
        setDonatur(data);
      } else {
        setDonatur(prev => [...prev, ...data]);
      }

      setPagination({ current_page, last_page, total });
    } catch (err) {
      console.error('Error fetching donatur:', err);
      setError('Gagal memuat data donatur. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchDonatur();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDonatur(1, true);
    }, [searchQuery, filters])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDonatur(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && pagination.current_page < pagination.last_page) {
      setLoadingMore(true);
      fetchDonatur(pagination.current_page + 1);
    }
  };

  const handleSearch = () => {
    fetchDonatur(1, true);
  };

  const handleDelete = (donatur) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus donatur "${donatur.nama_lengkap}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteDonatur(donatur.id_donatur)
        }
      ]
    );
  };

  const deleteDonatur = async (donaturId) => {
    try {
      await adminCabangDonaturApi.deleteDonatur(donaturId);
      Alert.alert('Sukses', 'Donatur berhasil dihapus');
      fetchDonatur(1, true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus donatur';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDonaturPress = (donatur) => {
    navigation.navigate('DonaturDetail', { donaturId: donatur.id_donatur });
  };

  const handleEdit = (donatur) => {
    navigation.navigate('DonaturForm', { donaturId: donatur.id_donatur });
  };

  const navigateToForm = (donaturId = null) => {
    navigation.navigate('DonaturForm', { donaturId });
  };

  const navigateToFilter = () => {
    navigation.navigate('DonaturFilter', { 
      currentFilters: filters,
      onApplyFilters: (newFilters) => {
        setFilters(newFilters);
      }
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  const renderDonaturCard = ({ item }) => (
    <DonaturCard
      donatur={item}
      onPress={handleDonaturPress}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Cari donatur..."
        showSearchButton={true}
        onSearch={handleSearch}
        style={styles.searchBar}
      />
      
      <TouchableOpacity style={styles.filterButton} onPress={navigateToFilter}>
        <Ionicons name="filter" size={20} color="#fff" />
        {getActiveFiltersCount() > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <LoadingSpinner size="small" message="Memuat lebih banyak..." />
      </View>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat data donatur..." />;
  }

  return (
    <View style={styles.container}>
      {error && <ErrorMessage message={error} onRetry={() => fetchDonatur(1, true)} />}

      {renderHeader()}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Total: {pagination.total} donatur
        </Text>
        {getActiveFiltersCount() > 0 && (
          <Text style={styles.filterText}>
            ({getActiveFiltersCount()} filter aktif)
          </Text>
        )}
      </View>

      <FlatList
        data={donatur}
        renderItem={renderDonaturCard}
        keyExtractor={(item) => item.id_donatur.toString()}
        contentContainerStyle={donatur.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="people-outline"
              title="Belum ada donatur"
              message="Mulai dengan menambahkan donatur baru"
              actionButtonText="Tambah Donatur"
              onActionPress={() => navigateToForm()}
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigateToForm()}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchBar: {
    flex: 1,
    marginRight: 12,
  },
  filterButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  filterText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  loadingMore: {
    paddingVertical: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});

export default AdminCabangDonaturListScreen;