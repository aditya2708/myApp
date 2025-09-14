import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import SearchBar from '../../../common/components/SearchBar';
import Button from '../../../common/components/Button';
import ConfirmationModal from '../../../common/components/ConfirmationModal';
import { adminCabangPengajuanDonaturApi } from '../api/adminCabangPengajuanDonaturApi';

const DonaturSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { child } = route.params;

  const [donatur, setDonatur] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedDonatur, setSelectedDonatur] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchDonatur = async (page = 1, search = '') => {
    try {
      setError(null);
      const response = await adminCabangPengajuanDonaturApi.getAvailableDonatur({
        page,
        search,
        per_page: 10
      });
      
      const { data, current_page, last_page } = response.data.data;
      
      if (page === 1) {
        setDonatur(data);
      } else {
        setDonatur(prev => [...prev, ...data]);
      }
      
      setPagination({ current_page, last_page });
    } catch (err) {
      setError('Gagal memuat data donatur');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchDonatur();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchInput('');
    setSearchQuery('');
    fetchDonatur(1, '');
  };

  const handleLoadMore = () => {
    if (pagination.current_page < pagination.last_page && !loadingMore) {
      setLoadingMore(true);
      fetchDonatur(pagination.current_page + 1, searchQuery);
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
    setDonatur([]); // Clear existing data
    fetchDonatur(1, trimmedInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setLoading(true);
    fetchDonatur(1, '');
  };

  const handleSelectDonatur = (donaturItem) => {
    setSelectedDonatur(donaturItem);
    setShowConfirmModal(true);
  };

  const handleConfirmAssignment = async () => {
    try {
      setAssigning(true);
      await adminCabangPengajuanDonaturApi.assignDonatur({
        id_anak: child.id_anak,
        id_donatur: selectedDonatur.id_donatur
      });

      Alert.alert(
        'Berhasil!',
        `Donatur ${selectedDonatur.nama_lengkap} berhasil ditugaskan untuk ${child.full_name}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal menugaskan donatur');
    } finally {
      setAssigning(false);
      setShowConfirmModal(false);
      setSelectedDonatur(null);
    }
  };

  const DonaturCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectDonatur(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.donaturImageContainer}>
          {item.foto_url ? (
            <Image source={{ uri: item.foto_url }} style={styles.donaturImage} />
          ) : (
            <View style={styles.donaturImagePlaceholder}>
              <Ionicons name="person" size={30} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.donaturInfo}>
          <Text style={styles.donaturName}>{item.nama_lengkap}</Text>
          <View style={styles.donaturDetails}>
            <Text style={styles.detailText}>
              <Ionicons name="call-outline" size={14} color="#666" /> {item.no_hp}
            </Text>
            <Text style={styles.detailText}>
              <Ionicons name="location-outline" size={14} color="#666" /> {item.alamat}
            </Text>
            {item.wilbin && (
              <Text style={styles.detailText}>
                <Ionicons name="business-outline" size={14} color="#666" /> {item.wilbin.nama_wilbin}
              </Text>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.statusContainer}>
        <View style={styles.childrenCountBadge}>
          <Ionicons name="people" size={16} color="#2ecc71" />
          <Text style={styles.childrenCountText}>
            {item.anak_count || 0} Anak Asuh
          </Text>
        </View>
        <Text style={styles.statusText}>
          {item.diperuntukan || 'Umum'}
        </Text>
      </View>
      
      <Button
        title="Pilih Donatur"
        type="primary"
        size="small"
        onPress={() => handleSelectDonatur(item)}
        leftIcon={<Ionicons name="checkmark" size={16} color="white" />}
        style={styles.selectButton}
      />
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
      <Text style={styles.emptyTitle}>Tidak Ada Donatur Tersedia</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Tidak ditemukan hasil pencarian' : 'Semua donatur sudah mencapai batas maksimal anak binaan'}
      </Text>
    </View>
  );

  if (loading && !refreshing && !searchLoading) {
    return <LoadingSpinner fullScreen message="Memuat data donatur..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.childSummary}>
          <Image 
            source={{ uri: child.foto_url }} 
            style={styles.childSummaryImage}
            defaultSource={require('../../../assets/images/logo.png')}
          />
          <View style={styles.childSummaryInfo}>
            <Text style={styles.childSummaryName}>{child.full_name}</Text>
            <Text style={styles.childSummaryDetail}>
              {child.umur} tahun • {child.shelter?.nama_shelter}
            </Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          Pilih donatur untuk anak ini
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchInput}
          onChangeText={handleInputChange}
          placeholder="Cari nama donatur..."
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
          onRetry={() => fetchDonatur(1, searchQuery)}
        />
      )}

      <FlatList
        data={donatur}
        keyExtractor={(item) => item.id_donatur.toString()}
        renderItem={DonaturCard}
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

      <ConfirmationModal
        visible={showConfirmModal}
        title="Konfirmasi Penugasan"
        message={`Apakah Anda yakin ingin menugaskan ${selectedDonatur?.nama_lengkap} sebagai donatur untuk ${child.full_name}?`}
        confirmText="Ya, Tugaskan"
        cancelText="Batal"
        onConfirm={handleConfirmAssignment}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedDonatur(null);
        }}
        loading={assigning}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  childSummary: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  childSummaryImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  childSummaryInfo: { flex: 1 },
  childSummaryName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  childSummaryDetail: { fontSize: 14, color: '#666', marginTop: 2 },
  headerSubtitle: { fontSize: 14, color: '#666' },
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
  donaturImageContainer: { marginRight: 12 },
  donaturImage: { width: 60, height: 60, borderRadius: 30 },
  donaturImagePlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  donaturInfo: { flex: 1 },
  donaturName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  donaturDetails: { gap: 4 },
  detailText: { fontSize: 13, color: '#666', marginBottom: 4 },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 8 },
  childrenCountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  childrenCountText: { fontSize: 12, color: '#2ecc71', marginLeft: 4, fontWeight: '500' },
  statusText: { fontSize: 12, color: '#666', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  selectButton: { alignSelf: 'stretch' },
  footerLoader: { padding: 16, alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});

export default DonaturSelectionScreen;