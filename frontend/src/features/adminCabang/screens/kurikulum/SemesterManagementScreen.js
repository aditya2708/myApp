import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import FloatingActionButton from '../../../../common/components/FloatingActionButton';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import {
  useGetSemesterListQuery,
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
  useDeleteSemesterMutation,
  useSetActiveSemesterMutation
} from '../../api/kurikulumApi';

/**
 * Semester Management Screen - API Integrated
 * CRUD interface for semester management
 */
const SemesterManagementScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [formData, setFormData] = useState({
    nama_semester: '',
    tahun_ajaran: '',
    periode: 'ganjil',
    tanggal_mulai: '',
    tanggal_selesai: ''
  });
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // API hooks
  const {
    data: semesterResponse,
    isLoading,
    error,
    refetch
  } = useGetSemesterListQuery({ status: 'all' });
  
  const [createSemester, { isLoading: isCreating }] = useCreateSemesterMutation();
  const [updateSemester, { isLoading: isUpdating }] = useUpdateSemesterMutation();
  const [deleteSemester, { isLoading: isDeleting }] = useDeleteSemesterMutation();
  const [setActiveSemester, { isLoading: isActivating }] = useSetActiveSemesterMutation();
  
  // Refetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleAddSemester = () => {
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    
    setFormData({
      nama_semester: '',
      tahun_ajaran: new Date().getFullYear().toString(),
      periode: 'ganjil',
      tanggal_mulai: '',
      tanggal_selesai: ''
    });
    setStartDate(today);
    setEndDate(nextYear);
    setShowCreateModal(true);
  };

  const handleEditSemester = (semester) => {
    setEditingSemester(semester);
    setFormData({
      nama_semester: semester.nama_semester || '',
      tahun_ajaran: semester.tahun_ajaran || '',
      periode: semester.periode || 'ganjil',
      tanggal_mulai: semester.tanggal_mulai || '',
      tanggal_selesai: semester.tanggal_selesai || ''
    });
    
    // Set date picker values
    const startDateValue = semester.tanggal_mulai ? new Date(semester.tanggal_mulai) : new Date();
    const endDateValue = semester.tanggal_selesai ? new Date(semester.tanggal_selesai) : new Date();
    setStartDate(startDateValue);
    setEndDate(endDateValue);
    
    setShowEditModal(true);
  };

  const handleCreateSubmit = async () => {
    // Simple validation
    if (!formData.nama_semester || !formData.tahun_ajaran) {
      Alert.alert('Error', 'Nama semester dan tahun ajaran harus diisi');
      return;
    }

    try {
      await createSemester(formData).unwrap();
      Alert.alert('Berhasil', 'Semester berhasil ditambahkan');
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      Alert.alert('Error', error?.data?.message || 'Gagal menambahkan semester');
    }
  };

  const handleEditSubmit = async () => {
    // Simple validation
    if (!formData.nama_semester || !formData.tahun_ajaran) {
      Alert.alert('Error', 'Nama semester dan tahun ajaran harus diisi');
      return;
    }

    try {
      await updateSemester({ 
        id: editingSemester.id_semester, 
        ...formData 
      }).unwrap();
      Alert.alert('Berhasil', 'Semester berhasil diupdate');
      setShowEditModal(false);
      setEditingSemester(null);
      refetch();
    } catch (error) {
      Alert.alert('Error', error?.data?.message || 'Gagal mengupdate semester');
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingSemester(null);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setFormData({
      nama_semester: '',
      tahun_ajaran: '',
      periode: 'ganjil',
      tanggal_mulai: '',
      tanggal_selesai: ''
    });
  };

  // Date picker handlers
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      setFormData({...formData, tanggal_mulai: formattedDate});
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      setFormData({...formData, tanggal_selesai: formattedDate});
    }
  };

  const showStartDatePickerModal = () => {
    setShowStartDatePicker(true);
  };

  const showEndDatePickerModal = () => {
    setShowEndDatePicker(true);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Pilih tanggal';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDeleteSemester = async (semester) => {
    Alert.alert(
      'Hapus Semester',
      `Apakah Anda yakin ingin menghapus semester \"${semester.nama_semester}\"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: async () => {
          try {
            await deleteSemester(semester.id_semester).unwrap();
            Alert.alert('Berhasil', 'Semester berhasil dihapus');
          } catch (error) {
            Alert.alert('Error', error?.data?.message || 'Gagal menghapus semester');
          }
        }}
      ]
    );
  };

  const handleSetActive = async (semester) => {
    Alert.alert(
      'Aktifkan Semester',
      `Aktifkan semester \"${semester.nama_semester}\"? Semester aktif lainnya akan dinonaktifkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Aktifkan', onPress: async () => {
          try {
            await setActiveSemester(semester.id_semester).unwrap();
            Alert.alert('Berhasil', 'Semester berhasil diaktifkan');
          } catch (error) {
            Alert.alert('Error', error?.data?.message || 'Gagal mengaktifkan semester');
          }
        }}
      ]
    );
  };

  // Process API data
  console.log('=== SCREEN DATA PROCESSING ===');
  console.log('- semesterResponse:', semesterResponse);
  console.log('- semesterResponse type:', typeof semesterResponse);
  console.log('- semesterResponse keys:', semesterResponse ? Object.keys(semesterResponse) : 'No keys');
  
  let allSemesters = [];
  
  // Handle different response structures
  if (semesterResponse?.data) {
    // Check if data is array (transformed response)
    if (Array.isArray(semesterResponse.data)) {
      allSemesters = semesterResponse.data;
      console.log('- Using transformed array data, length:', allSemesters.length);
    }
    // Check if data has pagination structure
    else if (semesterResponse.data.data && Array.isArray(semesterResponse.data.data)) {
      allSemesters = semesterResponse.data.data;
      console.log('- Using pagination data, length:', allSemesters.length);
    }
    // Fallback for other structures
    else {
      console.log('- Unknown data structure, using empty array');
      allSemesters = [];
    }
  } else {
    console.log('- No data in response, using empty array');
    allSemesters = [];
  }
  
  console.log('- Final allSemesters:', allSemesters);
  console.log('- Final allSemesters length:', allSemesters.length);
  
  // Group semesters by status
  const semesterData = {
    active: allSemesters.filter(semester => semester.is_active),
    draft: allSemesters.filter(semester => !semester.is_active && (!semester.status || semester.status === 'draft')),
    completed: allSemesters.filter(semester => semester.status === 'completed'),
    archived: allSemesters.filter(semester => semester.status === 'archived')
  };
  
  console.log('- Semester counts:', {
    active: semesterData.active.length,
    draft: semesterData.draft.length,
    completed: semesterData.completed.length,
    archived: semesterData.archived.length
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'draft': return '#ffc107';
      case 'completed': return '#6c757d';
      case 'archived': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'draft': return 'Draft';
      case 'completed': return 'Selesai';
      case 'archived': return 'Arsip';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const tabs = [
    { key: 'active', label: 'Aktif', count: semesterData.active.length },
    { key: 'draft', label: 'Draft', count: semesterData.draft.length },
    { key: 'completed', label: 'Selesai', count: semesterData.completed.length },
  ];

  const currentData = semesterData[selectedTab] || [];

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Memuat data semester..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        message="Gagal memuat data semester"
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Kelola Semester</Text>
        <Text style={styles.subtitle}>
          Manajemen semester untuk kurikulum cabang
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#28a745']}
            tintColor="#28a745"
          />
        }
      >
        {currentData.map((semester) => (
          <View key={semester.id_semester} style={styles.semesterCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.semesterName}>{semester.nama_semester}</Text>
                <View 
                  style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(semester.status) }
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(semester.status)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color="#6c757d" />
                <Text style={styles.infoText}>
                  {formatDate(semester.tanggal_mulai)} - {formatDate(semester.tanggal_selesai)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="school-outline" size={14} color="#6c757d" />
                <Text style={styles.infoText}>
                  Tahun Ajaran {semester.tahun_ajaran}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={14} color="#6c757d" />
                <Text style={styles.infoText}>
                  Periode {semester.periode === 'ganjil' ? 'Ganjil' : 'Genap'}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              {semester.status === 'draft' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.activateButton]}
                  onPress={() => handleSetActive(semester)}
                >
                  <Ionicons name="play-circle" size={16} color="#28a745" />
                  <Text style={[styles.actionText, { color: '#28a745' }]}>Aktifkan</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditSemester(semester)}
              >
                <Ionicons name="pencil" size={16} color="#007bff" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteSemester(semester)}
              >
                <Ionicons name="trash" size={16} color="#dc3545" />
                <Text style={[styles.actionText, styles.deleteText]}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {currentData.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Belum Ada Semester</Text>
            <Text style={styles.emptySubtitle}>
              Tap tombol + untuk menambah semester baru
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#17a2b8" />
          <Text style={styles.infoCardText}>
            Semester management terintegrasi dengan API. 
            Gunakan tombol + untuk menambah semester baru.
          </Text>
        </View>
      </ScrollView>

      <FloatingActionButton
        onPress={handleAddSemester}
        icon="add"
        backgroundColor="#28a745"
      />

      {/* Create Semester Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Semester</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Semester *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.nama_semester}
                  onChangeText={(text) => setFormData({...formData, nama_semester: text})}
                  placeholder="Contoh: Semester Ganjil 2024/2025"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tahun Ajaran *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.tahun_ajaran}
                  onChangeText={(text) => setFormData({...formData, tahun_ajaran: text})}
                  placeholder="Contoh: 2024/2025"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Periode</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[styles.radioOption, formData.periode === 'ganjil' && styles.radioSelected]}
                    onPress={() => setFormData({...formData, periode: 'ganjil'})}
                  >
                    <Text style={[styles.radioText, formData.periode === 'ganjil' && styles.radioTextSelected]}>Ganjil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.radioOption, formData.periode === 'genap' && styles.radioSelected]}
                    onPress={() => setFormData({...formData, periode: 'genap'})}
                  >
                    <Text style={[styles.radioText, formData.periode === 'genap' && styles.radioTextSelected]}>Genap</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tanggal Mulai</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={showStartDatePickerModal}
                >
                  <Text style={[styles.datePickerText, !formData.tanggal_mulai && styles.datePickerPlaceholder]}>
                    {formatDisplayDate(formData.tanggal_mulai)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6c757d" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tanggal Selesai</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={showEndDatePickerModal}
                >
                  <Text style={[styles.datePickerText, !formData.tanggal_selesai && styles.datePickerPlaceholder]}>
                    {formatDisplayDate(formData.tanggal_selesai)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6c757d" />
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleCreateSubmit}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Semester Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Semester</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Semester *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.nama_semester}
                  onChangeText={(text) => setFormData({...formData, nama_semester: text})}
                  placeholder="Contoh: Semester Ganjil 2024/2025"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tahun Ajaran *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.tahun_ajaran}
                  onChangeText={(text) => setFormData({...formData, tahun_ajaran: text})}
                  placeholder="Contoh: 2024/2025"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Periode</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[styles.radioOption, formData.periode === 'ganjil' && styles.radioSelected]}
                    onPress={() => setFormData({...formData, periode: 'ganjil'})}
                  >
                    <Text style={[styles.radioText, formData.periode === 'ganjil' && styles.radioTextSelected]}>Ganjil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.radioOption, formData.periode === 'genap' && styles.radioSelected]}
                    onPress={() => setFormData({...formData, periode: 'genap'})}
                  >
                    <Text style={[styles.radioText, formData.periode === 'genap' && styles.radioTextSelected]}>Genap</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tanggal Mulai</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={showStartDatePickerModal}
                >
                  <Text style={[styles.datePickerText, !formData.tanggal_mulai && styles.datePickerPlaceholder]}>
                    {formatDisplayDate(formData.tanggal_mulai)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6c757d" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tanggal Selesai</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={showEndDatePickerModal}
                >
                  <Text style={[styles.datePickerText, !formData.tanggal_selesai && styles.datePickerPlaceholder]}>
                    {formatDisplayDate(formData.tanggal_selesai)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6c757d" />
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleEditSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#6c757d',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  semesterCard: {
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
    marginBottom: 10,
  },
  cardTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  semesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    flex: 1,
    marginRight: 10,
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
  cardContent: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
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
  activateButton: {
    backgroundColor: '#e8f5e8',
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
  infoCardText: {
    flex: 1,
    fontSize: 12,
    color: '#0056b3',
    marginLeft: 10,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#343a40',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 14,
    color: '#343a40',
  },
  datePickerPlaceholder: {
    color: '#6c757d',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  radioSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  radioText: {
    fontSize: 14,
    color: '#6c757d',
  },
  radioTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#28a745',
    marginLeft: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default SemesterManagementScreen;