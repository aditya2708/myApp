import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminShelterKelompokApi } from '../api/adminShelterKelompokApi';
import { useAuth } from '../../../common/hooks/useAuth';

const AddChildrenToKelompokScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = useAuth();
  
  const { kelompokId, kelompokName, shelterId } = route.params || {};
  
  const [kelompokDetails, setKelompokDetails] = useState(null);
  const [availableChildren, setAvailableChildren] = useState([]);
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchKelompokDetails = async () => {
    try {
      const response = await adminShelterKelompokApi.getKelompokDetail(kelompokId);
      if (response.data.success) {
        setKelompokDetails(response.data.data);
      }
    } catch (err) {
      console.error('Error mengambil detail kelompok:', err);
    }
  };
  
  const fetchAvailableChildren = async () => {
    try {
      setError(null);
      
      const response = await adminShelterKelompokApi.getAvailableAnak(kelompokId);
      
      if (response.data.success) {
        const children = response.data.data.available_anak || [];
        setAvailableChildren(children);
        setFilteredChildren(children);
      } else {
        setError(response.data.message || 'Gagal memuat anak tersedia');
      }
    } catch (err) {
      console.error('Error mengambil anak tersedia:', err);
      setError('Gagal memuat anak tersedia. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    navigation.setOptions({
      headerTitle: `Tambah ke ${kelompokName || 'kelompok'}`
    });
    Promise.all([
      fetchKelompokDetails(),
      fetchAvailableChildren()
    ]);
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChildren(availableChildren);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = availableChildren.filter(child => 
        (child.full_name && child.full_name.toLowerCase().includes(query)) ||
        (child.nick_name && child.nick_name.toLowerCase().includes(query)) ||
        (child.nik_anak && child.nik_anak.includes(query))
      );
      setFilteredChildren(filtered);
    }
  }, [searchQuery, availableChildren]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    setSelectedChildren([]);
    Promise.all([
      fetchKelompokDetails(),
      fetchAvailableChildren()
    ]);
  };
  
  const toggleChildSelection = (childId) => {
    setSelectedChildren(prev => {
      if (prev.includes(childId)) {
        return prev.filter(id => id !== childId);
      } else {
        return [...prev, childId];
      }
    });
  };
  
  const selectAll = () => {
    const allChildIds = filteredChildren.map(child => child.id_anak);
    setSelectedChildren(allChildIds);
  };
  
  const deselectAll = () => {
    setSelectedChildren([]);
  };
  
  const checkEducationCompatibility = (child, kelompok) => {
    if (!child.anakPendidikan || !kelompok?.kelas_gabungan) {
      return { compatible: true, reason: 'No education data' };
    }

    const jenjang = child.anakPendidikan.jenjang?.toLowerCase().trim() || '';
    
    // Get kelas details for compatibility check
    const kelasGabunganDetails = kelompok.kelas_gabungan_details || [];
    
    if (kelasGabunganDetails.length === 0) {
      return { compatible: true, reason: 'No kelas data available' };
    }
    
    // Check if child's jenjang matches any of the kelas gabungan
    const isCompatible = kelasGabunganDetails.some(kelas => {
      const kelasJenjang = kelas.jenjang?.nama_jenjang?.toLowerCase() || '';
      return jenjang === kelasJenjang || 
             (jenjang === 'tk' && kelasJenjang === 'paud') ||
             (jenjang === 'paud' && kelasJenjang === 'tk');
    });

    return {
      compatible: isCompatible,
      reason: isCompatible ? 'Compatible' : `${jenjang.toUpperCase()} doesn't match kelompok's kelas`
    };
  };

  const getJenjangBadgeColor = (jenjang) => {
    if (!jenjang) return '#95a5a6';
    
    const jenjangLower = jenjang.toLowerCase();
    
    if (jenjangLower.includes('sd')) return '#3498db';
    if (jenjangLower.includes('smp')) return '#f39c12';
    if (jenjangLower.includes('sma') || jenjangLower.includes('smk')) return '#e74c3c';
    if (jenjangLower.includes('tk') || jenjangLower.includes('paud')) return '#9b59b6';
    
    return '#95a5a6';
  };
  
  const handleSubmit = async () => {
    if (selectedChildren.length === 0) {
      Alert.alert('Tidah ada pilihan', 'Pilih minimal 1 anak.');
      return;
    }
    
    Alert.alert(
      'Konfirmasi',
      `Tambah ${selectedChildren.length} Anak${selectedChildren.length > 1 ? '' : ''} ke kelompok?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Tambah', 
          onPress: async () => {
            setSubmitting(true);
            
            try {
              const response = await adminShelterKelompokApi.addAnak(
                kelompokId,
                { anak_ids: selectedChildren }
              );
              
              if (response.data.success) {
                const { added_count, errors } = response.data.data;
                
                if (errors && errors.length > 0) {
                  Alert.alert(
                    'Sukses Sebagian', 
                    `Added ${added_count} children, but ${errors.length} failed:\n${errors.join('\n')}`
                  );
                } else {
                  Alert.alert('Berhasil', `Berhasil menambahkan ${added_count} anak ke kelompok!`);
                }
                
                // Navigate back with refresh flag
                navigation.navigate('KelompokDetail', { id: kelompokId, refresh: true });
              } else {
                Alert.alert('Error', response.data.message || 'Gagal menambahkan anak');
              }
            } catch (err) {
              console.error('Gagal masukkan anak:', err);
              Alert.alert('Error', 'Gagal masukkan anak, coba lagi.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };
  
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    
    let dob;
    try {
      if (birthDate.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
        const parts = birthDate.split(/[-/]/);
        dob = new Date(parts[2], parts[1] - 1, parts[0]);
      } else if (birthDate.match(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/)) {
        dob = new Date(birthDate);
      } else {
        dob = new Date(birthDate);
      }
      
      if (isNaN(dob.getTime())) return '';
      
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      return `${age} Tahun`;
    } catch (error) {
      return '';
    }
  };
  
  const renderChildItem = ({ item: child }) => {
    const isSelected = selectedChildren.includes(child.id_anak);
    const compatibility = checkEducationCompatibility(child, kelompokDetails);
    
    return (
      <TouchableOpacity
        style={[
          styles.childItem, 
          isSelected && styles.childItemSelected,
          !compatibility.compatible && styles.childItemIncompatible
        ]}
        onPress={() => toggleChildSelection(child.id_anak)}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </View>
        
        <View style={styles.childImageContainer}>
          {child.foto_url && child.foto_url !== 'http://127.0.0.1:8000/images/default.png' ? (
            <Image source={{ uri: child.foto_url }} style={styles.childImage} />
          ) : (
            <View style={styles.childImagePlaceholder}>
              <Ionicons 
                name={child.jenis_kelamin === 'Laki-laki' ? 'person' : 'person'} 
                size={24} 
                color="#666" 
              />
            </View>
          )}
        </View>
        
        <View style={styles.childInfo}>
          <View style={styles.childHeader}>
            <Text style={styles.childName} numberOfLines={1}>
              {child.full_name || child.nick_name}
            </Text>
            
            <View style={styles.compatibilityIndicator}>
              <Ionicons 
                name={compatibility.compatible ? 'checkmark-circle' : 'warning-outline'} 
                size={18} 
                color={compatibility.compatible ? '#2ecc71' : '#f39c12'} 
              />
            </View>
          </View>
          
          <Text style={styles.childDetails}>
            {child.jenis_kelamin === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'}
            {child.tanggal_lahir && ` • ${calculateAge(child.tanggal_lahir)}`}
          </Text>
          
          {child.nik_anak && (
            <Text style={styles.childNik}>NIK: {child.nik_anak}</Text>
          )}
          
          <View style={styles.badgeContainer}>
            {child.anakPendidikan && (
              <View style={[
                styles.educationBadge,
                { backgroundColor: getJenjangBadgeColor(child.anakPendidikan.jenjang) }
              ]}>
                <Text style={styles.educationBadgeText}>
                  {child.anakPendidikan.jenjang?.toUpperCase()}
                  {child.anakPendidikan.kelas ? ` ${child.anakPendidikan.kelas}` : ''}
                </Text>
              </View>
            )}
            
            {!compatibility.compatible && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningBadgeText}>
                  Level Mismatch
                </Text>
              </View>
            )}
          </View>
          
          {!compatibility.compatible && (
            <Text style={styles.compatibilityNote}>
              {compatibility.reason}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color="#bdc3c7" />
      <Text style={styles.emptyText}>
        {searchQuery.trim() !== '' 
          ? 'No children found matching your search'
          : 'No available children without group'}
      </Text>
    </View>
  );
  
  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat..." />;
  }
  
  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchAvailableChildren}
        />
      )}
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari berdasarkan nama..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {filteredChildren.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedChildren.length} dari {filteredChildren.length} dipilih
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={selectAll}
              disabled={selectedChildren.length === filteredChildren.length}
            >
              <Text style={[
                styles.selectionButtonText,
                selectedChildren.length === filteredChildren.length && styles.disabledText
              ]}>
                Pilih semua
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={deselectAll}
              disabled={selectedChildren.length === 0}
            >
              <Text style={[
                styles.selectionButtonText,
                selectedChildren.length === 0 && styles.disabledText
              ]}>
                Batal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <FlatList
        data={filteredChildren}
        renderItem={renderChildItem}
        keyExtractor={(item) => item.id_anak.toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#9b59b6']}
          />
        }
      />
      
      {selectedChildren.length > 0 && (
        <View style={styles.submitContainer}>
          <Button
            title={`Tambah ${selectedChildren.length} Anak${selectedChildren.length > 1 ? '' : ''}`}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            type="primary"
            size="large"
            fullWidth
            style={styles.submitButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectionActions: {
    flexDirection: 'row',
  },
  selectionButton: {
    marginLeft: 16,
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9b59b6',
  },
  disabledText: {
    color: '#ccc',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  childItemSelected: {
    backgroundColor: '#f2e5ff',
    borderWidth: 1,
    borderColor: '#9b59b6',
  },
  childItemIncompatible: {
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#9b59b6',
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
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  childName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  compatibilityIndicator: {
    marginLeft: 8,
  },
  childDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  childNik: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  educationBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  educationBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  warningBadge: {
    backgroundColor: '#f39c12',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  warningBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  compatibilityNote: {
    fontSize: 12,
    color: '#f39c12',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  submitButton: {
    backgroundColor: '#9b59b6',
  },
});

export default AddChildrenToKelompokScreen;