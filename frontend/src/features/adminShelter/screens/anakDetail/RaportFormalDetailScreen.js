import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  Linking
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { adminShelterRaportFormalApi } from '../../api/adminShelterRaportFormalApi';

const { width } = Dimensions.get('window');

const RaportFormalDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { anakData, anakId, raportId, raportData } = route.params || {};
  
  const [loading, setLoading] = useState(!raportData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [raport, setRaport] = useState(raportData || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Detail Raport Formal',
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={confirmDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      )
    });
  }, [navigation, raport]);

  useEffect(() => {
    if (!raportData && anakId && raportId) {
      fetchRaportData();
    }
  }, [raportData, anakId, raportId]);

  const fetchRaportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminShelterRaportFormalApi.getRaportFormalDetail(anakId, raportId);
      
      if (response.data.success) {
        setRaport(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat data raport formal');
      }
    } catch (err) {
      console.error('Error fetching raport formal data:', err);
      setError('Gagal memuat data raport formal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('RaportFormalForm', {
      anakData,
      anakId,
      raportId,
      raportData: raport,
      isEdit: true
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Hapus Raport Formal',
      'Anda yakin ingin menghapus raport formal ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: handleDelete
        }
      ]
    );
  };

  const handleDelete = async () => {
    if (!anakId || !raportId) {
      Alert.alert('Error', 'ID anak atau ID raport tidak ditemukan');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await adminShelterRaportFormalApi.deleteRaportFormal(anakId, raportId);
      
      if (response.data.success) {
        Alert.alert(
          'Sukses',
          'Raport formal berhasil dihapus',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        setError(response.data.message || 'Gagal menghapus raport formal');
      }
    } catch (err) {
      console.error('Error deleting raport formal:', err);
      setError('Gagal menghapus raport formal. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilePress = (fileUrl, fileName) => {
    if (fileUrl.toLowerCase().includes('.pdf')) {
      Linking.openURL(fileUrl);
    } else {
      setSelectedFile({ url: fileUrl, name: fileName });
      setShowFileModal(true);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data raport formal..." />;
  }

  if (!raport && !loading) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error || 'Data raport formal tidak ditemukan'}
          onRetry={fetchRaportData}
          retryText="Coba Lagi"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {submitting && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message="Menghapus raport formal..." />
        </View>
      )}
      
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
          style={styles.errorMessage}
        />
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.childInfoContainer}>
          <View style={styles.childImageContainer}>
            {anakData?.foto_url ? (
              <Image
                source={{ uri: anakData.foto_url }}
                style={styles.childImage}
              />
            ) : (
              <View style={styles.childImagePlaceholder}>
                <Ionicons name="person" size={30} color="#ffffff" />
              </View>
            )}
          </View>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{anakData?.full_name || 'Nama Anak'}</Text>
            {anakData?.nick_name && (
              <Text style={styles.childNickname}>{anakData.nick_name}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.raportHeader}>
          <View style={styles.raportTitle}>
            <Text style={styles.raportTitleText}>{raport.nama_sekolah}</Text>
            <Text style={styles.raportSubtitle}>
              {raport.tingkat_sekolah} - Kelas {raport.kelas}
              {raport.jurusan && ` (${raport.jurusan})`}
            </Text>
          </View>
          <View style={styles.raportMeta}>
            <Text style={styles.raportMetaText}>
              Semester {raport.semester} - {raport.tahun_ajaran}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informasi Sekolah</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama Sekolah:</Text>
            <Text style={styles.infoValue}>{raport.nama_sekolah}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tingkat:</Text>
            <Text style={styles.infoValue}>{raport.tingkat_sekolah}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kelas:</Text>
            <Text style={styles.infoValue}>{raport.kelas}</Text>
          </View>
          {raport.jurusan && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jurusan:</Text>
              <Text style={styles.infoValue}>{raport.jurusan}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Semester:</Text>
            <Text style={styles.infoValue}>{raport.semester}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tahun Ajaran:</Text>
            <Text style={styles.infoValue}>{raport.tahun_ajaran}</Text>
          </View>
        </View>
        
        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>File Dokumen</Text>
          
          {raport.file_raport_url ? (
            <TouchableOpacity
              style={styles.fileItem}
              onPress={() => handleFilePress(raport.file_raport_url, 'Raport')}
            >
              <Ionicons name="document-outline" size={24} color="#e74c3c" />
              <Text style={styles.fileName}>File Raport</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyFile}>
              <Text style={styles.emptyFileText}>File raport tidak tersedia</Text>
            </View>
          )}
          
          {raport.file_transkrip_url ? (
            <TouchableOpacity
              style={styles.fileItem}
              onPress={() => handleFilePress(raport.file_transkrip_url, 'Transkrip')}
            >
              <Ionicons name="document-outline" size={24} color="#3498db" />
              <Text style={styles.fileName}>File Transkrip</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyFile}>
              <Text style={styles.emptyFileText}>File transkrip tidak tersedia</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <Button
            title="Edit Raport"
            onPress={handleEdit}
            leftIcon={<Ionicons name="create-outline" size={20} color="#ffffff" />}
            style={styles.editButton}
          />
          <Button
            title="Hapus Raport"
            onPress={confirmDelete}
            leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
            type="danger"
            style={styles.deleteButton}
          />
        </View>
      </ScrollView>
      
      <Modal
        visible={showFileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFileModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFileModal(false)}
          >
            <Ionicons name="close-circle" size={36} color="#ffffff" />
          </TouchableOpacity>
          
          {selectedFile && (
            <Image
              source={{ uri: selectedFile.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorMessage: {
    margin: 16,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  childInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  childImageContainer: {
    marginRight: 16,
  },
  childImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  childImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  childNickname: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  raportHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  raportTitle: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  raportTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  raportSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  raportMeta: {
    alignItems: 'flex-start',
  },
  raportMetaText: {
    fontSize: 14,
    color: '#666666',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  filesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fileName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  emptyFile: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyFileText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
  },
  fullImage: {
    width: width,
    height: width * 1.3,
  },
});

export default RaportFormalDetailScreen;