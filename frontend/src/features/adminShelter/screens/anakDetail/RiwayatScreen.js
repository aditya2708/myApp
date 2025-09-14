import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import SearchBar from '../../../../common/components/SearchBar';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import FloatingActionButton from '../../../../common/components/FloatingActionButton';

import { adminShelterRiwayatApi } from '../../api/adminShelterRiwayatApi';

const RiwayatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { anakData, anakId } = route.params;

  const [riwayatList, setRiwayatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  useFocusEffect(
    useCallback(() => {
      fetchRiwayatList();
    }, [searchQuery])
  );

  const fetchRiwayatList = async (page = 1, isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const params = {
        page,
        per_page: 10,
        ...(searchQuery && { search: searchQuery })
      };

      const response = await adminShelterRiwayatApi.getAllRiwayat(anakId, params);

      if (response.data.success) {
        setRiwayatList(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.message || 'Gagal memuat data riwayat');
      }
    } catch (err) {
      console.error('Error fetching riwayat:', err);
      setError('Gagal memuat data riwayat. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRiwayatList(1, true);
  };

  const handleDelete = (riwayatId, namaRiwayat) => {
    Alert.alert(
      'Hapus Riwayat',
      `Anda yakin ingin menghapus riwayat "${namaRiwayat}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminShelterRiwayatApi.deleteRiwayat(anakId, riwayatId);
              fetchRiwayatList();
              Alert.alert('Sukses', 'Riwayat berhasil dihapus');
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus riwayat');
            }
          }
        }
      ]
    );
  };

  const renderRiwayatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.riwayatCard}
      onPress={() => navigation.navigate('RiwayatDetail', { 
        anakId, 
        riwayatId: item.id_histori,
        anakData
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.jenisHistori}>{item.jenis_histori}</Text>
          <Text style={styles.namaHistori}>{item.nama_histori}</Text>
          <Text style={styles.tanggal}>
            {format(new Date(item.tanggal), 'dd MMMM yyyy', { locale: id })}
          </Text>
        </View>
        {item.foto_url && (
          <Image source={{ uri: item.foto_url }} style={styles.thumbnail} />
        )}
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.di_opname === 'YA' ? '#e74c3c' : '#2ecc71' }
          ]}>
            <Text style={styles.statusText}>
              {item.di_opname === 'YA' ? 'Dirawat' : 'Tidak Dirawat'}
            </Text>
          </View>
          {item.di_opname === 'YA' && item.dirawat_id && (
            <Text style={styles.rawatInfo}>ID Rawat: {item.dirawat_id}</Text>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RiwayatForm', {
            anakId,
            riwayatData: item,
            isEdit: true,
            anakData
          })}
        >
          <Ionicons name="create-outline" size={16} color="#3498db" />
          <Text style={[styles.actionButtonText, { color: '#3498db' }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item.id_histori, item.nama_histori)}
        >
          <Ionicons name="trash-outline" size={16} color="#e74c3c" />
          <Text style={[styles.actionButtonText, { color: '#e74c3c' }]}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat riwayat..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.childName}>
          Riwayat {anakData?.full_name || anakData?.nick_name || 'Anak'}
        </Text>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cari riwayat..."
          style={styles.searchBar}
        />
      </View>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchRiwayatList()}
          retryText="Coba Lagi"
        />
      )}

      {!error && (
        <>
          {riwayatList.length === 0 ? (
            <EmptyState
              title="Belum Ada Riwayat"
              subtitle="Belum ada riwayat yang tercatat untuk anak ini"
              icon="document-text-outline"
            />
          ) : (
            <FlatList
              data={riwayatList}
              renderItem={renderRiwayatItem}
              keyExtractor={(item) => item.id_histori.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}

          <FloatingActionButton
            onPress={() => navigation.navigate('RiwayatForm', { 
              anakId, 
              isEdit: false,
              anakData
            })}
            icon="add"
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  searchBar: {
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  riwayatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  jenisHistori: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  namaHistori: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tanggal: {
    fontSize: 12,
    color: '#999',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cardContent: {
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  rawatInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default RiwayatScreen;