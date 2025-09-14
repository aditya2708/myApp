import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

import { adminShelterAnakApi } from '../api/adminShelterAnakApi';

const { width } = Dimensions.get('window');

const AnakDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, isNew } = route.params || {};
  
  const [anakData, setAnakData] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState(null);

  const menuItems = [
    {
      title: 'Edit Data',
      screen: 'AnakForm',
      icon: 'create-outline'
    },
    {
      title: 'Prestasi',
      screen: 'Prestasi',
      icon: 'trophy-outline'
    },
    {
      title: 'Surat',
      screen: 'Surat',
      icon: 'mail-outline'
    },
    {
      title: 'Riwayat',
      screen: 'Riwayat',
      icon: 'book-outline'
    },
    {
      title: 'Informasi Anak',
      screen: 'InformasiAnak',
      icon: 'clipboard-outline'
    },
    {
      title: 'Penilaian',
      screen: 'PenilaianList',
      icon: 'document-text-outline'
    },
    {
      title: 'Raport Shelter',
      screen: 'Raport',
      icon: 'library-outline'
    },
    {
      title: 'Raport Formal',
      screen: 'RaportFormal',
      icon: 'school-outline'
    }
  ];

  useEffect(() => {
    if (!isNew && id) {
      fetchAnakDetail();
    }
  }, [id, isNew]);

  // Refresh data when screen comes into focus to get updated status_cpb
  useFocusEffect(
    React.useCallback(() => {
      if (!isNew && id) {
        fetchAnakDetail();
      }
    }, [id, isNew])
  );

  useEffect(() => {
    let title = isNew 
      ? 'Tambah Anak Baru' 
      : (anakData?.full_name || anakData?.nick_name || 'Detail Anak');
    
    navigation.setOptions({ 
      title,
      headerRight: () => (
        !isNew && (
          <TouchableOpacity 
            style={{ marginRight: 16 }} 
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
        )
      )
    });
  }, [isNew, anakData, navigation]);

  const fetchAnakDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminShelterAnakApi.getAnakDetail(id);
      
      if (response.data.success) {
        setAnakData(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat detail anak');
      }
    } catch (err) {
      console.error('Error fetching anak detail:', err);
      setError('Gagal memuat detail anak. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Anak',
      'Anda yakin ingin menghapus anak ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const response = await adminShelterAnakApi.deleteAnak(id);
              
              if (response.data.success) {
                Alert.alert(
                  'Sukses',
                  'Anak berhasil dihapus',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                setError(response.data.message || 'Gagal menghapus anak');
              }
            } catch (err) {
              console.error('Error deleting anak:', err);
              setError('Gagal menghapus anak. Silakan coba lagi.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const navigateToScreen = (screen) => {
    // Ensure we have basic data before navigation
    const safeAnakData = anakData || {
      id_anak: id,
      full_name: 'Nama Tidak Tersedia',
      nick_name: null,
      foto_url: null
    };

    if (screen === 'AnakForm') {
      navigation.navigate(screen, { 
        anakData: safeAnakData,
        isEdit: true
      });
    } else if (screen === 'Surat') {
      navigation.navigate(screen, { 
        childId: id,
        childName: safeAnakData.full_name || safeAnakData.nick_name || 'Anak'
      });
    } else {
      navigation.navigate(screen, { 
        anakData: safeAnakData, 
        anakId: id,
        title: `${screen} - ${safeAnakData.full_name || safeAnakData.nick_name || 'Anak'}`
      });
    }
  };

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => navigateToScreen(item.screen)}
    >
      <Ionicons name={item.icon} size={32} color="#e74c3c" style={styles.menuIcon} />
      <Text style={styles.menuTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      await adminShelterAnakApi.toggleAnakStatus(id);
      await fetchAnakDetail();
      Alert.alert('Sukses', 'Status anak berhasil diubah');
    } catch (err) {
      console.error('Error toggling status:', err);
      setError('Gagal mengubah status anak');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data anak..." />;
  }

  if (error && !anakData) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={fetchAnakDetail}
          retryText="Coba Lagi"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
          style={styles.errorBanner}
        />
      )}

      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {anakData?.foto_url ? (
            <Image
              source={{ uri: anakData.foto_url }}
              style={styles.profileImage}
              defaultSource={require('../../../assets/images/logo.png')}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={50} color="#ffffff" />
            </View>
          )}
        </View>
        
        <Text style={styles.profileName}>
          {anakData?.full_name || 'Nama Tidak Tersedia'}
        </Text>
        {anakData?.nick_name && anakData?.full_name !== anakData?.nick_name && (
          <Text style={styles.profileNickname}>{anakData.nick_name}</Text>
        )}
        
        <View style={[
          styles.statusBadge,
          { backgroundColor: anakData?.status_validasi === 'aktif' ? '#2ecc71' : '#e74c3c' }
        ]}>
          <Text style={styles.statusText}>
            {anakData?.status_validasi === 'aktif' ? 'Aktif' : 'Non-Aktif'}
          </Text>
        </View>

        <Button
          title={anakData?.status_validasi === 'aktif' ? 'Ubah ke Non-Aktif' : 'Ubah ke Aktif'}
          onPress={handleToggleStatus}
          type={anakData?.status_validasi === 'aktif' ? 'danger' : 'success'}
          style={styles.toggleButton}
          size="small"
        />
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.menuSectionTitle}>Menu</Text>
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.screen}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.menuGrid}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorBanner: {
    margin: 16,
    marginBottom: 0,
  },
  profileHeader: {
    backgroundColor: '#e74c3c',
    padding: 20,
    alignItems: 'center',
    paddingBottom: 30,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#c0392b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  profileNickname: {
    fontSize: 16,
    color: '#f8f8f8',
    marginTop: 4,
    textAlign: 'center',
  },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 16,
    minWidth: 150,
  },
  menuContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 10,
  },
  menuGrid: {
    paddingBottom: 20,
  },
  menuItem: {
    width: (width - 48) / 2,
    aspectRatio: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuIcon: {
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});

export default AnakDetailScreen;