import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import TextInput from '../../../common/components/TextInput';
import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminCabangDonaturApi } from '../api/adminCabangDonaturApi';

const AdminCabangDonaturFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { donaturId } = route.params || {};
  const isEdit = !!donaturId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    wilbins: [],
    shelters: [],
    banks: [],
    diperuntukan_options: []
  });
  const [availableShelters, setAvailableShelters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    options: [],
    selectedValue: '',
    onSelect: null
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nama_lengkap: '',
    alamat: '',
    no_hp: '',
    id_wilbin: '',
    id_shelter: '',
    id_bank: '',
    no_rekening: '',
    diperuntukan: '',
    foto: null
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Enhanced form validation hook
  
  // Create refs for key form fields
  const emailRef = useRef('email');
  const passwordRef = useRef('password');
  const namaLengkapRef = useRef('nama_lengkap');
  const noHandphoneRef = useRef('no_handphone');

  useEffect(() => {
    fetchFilterOptions();
    if (isEdit) {
      fetchDonaturDetail();
    }
  }, [isEdit, donaturId]);

  useEffect(() => {
    if (formData.id_wilbin) {
      fetchSheltersByWilbin(formData.id_wilbin);
    } else {
      setAvailableShelters([]);
      setFormData(prev => ({ ...prev, id_shelter: '' }));
    }
  }, [formData.id_wilbin]);

  const fetchFilterOptions = async () => {
    try {
      const response = await adminCabangDonaturApi.getFilterOptions();
      setFilterOptions(response.data.data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchSheltersByWilbin = async (wilbinId) => {
    try {
      const response = await adminCabangDonaturApi.getSheltersByWilbin(wilbinId);
      setAvailableShelters(response.data.data);
    } catch (err) {
      console.error('Error fetching shelters:', err);
      setAvailableShelters([]);
    }
  };

  const fetchDonaturDetail = async () => {
    try {
      setError(null);
      const response = await adminCabangDonaturApi.getDonaturDetail(donaturId);
      const donatur = response.data.data;
      
      setFormData({
        email: donatur.user?.email || '',
        password: '',
        nama_lengkap: donatur.nama_lengkap || '',
        alamat: donatur.alamat || '',
        no_hp: donatur.no_hp || '',
        id_wilbin: donatur.id_wilbin?.toString() || '',
        id_shelter: donatur.id_shelter?.toString() || '',
        id_bank: donatur.id_bank?.toString() || '',
        no_rekening: donatur.no_rekening || '',
        diperuntukan: donatur.diperuntukan || '',
        foto: donatur.foto ? `https://berbagipendidikan.org/storage/Donatur/${donatur.id_donatur}/${donatur.foto}` : null
      });
    } catch (err) {
      console.error('Error fetching donatur detail:', err);
      setError('Gagal memuat data donatur. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!isEdit && !formData.password.trim()) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.trim() && formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (!formData.nama_lengkap.trim()) {
      newErrors.nama_lengkap = 'Nama lengkap wajib diisi';
    }

    if (!formData.alamat.trim()) {
      newErrors.alamat = 'Alamat wajib diisi';
    }

    if (!formData.no_hp.trim()) {
      newErrors.no_hp = 'Nomor HP wajib diisi';
    }

    if (!formData.id_wilbin) {
      newErrors.id_wilbin = 'Wilayah binaan wajib dipilih';
    }

    if (!formData.id_shelter) {
      newErrors.id_shelter = 'Shelter wajib dipilih';
    }

    if (!formData.diperuntukan) {
      newErrors.diperuntukan = 'Diperuntukan wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validasi Gagal', 'Mohon periksa kembali data yang diisi');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'foto') {
          if (formData.foto && typeof formData.foto === 'object' && formData.foto.uri) {
            submitData.append('foto', {
              uri: formData.foto.uri,
              type: formData.foto.type,
              name: formData.foto.fileName || 'foto.jpg'
            });
          }
        } else if (formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      if (isEdit) {
        await adminCabangDonaturApi.updateDonatur(donaturId, submitData);
        Alert.alert('Sukses', 'Donatur berhasil diupdate', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await adminCabangDonaturApi.createDonatur(submitData);
        Alert.alert('Sukses', 'Donatur berhasil dibuat', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      console.error('Error saving donatur:', err);
      const errorMessage = err.response?.data?.message || 'Gagal menyimpan data donatur';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Akses galeri diperlukan untuk mengupload foto');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFormData(prev => ({
        ...prev,
        foto: {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || 'foto.jpg'
        }
      }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, foto: null }));
  };

  const openModal = (title, options, selectedValue, onSelect) => {
    setModalData({ title, options, selectedValue, onSelect });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData({ title: '', options: [], selectedValue: '', onSelect: null });
  };

  const selectOption = (value) => {
    if (modalData.onSelect) {
      modalData.onSelect(value);
    }
    closeModal();
  };

  const getDisplayValue = (options, value, keyField, labelField) => {
    if (!value) return null;
    const option = options.find(opt => 
      (opt[keyField] || opt.id_wilbin || opt.id_shelter || opt.id_bank)?.toString() === value?.toString()
    );
    return option ? (option[labelField] || option.nama_wilbin || option.nama_shelter || option.nama_bank) : 'Tidak ditemukan';
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data..." />;
  }

  const renderPhotoSection = () => (
    <View style={styles.photoSection}>
      <Text style={styles.label}>Foto Profil</Text>
      <View style={styles.photoContainer}>
        {formData.foto ? (
          <View style={styles.photoWrapper}>
            <Image
              source={{ uri: typeof formData.foto === 'string' ? formData.foto : formData.foto.uri }}
              style={styles.photo}
            />
            <TouchableOpacity style={styles.removePhotoButton} onPress={removeImage}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoPlaceholder} onPress={pickImage}>
            <Ionicons name="camera" size={32} color="#bdc3c7" />
            <Text style={styles.photoPlaceholderText}>Tap untuk pilih foto</Text>
          </TouchableOpacity>
        )}
        {formData.foto && (
          <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
            <Text style={styles.changePhotoText}>Ganti Foto</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderDropdown = (value, onSelect, options, placeholder, keyField = 'value', labelField = 'label') => (
    <TouchableOpacity
      style={styles.dropdown}
      onPress={() => {
        if (options.length === 0) {
          Alert.alert('Info', 'Tidak ada opsi tersedia');
          return;
        }
        openModal(`Pilih ${placeholder}`, options, value, onSelect);
      }}
    >
      <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
        {value ? getDisplayValue(options, value, keyField, labelField) : placeholder}
      </Text>
      <Ionicons name="chevron-down" size={20} color="#666" />
    </TouchableOpacity>
  );

  const renderSelectionModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalData.title}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={[{ isAll: true }, ...modalData.options]}
            keyExtractor={(item, index) => 
              item.isAll ? 'all' : 
              (item.id_wilbin || item.id_shelter || item.id_bank || item.value || index).toString()
            }
            renderItem={({ item }) => {
              if (item.isAll) {
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, modalData.selectedValue === '' && styles.selectedOption]}
                    onPress={() => selectOption('')}
                  >
                    <Text style={[styles.optionText, modalData.selectedValue === '' && styles.selectedOptionText]}>
                      Pilih {modalData.title}
                    </Text>
                    {modalData.selectedValue === '' && (
                      <Ionicons name="checkmark" size={20} color="#2ecc71" />
                    )}
                  </TouchableOpacity>
                );
              }

              const value = (item.id_wilbin || item.id_shelter || item.id_bank || item.value)?.toString();
              const label = item.label || item.nama_wilbin || item.nama_shelter || item.nama_bank;
              const isSelected = modalData.selectedValue === value;

              return (
                <TouchableOpacity
                  style={[styles.optionItem, isSelected && styles.selectedOption]}
                  onPress={() => selectOption(value)}
                >
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#2ecc71" />
                  )}
                </TouchableOpacity>
              );
            }}
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {error && <ErrorMessage message={error} />}

          {renderPhotoSection()}

          <Text style={styles.sectionTitle}>Data Akun</Text>
          <TextInput
            ref={emailRef}
            label="Email *"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="Masukkan email"
            keyboardType="email-address"
            autoCapitalize="none"
            // fieldStatus={getFieldStatus('email', formData.email)}
          />

          <TextInput
            ref={passwordRef}
            label={isEdit ? "Password (kosongkan jika tidak ingin mengubah)" : "Password *"}
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            placeholder={isEdit ? "Kosongkan jika tidak ingin mengubah" : "Masukkan password"}
            secureTextEntry={!showPassword}
            // fieldStatus={getFieldStatus('password', formData.password)}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
              </TouchableOpacity>
            }
          />

          <Text style={styles.sectionTitle}>Data Pribadi</Text>
          <TextInput
            ref={namaLengkapRef}
            label="Nama Lengkap *"
            value={formData.nama_lengkap}
            onChangeText={(text) => setFormData(prev => ({ ...prev, nama_lengkap: text }))}
            placeholder="Masukkan nama lengkap"
            // fieldStatus={getFieldStatus('nama_lengkap', formData.nama_lengkap)}
          />

          <TextInput
            label="Alamat *"
            value={formData.alamat}
            onChangeText={(text) => setFormData(prev => ({ ...prev, alamat: text }))}
            placeholder="Masukkan alamat lengkap"
            multiline={true}
            error={errors.alamat}
          />

          <TextInput
            ref={noHandphoneRef}
            label="Nomor HP *"
            value={formData.no_hp}
            onChangeText={(text) => setFormData(prev => ({ ...prev, no_hp: text }))}
            placeholder="Masukkan nomor HP"
            keyboardType="phone-pad"
            // fieldStatus={getFieldStatus('no_hp', formData.no_hp)}
          />

          <Text style={styles.sectionTitle}>Penempatan</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wilayah Binaan *</Text>
            {renderDropdown(
              formData.id_wilbin,
              (value) => setFormData(prev => ({ ...prev, id_wilbin: value })),
              filterOptions.wilbins,
              'Wilayah Binaan'
            )}
            {errors.id_wilbin && <Text style={styles.errorText}>{errors.id_wilbin}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shelter *</Text>
            {renderDropdown(
              formData.id_shelter,
              (value) => setFormData(prev => ({ ...prev, id_shelter: value })),
              availableShelters,
              formData.id_wilbin ? 'Shelter' : 'Pilih Wilayah Binaan terlebih dahulu'
            )}
            {errors.id_shelter && <Text style={styles.errorText}>{errors.id_shelter}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Diperuntukan *</Text>
            {renderDropdown(
              formData.diperuntukan,
              (value) => setFormData(prev => ({ ...prev, diperuntukan: value })),
              filterOptions.diperuntukan_options,
              'Diperuntukan'
            )}
            {errors.diperuntukan && <Text style={styles.errorText}>{errors.diperuntukan}</Text>}
          </View>

          <Text style={styles.sectionTitle}>Informasi Bank (Opsional)</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank</Text>
            {renderDropdown(
              formData.id_bank,
              (value) => setFormData(prev => ({ ...prev, id_bank: value })),
              filterOptions.banks,
              'Bank'
            )}
          </View>

          <TextInput
            label="Nomor Rekening"
            value={formData.no_rekening}
            onChangeText={(text) => setFormData(prev => ({ ...prev, no_rekening: text }))}
            placeholder="Masukkan nomor rekening"
            keyboardType="numeric"
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Batal"
              type="outline"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            />
            <Button
              title={isEdit ? "Update" : "Simpan"}
              onPress={handleSubmit}
              loading={saving}
              style={styles.submitButton}
            />
          </View>
        </View>
      </ScrollView>

      {renderSelectionModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2ecc71',
    paddingBottom: 8,
  },
  photoSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bdc3c7',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  changePhotoButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3498db',
    borderRadius: 6,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#9e9e9e',
  },
  errorText: {
    fontSize: 12,
    color: '#e53935',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#e8f5e8',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedOptionText: {
    color: '#2ecc71',
    fontWeight: '500',
  },
});

export default AdminCabangDonaturFormScreen;