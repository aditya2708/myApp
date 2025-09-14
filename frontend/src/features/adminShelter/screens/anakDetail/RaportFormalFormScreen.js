import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { adminShelterRaportFormalApi } from '../../api/adminShelterRaportFormalApi';

const RaportFormalFormScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { anakData, anakId, raportId, raportData, isEdit } = route.params || {};
  
  const [formData, setFormData] = useState({
    nama_sekolah: '',
    tingkat_sekolah: '',
    kelas: '',
    jurusan: '',
    semester: '',
    tahun_ajaran: ''
  });
  
  const [files, setFiles] = useState({
    file_raport: null,
    file_transkrip: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tingkatSekolahOptions = ['SD', 'SMP', 'SMA', 'SMK'];
  const semesterOptions = ['ganjil', 'genap'];

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Raport Formal' : 'Tambah Raport Formal'
    });

    if (isEdit && raportData) {
      setFormData({
        nama_sekolah: raportData.nama_sekolah || '',
        tingkat_sekolah: raportData.tingkat_sekolah || '',
        kelas: raportData.kelas || '',
        jurusan: raportData.jurusan || '',
        semester: raportData.semester || '',
        tahun_ajaran: raportData.tahun_ajaran || ''
      });
    }
  }, [isEdit, raportData, navigation]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'tingkat_sekolah' && !['SMA', 'SMK'].includes(value)) {
      setFormData(prev => ({
        ...prev,
        jurusan: ''
      }));
    }
  };

  const pickFile = async (fileType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFiles(prev => ({
          ...prev,
          [fileType]: file
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih file');
    }
  };

  const removeFile = (fileType) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: null
    }));
  };

  const validateForm = () => {
    const required = ['nama_sekolah', 'tingkat_sekolah', 'kelas', 'semester', 'tahun_ajaran'];
    
    for (const field of required) {
      if (!formData[field].trim()) {
        setError(`${field.replace('_', ' ')} harus diisi`);
        return false;
      }
    }

    if (['SMA', 'SMK'].includes(formData.tingkat_sekolah) && !formData.jurusan.trim()) {
      setError('Jurusan harus diisi untuk SMA/SMK');
      return false;
    }

    if (!isEdit) {
      if (!files.file_raport) {
        setError('File raport harus diupload');
        return false;
      }
      if (!files.file_transkrip) {
        setError('File transkrip harus diupload');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      if (files.file_raport) {
        submitData.append('file_raport', {
          uri: files.file_raport.uri,
          type: files.file_raport.mimeType,
          name: files.file_raport.name
        });
      }

      if (files.file_transkrip) {
        submitData.append('file_transkrip', {
          uri: files.file_transkrip.uri,
          type: files.file_transkrip.mimeType,
          name: files.file_transkrip.name
        });
      }

      let response;
      if (isEdit) {
        response = await adminShelterRaportFormalApi.updateRaportFormal(anakId, raportId, submitData);
      } else {
        response = await adminShelterRaportFormalApi.createRaportFormal(anakId, submitData);
      }

      if (response.data.success) {
        Alert.alert(
          'Sukses',
          `Raport formal berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        setError(response.data.message || 'Gagal menyimpan raport formal');
      }
    } catch (err) {
      console.error('Error submitting raport formal:', err);
      setError('Gagal menyimpan raport formal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const renderFileUpload = (fileType, label) => {
    const file = files[fileType];
    
    return (
      <View style={styles.fileUploadContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        
        {file ? (
          <View style={styles.selectedFile}>
            <View style={styles.fileInfo}>
              <Ionicons name="document-outline" size={24} color="#e74c3c" />
              <Text style={styles.fileName}>{file.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeFileButton}
              onPress={() => removeFile(fileType)}
            >
              <Ionicons name="close-circle" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.filePickerButton}
            onPress={() => pickFile(fileType)}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#3498db" />
            <Text style={styles.filePickerText}>Pilih File</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderDropdown = (field, options, placeholder) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{placeholder}</Text>
        <View style={styles.dropdownContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.dropdownOption,
                formData[field] === option && styles.selectedOption
              ]}
              onPress={() => handleInputChange(field, option)}
            >
              <Text style={[
                styles.dropdownOptionText,
                formData[field] === option && styles.selectedOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message={`${isEdit ? 'Memperbarui' : 'Menambahkan'} raport formal...`} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View style={styles.headerImageContainer}>
            {anakData?.foto_url ? (
              <Image
                source={{ uri: anakData.foto_url }}
                style={styles.headerImage}
              />
            ) : (
              <View style={styles.headerImagePlaceholder}>
                <Ionicons name="person" size={30} color="#ffffff" />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{anakData?.full_name || 'Nama Anak'}</Text>
            {anakData?.nick_name && (
              <Text style={styles.headerNickname}>{anakData.nick_name}</Text>
            )}
          </View>
        </View>

        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => setError(null)}
          />
        )}

        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nama Sekolah</Text>
            <TextInput
              style={styles.textInput}
              value={formData.nama_sekolah}
              onChangeText={(value) => handleInputChange('nama_sekolah', value)}
              placeholder="Masukkan nama sekolah"
              placeholderTextColor="#999999"
            />
          </View>

          {renderDropdown('tingkat_sekolah', tingkatSekolahOptions, 'Tingkat Sekolah')}

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Kelas</Text>
            <TextInput
              style={styles.textInput}
              value={formData.kelas}
              onChangeText={(value) => handleInputChange('kelas', value)}
              placeholder="Contoh: 1, 2, 3"
              placeholderTextColor="#999999"
            />
          </View>

          {['SMA', 'SMK'].includes(formData.tingkat_sekolah) && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Jurusan</Text>
              <TextInput
                style={styles.textInput}
                value={formData.jurusan}
                onChangeText={(value) => handleInputChange('jurusan', value)}
                placeholder="Masukkan jurusan"
                placeholderTextColor="#999999"
              />
            </View>
          )}

          {renderDropdown('semester', semesterOptions, 'Semester')}

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Tahun Ajaran</Text>
            <TextInput
              style={styles.textInput}
              value={formData.tahun_ajaran}
              onChangeText={(value) => handleInputChange('tahun_ajaran', value)}
              placeholder="Contoh: 2023/2024"
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.filesSection}>
            <Text style={styles.sectionTitle}>Upload Dokumen</Text>
            <Text style={styles.sectionSubtitle}>
              Upload file scan raport dan transkrip nilai (PDF/Gambar, max 5MB)
            </Text>
            
            {renderFileUpload('file_raport', 'File Raport')}
            {renderFileUpload('file_transkrip', 'File Transkrip')}
          </View>

          <Button
            title={isEdit ? 'Perbarui Raport' : 'Simpan Raport'}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
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
  headerContainer: {
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
  headerImageContainer: {
    marginRight: 16,
  },
  headerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerNickname: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#ffffff',
  },
  dropdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dddddd',
    backgroundColor: '#ffffff',
  },
  selectedOption: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  filesSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  fileUploadContainer: {
    marginBottom: 16,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f8fbff',
  },
  filePickerText: {
    fontSize: 16,
    color: '#3498db',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
    flex: 1,
  },
  removeFileButton: {
    padding: 4,
  },
  submitButton: {
    marginTop: 24,
  },
});

export default RaportFormalFormScreen;