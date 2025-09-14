import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import TextInput from '../../../../common/components/TextInput';
import PickerInput from '../../../../common/components/PickerInput';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import FileUploadInput from '../../components/template/FileUploadInput';

import {
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  setFormData,
  resetFormData,
  setFormMode,
  setUploadProgress,
  selectFormData,
  selectFormMode,
  selectTemplateLoading,
  selectTemplateError,
  selectUploadProgress
} from '../../redux/templateSlice';

const TemplateMateriFormScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();

  // Route params
  const {
    mode, // create, edit, duplicate
    template = null,
    jenjang, jenjangId, jenjangName,
    kelas, kelasId, kelasName,
    mataPelajaran, mataPelajaranId, mataPelajaranName
  } = route.params;

  // Redux state
  const formData = useSelector(selectFormData);
  const formMode = useSelector(selectFormMode);
  const loading = useSelector(selectTemplateLoading);
  const error = useSelector(selectTemplateError);
  const uploadProgress = useSelector(selectUploadProgress);

  // Local state untuk validation
  const [validationErrors, setValidationErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form saat component mount
  useEffect(() => {
    dispatch(setFormMode(mode));
    
    if (mode === 'edit' && template) {
      // Populate form untuk edit mode
      dispatch(setFormData({
        id_mata_pelajaran: template.id_mata_pelajaran,
        id_kelas: template.id_kelas,
        nama_template: template.nama_template,
        deskripsi: template.deskripsi || '',
        kategori: template.kategori || '',
        urutan: template.urutan || 1,
        version: template.version || '1.0',
        metadata: template.metadata || {}
      }));
    } else if (mode === 'duplicate' && template) {
      // Populate form untuk duplicate mode
      dispatch(setFormData({
        id_mata_pelajaran: template.id_mata_pelajaran,
        id_kelas: template.id_kelas,
        nama_template: `${template.nama_template} (Copy)`,
        deskripsi: template.deskripsi || '',
        kategori: template.kategori || '',
        urutan: template.urutan || 1,
        version: '1.0', // Reset version untuk duplicate
        metadata: template.metadata || {}
      }));
    } else {
      // Initialize untuk create mode
      dispatch(setFormData({
        id_mata_pelajaran: mataPelajaranId,
        id_kelas: kelasId,
        nama_template: '',
        deskripsi: '',
        kategori: '',
        urutan: 1,
        version: '1.0',
        file: null,
        metadata: {}
      }));
    }

    return () => {
      // Cleanup saat component unmount
      dispatch(resetFormData());
    };
  }, [mode, template, mataPelajaranId, kelasId, dispatch]);

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.nama_template.trim()) {
      errors.nama_template = 'Nama template wajib diisi';
    } else if (formData.nama_template.length < 3) {
      errors.nama_template = 'Nama template minimal 3 karakter';
    }

    if (!formData.kategori) {
      errors.kategori = 'Kategori wajib dipilih';
    }

    if (formData.urutan < 1) {
      errors.urutan = 'Urutan minimal 1';
    }

    if (!formData.version.trim()) {
      errors.version = 'Version wajib diisi';
    }

    // File validation untuk create dan duplicate mode
    if ((mode === 'create' || mode === 'duplicate') && !formData.file) {
      errors.file = 'File template wajib diupload';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Event handlers
  const handleInputChange = (field, value) => {
    dispatch(setFormData({ [field]: value }));
    setIsDirty(true);
    
    // Clear validation error saat user mengisi
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileSelect = (file) => {
    dispatch(setFormData({ file }));
    setIsDirty(true);
    
    // Clear file validation error
    if (validationErrors.file) {
      setValidationErrors(prev => ({ ...prev, file: undefined }));
    }
  };

  const handleFileRemove = () => {
    dispatch(setFormData({ file: null }));
    setIsDirty(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validasi Error', 'Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      // Prepare FormData untuk file upload
      const submitData = new FormData();
      
      // Add text fields
      submitData.append('id_mata_pelajaran', formData.id_mata_pelajaran);
      submitData.append('id_kelas', formData.id_kelas);
      submitData.append('nama_template', formData.nama_template.trim());
      submitData.append('deskripsi', formData.deskripsi.trim());
      submitData.append('kategori', formData.kategori);
      submitData.append('urutan', formData.urutan.toString());
      submitData.append('version', formData.version.trim());
      
      // Add metadata if exists
      if (formData.metadata && Object.keys(formData.metadata).length > 0) {
        submitData.append('metadata', JSON.stringify(formData.metadata));
      }

      // Add file if exists
      if (formData.file) {
        submitData.append('file', {
          uri: formData.file.uri,
          type: formData.file.mimeType || formData.file.type,
          name: formData.file.name
        });
      }

      let result;
      
      if (mode === 'edit') {
        result = await dispatch(updateTemplate({
          templateId: template.id_template_materi,
          formData: submitData
        })).unwrap();
        
        Alert.alert('Sukses', 'Template berhasil diperbarui', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else if (mode === 'duplicate') {
        result = await dispatch(duplicateTemplate({
          templateId: template.id_template_materi,
          duplicateData: {
            nama_template: formData.nama_template.trim(),
            deskripsi: formData.deskripsi.trim(),
            kategori: formData.kategori,
            urutan: formData.urutan,
            version: formData.version.trim(),
            file: formData.file
          }
        })).unwrap();
        
        Alert.alert('Sukses', 'Template berhasil diduplikasi', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        result = await dispatch(createTemplate(submitData)).unwrap();
        
        Alert.alert('Sukses', 'Template berhasil dibuat', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }

    } catch (err) {
      console.error('Error submitting form:', err);
      Alert.alert('Error', err || 'Gagal menyimpan template');
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        'Batalkan Perubahan',
        'Perubahan yang belum disimpan akan hilang. Lanjutkan?',
        [
          { text: 'Tetap Edit', style: 'cancel' },
          { text: 'Batalkan', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Get title berdasarkan mode
  const getTitle = () => {
    switch (mode) {
      case 'edit': return 'Edit Template';
      case 'duplicate': return 'Duplikasi Template';
      default: return 'Buat Template Baru';
    }
  };

  // Kategori options
  const kategoriOptions = [
    { label: 'Pilih Kategori', value: '' },
    { label: 'Materi Pembelajaran', value: 'materi' },
    { label: 'Latihan Soal', value: 'latihan' },
    { label: 'Evaluasi', value: 'evaluasi' }
  ];

  const isSubmitting = loading.create || loading.update || loading.duplicate;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <Text style={styles.headerSubtitle}>
            {mataPelajaranName} - {kelasName}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <Ionicons name="checkmark" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Dasar</Text>
            
            <TextInput
              label="Nama Template"
              value={formData.nama_template}
              onChangeText={(value) => handleInputChange('nama_template', value)}
              placeholder="Masukkan nama template"
              error={validationErrors.nama_template}
              required
              maxLength={255}
            />

            <TextInput
              label="Deskripsi"
              value={formData.deskripsi}
              onChangeText={(value) => handleInputChange('deskripsi', value)}
              placeholder="Masukkan deskripsi template (opsional)"
              multiline
              numberOfLines={3}
              maxLength={1000}
            />

            <PickerInput
              label="Kategori"
              value={formData.kategori}
              onValueChange={(value) => handleInputChange('kategori', value)}
              items={kategoriOptions}
              error={validationErrors.kategori}
              required
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <TextInput
                  label="Urutan"
                  value={formData.urutan?.toString()}
                  onChangeText={(value) => handleInputChange('urutan', parseInt(value) || 1)}
                  placeholder="1"
                  keyboardType="numeric"
                  error={validationErrors.urutan}
                  required
                />
              </View>
              <View style={styles.rowItem}>
                <TextInput
                  label="Version"
                  value={formData.version}
                  onChangeText={(value) => handleInputChange('version', value)}
                  placeholder="1.0"
                  error={validationErrors.version}
                  required
                />
              </View>
            </View>
          </View>

          {/* File Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>File Template</Text>
            
            <FileUploadInput
              label="Upload File"
              value={formData.file}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              placeholder="Pilih file template untuk diupload"
              allowedTypes={[
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.ms-powerpoint'
              ]}
              maxSizeInMB={10}
              required={mode === 'create' || mode === 'duplicate'}
              error={validationErrors.file}
              uploadProgress={uploadProgress}
              isUploading={isSubmitting}
            />

            {mode === 'edit' && template?.file_name && !formData.file && (
              <View style={styles.currentFileInfo}>
                <View style={styles.currentFileHeader}>
                  <Ionicons name="document" size={20} color="#3498db" />
                  <Text style={styles.currentFileLabel}>File Saat Ini:</Text>
                </View>
                <Text style={styles.currentFileName}>{template.file_name}</Text>
                <Text style={styles.currentFileNote}>
                  Upload file baru untuk mengganti file yang ada
                </Text>
              </View>
            )}
          </View>

          {/* Context Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Konteks</Text>
            
            <View style={styles.contextInfo}>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>Jenjang:</Text>
                <Text style={styles.contextValue}>{jenjangName}</Text>
              </View>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>Kelas:</Text>
                <Text style={styles.contextValue}>{kelasName}</Text>
              </View>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>Mata Pelajaran:</Text>
                <Text style={styles.contextValue}>{mataPelajaranName}</Text>
              </View>
            </View>
          </View>

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>
                {mode === 'edit' ? 'Memperbarui' : 'Mengupload'} template...
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          )}

          {/* Error Messages */}
          {error.create && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#e74c3c" />
              <Text style={styles.errorText}>{error.create}</Text>
            </View>
          )}
          {error.update && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#e74c3c" />
              <Text style={styles.errorText}>{error.update}</Text>
            </View>
          )}
          {error.duplicate && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#e74c3c" />
              <Text style={styles.errorText}>{error.duplicate}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.submitButtonContent}>
              <LoadingSpinner size="small" color="white" />
              <Text style={styles.submitButtonText}>
                {mode === 'edit' ? 'Memperbarui...' : 'Menyimpan...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'edit' ? 'Perbarui Template' : 'Simpan Template'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27ae60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  rowItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  currentFileInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  currentFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentFileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginLeft: 8,
  },
  currentFileName: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 4,
    marginLeft: 28,
  },
  currentFileNote: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginLeft: 28,
  },
  contextInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  contextItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  contextValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  progressSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginLeft: 8,
    flex: 1,
  },
  submitContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  submitButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TemplateMateriFormScreen;