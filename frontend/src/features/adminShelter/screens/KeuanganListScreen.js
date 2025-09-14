import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import SearchBar from '../../../common/components/SearchBar';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import EmptyState from '../../../common/components/EmptyState';
import PickerInput from '../../../common/components/PickerInput';
import ConfirmationModal from '../../../common/components/ConfirmationModal';
import { adminShelterKeuanganApi } from '../api/adminShelterKeuanganApi';

const KeuanganListScreen = () => {
  const navigation = useNavigation();
  const [keuangan, setKeuangan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedTingkatSekolah, setSelectedTingkatSekolah] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, item: null });
  const [deleting, setDeleting] = useState(false);

  // Filter options
  const semesterOptions = [
    { label: 'Semester 1', value: 'Semester 1' },
    { label: 'Semester 2', value: 'Semester 2' },
    { label: 'Semester Genap', value: 'Semester Genap' },
    { label: 'Semester Ganjil', value: 'Semester Ganjil' },
  ];

  const tingkatSekolahOptions = [
    { label: 'SD', value: 'SD' },
    { label: 'SMP', value: 'SMP' },
    { label: 'SMA', value: 'SMA' },
    { label: 'SMK', value: 'SMK' },
  ];

  const fetchKeuangan = async () => {
    try {
      setError(null);
      const params = {
        search: searchQuery,
        semester: selectedSemester,
        tingkat_sekolah: selectedTingkatSekolah,
        per_page: 20,
      };

      const response = await adminShelterKeuanganApi.getAllKeuangan(params);
      setKeuangan(response.data.data.data || []);
    } catch (err) {
      console.error('Error fetching keuangan:', err);
      setError('Gagal memuat data keuangan. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchKeuangan();
    }, [searchQuery, selectedSemester, selectedTingkatSekolah])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchKeuangan();
  };

  const handleSearch = () => {
    setLoading(true);
    fetchKeuangan();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSemester('');
    setSelectedTingkatSekolah('');
    setShowFilters(false);
  };

  const handleAddKeuangan = () => {
    navigation.navigate('KeuanganForm');
  };

  const handleEditKeuangan = (item) => {
    navigation.navigate('KeuanganForm', { keuangan: item, isEdit: true });
  };

  const handleViewDetail = (item) => {
    navigation.navigate('KeuanganDetail', { keuanganId: item.id_keuangan });
  };

  const handleDeleteKeuangan = (item) => {
    setDeleteModal({ visible: true, item });
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await adminShelterKeuanganApi.deleteKeuangan(deleteModal.item.id_keuangan);
      
      setKeuangan(prev => 
        prev.filter(item => item.id_keuangan !== deleteModal.item.id_keuangan)
      );
      
      Alert.alert('Berhasil', 'Data keuangan berhasil dihapus');
    } catch (err) {
      console.error('Error deleting keuangan:', err);
      Alert.alert('Error', 'Gagal menghapus data keuangan');
    } finally {
      setDeleting(false);
      setDeleteModal({ visible: false, item: null });
    }
  };

  const formatCurrency = (amount) => {
    const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue || 0);
  };

  // Use calculated totals from API response or calculate if not available
  const getTotals = (item) => {
    // Use totals from API if available
    if (item.total_kebutuhan !== undefined && item.total_bantuan !== undefined) {
      return {
        totalKebutuhan: parseFloat(item.total_kebutuhan) || 0,
        totalBantuan: parseFloat(item.total_bantuan) || 0,
        sisaTagihan: parseFloat(item.sisa_tagihan) || 0,
      };
    }
    
    // Fallback calculation if API doesn't provide totals
    const bimbel = parseFloat(item.bimbel) || 0;
    const eskulDanKeagamaan = parseFloat(item.eskul_dan_keagamaan) || 0;
    const laporan = parseFloat(item.laporan) || 0;
    const uangTunai = parseFloat(item.uang_tunai) || 0;
    const donasi = parseFloat(item.donasi) || 0;
    const subsidiInfak = parseFloat(item.subsidi_infak) || 0;
    
    const totalKebutuhan = bimbel + eskulDanKeagamaan + laporan + uangTunai;
    const totalBantuan = donasi + subsidiInfak;
    const sisaTagihan = Math.max(0, totalKebutuhan - totalBantuan);
    
    return { totalKebutuhan, totalBantuan, sisaTagihan };
  };

  const renderKeuanganItem = ({ item }) => {
    const { totalKebutuhan, totalBantuan, sisaTagihan } = getTotals(item);
    const statusPaid = item.is_lunas !== undefined ? item.is_lunas : (totalKebutuhan <= totalBantuan);

    return (
      <TouchableOpacity 
        style={styles.keuanganCard}
        onPress={() => handleViewDetail(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.childInfo}>
            {item.anak?.foto ? (
              <Image 
                source={{ uri: `http://192.168.8.105:8000/storage/Anak/${item.anak.id_anak}/${item.anak.foto}` }}
                style={styles.childAvatar}
              />
            ) : (
              <View style={styles.childAvatarPlaceholder}>
                <Ionicons name="person" size={20} color="#ffffff" />
              </View>
            )}
            <View style={styles.childDetails}>
              <Text style={styles.childName}>{item.anak?.full_name || 'Nama tidak diketahui'}</Text>
              <Text style={styles.semesterText}>{item.semester} - {item.tingkat_sekolah}</Text>
            </View>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditKeuangan(item)}
            >
              <Ionicons name="create-outline" size={20} color="#3498db" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteKeuangan(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.financialInfo}>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Total Kebutuhan:</Text>
            <Text style={styles.financialAmount}>{formatCurrency(totalKebutuhan)}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Total Bantuan:</Text>
            <Text style={styles.financialAmount}>{formatCurrency(totalBantuan)}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Sisa Tagihan:</Text>
            <Text style={[styles.financialAmount, { color: sisaTagihan > 0 ? '#e74c3c' : '#27ae60' }]}>
              {formatCurrency(sisaTagihan)}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusPaid ? '#27ae60' : '#e74c3c' }]}>
            <Text style={styles.statusText}>
              {statusPaid ? 'Lunas' : 'Belum Lunas'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat data keuangan..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Section */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cari nama anak..."
          showSearchButton
          onSearch={handleSearch}
          style={styles.searchBar}
        />
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <PickerInput
            label="Semester"
            value={selectedSemester}
            onValueChange={setSelectedSemester}
            items={semesterOptions}
            placeholder="Pilih Semester"
          />
          
          <PickerInput
            label="Tingkat Sekolah"
            value={selectedTingkatSekolah}
            onValueChange={setSelectedTingkatSekolah}
            items={tingkatSekolahOptions}
            placeholder="Pilih Tingkat Sekolah"
          />

          <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
            <Text style={styles.clearFilterText}>Bersihkan Filter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchKeuangan}
        />
      )}

      {/* Keuangan List */}
      <FlatList
        data={keuangan}
        renderItem={renderKeuanganItem}
        keyExtractor={(item) => item.id_keuangan.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !loading && !error && (
            <EmptyState
              icon="wallet-outline"
              title="Belum Ada Data Keuangan"
              message="Tambahkan data keuangan anak pertama Anda"
              actionButtonText="Tambah Keuangan"
              onActionPress={handleAddKeuangan}
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddKeuangan}>
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModal.visible}
        title="Hapus Data Keuangan"
        message={`Apakah Anda yakin ingin menghapus data keuangan ${deleteModal.item?.anak?.full_name}?`}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ visible: false, item: null })}
        loading={deleting}
        type="danger"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 12,
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearFilterButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  clearFilterText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  keuanganCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  childAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  semesterText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  financialInfo: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  financialLabel: {
    fontSize: 14,
    color: '#666',
  },
  financialAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default KeuanganListScreen;