import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturApi } from '../api/donaturApi';

const { width } = Dimensions.get('window');

const ChildProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName } = route.params;

  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchChildDetails = async () => {
    try {
      setError(null);
      const response = await donaturApi.getChildDetails(childId);
      setChild(response.data.data);
    } catch (err) {
      console.error('Error fetching child details:', err);
      setError('Gagal memuat detail anak');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChildDetails();
  }, [childId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChildDetails();
  };

  const navigateToSurat = () => {
    navigation.navigate('SuratList', { childId, childName });
  };

  const navigateToPrestasi = () => {
    navigation.navigate('ChildPrestasiList', { childId, childName });
  };

  const navigateToRaport = () => {
    navigation.navigate('ChildRaportList', { childId, childName });
  };

  const navigateToAktivitas = () => {
    navigation.navigate('ChildAktivitasList', { childId, childName });
  };

  const navigateToBilling = () => {
    navigation.navigate('ChildBilling', { childId, childName });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Tidak diketahui';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} tahun`;
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat detail anak..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={fetchChildDetails} />
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Data anak tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Child Header */}
      <View style={styles.headerCard}>
        <View style={styles.profileSection}>
          {child.foto ? (
            <Image 
              source={{ uri: `https://bp.berbagipendidikan.org/storage/Anak/${child.id_anak}/${child.foto}` }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={60} color="#ffffff" />
            </View>
          )}
          
          <View style={styles.profileInfo}>
            <Text style={styles.childName}>{child.full_name}</Text>
            <Text style={styles.childNickname}>{child.nick_name || 'No nickname'}</Text>
            <Text style={styles.childAge}>{calculateAge(child.tanggal_lahir)}</Text>
            <Text style={styles.childGender}>{child.jenis_kelamin}</Text>
          </View>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Informasi Dasar</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tempat, Tanggal Lahir:</Text>
          <Text style={styles.infoValue}>
            {child.tempat_lahir}, {child.tanggal_lahir ? new Date(child.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Agama:</Text>
          <Text style={styles.infoValue}>{child.agama || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Anak ke:</Text>
          <Text style={styles.infoValue}>{child.anak_ke || '-'} dari {child.dari_bersaudara || '-'} bersaudara</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tinggal bersama:</Text>
          <Text style={styles.infoValue}>{child.tinggal_bersama || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Jarak rumah:</Text>
          <Text style={styles.infoValue}>{child.jarak_rumah || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Transportasi:</Text>
          <Text style={styles.infoValue}>{child.transportasi || '-'}</Text>
        </View>
      </View>

      {/* Educational Information */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Informasi Pendidikan</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hafalan:</Text>
          <Text style={styles.infoValue}>{child.hafalan || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pelajaran Favorit:</Text>
          <Text style={styles.infoValue}>{child.pelajaran_favorit || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hobi:</Text>
          <Text style={styles.infoValue}>{child.hobi || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Prestasi:</Text>
          <Text style={styles.infoValue}>{child.prestasi || '-'}</Text>
        </View>
      </View>

      {/* Background Story */}
      {child.background_story && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Latar Belakang</Text>
          <Text style={styles.storyText}>{child.background_story}</Text>
        </View>
      )}

      {/* Educational Goals */}
      {child.educational_goals && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Tujuan Pendidikan</Text>
          <Text style={styles.storyText}>{child.educational_goals}</Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Menu Anak</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={navigateToSurat}>
            <View style={[styles.actionIcon, { backgroundColor: '#3498db' }]}>
              <Ionicons name="mail" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Surat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={navigateToPrestasi}>
            <View style={[styles.actionIcon, { backgroundColor: '#f39c12' }]}>
              <Ionicons name="trophy" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Prestasi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={navigateToRaport}>
            <View style={[styles.actionIcon, { backgroundColor: '#e74c3c' }]}>
              <Ionicons name="document-text" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Raport</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={navigateToAktivitas}>
            <View style={[styles.actionIcon, { backgroundColor: '#2ecc71' }]}>
              <Ionicons name="calendar" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Aktivitas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={navigateToBilling}>
            <View style={[styles.actionIcon, { backgroundColor: '#9b59b6' }]}>
              <Ionicons name="wallet" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Tagihan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Information */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Status</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status Validasi:</Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: child.status_validasi === 'aktif' ? '#27ae60' : '#e74c3c' 
          }]}>
            <Text style={styles.statusText}>{child.status_validasi || 'Tidak diketahui'}</Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status CPB:</Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: child.status_cpb === 'CPB' ? '#3498db' : '#95a5a6' 
          }]}>
            <Text style={styles.statusText}>{child.status_cpb || 'Tidak diketahui'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tanggal Sponsorship:</Text>
          <Text style={styles.infoValue}>
            {child.sponsorship_date ? new Date(child.sponsorship_date).toLocaleDateString('id-ID') : '-'}
          </Text>
        </View>
      </View>

      {/* Special Needs */}
      {child.special_needs && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Kebutuhan Khusus</Text>
          <Text style={styles.storyText}>{child.special_needs}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    backgroundColor: '#9b59b6',
    padding: 20,
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8e44ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  childNickname: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  childGender: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  storyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '18%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ChildProfileScreen;