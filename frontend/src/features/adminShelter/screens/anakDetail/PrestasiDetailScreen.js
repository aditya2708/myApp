import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

// Import utils
import { formatDateToIndonesian } from '../../../../common/utils/dateFormatter';

// Import API
import { adminShelterPrestasiApi } from '../../api/adminShelterPrestasiApi';

const PrestasiDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { anakData, anakId, prestasiId, prestasiData } = route.params || {};
  
  const [loading, setLoading] = useState(!prestasiData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [prestasi, setPrestasi] = useState(prestasiData || null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Set screen title
  useEffect(() => {
    navigation.setOptions({
      title: 'Detail Prestasi',
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
  }, [navigation, prestasi]);

  // Fetch prestasi data if not provided
  useEffect(() => {
    if (!prestasiData && anakId && prestasiId) {
      fetchPrestasiData();
    }
  }, [prestasiData, anakId, prestasiId]);

  // Fetch prestasi data
  const fetchPrestasiData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminShelterPrestasiApi.getPrestasiDetail(anakId, prestasiId);
      
      if (response.data.success) {
        setPrestasi(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat data prestasi');
      }
    } catch (err) {
      console.error('Error fetching prestasi data:', err);
      setError('Gagal memuat data prestasi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigation.navigate('PrestasiForm', {
      anakData,
      anakId,
      prestasiId,
      prestasiData: prestasi,
      isEdit: true
    });
  };

  // Confirm delete
  const confirmDelete = () => {
    Alert.alert(
      'Hapus Prestasi',
      'Anda yakin ingin menghapus prestasi ini? Tindakan ini tidak dapat dibatalkan.',
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

  // Handle delete
  const handleDelete = async () => {
    try {
      setSubmitting(true);
      
      const response = await adminShelterPrestasiApi.deletePrestasi(anakId, prestasiId);
      
      if (response.data.success) {
        Alert.alert(
          'Sukses',
          'Prestasi berhasil dihapus',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        setError(response.data.message || 'Gagal menghapus prestasi');
      }
    } catch (err) {
      console.error('Error deleting prestasi:', err);
      setError('Gagal menghapus prestasi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle image modal
  const toggleImageModal = () => {
    setShowImageModal(!showImageModal);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Memuat data prestasi..." />
      </View>
    );
  }

  // No data state
  if (!prestasi && !loading) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error || 'Data prestasi tidak ditemukan'}
          onRetry={fetchPrestasiData}
          retryText="Coba Lagi"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Submit loading overlay */}
      {submitting && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message="Menghapus prestasi..." />
        </View>
      )}
      
      {/* Error message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
          style={styles.errorMessage}
        />
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header section with child info */}
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
        
        {/* Prestasi Info Card */}
        <View style={styles.prestasiCard}>
          <Text style={styles.prestasiTitle}>{prestasi.nama_prestasi}</Text>
          
          <View style={styles.prestasiMetaContainer}>
            <View style={styles.prestasiMetaItem}>
              <Ionicons name="trophy-outline" size={20} color="#e74c3c" />
              <Text style={styles.prestasiMetaText}>{prestasi.jenis_prestasi}</Text>
            </View>
            
            <View style={styles.prestasiMetaItem}>
              <Ionicons name="medal-outline" size={20} color="#e74c3c" />
              <Text style={styles.prestasiMetaText}>{prestasi.level_prestasi}</Text>
            </View>
            
            <View style={styles.prestasiMetaItem}>
              <Ionicons name="calendar-outline" size={20} color="#e74c3c" />
              <Text style={styles.prestasiMetaText}>
                {formatDateToIndonesian(prestasi.tgl_upload)}
              </Text>
            </View>
          </View>
          
          {/* Prestasi Photo */}
          {prestasi.foto_url && (
            <TouchableOpacity onPress={toggleImageModal}>
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: prestasi.foto_url }}
                  style={styles.prestasiPhoto}
                  resizeMode="cover"
                />
                <View style={styles.photoOverlay}>
                  <Ionicons name="expand-outline" size={24} color="#ffffff" />
                  <Text style={styles.photoOverlayText}>Tap untuk memperbesar</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Edit Prestasi"
            onPress={handleEdit}
            leftIcon={<Ionicons name="create-outline" size={20} color="#ffffff" />}
            style={styles.editButton}
          />
          <Button
            title="Hapus Prestasi"
            onPress={confirmDelete}
            leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
            type="danger"
            style={styles.deleteButton}
          />
        </View>
      </ScrollView>
      
      {/* Image modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={toggleImageModal}
          >
            <Ionicons name="close-circle" size={36} color="#ffffff" />
          </TouchableOpacity>
          
          <Image
            source={{ uri: prestasi?.foto_url }}
            style={styles.fullImage}
            resizeMode="contain"
          />
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
  prestasiCard: {
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
  prestasiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  prestasiMetaContainer: {
    marginBottom: 16,
  },
  prestasiMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prestasiMetaText: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 8,
  },
  photoContainer: {
    position: 'relative',
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prestasiPhoto: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlayText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
    width: '100%',
    height: '80%',
  },
});

export default PrestasiDetailScreen;