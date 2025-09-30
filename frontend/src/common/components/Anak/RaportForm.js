import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Import components
import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import utils
import { formatDateForApi, formatDateToIndonesian } from '../../../common/utils/dateFormatter';

/**
 * Raport Form Component
 * Reusable form for adding and editing raport
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Function to call when form is submitted
 * @param {Function} props.onCancel - Function to call when form is cancelled
 * @param {boolean} props.isLoading - Whether the form is in loading state
 * @param {string} props.error - Error message to display
 * @param {boolean} props.isEdit - Whether the form is in edit mode
 */
const RaportForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  isEdit = false
}) => {
  // Form state
  const [formData, setFormData] = useState({
    tingkat: '',
    kelas: '',
    nilai_min: '',
    nilai_max: '',
    nilai_rata_rata: '',
    semester: '',
    tanggal: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
    ...initialValues
  });

  // Photos state
  const [photos, setPhotos] = useState([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Tingkat options
  const tingkatOptions = [
    'TK',
    'SD',
    'SMP',
    'SMA',
    'SMK',
    'Perguruan Tinggi'
  ];

  // Semester options
  const semesterOptions = [
    'Semester 1',
    'Semester 2'
  ];

  // Initialize photos from initialValues if in edit mode
  useEffect(() => {
    if (isEdit && initialValues.foto_raport && initialValues.foto_raport.length > 0) {
      const initialPhotos = initialValues.foto_raport.map(photo => ({
        id: photo.id_foto,
        // uri: photo.foto_url,
        isExisting: true
      }));
      setPhotos(initialPhotos);
    }
  }, [isEdit, initialValues]);

  // Handle text input changes
  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Handle number input changes with validation
  const handleNumberChange = (key, value) => {
    if (value === '' || (!isNaN(value) && value >= 0)) {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  // Handle opening the image picker
  const handlePickImages = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access camera roll is required');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Add new photos to the state
        const newPhotos = result.assets.map(asset => ({
          uri: asset.uri,
          isExisting: false
        }));
        
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  // Handle removing a photo
  const handleRemovePhoto = (index) => {
    const photoToRemove = photos[index];
    
    if (photoToRemove.isExisting && photoToRemove.id) {
      // If it's an existing photo, add its ID to deletedPhotoIds
      setDeletedPhotoIds(prev => [...prev, photoToRemove.id]);
    }
    
    // Remove the photo from the photos array
    setPhotos(prev => prev.filter((_, i) => i !== index));
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
    if (!formData.tingkat) {
      Alert.alert('Error', 'Tingkat pendidikan harus diisi');
      return;
    }
    
    if (!formData.kelas) {
      Alert.alert('Error', 'Kelas harus diisi');
      return;
    }
    
    if (!formData.semester) {
      Alert.alert('Error', 'Semester harus diisi');
      return;
    }
    
    // Create FormData object for submission
    const submitData = new FormData();
    
    // Add form fields - ensure we only add non-empty values
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Convert numbers to strings
        submitData.append(key, String(value));
      }
    });
    
    // Log for debugging
    console.log('Form data being submitted:', Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => 
        value !== null && value !== undefined && value !== ''
      )
    ));
    
    // Add new photos
    if (photos.length > 0) {
      photos.filter(photo => !photo.isExisting).forEach((photo, index) => {
        try {
          const photoName = photo.uri.split('/').pop();
          const match = /\.(\w+)$/.exec(photoName);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          submitData.append(`foto_rapor[${index}]`, {
            uri: photo.uri,
            name: photoName,
            type
          });
          console.log(`Added photo: ${photoName}`);
        } catch (err) {
          console.error('Error adding photo to FormData:', err);
        }
      });
    }
    
    // Add deleted photo IDs if in edit mode
    if (isEdit && deletedPhotoIds.length > 0) {
      deletedPhotoIds.forEach((id, index) => {
        submitData.append(`hapus_foto[${index}]`, id);
      });
      console.log('Deleted photo IDs:', deletedPhotoIds);
    }
    
    // Call onSubmit with the FormData
    onSubmit(submitData);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          style={styles.errorMessage}
        />
      )}
      
      {/* Form Fields */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Tingkat Pendidikan *</Text>
        <View style={styles.buttonGroup}>
          {tingkatOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                formData.tingkat === option && styles.optionButtonActive
              ]}
              onPress={() => handleChange('tingkat', option)}
            >
              <Text style={[
                styles.optionButtonText,
                formData.tingkat === option && styles.optionButtonTextActive
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Kelas *</Text>
        <TextInput
          value={formData.kelas}
          onChangeText={(value) => handleChange('kelas', value)}
          placeholder="Masukkan kelas"
          style={styles.input}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Semester *</Text>
        <View style={styles.buttonGroup}>
          {semesterOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                formData.semester === option && styles.optionButtonActive
              ]}
              onPress={() => handleChange('semester', option)}
            >
              <Text style={[
                styles.optionButtonText,
                formData.semester === option && styles.optionButtonTextActive
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Tanggal Raport *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
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
      
      <View style={styles.scoresContainer}>
        <Text style={styles.label}>Nilai Raport</Text>
        
        <View style={styles.scoreInputRow}>
          <View style={styles.scoreInputGroup}>
            <Text style={styles.scoreLabel}>Nilai Minimum</Text>
            <TextInput
              value={formData.nilai_min}
              onChangeText={(value) => handleNumberChange('nilai_min', value)}
              placeholder="0"
              keyboardType="numeric"
              style={styles.scoreInput}
            />
          </View>
          
          <View style={styles.scoreInputGroup}>
            <Text style={styles.scoreLabel}>Nilai Rata-rata</Text>
            <TextInput
              value={formData.nilai_rata_rata}
              onChangeText={(value) => handleNumberChange('nilai_rata_rata', value)}
              placeholder="0"
              keyboardType="numeric"
              style={styles.scoreInput}
            />
          </View>
          
          <View style={styles.scoreInputGroup}>
            <Text style={styles.scoreLabel}>Nilai Maksimum</Text>
            <TextInput
              value={formData.nilai_max}
              onChangeText={(value) => handleNumberChange('nilai_max', value)}
              placeholder="0"
              keyboardType="numeric"
              style={styles.scoreInput}
            />
          </View>
        </View>
      </View>
      
      {/* Photo Upload Section */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Foto Raport</Text>
        
        <Button
          title="Tambah Foto Raport"
          onPress={handlePickImages}
          leftIcon={<Ionicons name="camera-outline" size={20} color="#fff" />}
          type="outline"
          style={styles.uploadButton}
        />
        
        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoThumbnail}
                />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {/* Form Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          title="Batal"
          onPress={onCancel}
          type="outline"
          style={styles.cancelButton}
          disabled={isLoading}
        />
        <Button
          title={isEdit ? "Simpan Perubahan" : "Simpan Raport"}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
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
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  scoresContainer: {
    marginBottom: 20,
  },
  scoreInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreInputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreInput: {
    textAlign: 'center',
  },
  uploadButton: {
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoItem: {
    width: 100,
    height: 100,
    margin: 4,
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
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

export default RaportForm;