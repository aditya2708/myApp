import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import PrestasiListItem from '../../../../common/components/Anak/PrestasiListItem';

// Import API
import { adminShelterPrestasiApi } from '../../api/adminShelterPrestasiApi';

const PrestasiScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { anakData, anakId } = route.params || {};
  
  const [prestasiList, setPrestasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch prestasi data
  const fetchPrestasiData = async () => {
    if (!anakId) return;
    
    try {
      setError(null);
      const response = await adminShelterPrestasiApi.getPrestasi(anakId);
      
      if (response.data.success) {
        setPrestasiList(response.data.data || []);
      } else {
        setError(response.data.message || 'Gagal memuat data prestasi');
      }
    } catch (err) {
      console.error('Error fetching prestasi data:', err);
      setError('Gagal memuat data prestasi. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPrestasiData();
  }, [anakId]);
  
  // Refresh data when navigating back to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPrestasiData();
    });
    
    return unsubscribe;
  }, [navigation]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrestasiData();
  };

  // Handle view prestasi detail
  const handleViewPrestasi = (prestasi) => {
    navigation.navigate('PrestasiDetail', {
      anakData,
      anakId,
      prestasiId: prestasi.id_prestasi,
      prestasiData: prestasi
    });
  };

  // Handle add new prestasi
  const handleAddPrestasi = () => {
    navigation.navigate('PrestasiForm', {
      anakData,
      anakId,
      isEdit: false
    });
  };

  // Handle edit prestasi
  const handleEditPrestasi = (prestasi) => {
    navigation.navigate('PrestasiForm', {
      anakData,
      anakId,
      prestasiId: prestasi.id_prestasi,
      prestasiData: prestasi,
      isEdit: true
    });
  };

  // Handle delete prestasi
  const handleDeletePrestasi = (prestasi) => {
    Alert.alert(
      'Hapus Prestasi',
      `Anda yakin ingin menghapus prestasi "${prestasi.nama_prestasi}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await adminShelterPrestasiApi.deletePrestasi(anakId, prestasi.id_prestasi);
              
              if (response.data.success) {
                // Remove the deleted prestasi from the list
                setPrestasiList(prev => prev.filter(item => item.id_prestasi !== prestasi.id_prestasi));
                Alert.alert('Sukses', 'Prestasi berhasil dihapus');
              } else {
                setError(response.data.message || 'Gagal menghapus prestasi');
              }
            } catch (err) {
              console.error('Error deleting prestasi:', err);
              setError('Gagal menghapus prestasi. Silakan coba lagi.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerImageContainer}>
            {anakData?.foto_url ? (
              <Image
                source={{ uri: anakData.foto_url }}
                style={styles.headerImage}
              />
            ) : (
              <View style={styles.headerImagePlaceholder}>
                <Ionicons name="person" size={40} color="#ffffff" />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{anakData?.full_name || 'Nama Anak'}</Text>
            {anakData?.nick_name && (
              <Text style={styles.headerNickname}>{anakData.nick_name}</Text>
            )}
          </View>
        </View>
        <LoadingSpinner message="Memuat data prestasi..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerImageContainer}>
          {anakData?.foto_url ? (
            <Image
              source={{ uri: anakData.foto_url }}
              style={styles.headerImage}
            />
          ) : (
            <View style={styles.headerImagePlaceholder}>
              <Ionicons name="person" size={40} color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{anakData?.full_name || 'Nama Anak'}</Text>
          {anakData?.nick_name && (
            <Text style={styles.headerNickname}>{anakData.nick_name}</Text>
          )}
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Error Message */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={fetchPrestasiData}
          />
        )}
        
        {/* Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prestasi Anak</Text>
          <Button
            title="Tambah Prestasi"
            onPress={handleAddPrestasi}
            leftIcon={<Ionicons name="add" size={16} color="#fff" />}
            size="small"
          />
        </View>
        
        {/* Prestasi List */}
        {prestasiList.length > 0 ? (
          <FlatList
            data={prestasiList}
            renderItem={({ item }) => (
              <PrestasiListItem
                prestasi={item}
                onPress={() => handleViewPrestasi(item)}
                onEdit={() => handleEditPrestasi(item)}
                onDelete={() => handleDeletePrestasi(item)}
              />
            )}
            keyExtractor={(item) => item.id_prestasi.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={80} color="#cccccc" />
            <Text style={styles.emptyTitle}>Belum Ada Prestasi</Text>
            <Text style={styles.emptyText}>
              Belum ada data prestasi untuk anak ini. Tambahkan prestasi baru untuk memulai.
            </Text>
            <Button
              title="Tambah Prestasi Pertama"
              onPress={handleAddPrestasi}
              style={styles.emptyButton}
              leftIcon={<Ionicons name="add" size={16} color="#fff" />}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerImageContainer: {
    marginRight: 16,
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerNickname: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default PrestasiScreen;