import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminShelterKelompokApi } from '../api/adminShelterKelompokApi';
import { useAuth } from '../../../common/hooks/useAuth';

const KelompokDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = useAuth();
  
  const { id } = route.params || {};
  
  const [kelompok, setKelompok] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Supporting data for kelas gabungan display
  const [availableKelas, setAvailableKelas] = useState([]);
  
  const fetchKelompokDetails = async () => {
    try {
      setError(null);
      
      const response = await adminShelterKelompokApi.getKelompokDetail(id);
      
      if (response.data.success) {
        const kelompokData = response.data.data;
        setKelompok(kelompokData);
        setChildren(kelompokData.anak || []);
        navigation.setOptions({ 
          headerTitle: kelompokData.nama_kelompok || 'Detail Kelompok' 
        });
      } else {
        setError(response.data.message || 'Failed to load group details');
      }
    } catch (err) {
      console.error('Error fetching kelompok details:', err);
      setError('Failed to load group details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch available kelas for displaying kelas gabungan info
  const fetchAvailableKelas = async () => {
    try {
      const response = await adminShelterKelompokApi.getAvailableKelas();
      if (response.data.success) {
        setAvailableKelas(response.data.data.kelas_list || []);
      }
    } catch (err) {
      console.error('Error fetching available kelas:', err);
    }
  };
  
  useEffect(() => {
    if (id) {
      Promise.all([
        fetchKelompokDetails(),
        fetchAvailableKelas()
      ]);
    }
  }, [id]);
  
  // Handle refresh when coming back from AddChildrenToKelompok
  useEffect(() => {
    if (route.params?.refresh) {
      handleRefresh();
      // Reset the refresh param
      navigation.setParams({ refresh: false });
    }
  }, [route.params?.refresh]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchKelompokDetails(),
      fetchAvailableKelas()
    ]);
  };
  
  const handleEditKelompok = () => {
    navigation.navigate('KelompokForm', { kelompok });
  };
  
  const handleDeleteKelompok = () => {
    Alert.alert(
      'Hapus Kelompok',
      `Apakah Anda yakin ingin menghapus ${kelompok.nama_kelompok}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              if (children.length > 0) {
                Alert.alert(
                  'Tidak Dapat Menghapus',
                  'Kelompok ini masih memiliki anak binaan. Pindahkan semua anak terlebih dahulu.',
                  [{ text: 'OK' }]
                );
                setLoading(false);
                return;
              }
              
              const response = await adminShelterKelompokApi.deleteKelompok(id);
              
              if (response.data.success) {
                Alert.alert(
                  'Berhasil',
                  'Kelompok berhasil dihapus',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                setError(response.data.message || 'Failed to delete group');
                setLoading(false);
              }
            } catch (err) {
              console.error('Error deleting kelompok:', err);
              setError('Failed to delete group. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleRemoveChild = (child) => {
    Alert.alert(
      'Keluarkan Anak',
      `Apakah Anda yakin ingin mengeluarkan ${child.full_name || child.nick_name} dari kelompok ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluarkan', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const response = await adminShelterKelompokApi.removeAnak(
                id,
                child.id_anak
              );
              
              if (response.data.success) {
                handleRefresh();
              } else {
                setError(response.data.message || 'Failed to remove child');
                setLoading(false);
              }
            } catch (err) {
              console.error('Error removing child:', err);
              setError('Failed to remove child. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleAddChildren = () => {
    navigation.navigate('AddChildrenToKelompok', {
      kelompokId: id,
      kelompokName: kelompok?.nama_kelompok,
      shelterId: kelompok?.shelter?.id_shelter || profile?.shelter?.id_shelter
    });
  };

  // Get jenjang color based on name
  const getJenjangColor = (jenjangName) => {
    const jenjangColors = {
      'PAUD': '#9b59b6',
      'TK': '#8e44ad', 
      'SD': '#3498db',
      'SMP': '#f39c12',
      'SMA': '#e74c3c'
    };
    return jenjangColors[jenjangName] || '#95a5a6';
  };

  // Get kelas details by ID
  const getKelasById = (kelasId) => {
    return availableKelas.find(k => k.id_kelas === kelasId);
  };

  // Render kelas gabungan chips (updated for array of kelas IDs)
  const renderKelasGabunganChips = (kelasGabunganIds) => {
    if (!kelasGabunganIds || kelasGabunganIds.length === 0) {
      return (
        <View style={styles.noKelasContainer}>
          <Text style={styles.noKelasText}>Tidak ada kelas terdaftar</Text>
          <Text style={styles.noKelasSubText}>
            Edit kelompok untuk menambahkan kelas
          </Text>
        </View>
      );
    }

    // Convert kelas IDs to kelas objects
    const kelasDetails = kelasGabunganIds.map(kelasId => getKelasById(kelasId)).filter(Boolean);
    
    return (
      <View style={styles.kelasChipsContainer}>
        {kelasDetails.map((kelas) => (
          <View
            key={kelas.id_kelas}
            style={[
              styles.kelasChip,
              { backgroundColor: getJenjangColor(kelas.jenjang?.nama_jenjang) }
            ]}
          >
            <Text style={styles.kelasChipText}>
              {kelas.jenjang?.nama_jenjang} {kelas.nama_kelas}
            </Text>
          </View>
        ))}
      </View>
    );
  };


  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    
    try {
      let dob;
      if (birthDate.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
        const parts = birthDate.split(/[-/]/);
        dob = new Date(parts[2], parts[1] - 1, parts[0]);
      } else if (birthDate.match(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/)) {
        dob = new Date(birthDate);
      } else {
        dob = new Date(birthDate);
      }
      
      if (isNaN(dob.getTime())) {
        return '';
      }
      
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      return `${age}th`;
    } catch (error) {
      return '';
    }
  };
  
  const renderChildItem = ({ item: child }) => (
    <View style={styles.childItem}>
      <View style={styles.childImageContainer}>
        {child.foto_url && child.foto_url !== 'http://127.0.0.1:8000/images/default.png' ? (
          <Image source={{ uri: child.foto_url }} style={styles.childImage} />
        ) : (
          <View style={styles.childImagePlaceholder}>
            <Ionicons 
              name={child.jenis_kelamin === 'Laki-laki' ? 'person' : 'person'} 
              size={20} 
              color="#666" 
            />
          </View>
        )}
      </View>
      
      <View style={styles.childInfo}>
        <Text style={styles.childName}>{child.full_name || child.nick_name}</Text>
        <Text style={styles.childDetails}>
          {child.jenis_kelamin === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'} 
          {child.tanggal_lahir ? ` • ${calculateAge(child.tanggal_lahir)}` : ''}
          {child.nik_anak ? ` • ${child.nik_anak}` : ''}
        </Text>
        
        <View style={styles.childBadgeContainer}>
          <View style={styles.educationBadge}>
            <Text style={styles.educationBadgeText}>
              {child.anakPendidikan?.jenjang?.toUpperCase() || 'Belum Ada'}
              {child.anakPendidikan?.kelas ? ` ${child.anakPendidikan.kelas}` : ''}
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveChild(child)}
      >
        <Ionicons name="close-circle" size={22} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );
  
  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat detail kelompok..." />;
  }
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {error && (
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
        />
      )}
      
      {kelompok && (
        <>
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <Ionicons name="people-circle" size={48} color="#9b59b6" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.groupName}>{kelompok.nama_kelompok}</Text>
              <Text style={styles.shelterName}>
                {kelompok.shelter?.nama_shelter || 'Unknown Shelter'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleEditKelompok}
              >
                <Ionicons name="create-outline" size={22} color="#3498db" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleDeleteKelompok}
              >
                <Ionicons name="trash-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Kelas Gabungan Section */}
          <View style={styles.kelasSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school" size={20} color="#3498db" />
              <Text style={styles.sectionTitle}>Kelas Gabungan</Text>
            </View>
            {renderKelasGabunganChips(kelompok.kelas_gabungan)}
          </View>

          {/* Statistics Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#2ecc71" />
              <Text style={styles.statNumber}>{children.length}</Text>
              <Text style={styles.statLabel}>Anak Binaan</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="school" size={24} color="#3498db" />
              <Text style={styles.statNumber}>
                {kelompok.kelas_gabungan?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Kelas</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="layers" size={24} color="#9b59b6" />
              <Text style={styles.statNumber}>
                {(() => {
                  if (!kelompok.kelas_gabungan || kelompok.kelas_gabungan.length === 0) return 0;
                  const kelasDetails = kelompok.kelas_gabungan.map(kelasId => getKelasById(kelasId)).filter(Boolean);
                  const jenjangSet = new Set(kelasDetails.map(k => k.jenjang?.nama_jenjang));
                  return jenjangSet.size;
                })()}
              </Text>
              <Text style={styles.statLabel}>Jenjang</Text>
            </View>
          </View>

          {/* Simplified Kurikulum Info */}
          {kelompok.kelas_gabungan && kelompok.kelas_gabungan.length > 0 && (
            <View style={styles.kurikulumInfoSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="library" size={20} color="#e67e22" />
                <Text style={styles.sectionTitle}>Informasi Kurikulum</Text>
              </View>
              <Text style={styles.kurikulumInfoText}>
                Kelompok ini dapat mengakses materi untuk {kelompok.kelas_gabungan.length} kelas yang dipilih.
                Aktivitas dapat dibuat berdasarkan materi yang tersedia untuk kombinasi kelas ini.
              </Text>
              <Button
                title="Lihat Materi Tersedia"
                onPress={() => navigation.navigate('KurikulumBrowser')}
                type="outline"
                size="small"
                style={styles.viewMateriButton}
                leftIcon={<Ionicons name="book-outline" size={16} color="#e67e22" />}
              />
            </View>
          )}

          {/* Kurikulum Management Section */}
          {/* Simplified Aktivitas Management */}
          <View style={styles.aktivitasManagementSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color="#3498db" />
              <Text style={styles.sectionTitle}>Kelola Aktivitas</Text>
            </View>
            <View style={styles.aktivitasActions}>
              <Button
                title="Buat Aktivitas"
                onPress={() => navigation.navigate('ActivityForm', { kelompok })}
                type="primary"
                style={styles.createAktivitasButton}
                leftIcon={<Ionicons name="add-circle" size={16} color="#ffffff" />}
              />
              
              <Button
                title="Lihat Aktivitas"
                onPress={() => navigation.navigate('ActivitiesList', { kelompokId: kelompok.id_kelompok })}
                type="outline"
                style={styles.viewAktivitasButton}
                leftIcon={<Ionicons name="list-outline" size={16} color="#3498db" />}
              />
            </View>
            
            <Text style={styles.aktivitasNote}>
              Buat aktivitas pembelajaran berdasarkan materi yang sesuai dengan kelas gabungan kelompok ini.
            </Text>
          </View>

          
          {/* Children Section */}
          <View style={styles.childrenContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#2ecc71" />
              <Text style={styles.sectionTitle}>Daftar Anak ({children.length})</Text>
              <Button
                title="Tambah Anak"
                onPress={handleAddChildren}
                type="primary"
                size="small"
                style={styles.addChildrenButton}
                leftIcon={<Ionicons name="add" size={16} color="#ffffff" />}
              />
            </View>
            
            {children.length > 0 ? (
              <FlatList
                data={children}
                renderItem={renderChildItem}
                keyExtractor={(item) => item.id_anak?.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyChildren}>
                <Ionicons name="people-outline" size={48} color="#bdc3c7" />
                <Text style={styles.emptyText}>Belum ada anak binaan</Text>
                <Text style={styles.emptySubText}>
                  Tambahkan anak binaan untuk memulai kegiatan kelompok
                </Text>
                <Button
                  title="Tambah Anak Pertama"
                  onPress={handleAddChildren}
                  type="primary"
                  size="small"
                  style={styles.emptyButton}
                />
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
    paddingBottom: 30,
  },

  // Header Card
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerIcon: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  shelterName: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },

  // Kelas Gabungan Section
  kelasSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  kelasChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kelasChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  kelasChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  noKelasContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noKelasText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  noKelasSubText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 4,
  },

  // Statistics Cards
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 4,
  },

  // Kurikulum Info Section
  kurikulumInfoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  kurikulumInfoText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 12,
  },
  viewMateriButton: {
    borderColor: '#e67e22',
  },

  // Aktivitas Management Section
  aktivitasManagementSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aktivitasActions: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  createAktivitasButton: {
    flex: 1,
    backgroundColor: '#3498db',
  },
  viewAktivitasButton: {
    flex: 1,
    borderColor: '#3498db',
  },
  aktivitasNote: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },


  // Children Section
  childrenContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addChildrenButton: {
    backgroundColor: '#9b59b6',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  childImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
  },
  childImage: {
    width: '100%',
    height: '100%',
  },
  childImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  childBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  educationBadge: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  educationBadgeText: {
    fontSize: 10,
    color: '#34495e',
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
  },
  emptyChildren: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 150,
  }
});

export default KelompokDetailScreen;