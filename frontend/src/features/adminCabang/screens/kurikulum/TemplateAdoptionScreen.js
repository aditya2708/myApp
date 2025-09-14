import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { BreadcrumbNavigation } from '../../components/kurikulum';
import { useGetTemplateAdoptionsQuery, useAdoptTemplateMutation, useCustomizeTemplateMutation, useSkipTemplateMutation } from '../../api/kurikulumApi';
import {
  selectAdoptionUI,
  selectAdoptionLoading,
  selectSelectedTemplate,
  setSelectedTab,
  setSelectedTemplate,
  setShowPreviewModal,
  setShowCustomizeModal,
  setCustomizationNotes,
  startAdoptionFlow,
  closeAllModals,
  clearSelectedTemplate,
} from '../../redux/templateAdoptionSlice';

const TemplateAdoptionScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  // Redux state
  const { selectedTab, showPreviewModal, showCustomizeModal } = useSelector(selectAdoptionUI);
  const { isAdopting, isCustomizing, isSkipping } = useSelector(selectAdoptionLoading);
  const selectedTemplate = useSelector(selectSelectedTemplate);
  const [customizationNotes, setCustomizationNotesLocal] = useState('');

  // Ensure selectedTab has initial value
  React.useEffect(() => {
    if (!selectedTab) {
      dispatch(setSelectedTab('pending'));
    }
  }, [selectedTab, dispatch]);

  const queryParams = {
    status: selectedTab === 'pending' ? 'pending' : 'adopted,customized,skipped'
  };
  
  const {
    data: adoptionsData,
    isLoading,
    error,
    refetch
  } = useGetTemplateAdoptionsQuery(queryParams);

  // Debug logging
  React.useEffect(() => {
    console.log('=== TEMPLATE ADOPTION DEBUG ===');
    console.log('- selectedTab:', selectedTab);
    console.log('- queryParams:', queryParams);
    console.log('- isLoading:', isLoading);
    console.log('- error:', error);
    console.log('- adoptionsData:', adoptionsData);
    console.log('- adoptionsData?.data:', adoptionsData?.data);
    console.log('- Array length:', adoptionsData?.data?.length || 0);
  }, [selectedTab, isLoading, error, adoptionsData]);

  const [adoptTemplate] = useAdoptTemplateMutation();
  const [customizeTemplate] = useCustomizeTemplateMutation();
  const [skipTemplate] = useSkipTemplateMutation();

  const breadcrumbPath = [
    { name: 'Kurikulum', screen: 'KurikulumHome' },
    { name: 'Adopsi Template', screen: 'TemplateAdoption' }
  ];

  const handleNavigate = (index) => {
    if (index === 0) {
      navigation.navigate('KurikulumHome');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'adopted': return '#4caf50';
      case 'customized': return '#2196f3';
      case 'skipped': return '#9e9e9e';
      default: return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'adopted': return 'Diadopsi';
      case 'customized': return 'Dikustomisasi';
      case 'skipped': return 'Dilewati';
      default: return status;
    }
  };

  const handlePreview = (adoption) => {
    dispatch(setSelectedTemplate(adoption));
    dispatch(setShowPreviewModal(true));
  };

  const handleAdopt = async (adoptionId) => {
    Alert.alert(
      'Adopsi Template',
      'Template akan diadopsi tanpa perubahan. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Adopsi',
          onPress: async () => {
            try {
              await adoptTemplate({ adoptionId }).unwrap();
              Alert.alert('Sukses', 'Template berhasil diadopsi');
              refetch();
            } catch (error) {
              Alert.alert('Error', 'Gagal mengadopsi template');
            }
          }
        }
      ]
    );
  };

  const handleCustomize = (adoption) => {
    setSelectedTemplate(adoption);
    setCustomizationNotes('');
    setShowCustomizeModal(true);
  };

  const handleCustomizeSubmit = async () => {
    if (!customizationNotes.trim()) {
      Alert.alert('Error', 'Catatan kustomisasi harus diisi');
      return;
    }

    try {
      await customizeTemplate({
        adoptionId: selectedTemplate.id_adoption,
        notes: customizationNotes
      }).unwrap();
      Alert.alert('Sukses', 'Template berhasil dikustomisasi');
      setShowCustomizeModal(false);
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Gagal mengkustomisasi template');
    }
  };

  const handleSkip = async (adoptionId) => {
    Alert.alert(
      'Lewati Template',
      'Template akan dilewati dan tidak diadopsi. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lewati',
          style: 'destructive',
          onPress: async () => {
            try {
              await skipTemplate({ adoptionId }).unwrap();
              Alert.alert('Sukses', 'Template berhasil dilewati');
              refetch();
            } catch (error) {
              Alert.alert('Error', 'Gagal melewati template');
            }
          }
        }
      ]
    );
  };

  const renderTemplateCard = ({ item }) => {
    const template = item.template_materi;
    
    return (
      <View style={styles.templateCard}>
        <View style={styles.cardHeader}>
          <View style={styles.templateInfo}>
            <Text style={styles.templateTitle} numberOfLines={2}>
              {template.nama_template}
            </Text>
            <Text style={styles.templateSubject}>
              {template.mata_pelajaran?.nama_mata_pelajaran} - {template.kelas?.nama_kelas}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => handlePreview(item)}
          >
            <Ionicons name="eye" size={20} color="#1976d2" />
          </TouchableOpacity>
        </View>

        {template.deskripsi && (
          <Text style={styles.templateDescription} numberOfLines={2}>
            {template.deskripsi}
          </Text>
        )}

        <View style={styles.fileInfo}>
          <Ionicons name="document" size={16} color="#666" />
          <Text style={styles.fileName}>
            {template.file_name || 'Tidak ada file'}
          </Text>
          <Text style={styles.fileSize}>
            {formatFileSize(template.file_size)}
          </Text>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.adoptButton]}
              onPress={() => handleAdopt(item.id_adoption)}
              disabled={isAdopting}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Adopsi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.customizeButton]}
              onPress={() => handleCustomize(item)}
              disabled={isCustomizing}
            >
              <Ionicons name="create" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Kustomisasi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={() => handleSkip(item.id_adoption)}
              disabled={isSkipping}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Lewati</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.adoption_notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Catatan:</Text>
            <Text style={styles.notesText}>{item.adoption_notes}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderPreviewModal = () => {
    if (!selectedTemplate) return null;
    const template = selectedTemplate.template_materi;

    return (
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preview Template</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => dispatch(setShowPreviewModal(false))}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.previewTitle}>{template.nama_template}</Text>
            <Text style={styles.previewSubject}>
              {template.mata_pelajaran?.nama_mata_pelajaran} - {template.kelas?.nama_kelas}
            </Text>
            
            {template.deskripsi && (
              <View style={styles.previewSection}>
                <Text style={styles.sectionTitle}>Deskripsi:</Text>
                <Text style={styles.sectionContent}>{template.deskripsi}</Text>
              </View>
            )}
            
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>File:</Text>
              <View style={styles.filePreview}>
                <Ionicons name="document" size={20} color="#1976d2" />
                <Text style={styles.fileName}>{template.file_name}</Text>
                <Text style={styles.fileSize}>({formatFileSize(template.file_size)})</Text>
              </View>
            </View>

            {template.metadata && (
              <View style={styles.previewSection}>
                <Text style={styles.sectionTitle}>Metadata:</Text>
                <Text style={styles.sectionContent}>
                  {JSON.stringify(template.metadata, null, 2)}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderCustomizeModal = () => (
    <Modal
      visible={showCustomizeModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.customizeModal}>
          <Text style={styles.modalTitle}>Kustomisasi Template</Text>
          
          <Text style={styles.inputLabel}>Catatan Kustomisasi:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            value={customizationNotes}
            onChangeText={setCustomizationNotes}
            placeholder="Jelaskan perubahan yang akan dilakukan..."
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowCustomizeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleCustomizeSubmit}
              disabled={isCustomizing}
            >
              {isCustomizing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Kustomisasi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Memuat template...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#dc3545" />
        <Text style={styles.errorTitle}>Gagal Memuat Template</Text>
        <Text style={styles.errorMessage}>
          {error?.data?.message || error?.message || 'Terjadi kesalahan saat memuat data template'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BreadcrumbNavigation path={breadcrumbPath} onNavigate={handleNavigate} />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
          onPress={() => dispatch(setSelectedTab('pending'))}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
            Menunggu
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
          onPress={() => dispatch(setSelectedTab('history'))}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
            Riwayat
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={adoptionsData?.data || []}
        renderItem={renderTemplateCard}
        keyExtractor={(item) => item.id_adoption.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {selectedTab === 'pending' ? 'Tidak ada template menunggu' : 'Tidak ada riwayat adopsi'}
            </Text>
          </View>
        }
      />

      {renderPreviewModal()}
      {renderCustomizeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateSubject: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  previewButton: {
    padding: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 12,
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  adoptButton: {
    backgroundColor: '#4caf50',
  },
  customizeButton: {
    backgroundColor: '#2196f3',
  },
  skipButton: {
    backgroundColor: '#9e9e9e',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  notesContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewSubject: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  previewSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customizeModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#1976d2',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default TemplateAdoptionScreen;