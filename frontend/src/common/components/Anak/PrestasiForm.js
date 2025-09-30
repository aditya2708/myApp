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
 * Prestasi Form Component
 * Reusable form for adding and editing achievements
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Function to call when form is submitted
 * @param {Function} props.onCancel - Function to call when form is cancelled
 * @param {boolean} props.isLoading - Whether the form is in loading state
 * @param {string} props.error - Error message to display
 * @param {boolean} props.isEdit - Whether the form is in edit mode
 */
const PrestasiForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  isEdit = false
}) => {
  // Form state
  const [formData, setFormData] = useState({
    jenis_prestasi: '',
    level_prestasi: '',
    nama_prestasi: '',
    tgl_upload: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
    ...initialValues
  });
  
  const [photo, setPhoto] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Jenis Prestasi options
  const jenisPrestasiOptions = [
    'Akademik',
    'Non-Akademik',
    'Olahraga',
    'Seni',
    'Lainnya'
  ];

  // Level Prestasi options
  const levelPrestasiOptions = [
    'Kelas',
    'Sekolah',
    'Kecamatan',
    'Kabupaten/Kota',
    'Provinsi',
    'Nasional',
    'Internasional'
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      setFormData(prev => ({ ...prev, tgl_upload: formattedDate }));
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!formData.nama_prestasi) {
      alert('Nama prestasi harus diisi');
      return;
    }
    
    if (!formData.jenis_prestasi) {
      alert('Jenis prestasi harus diisi');
      return;
    }
    
    if (!formData.level_prestasi) {
      alert('Level prestasi harus diisi');
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
      
      {/* Nama Prestasi */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nama Prestasi *</Text>
        <TextInput
          value={formData.nama_prestasi}
          onChangeText={(value) => handleChange('nama_prestasi', value)}
          placeholder="Masukkan nama prestasi"
        />
      </View>
      
      {/* Jenis Prestasi */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Jenis Prestasi *</Text>
        <View style={styles.optionsContainer}>
          {jenisPrestasiOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                formData.jenis_prestasi === option && styles.optionButtonActive
              ]}
              onPress={() => handleChange('jenis_prestasi', option)}
            >
              <Text style={[
                styles.optionButtonText,
                formData.jenis_prestasi === option && styles.optionButtonTextActive
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Level Prestasi */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Level Prestasi *</Text>
        <View style={styles.optionsContainer}>
          {levelPrestasiOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                formData.level_prestasi === option && styles.optionButtonActive
              ]}
              onPress={() => handleChange('level_prestasi', option)}
            >
              <Text style={[
                styles.optionButtonText,
                formData.level_prestasi === option && styles.optionButtonTextActive
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Tanggal */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Tanggal</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {formData.tgl_upload ? formatDateToIndonesian(formData.tgl_upload) : 'Pilih Tanggal'}
          </Text>
          <Ionicons name="calendar-outline" size={24} color="#666" />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.tgl_upload)}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
      
      {/* Photo Upload */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Foto Prestasi</Text>
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
          title={isEdit ? "Simpan Perubahan" : "Simpan Prestasi"}
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

export default PrestasiForm;