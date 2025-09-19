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

// Import components
import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import API
import { adminShelterKeluargaApi } from '../api/adminShelterKeluargaApi';
import { useAuth } from '../../../common/hooks/useAuth';

const KeluargaManagementScreen = () => {
  const navigation = useNavigation();
  const { profile } = useAuth();
  
  // State
  const [keluargaList, setKeluargaList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Fetch keluarga data
  const fetchKeluargaData = async (page = 1, refresh = false) => {
    try {
      if (refresh) page = 1;
      setError(null);

      const params = { page, per_page: 10, search: debouncedSearchQuery.trim() };
      const response = await adminShelterKeluargaApi.getAllKeluarga(params);

      if (response.data.success) {
        let newData = response.data.data || [];
        // filter out items without id
        newData = newData.filter(item => item.id_keluarga != null);

        if (refresh || page === 1) {
          setKeluargaList(newData);
        } else {
          setKeluargaList(prev => {
            const existingIds = new Set(prev.map(i => i.id_keluarga));
            const filtered = newData.filter(i => !existingIds.has(i.id_keluarga));
            return [...prev, ...filtered];
          });
        }

        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.current_page);
          setTotalPages(response.data.pagination.last_page);
        }
      } else {
        setError(response.data.message || 'Failed to load data');
      }
    } catch (err) {
      console.error('Error fetching keluarga:', err);
      setError('Failed to load family data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchKeluargaData(1, true); }, [debouncedSearchQuery]);
  useEffect(() => { fetchKeluargaData(); }, []);
  
  // Auto-refresh data when screen comes back to focus
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we're not currently loading and not in the middle of searching
      if (!loading && !refreshing && debouncedSearchQuery === searchQuery) {
        fetchKeluargaData(1, true);
      }
    }, [loading, refreshing, debouncedSearchQuery, searchQuery])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchKeluargaData(1, true);
  };

  const handleLoadMore = () => {
    if (loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    fetchKeluargaData(currentPage + 1);
  };

  const clearSearch = () => setSearchQuery('');

  const handleViewKeluarga = id => navigation.navigate('KeluargaDetail', { id });
  const handleAddKeluarga = () => {
    navigation.navigate('KeluargaForm', { isNew: true });
  };

  const handleDeleteKeluarga = (keluarga) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus keluarga "${keluarga.kepala_keluarga}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: () => performDeleteKeluarga(keluarga)
        }
      ]
    );
  };

  const performDeleteKeluarga = async (keluarga) => {
    try {
      setLoading(true);
      const response = await adminShelterKeluargaApi.deleteKeluarga(keluarga.id_keluarga);
      
      if (response.data.success) {
        handleRefresh();
        Alert.alert('Berhasil', 'Keluarga telah dihapus');
      }
    } catch (err) {
      console.error('Error deleting keluarga:', err);
      
      // Handle case where family has active children
      if (err.response?.data?.code === 'HAS_ACTIVE_CHILDREN') {
        const childrenInfo = err.response.data.data.children_info;
        showDeleteOptionsDialog(keluarga, childrenInfo);
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Gagal menghapus keluarga');
      }
    } finally {
      setLoading(false);
    }
  };

  const showDeleteOptionsDialog = (keluarga, childrenInfo) => {
    const activeChildrenNames = childrenInfo.active_children_list
      .map(child => child.full_name || child.nick_name)
      .join(', ');
    
    Alert.alert(
      'Keluarga Memiliki Anak Aktif',
      `Keluarga "${keluarga.kepala_keluarga}" memiliki ${childrenInfo.active_children} anak aktif: ${activeChildrenNames}.\n\nPERINGATAN: Menghapus keluarga ini akan sekaligus menghapus semua data anak yang terkait dari sistem.`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus Paksa', 
          style: 'destructive',
          onPress: () => confirmForceDelete(keluarga, childrenInfo)
        }
      ]
    );
  };


  const confirmForceDelete = (keluarga, childrenInfo) => {
    Alert.alert(
      'Konfirmasi Hapus Paksa',
      `Anda akan menghapus keluarga "${keluarga.kepala_keluarga}" dan mengubah status ${childrenInfo.active_children} anak menjadi "tanpa keluarga".\n\nApakah Anda yakin?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus Paksa', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminShelterKeluargaApi.forceDeleteKeluarga(keluarga.id_keluarga);
              handleRefresh();
              Alert.alert('Berhasil', 'Keluarga telah dihapus dan status anak telah diperbarui');
            } catch (err) {
              console.error('Error force deleting keluarga:', err);
              Alert.alert('Error', 'Gagal menghapus keluarga');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderFooter = () => loadingMore ? (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color="#e74c3c" />
      <Text style={styles.footerText}>Memuat Lebih Banyak...</Text>
    </View>
  ) : null;

  const renderKeluargaItem = ({ item }) => (
    <TouchableOpacity style={styles.keluargaItem} onPress={() => handleViewKeluarga(item.id_keluarga)}>
      <View style={styles.keluargaContent}>
        <View style={styles.keluargaHeader}>
          <Text style={styles.keluargaName}>{item.kepala_keluarga}</Text>
          <View style={styles.keluargaActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('KeluargaForm', { keluarga: item })}>
              <Ionicons name="create-outline" size={18} color="#3498db" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.hiddenActionButton]}
              onPress={() => handleDeleteKeluarga(item)}
              disabled
              pointerEvents="none"
              accessible={false}
              testID="keluarga-delete-action"
            >
              <Ionicons name="trash-outline" size={18} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.keluargaDetails}>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>No. KK:</Text><Text style={styles.detailValue}>{item.no_kk || '-'}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Status:</Text><Text style={styles.detailValue}>{item.status_ortu || '-'}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Shelter:</Text><Text style={styles.detailValue}>{item.shelter?.nama_shelter || '-'}</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing && !loadingMore) return <LoadingSpinner fullScreen message="Memuat Data..." />;

  return (
    <View style={styles.container}>
      {error && <ErrorMessage message={error} onRetry={handleRefresh} retryText="Try Again" />}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Cari Keluarga atau KK" value={searchQuery} onChangeText={setSearchQuery} clearButtonMode="while-editing" />
          {searchQuery.length > 0 && <TouchableOpacity onPress={clearSearch} style={styles.clearButton}><Ionicons name="close-circle" size={20} color="#999999" /></TouchableOpacity>}
        </View>
      </View>
      {keluargaList.length > 0 ? (
        <FlatList
          data={keluargaList}
          renderItem={renderKeluargaItem}
          keyExtractor={item => item.id_keluarga.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      ) : (
        <View style={styles.emptyContainer}>
          {searchQuery.trim() !== '' ? (
            <>
              <Ionicons name="search" size={60} color="#cccccc" />
              <Text style={styles.emptyText}>No families found with "{searchQuery}"</Text>
              <Button title="Clear Search" onPress={clearSearch} type="outline" style={styles.emptyButton} />
            </>
          ) : (
            <>
              <Ionicons name="people" size={60} color="#cccccc" />
              <Text style={styles.emptyText}>No families registered yet</Text>
              <Button title="Add First Family" onPress={handleAddKeluarga} type="primary" style={styles.emptyButton} />
            </>
          )}
        </View>
      )}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddKeluarga}>
        <Ionicons name="add" size={30} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchContainer: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eeeeee' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, fontSize: 16, color: '#333333' },
  clearButton: { padding: 4 },
  listContainer: { padding: 16, paddingBottom: 80 },
  keluargaItem: { backgroundColor: '#ffffff', borderRadius: 8, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  keluargaContent: { padding: 16 },
  keluargaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  keluargaName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  keluargaActions: { flexDirection: 'row' },
  actionButton: { padding: 6, marginLeft: 8 },
  hiddenActionButton: { display: 'none' },
  keluargaDetails: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12 },
  detailRow: { flexDirection: 'row', marginBottom: 4 },
  detailLabel: { width: 70, fontSize: 14, color: '#777' },
  detailValue: { flex: 1, fontSize: 14, color: '#333' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#999999', textAlign: 'center', marginTop: 16, marginBottom: 24 },
  emptyButton: { minWidth: 180 },
  footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16 },
  footerText: { marginLeft: 8, fontSize: 14, color: '#666666' },
  floatingButton: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
});

export default KeluargaManagementScreen;
