import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetKelasCustomQuery,
  useCreateKelasCustomMutation,
  useUpdateKelasCustomMutation,
  useDeleteKelasCustomMutation,
  useGetMasterDataDropdownQuery,
} from '../../../api/kurikulumApi';

const DEFAULT_TINGKAT_RANGE = { min: 1, max: 12 };

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractRangeFromMetadata = (metadata = {}) => {
  if (!metadata || typeof metadata !== 'object') {
    return { min: null, max: null };
  }

  const rangeSource = [
    metadata.rentang_tingkat,
    metadata.tingkat_range,
    metadata.range_tingkat,
    metadata.tingkat,
  ].find((candidate) => candidate && typeof candidate === 'object');

  const min = [
    metadata.tingkat_min,
    metadata.tingkatMin,
    rangeSource?.min,
    rangeSource?.start,
    rangeSource?.from,
    rangeSource?.lowest,
  ]
    .map(parseNumber)
    .find((value) => value !== null);

  const max = [
    metadata.tingkat_max,
    metadata.tingkatMax,
    rangeSource?.max,
    rangeSource?.end,
    rangeSource?.to,
    rangeSource?.highest,
  ]
    .map(parseNumber)
    .find((value) => value !== null);

  return { min, max };
};

const getAllowedTingkat = (jenjang) => {
  if (!jenjang) {
    return {
      min: null,
      max: null,
      list: [],
    };
  }

  const { min, max } = extractRangeFromMetadata(jenjang.metadata || {});
  const finalMin = parseNumber(min) ?? DEFAULT_TINGKAT_RANGE.min;
  const finalMax = parseNumber(max) ?? DEFAULT_TINGKAT_RANGE.max;

  if (!Number.isFinite(finalMin) || !Number.isFinite(finalMax) || finalMin > finalMax) {
    return {
      min: DEFAULT_TINGKAT_RANGE.min,
      max: DEFAULT_TINGKAT_RANGE.max,
      list: Array.from(
        { length: DEFAULT_TINGKAT_RANGE.max - DEFAULT_TINGKAT_RANGE.min + 1 },
        (_, index) => DEFAULT_TINGKAT_RANGE.min + index
      ),
    };
  }

  const minInt = Math.ceil(finalMin);
  const maxInt = Math.floor(finalMax);

  if (minInt > maxInt) {
    return {
      min: DEFAULT_TINGKAT_RANGE.min,
      max: DEFAULT_TINGKAT_RANGE.max,
      list: Array.from(
        { length: DEFAULT_TINGKAT_RANGE.max - DEFAULT_TINGKAT_RANGE.min + 1 },
        (_, index) => DEFAULT_TINGKAT_RANGE.min + index
      ),
    };
  }

  return {
    min: minInt,
    max: maxInt,
    list: Array.from({ length: maxInt - minInt + 1 }, (_, index) => minInt + index),
  };
};

const KelasCustomTab = ({ refreshing, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedJenjang, setSelectedJenjang] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    id_jenjang: '',
    nama_kelas: '',
    tingkat: '',
    deskripsi: '',
    is_global: false,
    target_jenjang: [],
    kelas_gabungan: [],
  });

  // API hooks
  const { data: kelasData, isLoading, refetch } = useGetKelasCustomQuery({
    id_jenjang: selectedJenjang || undefined
  });
  const { data: dropdownData } = useGetMasterDataDropdownQuery();
  const [createKelas, { isLoading: isCreating }] = useCreateKelasCustomMutation();
  const [updateKelas, { isLoading: isUpdating }] = useUpdateKelasCustomMutation();
  const [deleteKelas] = useDeleteKelasCustomMutation();

  const jenjangOptions = useMemo(() => dropdownData?.data?.jenjang || [], [dropdownData]);
  const selectedJenjangOption = useMemo(
    () => jenjangOptions.find((jenjang) => jenjang.id_jenjang?.toString() === formData.id_jenjang),
    [jenjangOptions, formData.id_jenjang]
  );
  const allowedTingkat = useMemo(() => getAllowedTingkat(selectedJenjangOption), [selectedJenjangOption]);

  // Refresh when tab refreshing prop changes
  useEffect(() => {
    if (refreshing) {
      refetch();
    }
  }, [refreshing, refetch]);

  const resetForm = () => {
    setFormData({
      id_jenjang: '',
      nama_kelas: '',
      tingkat: '',
      deskripsi: '',
      is_global: false,
      target_jenjang: [],
      kelas_gabungan: [],
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
      id_jenjang: item.id_jenjang?.toString() || '',
      nama_kelas: item.nama_kelas || '',
      tingkat: item.tingkat?.toString() || '',
      deskripsi: item.deskripsi || '',
      is_global: item.is_global || false,
      target_jenjang: item.target_jenjang || [],
      kelas_gabungan: item.kelas_gabungan || [],
    });
    setModalMode('edit');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Hapus Kelas Custom',
      `Apakah Anda yakin ingin menghapus kelas "${item.nama_kelas}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteKelas(item.id_kelas).unwrap();
              Alert.alert('Sukses', 'Kelas custom berhasil dihapus');
              refetch();
            } catch (error) {
              Alert.alert('Error', error?.data?.message || 'Gagal menghapus kelas custom');
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.nama_kelas.trim()) {
      Alert.alert('Error', 'Nama kelas harus diisi');
      return;
    }

    if (!formData.id_jenjang) {
      Alert.alert('Error', 'Jenjang harus dipilih');
      return;
    }

    const tingkatNumber = formData.tingkat ? parseInt(formData.tingkat, 10) : null;
    if (tingkatNumber !== null) {
      if (Number.isNaN(tingkatNumber)) {
        Alert.alert('Error', 'Tingkat tidak valid');
        return;
      }

      if (allowedTingkat.min !== null && allowedTingkat.max !== null) {
        if (tingkatNumber < allowedTingkat.min || tingkatNumber > allowedTingkat.max) {
          const jenjangName = selectedJenjangOption?.nama_jenjang || 'jenjang ini';
          Alert.alert(
            'Error',
            `Tingkat harus berada dalam rentang ${allowedTingkat.min}-${allowedTingkat.max} untuk ${jenjangName}.`
          );
          return;
        }
      }
    }

    try {
      const submitData = {
        id_jenjang: parseInt(formData.id_jenjang),
        nama_kelas: formData.nama_kelas,
        tingkat: tingkatNumber,
        deskripsi: formData.deskripsi,
        is_global: formData.is_global,
        target_jenjang: formData.target_jenjang,
        kelas_gabungan: formData.kelas_gabungan,
      };

      if (modalMode === 'create') {
        await createKelas(submitData).unwrap();
        Alert.alert('Sukses', 'Kelas custom berhasil dibuat');
      } else {
        await updateKelas({ id: selectedItem.id_kelas, ...submitData }).unwrap();
        Alert.alert('Sukses', 'Kelas custom berhasil diperbarui');
      }
      
      setShowModal(false);
      refetch();
    } catch (error) {
      Alert.alert('Error', error?.data?.message || `Gagal ${modalMode === 'create' ? 'membuat' : 'memperbarui'} kelas custom`);
    }
  };

  const renderKelasCard = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.nama_kelas}</Text>
          <Text style={styles.itemSubtitle}>
            {item.jenjang?.nama_jenjang} • Tingkat: {item.tingkat || 'N/A'}
          </Text>
          <View style={styles.badgeContainer}>
            {item.is_global && (
              <View style={[styles.badge, styles.globalBadge]}>
                <Text style={styles.badgeText}>Global</Text>
              </View>
            )}
            <View style={[styles.badge, styles.customBadge]}>
              <Text style={styles.badgeText}>Custom</Text>
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

  const renderJenjangPicker = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Jenjang *</Text>
        <View style={styles.pickerContainer}>
          {jenjangOptions.map((jenjang) => (
            <TouchableOpacity
              key={jenjang.id_jenjang}
              style={[
                styles.pickerOption,
                formData.id_jenjang === jenjang.id_jenjang.toString() && styles.pickerOptionActive
              ]}
              onPress={() =>
                setFormData((prev) => ({
                  ...prev,
                  id_jenjang: jenjang.id_jenjang.toString(),
                }))
              }
            >
              <Text style={[
                styles.pickerOptionText,
                formData.id_jenjang === jenjang.id_jenjang.toString() && styles.pickerOptionTextActive
              ]}>
                {jenjang.nama_jenjang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (!formData.id_jenjang || !formData.tingkat) {
      return;
    }

    if (allowedTingkat.min === null || allowedTingkat.max === null) {
      return;
    }

    const numericTingkat = parseInt(formData.tingkat, 10);
    if (
      Number.isNaN(numericTingkat) ||
      numericTingkat < allowedTingkat.min ||
      numericTingkat > allowedTingkat.max
    ) {
      setFormData((prev) => ({
        ...prev,
        tingkat: '',
      }));
    }
  }, [formData.id_jenjang, formData.tingkat, allowedTingkat.min, allowedTingkat.max]);

  const renderTingkatPicker = () => {
    const hasRange =
      allowedTingkat.list.length > 0 &&
      allowedTingkat.min !== null &&
      allowedTingkat.max !== null;
    const min = hasRange ? allowedTingkat.min : DEFAULT_TINGKAT_RANGE.min;
    const max = hasRange ? allowedTingkat.max : DEFAULT_TINGKAT_RANGE.max;
    const jenjangName = selectedJenjangOption?.nama_jenjang;
    const placeholder = formData.id_jenjang
      ? hasRange
        ? `Pilih tingkat (${min}-${max})`
        : 'Rentang tingkat belum tersedia'
      : 'Pilih tingkat setelah memilih jenjang';

    return (
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Tingkat</Text>
        <Text style={styles.helperText}>
          {formData.id_jenjang
            ? hasRange
              ? `Rentang tingkat valid${jenjangName ? ` untuk ${jenjangName}` : ''}: ${min}-${max}`
              : `Rentang tingkat${jenjangName ? ` untuk ${jenjangName}` : ''} belum tersedia.`
            : 'Silakan pilih jenjang terlebih dahulu untuk melihat pilihan tingkat.'}
        </Text>
        {!formData.tingkat && (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
        <View style={[styles.pickerContainer, styles.tingkatPickerContainer]}>
          <TouchableOpacity
            style={[
              styles.pickerOption,
              formData.tingkat === '' && styles.pickerOptionActive,
            ]}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                tingkat: '',
              }))
            }
          >
            <Text
              style={[
                styles.pickerOptionText,
                formData.tingkat === '' && styles.pickerOptionTextActive,
              ]}
            >
              Kosong
            </Text>
          </TouchableOpacity>

          {hasRange &&
            allowedTingkat.list.map((tingkat) => (
              <TouchableOpacity
                key={tingkat}
                style={[
                  styles.pickerOption,
                  formData.tingkat === tingkat.toString() && styles.pickerOptionActive,
                ]}
                onPress={() =>
                  setFormData((prev) => ({
                    ...prev,
                    tingkat: tingkat.toString(),
                  }))
                }
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    formData.tingkat === tingkat.toString() && styles.pickerOptionTextActive,
                  ]}
                >
                  {tingkat}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
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
            {modalMode === 'create' ? 'Tambah' : 'Edit'} Kelas Custom
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          {renderJenjangPicker()}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Kelas *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.nama_kelas}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nama_kelas: text }))}
              placeholder="Masukkan nama kelas"
            />
          </View>

          {renderTingkatPicker()}

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
        </View>
      </View>
    </Modal>
  );

  const currentData = kelasData?.data || [];

  return (
    <View style={styles.container}>
      {/* Filter & Add Button */}
      <View style={styles.headerContainer}>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter Jenjang:</Text>
          <TouchableOpacity
            style={[styles.filterButton, !selectedJenjang && styles.filterButtonActive]}
            onPress={() => setSelectedJenjang('')}
          >
            <Text style={[styles.filterButtonText, !selectedJenjang && styles.filterButtonTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>
          {dropdownData?.data?.jenjang?.map((jenjang) => (
            <TouchableOpacity
              key={jenjang.id_jenjang}
              style={[
                styles.filterButton,
                selectedJenjang === jenjang.id_jenjang.toString() && styles.filterButtonActive
              ]}
              onPress={() => setSelectedJenjang(jenjang.id_jenjang.toString())}
            >
              <Text style={[
                styles.filterButtonText,
                selectedJenjang === jenjang.id_jenjang.toString() && styles.filterButtonTextActive
              ]}>
                {jenjang.nama_jenjang}
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
          renderItem={renderKelasCard}
          keyExtractor={(item) => item.id_kelas.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh || refetch}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada kelas custom</Text>
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
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: '#adb5bd',
    marginBottom: 8,
    fontStyle: 'italic',
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
  tingkatPickerContainer: {
    marginTop: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  pickerOptionActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
});

export default KelasCustomTab;