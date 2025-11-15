import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import HonorSummaryCard from '../components/HonorSummaryCard';

import {
  fetchTutorDetail,
  deleteTutor,
  toggleTutorStatus,
  selectSelectedTutor,
  selectTutorStatus,
  selectTutorError,
  selectTutorActionStatus
} from '../redux/tutorSlice';

const TutorDetailScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const { tutorId } = route.params;

  const tutor = useSelector(selectSelectedTutor);
  const status = useSelector(selectTutorStatus);
  const error = useSelector(selectTutorError);
  const toggleStatusState = useSelector(state => selectTutorActionStatus(state, 'toggle'));
  const isTutorActive = tutor?.is_active ?? true;

  useEffect(() => {
    dispatch(fetchTutorDetail(tutorId));
  }, [dispatch, tutorId]);

  const handleEditTutor = () => {
    navigation.navigate('TutorForm', { tutor });
  };

  const handleDeleteTutor = () => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus tutor ${tutor.nama}?`,
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteTutor(tutorId))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', 'Tutor berhasil dihapus');
                navigation.goBack();
              })
              .catch((error) => {
                Alert.alert('Gagal', error || 'Gagal menghapus tutor');
              });
          }
        }
      ]
    );
  };

  const handleViewActivityHistory = () => {
    navigation.navigate('TutorActivityHistory', {
      tutorId: tutor.id_tutor,
      tutorName: tutor.nama
    });
  };

  const handleViewCompetencies = () => {
    navigation.navigate('TutorCompetencyList', {
      tutorId: tutor.id_tutor,
      tutorName: tutor.nama
    });
  };

  const handleViewHonor = () => {
    navigation.navigate('TutorHonor', {
      tutorId: tutor.id_tutor,
      tutorName: tutor.nama
    });
  };

  const handleViewHonorHistory = () => {
    navigation.navigate('TutorHonorHistory', {
      tutorId: tutor.id_tutor,
      tutorName: tutor.nama
    });
  };

  const handleCallTutor = () => {
    if (tutor.no_hp) {
      Linking.openURL(`tel:${tutor.no_hp}`);
    }
  };

  const handleEmailTutor = () => {
    if (tutor.email) {
      Linking.openURL(`mailto:${tutor.email}`);
    }
  };

  const handleToggleTutorStatus = () => {
    const nextStatus = !isTutorActive;
    Alert.alert(
      nextStatus ? 'Aktifkan Tutor' : 'Nonaktifkan Tutor',
      `Apakah Anda yakin ingin ${nextStatus ? 'mengaktifkan' : 'menonaktifkan'} ${tutor.nama}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: () => {
            dispatch(toggleTutorStatus({ id: tutor.id_tutor, isActive: nextStatus }))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', `Tutor berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
              })
              .catch((toggleError) => {
                Alert.alert('Gagal', toggleError || 'Gagal memperbarui status tutor');
              });
          }
        }
      ]
    );
  };

  if (status === 'loading') {
    return <LoadingSpinner fullScreen message="Memuat detail tutor..." />;
  }

  if (status === 'failed' || !tutor) {
    return (
      <ErrorMessage
        message={error || 'Gagal memuat detail tutor'}
        onRetry={() => dispatch(fetchTutorDetail(tutorId))}
      />
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.photoContainer}>
        {tutor.foto_url ? (
          <Image
            source={{ uri: tutor.foto_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={60} color="#ffffff" />
          </View>
        )}
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.nameText}>{tutor.nama}</Text>
        <View style={[styles.statusBadge, isTutorActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text
            style={[
              styles.statusBadgeText,
              isTutorActive ? styles.activeBadgeText : styles.inactiveBadgeText
            ]}
          >
            {isTutorActive ? 'Aktif' : 'Nonaktif'}
          </Text>
        </View>
      </View>

      <View style={styles.contactActions}>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleCallTutor}
        >
          <Ionicons name="call" size={24} color="#3498db" />
          <Text style={styles.contactButtonText}>Telepon</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleEmailTutor}
        >
          <Ionicons name="mail" size={24} color="#3498db" />
          <Text style={styles.contactButtonText}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleViewActivityHistory}
        >
          <Ionicons name="calendar" size={24} color="#3498db" />
          <Text style={styles.contactButtonText}>Riwayat</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleViewHonorHistory}
        >
          <Ionicons name="document-text" size={24} color="#3498db" />
          <Text style={styles.contactButtonText}>Honor</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleViewCompetencies}
        >
          <Ionicons name="ribbon" size={24} color="#3498db" />
          <Text style={styles.contactButtonText}>Kompetensi</Text>
        </TouchableOpacity>
      </View>

      <HonorSummaryCard 
        tutorId={tutor.id_tutor}
        onPress={handleViewHonor}
      />

      <View style={styles.detailSection}>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <Text style={styles.detailText}>{tutor.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="phone-portrait-outline" size={20} color="#666" />
          <Text style={styles.detailText}>{tutor.no_hp}</Text>
        </View>
        {tutor.pendidikan && (
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{tutor.pendidikan}</Text>
          </View>
        )}
        {tutor.maple && (
          <View style={styles.detailRow}>
            <Ionicons name="book-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{tutor.maple}</Text>
          </View>
        )}
        {tutor.alamat && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{tutor.alamat}</Text>
          </View>
        )}
      </View>

      <View style={styles.toggleButtonWrapper}>
        <Button
          title={isTutorActive ? 'Nonaktifkan Tutor' : 'Aktifkan Tutor'}
          onPress={handleToggleTutorStatus}
          type={isTutorActive ? 'danger' : 'primary'}
          disabled={toggleStatusState === 'loading'}
          leftIcon={
            <Ionicons
              name={isTutorActive ? 'close-circle-outline' : 'checkmark-circle-outline'}
              size={20}
              color="#ffffff"
            />
          }
        />
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Edit"
          onPress={handleEditTutor}
          type="outline"
          style={styles.editButton}
          leftIcon={<Ionicons name="create-outline" size={20} color="#3498db" />}
        />
        <Button
          title="Hapus"
          onPress={handleDeleteTutor}
          type="danger"
          style={styles.deleteButton}
          leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
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
  contentContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 5,
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  nameRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeBadge: {
    backgroundColor: '#e8f8f2',
  },
  inactiveBadge: {
    backgroundColor: '#fdecea',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeBadgeText: {
    color: '#2ecc71',
  },
  inactiveBadgeText: {
    color: '#e74c3c',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    minWidth: 70,
    justifyContent: 'center',
  },
  contactButtonText: {
    marginLeft: 6,
    color: '#3498db',
    fontWeight: '500',
    fontSize: 12,
  },
  detailSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 8,
  },
  toggleButtonWrapper: {
    marginBottom: 16,
  },
});

export default TutorDetailScreen;
