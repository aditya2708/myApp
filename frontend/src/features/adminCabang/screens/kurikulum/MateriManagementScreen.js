import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import FloatingActionButton from '../../../../common/components/FloatingActionButton';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { useGetMateriListQuery, useDeleteMateriMutation } from '../../api/kurikulumApi';

/**
 * Materi Management Screen - API Integrated
 * CRUD interface for learning materials
 */
const MateriManagementScreen = ({ navigation, route }) => {
  const { jenjang, kelas, mataPelajaran } = route.params;
  
  // Get auth state for debugging
  const auth = useSelector(state => state.auth);

  // API hooks
  const {
    data: materiResponse,
    isLoading,
    error,
    refetch
  } = useGetMateriListQuery({
    mata_pelajaran: mataPelajaran.id_mata_pelajaran,
    kelas: kelas.id_kelas
  });

  const [deleteMateri, { isLoading: isDeleting }] = useDeleteMateriMutation();

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleAddMateri = () => {
    navigation.navigate('MateriForm', { 
      jenjang, 
      kelas, 
      mataPelajaran,
      isEdit: false 
    });
  };

  const handleEditMateri = (materi) => {
    navigation.navigate('MateriForm', { 
      jenjang, 
      kelas, 
      mataPelajaran,
      isEdit: true,
      materi 
    });
  };

  const handleDeleteMateri = (materi) => {
    Alert.alert(
      'Hapus Materi',
      `Apakah Anda yakin ingin menghapus materi "${materi.nama_materi}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: async () => {
          try {
            await deleteMateri(materi.id_materi).unwrap();
            Alert.alert('Sukses', 'Materi berhasil dihapus');
            refetch(); // Refresh data
          } catch (error) {
            Alert.alert('Error', error.message || 'Gagal menghapus materi');
          }
        }}
      ]
    );
  };

  // Get materi list from API response (handle pagination)
  const materiList = materiResponse?.data?.data || [];

  // DEBUG LOGGING FOR PHYSICAL DEVICE
  console.log('=== MATERI MANAGEMENT SCREEN DEBUG ===');
  console.log('Authentication state:');
  console.log('- isAuthenticated:', !!auth?.token);
  console.log('- user:', auth?.user ? `${auth.user.name} (${auth.user.role})` : 'No user');
  console.log('- token exists:', !!auth?.token);
  console.log('- token length:', auth?.token ? auth.token.length : 'No token');
  console.log('Route params received:');
  console.log('- jenjang:', JSON.stringify(jenjang, null, 2));
  console.log('- kelas:', JSON.stringify(kelas, null, 2));
  console.log('- mataPelajaran:', JSON.stringify(mataPelajaran, null, 2));
  
  const queryParams = {
    mata_pelajaran: mataPelajaran?.id_mata_pelajaran,
    kelas: kelas?.id_kelas
  };
  console.log('API Query params sent:', queryParams);
  
  // Log the exact URL that would be constructed
  const baseUrl = 'http://192.168.8.105:8000/api/admin-cabang/materi';
  const searchParams = new URLSearchParams(queryParams);
  const fullUrl = `${baseUrl}?${searchParams.toString()}`;
  console.log('Full API URL:', fullUrl);
  
  console.log('RTK Query State:');
  console.log('- isLoading:', isLoading);
  console.log('- error:', error ? JSON.stringify(error, null, 2) : 'No error');
  console.log('API Response:');
  console.log('- materiResponse:', materiResponse ? JSON.stringify(materiResponse, null, 2) : 'No response');
  console.log('Processed Data:');
  console.log('- materiList length:', materiList?.length);
  console.log('- materiList:', JSON.stringify(materiList, null, 2));
  console.log('=== END DEBUG ===');

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Memuat data materi..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        message="Gagal memuat data materi"
        onRetry={refetch}
      />
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#28a745';
      case 'draft': return '#ffc107';
      case 'archived': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return 'document';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'document-text';
      case 'doc': case 'docx': return 'document';
      case 'jpg': case 'jpeg': case 'png': return 'image';
      default: return 'document';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#dc3545']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Kelola Materi</Text>
          <Text style={styles.subtitle}>
            {mataPelajaran.nama_mata_pelajaran} - {kelas.nama_kelas}
          </Text>
        </View>

        <View style={styles.content}>
          {materiList.map((materi) => (
            <View key={materi.id_materi} style={styles.materiCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={getFileIcon(materi.file_name)} 
                    size={20} 
                    color="#dc3545" 
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.materiName}>{materi.nama_materi}</Text>
                  <Text style={styles.materiDescription}>{materi.deskripsi}</Text>
                  <View style={styles.materiMeta}>
                    <Text style={styles.urutanText}>Urutan: {materi.urutan}</Text>
                    <View 
                      style={[
                        styles.statusBadge, 
                        { backgroundColor: getStatusColor(materi.kategori || 'draft') }
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {materi.kategori === 'published' ? 'Terbit' : 
                         materi.kategori === 'draft' ? 'Draft' : 
                         materi.file_name ? 'Ada File' : 'Draft'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditMateri(materi)}
                >
                  <Ionicons name="pencil" size={16} color="#007bff" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteMateri(materi)}
                >
                  <Ionicons name="trash" size={16} color="#dc3545" />
                  <Text style={[styles.actionText, styles.deleteText]}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {materiList.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>Belum Ada Materi</Text>
              <Text style={styles.emptySubtitle}>
                Tap tombol + untuk menambah materi baru
              </Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#17a2b8" />
            <Text style={styles.infoText}>
              CRUD materi sudah terintegrasi dengan backend API. 
              Fitur drag & drop reorder akan diimplementasi selanjutnya.
            </Text>
          </View>
        </View>
      </ScrollView>

      <FloatingActionButton
        onPress={handleAddMateri}
        icon="add"
        backgroundColor="#007bff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  content: {
    padding: 20,
  },
  materiCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8d7da',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  materiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 4,
  },
  materiDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 18,
  },
  materiMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urutanText: {
    fontSize: 12,
    color: '#6c757d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#007bff',
  },
  deleteText: {
    color: '#dc3545',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0056b3',
    marginLeft: 10,
    lineHeight: 16,
  },
});

export default MateriManagementScreen;