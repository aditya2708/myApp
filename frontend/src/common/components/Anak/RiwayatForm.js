import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Import components
import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import utils
import { formatDateToIndonesian } from '../../../common/utils/dateFormatter';

/**
 * Riwayat Form Component
 * Reusable form for adding and editing history records
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Function to call when form is submitted
 * @param {Function} props.onCancel - Function to call when form is cancelled
 * @param {boolean} props.isLoading - Whether the form is in loading state
 * @param {string} props.error - Error message to display
 * @param {boolean} props.isEdit - Whether the form is in edit mode
 */
const RiwayatForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  isEdit = false
}) => {
  // Form state
  const [formData, setFormData] = useState({
    jenis_histori: '',
    nama_histori: '',
    di_opname: 'TIDAK',
    dirawat_id: '',
    tanggal: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
    ...initialValues
  });
  
  const [photo, setPhoto] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Jenis Histori options
  const jenisHistoriOptions = [
    'Kesehatan',
    'Pendidikan', 
    'Keluarga',
    'Lainnya'
  ];

  // Initialize photo from initialValues if in edit mode
  useEffect(() => {
    if (isEdit && initialValues.foto_url) {
      setPhoto(initialValues.foto_url);
    }
  }, [isEdit, initialValues]);

  // Handle text input changes
  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Handle photo selection
  const handleSelectPhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Permission to access camera roll is required');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      alert('Failed to select photo');
    }
  };

  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      setFormData(prev => ({ ...prev, tanggal: formattedDate }));
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!formData.nama_histori) {
      alert('Nama riwayat harus diisi');
      return;
    }
    
    if (!formData.jenis_histori) {
      alert('Jenis riwayat harus diisi');
      return;
    }
    
    if (!formData.di_opname) {
      alert('Dirawat inap harus dipilih (Ya/Tidak)');
      return;
    }
    
    // Create FormData object
    const submitData = new FormData();
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        submitData.append(key, String(value));
      }
    });
    
    // Always add is_read field with value "0"
    submitData.append('is_read', "0");
    
    // Add photo if selected and it's not a URL (new photo)
    if (photo && !photo.startsWith('http')) {
      const photoName = photo.split('/').pop();
      const match = /\.(\w+)$/.exec(photoName);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      submitData.append('foto', {
        uri: photo,
        name: photoName,
        type
      });
    }
    
    // Submit form
    onSubmit(submitData);
  };

  return (
    <View style={styles.container}>
      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          style={styles.errorMessage}
        />
      )}
      
      {/* Nama Riwayat */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nama Riwayat *</Text>
        <TextInput
          value={formData.nama_histori}
          onChangeText={(value) => handleChange('nama_histori', value)}
          placeholder="Masukkan nama riwayat"
        />
      </View>
      
      {/* Jenis Riwayat */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Jenis Riwayat *</Text>
        <View style={styles.optionsContainer}>
          {jenisHistoriOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                formData.jenis_histori === option && styles.optionButtonActive
              ]}
              onPress={() => handleChange('jenis_histori', option)}
            >
              <Text style={[
                styles.optionButtonText,
                formData.jenis_histori === option && styles.optionButtonTextActive
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Dirawat Inap */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Dirawat Inap *</Text>
        <View style={styles.opnameButtons}>
          <TouchableOpacity
            style={[
              styles.opnameButton,
              formData.di_opname === 'YA' && styles.opnameButtonActive
            ]}
            onPress={() => handleChange('di_opname', 'YA')}
          >
            <Text style={[
              styles.opnameButtonText,
              formData.di_opname === 'YA' && styles.opnameButtonTextActive
            ]}>
              Ya
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.opnameButton,
              formData.di_opname === 'TIDAK' && styles.opnameButtonActive
            ]}
            onPress={() => handleChange('di_opname', 'TIDAK')}
          >
            <Text style={[
              styles.opnameButtonText,
              formData.di_opname === 'TIDAK' && styles.opnameButtonTextActive
            ]}>
              Tidak
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* ID yang Dirawat (jika di_opname = "YA") */}
      {formData.di_opname === 'YA' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>ID yang Dirawat</Text>
          <TextInput
            value={formData.dirawat_id}
            onChangeText={(value) => handleChange('dirawat_id', value)}
            placeholder="Masukkan ID yang dirawat"
            keyboardType="numeric"
          />
        </View>
      )}
      
      {/* Tanggal */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Tanggal</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {formData.tanggal ? formatDateToIndonesian(formData.tanggal) : 'Pilih Tanggal'}
          </Text>
          <Ionicons name="calendar-outline" size={24} color="#666" />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.tanggal)}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
      
      {/* Photo Upload */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Foto Riwayat</Text>
        <View style={styles.photoContainer}>
          {photo ? (
            <View style={styles.photoPreview}>
              <Image
                source={{ uri: photo }}
                style={styles.photoImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setPhoto(null)}
              >
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={handleSelectPhoto}
            >
              <Ionicons name="image-outline" size={40} color="#999" />
              <Text style={styles.photoPlaceholderText}>Tambah Foto</Text>
            </TouchableOpacity>
          )}
          
          {photo && (
            <Button
              title="Ganti Foto"
              onPress={handleSelectPhoto}
              type="outline"
              size="small"
              style={styles.changePhotoButton}
            />
          )}
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Batal"
          onPress={onCancel}
          type="outline"
          style={styles.cancelButton}
          disabled={isLoading}
        />
        <Button
          title={isEdit ? "Simpan Perubahan" : "Simpan Riwayat"}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorMessage: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e74c3c',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#e74c3c',
  },
  optionButtonText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  opnameButtons: {
    flexDirection: 'row',
  },
  opnameButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
    marginRight: 8,
  },
  opnameButtonActive: {
    backgroundColor: '#e74c3c',
  },
  opnameButtonText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
  },
  opnameButtonTextActive: {
    color: '#ffffff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#999',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  changePhotoButton: {
    width: 150,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
    marginLeft: 8,
  },
});

export default RiwayatForm;