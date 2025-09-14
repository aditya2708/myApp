import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import FloatingActionButton from '../../../../common/components/FloatingActionButton';
import { adminShelterRaportFormalApi } from '../../api/adminShelterRaportFormalApi';

const RaportFormalScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { anakData, anakId } = route.params || {};
  
  const [raportList, setRaportList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRaportFormal();
  }, [anakId]);

  const loadRaportFormal = async () => {
    if (!anakId) return;
    
    try {
      setError(null);
      const response = await adminShelterRaportFormalApi.getRaportFormal(anakId);
      
      if (response.data.success) {
        setRaportList(response.data.data || []);
      } else {
        setError(response.data.message || 'Gagal memuat data raport formal');
      }
    } catch (err) {
      console.error('Error fetching raport formal:', err);
      setError('Gagal memuat data raport formal. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRaportFormal();
  };

  const navigateToDetail = (raport) => {
    navigation.navigate('RaportFormalDetail', {
      anakData,
      anakId,
      raportId: raport.id_raport_formal,
      raportData: raport
    });
  };

  const navigateToForm = () => {
    navigation.navigate('RaportFormalForm', {
      anakData,
      anakId
    });
  };

  const handleDelete = (raport) => {
    Alert.alert(
      'Hapus Raport Formal',
      'Anda yakin ingin menghapus raport formal ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminShelterRaportFormalApi.deleteRaportFormal(anakId, raport.id_raport_formal);
              Alert.alert('Sukses', 'Raport formal berhasil dihapus');
              loadRaportFormal();
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus raport formal');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderRaportItem = ({ item }) => (
    <TouchableOpacity
      style={styles.raportCard}
      onPress={() => navigateToDetail(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{item.nama_sekolah}</Text>
          <Text style={styles.schoolLevel}>
            {item.tingkat_sekolah} - Kelas {item.kelas}
            {item.jurusan && ` (${item.jurusan})`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.semesterInfo}>
          <Text style={styles.semester}>
            Semester {item.semester} - {item.tahun_ajaran}
          </Text>
        </View>
        
        <View style={styles.filesInfo}>
          {item.file_raport && (
            <View style={styles.fileIndicator}>
              <Ionicons name="document-outline" size={16} color="#2ecc71" />
              <Text style={styles.fileText}>Raport</Text>
            </View>
          )}
          {item.file_transkrip && (
            <View style={styles.fileIndicator}>
              <Ionicons name="document-outline" size={16} color="#3498db" />
              <Text style={styles.fileText}>Transkrip</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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
                <Ionicons name="person" size={30} color="#ffffff" />
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
        <LoadingSpinner message="Memuat data raport formal..." />
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
              <Ionicons name="person" size={30} color="#ffffff" />
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

      {error && (
        <ErrorMessage
          message={error}
          onRetry={loadRaportFormal}
        />
      )}

      <FlatList
        data={raportList}
        renderItem={renderRaportItem}
        keyExtractor={(item) => item.id_raport_formal.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="school-outline"
            title="Belum Ada Raport Formal"
            message="Belum ada data raport pendidikan formal untuk anak ini. Tambahkan raport formal untuk memulai."
            actionButtonText="Tambah Raport Formal"
            onActionPress={navigateToForm}
          />
        }
      />

      <FloatingActionButton
        onPress={navigateToForm}
        icon="add"
        backgroundColor="#e74c3c"
      />
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
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerNickname: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  raportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
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
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  schoolLevel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  semesterInfo: {
    marginBottom: 8,
  },
  semester: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  filesInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  fileText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
});

export default RaportFormalScreen;