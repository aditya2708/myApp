import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetMataPelajaranCustomQuery,
  useCreateMataPelajaranCustomMutation,
  useUpdateMataPelajaranCustomMutation,
  useDeleteMataPelajaranCustomMutation,
  useGetMasterDataDropdownQuery,
} from '../../../api/kurikulumApi';

const MataPelajaranCustomTab = ({ refreshing, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedKategori, setSelectedKategori] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    nama_mata_pelajaran: '',
    kode_mata_pelajaran: '',
    kategori: 'wajib',
    deskripsi: '',
    id_jenjang: '',
    is_global: false,
    target_jenjang: [],
    target_kelas: [],
  });

  // API hooks
  const { data: mataPelajaranData, isLoading, refetch } = useGetMataPelajaranCustomQuery({
    kategori: selectedKategori || undefined
  });
  const { data: dropdownData } = useGetMasterDataDropdownQuery();
  const [createMataPelajaran, { isLoading: isCreating }] = useCreateMataPelajaranCustomMutation();
  const [updateMataPelajaran, { isLoading: isUpdating }] = useUpdateMataPelajaranCustomMutation();
  const [deleteMataPelajaran] = useDeleteMataPelajaranCustomMutation();

  // Refresh when tab refreshing prop changes
  useEffect(() => {
    if (refreshing) {
      refetch();
    }
  }, [refreshing, refetch]);

  const resetForm = () => {
    setFormData({
      nama_mata_pelajaran: '',
      kode_mata_pelajaran: '',
      kategori: 'wajib',
      deskripsi: '',
      id_jenjang: '',
      is_global: false,
      target_jenjang: [],
      target_kelas: [],
    });
  };

  const handleCreate = () => {
    resetForm();
    setModalMode('create');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setFormData({
      nama_mata_pelajaran: item.nama_mata_pelajaran || '',
      kode_mata_pelajaran: item.kode_mata_pelajaran || '',
      kategori: item.kategori || 'wajib',
      deskripsi: item.deskripsi || '',
      id_jenjang: item.id_jenjang?.toString() || '',
      is_global: item.is_global || false,
      target_jenjang: item.target_jenjang || [],
      target_kelas: item.target_kelas || [],
    });
    setModalMode('edit');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Hapus Mata Pelajaran Custom',
      `Apakah Anda yakin ingin menghapus mata pelajaran "${item.nama_mata_pelajaran}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMataPelajaran(item.id_mata_pelajaran).unwrap();
              Alert.alert('Sukses', 'Mata pelajaran custom berhasil dihapus');
              refetch();
            } catch (error) {
              Alert.alert('Error', error?.data?.message || 'Gagal menghapus mata pelajaran custom');
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.nama_mata_pelajaran.trim()) {
      Alert.alert('Error', 'Nama mata pelajaran harus diisi');
      return;
    }

    if (!formData.kode_mata_pelajaran.trim()) {
      Alert.alert('Error', 'Kode mata pelajaran harus diisi');
      return;
    }

    try {
      const submitData = {
        nama_mata_pelajaran: formData.nama_mata_pelajaran,
        kode_mata_pelajaran: formData.kode_mata_pelajaran,
        kategori: formData.kategori,
        deskripsi: formData.deskripsi,
        id_jenjang: formData.id_jenjang ? parseInt(formData.id_jenjang) : null,
        is_global: formData.is_global,
        target_jenjang: formData.target_jenjang,
        target_kelas: formData.target_kelas,
      };

      if (modalMode === 'create') {
        await createMataPelajaran(submitData).unwrap();
        Alert.alert('Sukses', 'Mata pelajaran custom berhasil dibuat');
      } else {
        await updateMataPelajaran({ id: selectedItem.id_mata_pelajaran, ...submitData }).unwrap();
        Alert.alert('Sukses', 'Mata pelajaran custom berhasil diperbarui');
      }
      
      setShowModal(false);
      refetch();
    } catch (error) {
      Alert.alert('Error', error?.data?.message || `Gagal ${modalMode === 'create' ? 'membuat' : 'memperbarui'} mata pelajaran custom`);
    }
  };

  const renderMataPelajaranCard = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.nama_mata_pelajaran}</Text>
          <Text style={styles.itemSubtitle}>
            Kode: {item.kode_mata_pelajaran} • {item.kategori}
          </Text>
          {item.jenjang && (
            <Text style={styles.itemSubtitle}>
              Jenjang: {item.jenjang.nama_jenjang}
            </Text>
          )}
          <View style={styles.badgeContainer}>
            {item.is_global && (
              <View style={[styles.badge, styles.globalBadge]}>
                <Text style={styles.badgeText}>Global</Text>
              </View>
            )}
            <View style={[styles.badge, getBadgeStyle(item.kategori)]}>
              <Text style={styles.badgeText}>{item.kategori}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create" size={18} color="#007bff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={18} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>

      {item.deskripsi && (
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.deskripsi}
        </Text>
      )}
    </View>
  );

  const getBadgeStyle = (kategori) => {
    switch (kategori) {
      case 'wajib': return styles.wajibBadge;
      case 'pilihan': return styles.pilihanBadge;
      case 'muatan_lokal': return styles.muatanLokalBadge;
      case 'pengembangan_diri': return styles.pengembanganDiriBadge;
      default: return styles.customBadge;
    }
  };

  const renderJenjangDropdown = () => {
    const jenjangOptions = dropdownData?.data?.jenjang || [];
    const [showJenjangPicker, setShowJenjangPicker] = useState(false);
    
    const selectedJenjang = jenjangOptions.find(j => j.id_jenjang.toString() === formData.id_jenjang);
    
    return (
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Jenjang Utama (Opsional)</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowJenjangPicker(true)}
        >
          <Text style={styles.dropdownText}>
            {selectedJenjang ? selectedJenjang.nama_jenjang : 'Semua Jenjang'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        
        <Modal
          visible={showJenjangPicker}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Pilih Jenjang</Text>
                <TouchableOpacity onPress={() => setShowJenjangPicker(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.pickerOptions}>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    !formData.id_jenjang && styles.pickerOptionSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, id_jenjang: '' }));
                    setShowJenjangPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    !formData.id_jenjang && styles.pickerOptionTextSelected
                  ]}>
                    Semua Jenjang
                  </Text>
                  {!formData.id_jenjang && (
                    <Ionicons name="checkmark" size={20} color="#007bff" />
                  )}
                </TouchableOpacity>
                
                {jenjangOptions.map((jenjang) => (
                  <TouchableOpacity
                    key={jenjang.id_jenjang}
                    style={[
                      styles.pickerOption,
                      formData.id_jenjang === jenjang.id_jenjang.toString() && styles.pickerOptionSelected
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        id_jenjang: jenjang.id_jenjang.toString() 
                      }));
                      setShowJenjangPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.id_jenjang === jenjang.id_jenjang.toString() && styles.pickerOptionTextSelected
                    ]}>
                      {jenjang.nama_jenjang}
                    </Text>
                    {formData.id_jenjang === jenjang.id_jenjang.toString() && (
                      <Ionicons name="checkmark" size={20} color="#007bff" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderKategoriDropdown = () => {
    const kategoriOptions = dropdownData?.data?.kategori_mata_pelajaran || [
      { value: 'wajib', label: 'Wajib' },
      { value: 'pilihan', label: 'Pilihan' },
      { value: 'muatan_lokal', label: 'Muatan Lokal' },
      { value: 'pengembangan_diri', label: 'Pengembangan Diri' }
    ];
    const [showKategoriPicker, setShowKategoriPicker] = useState(false);
    
    const selectedKategori = kategoriOptions.find(k => k.value === formData.kategori);
    
    return (
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Kategori *</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowKategoriPicker(true)}
        >
          <Text style={styles.dropdownText}>
            {selectedKategori ? selectedKategori.label : 'Pilih Kategori'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        
        <Modal
          visible={showKategoriPicker}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Pilih Kategori</Text>
                <TouchableOpacity onPress={() => setShowKategoriPicker(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.pickerOptions}>
                {kategoriOptions.map((kategori) => (
                  <TouchableOpacity
                    key={kategori.value}
                    style={[
                      styles.pickerOption,
                      formData.kategori === kategori.value && styles.pickerOptionSelected
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, kategori: kategori.value }));
                      setShowKategoriPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.kategori === kategori.value && styles.pickerOptionTextSelected
                    ]}>
                      {kategori.label}
                    </Text>
                    {formData.kategori === kategori.value && (
                      <Ionicons name="checkmark" size={20} color="#007bff" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {modalMode === 'create' ? 'Tambah' : 'Edit'} Mata Pelajaran Custom
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Mata Pelajaran *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.nama_mata_pelajaran}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nama_mata_pelajaran: text }))}
              placeholder="Masukkan nama mata pelajaran"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Kode Mata Pelajaran *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.kode_mata_pelajaran}
              onChangeText={(text) => setFormData(prev => ({ ...prev, kode_mata_pelajaran: text }))}
              placeholder="Masukkan kode mata pelajaran"
            />
          </View>

          {renderKategoriDropdown()}

          {renderJenjangDropdown()}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Deskripsi</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={formData.deskripsi}
              onChangeText={(text) => setFormData(prev => ({ ...prev, deskripsi: text }))}
              placeholder="Masukkan deskripsi (opsional)"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.formLabel}>Global (Berlaku untuk semua cabang)</Text>
              <Switch
                value={formData.is_global}
                onValueChange={(value) => setFormData(prev => ({ ...prev, is_global: value }))}
                trackColor={{ false: '#ddd', true: '#007bff' }}
                thumbColor={formData.is_global ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isCreating || isUpdating}
            >
              {(isCreating || isUpdating) ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {modalMode === 'create' ? 'Tambah' : 'Perbarui'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const currentData = mataPelajaranData?.data || [];

  return (
    <View style={styles.container}>
      {/* Filter & Add Button */}
      <View style={styles.headerContainer}>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter Kategori:</Text>
          <TouchableOpacity
            style={[styles.filterButton, !selectedKategori && styles.filterButtonActive]}
            onPress={() => setSelectedKategori('')}
          >
            <Text style={[styles.filterButtonText, !selectedKategori && styles.filterButtonTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>
          {(dropdownData?.data?.kategori_mata_pelajaran || [
            { value: 'wajib', label: 'Wajib' },
            { value: 'pilihan', label: 'Pilihan' },
            { value: 'muatan_lokal', label: 'Muatan Lokal' },
            { value: 'pengembangan_diri', label: 'Pengembangan Diri' }
          ]).map((kategori) => (
            <TouchableOpacity
              key={kategori.value}
              style={[
                styles.filterButton,
                selectedKategori === kategori.value && styles.filterButtonActive
              ]}
              onPress={() => setSelectedKategori(kategori.value)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedKategori === kategori.value && styles.filterButtonTextActive
              ]}>
                {kategori.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderMataPelajaranCard}
          keyExtractor={(item) => item.id_mata_pelajaran.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh || refetch}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada mata pelajaran custom</Text>
              <TouchableOpacity style={styles.emptyAddButton} onPress={handleCreate}>
                <Text style={styles.emptyAddButtonText}>Tambah Sekarang</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  addButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
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
  listContainer: {
    padding: 16,
  },
  itemCard: {
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
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  globalBadge: {
    backgroundColor: '#28a745',
  },
  wajibBadge: {
    backgroundColor: '#dc3545',
  },
  pilihanBadge: {
    backgroundColor: '#ffc107',
  },
  muatanLokalBadge: {
    backgroundColor: '#17a2b8',
  },
  pengembanganDiriBadge: {
    backgroundColor: '#6f42c1',
  },
  customBadge: {
    backgroundColor: '#007bff',
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    marginBottom: 16,
  },
  emptyAddButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  emptyAddButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
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
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  pickerOptionActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  pickerOptionTextActive: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
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
    backgroundColor: '#007bff',
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
  
  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  
  // Modal overlay and picker styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 400,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pickerOptions: {
    maxHeight: 300,
  },
  pickerOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  pickerOptionTextSelected: {
    color: '#007bff',
    fontWeight: '600',
  },
});

export default MataPelajaranCustomTab;