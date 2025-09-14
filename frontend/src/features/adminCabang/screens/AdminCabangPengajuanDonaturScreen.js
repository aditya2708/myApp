import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import SearchBar from '../../../common/components/SearchBar';
import Button from '../../../common/components/Button';
import { adminCabangPengajuanDonaturApi } from '../api/adminCabangPengajuanDonaturApi';

const AdminCabangPengajuanDonaturScreen = () => {
  const navigation = useNavigation();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchChildren = async (page = 1, search = '') => {
    try {
      setError(null);
      const response = await adminCabangPengajuanDonaturApi.getCpbChildren({
        page,
        search,
        per_page: 10
      });
      
      const { data, current_page, last_page } = response.data.data;
      
      if (page === 1) {
        setChildren(data);
      } else {
        setChildren(prev => {
          const existingIds = new Set(prev.map(item => item.id_anak));
          const newData = data.filter(item => !existingIds.has(item.id_anak));
          return [...prev, ...newData];
        });
      }
      
      setPagination({ current_page, last_page });
    } catch (err) {
      setError('Gagal memuat data anak CPB');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        fetchChildren();
      }
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchInput('');
    setSearchQuery('');
    fetchChildren(1, '');
  };

  const handleLoadMore = () => {
    if (pagination.current_page < pagination.last_page && !loadingMore) {
      setLoadingMore(true);
      fetchChildren(pagination.current_page + 1, searchQuery);
    }
  };

  const handleInputChange = (text) => {
    setSearchInput(text);
  };

  const handleSearch = () => {
    const trimmedInput = searchInput.trim();
    
    if (trimmedInput.length > 0 && trimmedInput.length < 3) {
      Alert.alert('Peringatan', 'Masukkan minimal 3 karakter untuk pencarian');
      return;
    }

    setSearchQuery(trimmedInput);
    setSearchLoading(true);
    setChildren([]); // Clear existing data
    fetchChildren(1, trimmedInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setLoading(true);
    fetchChildren(1, '');
  };

  const handleSelectDonatur = (child) => {
    navigation.navigate('DonaturSelection', { child });
  };

  const handleViewDetail = (child) => {
    navigation.navigate('ChildDetail', { childId: child.id_anak });
  };

  const ChildCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleViewDetail(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.childImageContainer}>
          {item.foto_url ? (
            <Image source={{ uri: item.foto_url }} style={styles.childImage} />
          ) : (
            <View style={styles.childImagePlaceholder}>
              <Ionicons name="person" size={30} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{item.full_name}</Text>
          <Text style={styles.childNick}>({item.nick_name})</Text>
          <View style={styles.childDetails}>
            <Text style={styles.detailText}>
              <Ionicons name="calendar-outline" size={14} color="#666" /> {item.umur} tahun
            </Text>
          </View>
          <Text style={styles.shelterText}>
            <Ionicons name="home-outline" size={14} color="#666" /> {item.shelter?.nama_shelter}
          </Text>
        </View>
      </View>
      
      <View style={styles.statusContainer}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>CPB</Text>
        </View>
        <Text style={styles.statusDescription}>Belum memiliki donatur</Text>
      </View>
      
      <View style={styles.cardActions}>
        <Button
          title="Lihat Detail"
          type="outline"
          size="small"
          onPress={() => handleViewDetail(item)}
          style={styles.detailButton}
        />
        <Button
          title="Ajukan Donatur"
          type="primary"
          size="small"
          onPress={() => handleSelectDonatur(item)}
          style={styles.assignButton}
          leftIcon={<Ionicons name="person-add" size={16} color="white" />}
        />
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <LoadingSpinner size="small" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Tidak Ada Anak CPB</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Tidak ditemukan hasil pencarian' : 'Semua anak sudah memiliki donatur'}
      </Text>
    </View>
  );

  if (loading && !refreshing && !searchLoading) {
    return <LoadingSpinner fullScreen message="Memuat data anak CPB..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengajuan Donatur</Text>
        <Text style={styles.headerSubtitle}>
          Daftar anak yang belum memiliki donatur
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchInput}
          onChangeText={handleInputChange}
          placeholder="Cari nama anak..."
          showSearchButton={true}
          onSearch={handleSearch}
          loading={searchLoading}
          disabled={loading}
        />
        
        {searchQuery && (
          <View style={styles.searchInfo}>
            <Text style={styles.searchInfoText}>
              Hasil pencarian: "{searchQuery}"
            </Text>
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#e74c3c" />
              <Text style={styles.clearButtonText}>Hapus</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchChildren(1, searchQuery)}
        />
      )}

      <FlatList
        data={children}
        keyExtractor={(item) => item.id_anak.toString()}
        renderItem={ChildCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  searchContainer: { padding: 16, backgroundColor: '#fff' },
  searchInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 12, 
    paddingHorizontal: 8 
  },
  searchInfoText: { fontSize: 14, color: '#666', flex: 1 },
  clearButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4 
  },
  clearButtonText: { fontSize: 14, color: '#e74c3c', marginLeft: 4 },
  listContainer: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  childImageContainer: { marginRight: 12 },
  childImage: { width: 60, height: 60, borderRadius: 30 },
  childImagePlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  childNick: { fontSize: 14, color: '#666', marginTop: 2 },
  childDetails: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  detailText: { fontSize: 13, color: '#666', marginRight: 16, marginBottom: 4 },
  shelterText: { fontSize: 13, color: '#666', marginTop: 4 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff3cd', borderRadius: 8, borderWidth: 1, borderColor: '#ffeaa7' },
  statusBadge: { backgroundColor: '#f39c12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statusDescription: { fontSize: 13, color: '#856404' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between' },
  detailButton: { flex: 1, marginRight: 8 },
  assignButton: { flex: 1, marginLeft: 8 },
  footerLoader: { padding: 16, alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});

export default AdminCabangPengajuanDonaturScreen;