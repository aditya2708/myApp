import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import AnakListItem from '../../../common/components/Anak/AnakListItem';
import { adminShelterAnakApi } from '../api/adminShelterAnakApi';

const AnakManagementScreen = () => {
  const navigation = useNavigation();
  const [anakList, setAnakList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    anak_aktif: 0,
    anak_tidak_aktif: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAnakData = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setCurrentPage(1);
        page = 1;
      }
      
      setError(null);
      
      const params = {
        page,
        per_page: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(searchQuery.trim() && { search: searchQuery.trim() })
      };
      
      const response = await adminShelterAnakApi.getAllAnak(params);
      
      if (response.data.success) {
        const newData = response.data.data || [];
        
        if (refresh || page === 1) {
          setAnakList(newData);
        } else {
          setAnakList(prev => [...prev, ...newData]);
        }
        
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.current_page);
          setTotalPages(response.data.pagination.last_page);
        }
        
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
      } else {
        setError(response.data.message || 'Gagal memuat data');
      }
    } catch (err) {
      console.error('Error fetching anak:', err);
      setError('Gagal memuat data anak. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAnakData();
  }, [statusFilter]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchAnakData(1, true);
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnakData(1, true);
  };

  const handleLoadMore = () => {
    if (loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    fetchAnakData(currentPage + 1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAnakData(1, true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchAnakData(1, true);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const handleViewAnak = (anakId) => {
    navigation.navigate('AnakDetail', { id: anakId });
  };

  const handleAddAnak = () => {
    navigation.navigate('AnakDetail', { isNew: true });
  };


  const handleDeleteAnak = (anak) => {
    Alert.alert(
      'Hapus Anak',
      `Anda yakin ingin menghapus ${anak.full_name || 'anak ini'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminShelterAnakApi.deleteAnak(anak.id_anak);
              handleRefresh();
              Alert.alert('Sukses', 'Anak berhasil dihapus');
            } catch (err) {
              console.error('Error deleting anak:', err);
              Alert.alert('Error', 'Gagal menghapus anak');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#E11D48" />
        <Text style={styles.footerText}>Memuat data...</Text>
      </View>
    );
  };

  if (loading && !refreshing && !loadingMore) {
    return <LoadingSpinner fullScreen message="Memuat data anak..." />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
          retryText="Coba Lagi"
        />
      )}
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari anak..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        <Button
          leftIcon={<Ionicons name="add" size={20} color="#FFFFFF" />}
          type="primary"
          onPress={handleAddAnak}
          style={styles.addButton}
        />
      </View>
      
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {[
          { key: '', label: 'Semua', count: summary.total },
          { key: 'aktif', label: 'Aktif', count: summary.anak_aktif },
          { key: 'non-aktif', label: 'Non-Aktif', count: summary.anak_tidak_aktif }
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              statusFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => handleStatusFilter(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              statusFilter === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label} ({filter.count || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Children List */}
      {anakList.length > 0 ? (
        <FlatList
          data={anakList}
          renderItem={({ item }) => (
            <AnakListItem 
              item={item}
              onPress={() => handleViewAnak(item.id_anak)}
              onDelete={handleDeleteAnak}
            />
          )}
          keyExtractor={(item) => item.id_anak?.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          {searchQuery.trim() !== '' ? (
            <>
              <Ionicons name="search" size={60} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                Tidak ada anak ditemukan dengan "{searchQuery}"
              </Text>
              <Button 
                title="Hapus Pencarian" 
                onPress={clearSearch} 
                type="outline"
                style={styles.emptyButton}
              />
            </>
          ) : (
            <>
              <Ionicons name="people" size={60} color="#D1D5DB" />
              <Text style={styles.emptyText}>Belum ada anak terdaftar</Text>
              <Button 
                title="Tambah Anak Pertama" 
                onPress={handleAddAnak} 
                type="primary"
                style={styles.emptyButton}
              />
            </>
          )}
        </View>
      )}

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('PengajuanAnakSearch')}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E11D48',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#E11D48',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#E11D48',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default AnakManagementScreen;