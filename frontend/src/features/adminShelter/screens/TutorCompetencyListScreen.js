import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

import {
  fetchCompetencies,
  deleteCompetency,
  selectCompetencies,
  selectCompetencyStatus,
  selectCompetencyError,
  selectCompetencyActionStatus
} from '../redux/tutorCompetencySlice';

const TutorCompetencyListScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const { tutorId, tutorName } = route.params;

  const competencies = useSelector(selectCompetencies);
  const status = useSelector(selectCompetencyStatus);
  const error = useSelector(selectCompetencyError);
  const deleteStatus = useSelector(state => selectCompetencyActionStatus(state, 'delete'));

  useEffect(() => {
    dispatch(fetchCompetencies(tutorId));
  }, [dispatch, tutorId]);

  const handleAddCompetency = () => {
    navigation.navigate('TutorCompetencyForm', { tutorId, tutorName });
  };

  const handleEditCompetency = (competency) => {
    navigation.navigate('TutorCompetencyForm', { 
      tutorId, 
      tutorName, 
      competency,
      isEdit: true 
    });
  };

  const handleViewCompetency = (competency) => {
    navigation.navigate('TutorCompetencyDetail', { 
      tutorId, 
      competencyId: competency.id_competency,
      tutorName 
    });
  };

  const handleDeleteCompetency = (competency) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Hapus kompetensi ${competency.nama_competency}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCompetency({ 
              tutorId, 
              competencyId: competency.id_competency 
            }))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', 'Kompetensi berhasil dihapus');
              })
              .catch((error) => {
                Alert.alert('Gagal', error || 'Gagal menghapus kompetensi');
              });
          }
        }
      ]
    );
  };

  const renderCompetencyItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.competencyItem}
      onPress={() => handleViewCompetency(item)}
    >
      <View style={styles.competencyHeader}>
        <Text style={styles.competencyName}>{item.nama_competency}</Text>
        <View style={styles.competencyActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditCompetency(item)}
          >
            <Ionicons name="create-outline" size={20} color="#3498db" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteCompetency(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.competencyDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.instansi_penerbit}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.tanggal_diperoleh).toLocaleDateString('id-ID')}
          </Text>
        </View>
        {item.jenis_kompetensi && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>{item.jenis_kompetensi.nama_jenis_kompetensi}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ribbon-outline" size={64} color="#e0e0e0" />
      <Text style={styles.emptyTitle}>Belum Ada Kompetensi</Text>
      <Text style={styles.emptySubtitle}>
        Tambahkan kompetensi untuk {tutorName}
      </Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddCompetency}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
        <Text style={styles.addButtonText}>Tambah Kompetensi</Text>
      </TouchableOpacity>
    </View>
  );

  if (status === 'loading') {
    return <LoadingSpinner fullScreen message="Memuat kompetensi..." />;
  }

  if (status === 'failed') {
    return (
      <ErrorMessage
        message={error || 'Gagal memuat kompetensi'}
        onRetry={() => dispatch(fetchCompetencies(tutorId))}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kompetensi {tutorName}</Text>
        <TouchableOpacity
          style={styles.addHeaderButton}
          onPress={handleAddCompetency}
        >
          <Ionicons name="add" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={competencies}
        renderItem={renderCompetencyItem}
        keyExtractor={(item) => item.id_competency.toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addHeaderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
  },
  competencyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  competencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  competencyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  competencyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  competencyDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  badgeContainer: {
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TutorCompetencyListScreen;