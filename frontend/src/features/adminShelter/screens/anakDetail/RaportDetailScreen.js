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
  Dimensions
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
import { raportApi } from '../../api/raportApi';

const { width } = Dimensions.get('window');

const RaportDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { anakData, anakId, raportId, raportData } = route.params || {};
  
  const [loading, setLoading] = useState(!raportData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [raport, setRaport] = useState(raportData || null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Set screen title
  useEffect(() => {
    navigation.setOptions({
      title: 'Detail Raport',
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            // onPress={handleEdit}
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

  // Fetch raport data if not provided
  useEffect(() => {
    if (!raportData && anakId && raportId) {
      fetchRaportData();
    }
  }, [raportData, anakId, raportId]);

  // Fetch raport data
  const fetchRaportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await raportApi.getRaportDetail(raportId);
      
      if (response.data.success) {
        setRaport(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat data raport');
      }
    } catch (err) {
      console.error('Error fetching raport data:', err);
      setError('Gagal memuat data raport. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit raport
  // const handleEdit = () => {
  //   navigation.navigate('EditRaport', {
  //     anakData,
  //     anakId,
  //     raportId,
  //     raportData: raport
  //   });
  // };

  // Confirm delete
  const confirmDelete = () => {
    Alert.alert(
      'Hapus Raport',
      'Anda yakin ingin menghapus raport ini? Tindakan ini tidak dapat dibatalkan.',
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

  // Handle delete raport
  const handleDelete = async () => {
    if (!anakId || !raportId) {
      Alert.alert('Error', 'ID anak atau ID raport tidak ditemukan');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await raportApi.deleteRaport(raportId);
      
      if (response.data.success) {
        Alert.alert(
          'Sukses',
          'Raport berhasil dihapus',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        setError(response.data.message || 'Gagal menghapus raport');
      }
    } catch (err) {
      console.error('Error deleting raport:', err);
      setError('Gagal menghapus raport. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle image press
  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data raport..." />;
  }

  // Error state
  if (!raport && !loading) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error || 'Data raport tidak ditemukan'}
          onRetry={fetchRaportData}
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
          <LoadingSpinner message="Menghapus raport..." />
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
        
        {/* Raport header */}
        <View style={styles.raportHeader}>
          <View style={styles.raportTitle}>
            <Text style={styles.raportTitleText}>{raport.semester}</Text>
            <Text style={styles.raportSubtitle}>{raport.tingkat} - Kelas {raport.kelas}</Text>
          </View>
          <View style={styles.raportDate}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.raportDateText}>
              {formatDateToIndonesian(raport.tanggal)}
            </Text>
          </View>
        </View>
        
        {/* Raport scores */}
        <View style={styles.scoresCard}>
          <Text style={styles.sectionTitle}>Nilai Raport</Text>
          <View style={styles.scoreRow}>
            {/* Min Score */}
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{raport.nilai_min || '-'}</Text>
              <Text style={styles.scoreLabel}>Nilai Minimum</Text>
            </View>
            
            {/* Average Score */}
            <View style={[styles.scoreBox, styles.accentScoreBox]}>
              <Text style={styles.accentScoreValue}>{raport.nilai_rata_rata || '-'}</Text>
              <Text style={styles.accentScoreLabel}>Rata-rata</Text>
            </View>
            
            {/* Max Score */}
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{raport.nilai_max || '-'}</Text>
              <Text style={styles.scoreLabel}>Nilai Maksimum</Text>
            </View>
          </View>
        </View>
        
        {/* Raport photos */}
        <View style={styles.photosSection}>
          <Text style={styles.sectionTitle}>Foto Raport</Text>
          
          {raport.foto_raport && raport.foto_raport.length > 0 ? (
            <View style={styles.photoGrid}>
              {raport.foto_raport.map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.photoItem}
                  onPress={() => handleImagePress(photo.foto_url)}
                >
                  <Image
                    source={{ uri: photo.foto_url }}
                    style={styles.photoThumbnail}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPhotos}>
              <Ionicons name="images-outline" size={60} color="#cccccc" />
              <Text style={styles.emptyPhotosText}>Tidak ada foto raport</Text>
            </View>
          )}
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Edit Raport"
            // onPress={handleEdit}
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
      
      {/* Image modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close-circle" size={36} color="#ffffff" />
          </TouchableOpacity>
          
          <Image
            source={{ uri: selectedImage }}
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
    marginBottom: 8,
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
  raportDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  raportDateText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  scoresCard: {
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
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreBox: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  accentScoreBox: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  accentScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666666',
  },
  accentScoreLabel: {
    fontSize: 12,
    color: '#ffffff',
  },
  photosSection: {
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoItem: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    margin: 4,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPhotosText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
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

export default RaportDetailScreen;