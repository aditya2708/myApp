import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

import {
  fetchCompetencyDetail,
  deleteCompetency,
  selectSelectedCompetency,
  selectCompetencyStatus,
  selectCompetencyError
} from '../redux/tutorCompetencySlice';

const TutorCompetencyDetailScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const { tutorId, competencyId, tutorName } = route.params;

  const competency = useSelector(selectSelectedCompetency);
  const status = useSelector(selectCompetencyStatus);
  const error = useSelector(selectCompetencyError);

  useEffect(() => {
    dispatch(fetchCompetencyDetail({ tutorId, competencyId }));
  }, [dispatch, tutorId, competencyId]);

  const handleEdit = () => {
    navigation.navigate('TutorCompetencyForm', {
      tutorId,
      tutorName,
      competency,
      isEdit: true
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Hapus kompetensi ${competency.nama_competency}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCompetency({ tutorId, competencyId }))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', 'Kompetensi berhasil dihapus');
                navigation.goBack();
              })
              .catch((error) => {
                Alert.alert('Gagal', error || 'Gagal menghapus kompetensi');
              });
          }
        }
      ]
    );
  };

  const handleOpenFile = () => {
    if (competency?.file_url) {
      Linking.openURL(competency.file_url).catch(() => {
        Alert.alert('Error', 'Tidak dapat membuka file');
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isExpired = () => {
    if (!competency?.tanggal_kadaluarsa) return false;
    return new Date(competency.tanggal_kadaluarsa) < new Date();
  };

  if (status === 'loading') {
    return <LoadingSpinner fullScreen message="Memuat detail kompetensi..." />;
  }

  if (status === 'failed' || !competency) {
    return (
      <ErrorMessage
        message={error || 'Gagal memuat detail kompetensi'}
        onRetry={() => dispatch(fetchCompetencyDetail({ tutorId, competencyId }))}
      />
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.competencyName}>{competency.nama_competency}</Text>
        {competency.jenis_kompetensi && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>{competency.jenis_kompetensi.nama_jenis_kompetensi}</Text>
          </View>
        )}
      </View>

      <View style={styles.detailSection}>
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="business-outline" size={20} color="#3498db" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Instansi Penerbit</Text>
            <Text style={styles.detailValue}>{competency.instansi_penerbit}</Text>
          </View>
        </View>

        {competency.nomor_sertifikat && (
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="card-outline" size={20} color="#3498db" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Nomor Sertifikat</Text>
              <Text style={styles.detailValue}>{competency.nomor_sertifikat}</Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar-outline" size={20} color="#3498db" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Tanggal Diperoleh</Text>
            <Text style={styles.detailValue}>{formatDate(competency.tanggal_diperoleh)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={isExpired() ? "#e74c3c" : "#3498db"} 
            />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Tanggal Kadaluarsa</Text>
            <Text style={[
              styles.detailValue,
              isExpired() && styles.expiredText
            ]}>
              {formatDate(competency.tanggal_kadaluarsa)}
              {isExpired() && ' (Kadaluarsa)'}
            </Text>
          </View>
        </View>

        {competency.deskripsi && (
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text-outline" size={20} color="#3498db" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Deskripsi</Text>
              <Text style={styles.detailValue}>{competency.deskripsi}</Text>
            </View>
          </View>
        )}

        {competency.file_url && (
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-outline" size={20} color="#3498db" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>File Sertifikat</Text>
              <TouchableOpacity 
                style={styles.fileButton}
                onPress={handleOpenFile}
              >
                <Ionicons name="download-outline" size={16} color="#3498db" />
                <Text style={styles.fileButtonText}>Buka File PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Edit"
          onPress={handleEdit}
          type="outline"
          style={styles.editButton}
          leftIcon={<Ionicons name="create-outline" size={20} color="#3498db" />}
        />
        <Button
          title="Hapus"
          onPress={handleDelete}
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
    padding: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    alignItems: 'center',
  },
  competencyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    alignSelf: 'center',
  },
  badge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '500',
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  expiredText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  fileButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
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
});

export default TutorCompetencyDetailScreen;