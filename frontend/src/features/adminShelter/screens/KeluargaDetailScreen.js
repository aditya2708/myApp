import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import API
import { adminShelterKeluargaApi } from '../api/adminShelterKeluargaApi';
import { formatDateToIndonesian } from '../../../common/utils/dateFormatter';

const KeluargaDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get keluarga ID from route params
  const { id } = route.params || {};
  
  // State
  const [keluargaData, setKeluargaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch keluarga details
  const fetchKeluargaDetails = async () => {
    try {
      setError(null);
      const response = await adminShelterKeluargaApi.getKeluargaDetail(id);
      
      if (response.data.success) {
        setKeluargaData(response.data.data);
        // Set screen title based on family head name
        navigation.setOptions({ 
          headerTitle: response.data.data.keluarga?.kepala_keluarga || 'Family Detail' 
        });
      } else {
        setError(response.data.message || 'Failed to load family details');
      }
    } catch (err) {
      console.error('Error fetching keluarga details:', err);
      setError('Failed to load family details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    if (id) {
      fetchKeluargaDetails();
    }
  }, [id]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchKeluargaDetails();
  };
  
  // Navigate to edit keluarga
  const handleEditKeluarga = () => {
    navigation.navigate('KeluargaForm', { keluarga: keluargaData.keluarga, isEdit: true });
  };
  
  // Handle delete keluarga
  const handleDeleteKeluarga = () => {
    Alert.alert(
      'Delete Family',
      `Are you sure you want to delete family "${keluargaData.keluarga.kepala_keluarga}"? This will also delete all associated data including children.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const response = await adminShelterKeluargaApi.deleteKeluarga(id);
              
              if (response.data.success) {
                Alert.alert(
                  'Success',
                  'Family has been deleted',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                setError(response.data.message || 'Failed to delete family');
                setLoading(false);
              }
            } catch (err) {
              console.error('Error deleting keluarga:', err);
              setError('Failed to delete family. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Navigate to view child detail
  const handleViewChild = (childId) => {
    navigation.navigate('AnakDetail', { id: childId });
  };
  
  
  // Loading state
  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat Data..." />;
  }
  
  // Extract data objects for easier reference
  const keluarga = keluargaData?.keluarga || {};
  const ayah = keluargaData?.keluarga?.ayah || {};
  const ibu = keluargaData?.keluarga?.ibu || {};
  const wali = keluargaData?.keluarga?.wali || {};
  const children = keluargaData?.anak || [];
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
        />
      )}
      
      {keluargaData && (
        <>
          {/* Family Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Data Keluarga</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleEditKeluarga}
                >
                  <Ionicons name="create-outline" size={22} color="#3498db" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDeleteKeluarga}
                >
                  <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.infoSection}>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kepala Keluarga:</Text>
                <Text style={styles.infoValue}>{keluarga.kepala_keluarga || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>No. KK:</Text>
                <Text style={styles.infoValue}>{keluarga.no_kk || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>{keluarga.status_ortu || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Shelter:</Text>
                <Text style={styles.infoValue}>{keluarga.shelter?.nama_shelter || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Wilbin:</Text>
                <Text style={styles.infoValue}>{keluarga.wilbin?.nama_wilbin || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kacab:</Text>
                <Text style={styles.infoValue}>{keluarga.kacab?.nama_kacab || '-'}</Text>
              </View>
            </View>
            
            {/* Contact Section */}
            <View style={styles.infoSection}>
              
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>No. Hp:</Text>
                <Text style={styles.infoValue}>{keluarga.no_tlp ? `${keluarga.no_tlp} (${keluarga.an_tlp || 'N/A'})` : '-'}</Text>
              </View>
            </View>
            
            {/* Bank Account Section */}
            <View style={styles.infoSection}>
           
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bank:</Text>
                <Text style={styles.infoValue}>{keluarga.bank?.nama_bank || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account:</Text>
                <Text style={styles.infoValue}>{keluarga.no_rek ? `${keluarga.no_rek} (${keluarga.an_rek || 'N/A'})` : '-'}</Text>
              </View>
            </View>
          </View>
          
          {/* Father Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Data Ayah</Text>
            
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nama:</Text>
                <Text style={styles.infoValue}>{ayah.nama_ayah || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>NIK:</Text>
                <Text style={styles.infoValue}>{ayah.nik_ayah || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Agama:</Text>
                <Text style={styles.infoValue}>{ayah.agama || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tempat dan tanggal lahir:</Text>
                <Text style={styles.infoValue}>
                  {ayah.tempat_lahir ? `${ayah.tempat_lahir}, ${formatDateToIndonesian(ayah.tanggal_lahir)}` : '-'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Alamat:</Text>
                <Text style={styles.infoValue}>{ayah.alamat || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Penghasilan:</Text>
                <Text style={styles.infoValue}>{ayah.penghasilan || '-'}</Text>
              </View>
              
              {ayah.tanggal_kematian && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Meninggal:</Text>
                    <Text style={styles.infoValue}>{formatDateToIndonesian(ayah.tanggal_kematian)}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Penyebab:</Text>
                    <Text style={styles.infoValue}>{ayah.penyebab_kematian || '-'}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
          
          {/* Mother Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Data Ibu</Text>
            
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nama:</Text>
                <Text style={styles.infoValue}>{ibu.nama_ibu || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>NIK:</Text>
                <Text style={styles.infoValue}>{ibu.nik_ibu || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Agama:</Text>
                <Text style={styles.infoValue}>{ibu.agama || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tempat dan tanggal lahir:</Text>
                <Text style={styles.infoValue}>
                  {ibu.tempat_lahir ? `${ibu.tempat_lahir}, ${formatDateToIndonesian(ibu.tanggal_lahir)}` : '-'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Alamat:</Text>
                <Text style={styles.infoValue}>{ibu.alamat || '-'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Penghasilan:</Text>
                <Text style={styles.infoValue}>{ibu.penghasilan || '-'}</Text>
              </View>
              
              {ibu.tanggal_kematian && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Meninggal:</Text>
                    <Text style={styles.infoValue}>{formatDateToIndonesian(ibu.tanggal_kematian)}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Penyebab:</Text>
                    <Text style={styles.infoValue}>{ibu.penyebab_kematian || '-'}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
          
          {/* Guardian Information */}
          {wali && Object.keys(wali).length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Data Wali</Text>
              
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nama:</Text>
                  <Text style={styles.infoValue}>{wali.nama_wali || '-'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>NIK:</Text>
                  <Text style={styles.infoValue}>{wali.nik_wali || '-'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Agama:</Text>
                  <Text style={styles.infoValue}>{wali.agama || '-'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tempat dan tanggal lahir:</Text>
                  <Text style={styles.infoValue}>
                    {wali.tempat_lahir ? `${wali.tempat_lahir}, ${formatDateToIndonesian(wali.tanggal_lahir)}` : '-'}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Alamat:</Text>
                  <Text style={styles.infoValue}>{wali.alamat || '-'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Penghasilan:</Text>
                  <Text style={styles.infoValue}>{wali.penghasilan || '-'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Hubungan:</Text>
                  <Text style={styles.infoValue}>{wali.hub_kerabat || '-'}</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Children Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Anak</Text>
            </View>
            
            {children.length > 0 ? (
              <View style={styles.childrenList}>
                {children.map((child) => (
                  <TouchableOpacity
                    key={child.id_anak.toString()}
                    style={styles.childItem}
                    onPress={() => handleViewChild(child.id_anak)}
                  >
                    <View style={styles.childImageContainer}>
                      {child.foto_url ? (
                        <Image
                          source={{ uri: child.foto_url }}
                          style={styles.childImage}
                        />
                      ) : (
                        <View style={styles.childImagePlaceholder}>
                          <Ionicons
                            name={child.jenis_kelamin === 'Laki-laki' ? 'Laki-laki' : 'Peerempuan'}
                            size={24}
                            color="#fff"
                          />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.full_name}</Text>
                      <Text style={styles.childDetail}>
                        {child.jenis_kelamin === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'} • 
                        {child.tanggal_lahir ? ` ${formatDateToIndonesian(child.tanggal_lahir)}` : ''}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: child.status_validasi === 'aktif' ? '#2ecc71' : '#e74c3c' }
                      ]}>
                        <Text style={styles.statusText}>
                          {child.status_validasi === 'aktif' ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    
                    <Ionicons name="chevron-forward" size={20} color="#bbb" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyChildren}>
                <Ionicons name="people-outline" size={40} color="#ddd" />
                <Text style={styles.emptyText}>Tidak ada anak yang terdaftar di keluarga ini</Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  },
  infoSection: {
    marginBottom: 16,
  },
  
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    color: '#777',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  childrenList: {
    marginTop: 8,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  childImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    overflow: 'hidden',
  },
  childImage: {
    width: '100%',
    height: '100%',
  },
  childImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#95a5a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  childDetail: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  emptyChildren: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginVertical: 12,
  },
});

export default KeluargaDetailScreen;