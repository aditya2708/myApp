import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Import components
import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import PickerInput from '../../../common/components/PickerInput';
import ErrorMessage from '../../../common/components/ErrorMessage';
import LoadingSpinner from '../../../common/components/LoadingSpinner';

// Import Redux actions
import {
  createTutor,
  updateTutor,
  selectTutorActionStatus,
  selectTutorActionError
} from '../redux/tutorSlice';

const TutorFormScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  // Get tutor from route params or set to null
  const existingTutor = route.params?.tutor;
  const isEditMode = !!existingTutor;

  // Selectors for action status and error
  const createStatus = useSelector(state => selectTutorActionStatus(state, 'create'));
  const updateStatus = useSelector(state => selectTutorActionStatus(state, 'update'));
  const actionError = useSelector(state => 
    isEditMode 
      ? selectTutorActionError(state, 'update') 
      : selectTutorActionError(state, 'create')
  );

  // Initial form state
  const [formData, setFormData] = useState({
    nama: existingTutor?.nama || '',
    pendidikan: existingTutor?.pendidikan || '',
    alamat: existingTutor?.alamat || '',
    email: existingTutor?.email || '',
    no_hp: existingTutor?.no_hp || '',
    maple: existingTutor?.maple || '',
    jenis_tutor: existingTutor?.jenis_tutor || 'non_tahfidz',
  });

  // Photo state
  const [photo, setPhoto] = useState(
    existingTutor?.foto_url ? { uri: existingTutor.foto_url } : null
  );

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
        Alert.alert('Izin Dibutuhkan', 'Izin akses galeri diperlukan');
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
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Kesalahan', 'Gagal memilih foto');
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!formData.nama) {
      Alert.alert('Kesalahan', 'Nama tutor harus diisi');
      return;
    }
    
    if (!formData.email) {
      Alert.alert('Kesalahan', 'Email tutor harus diisi');
      return;
    }
    
    if (!formData.no_hp) {
      Alert.alert('Kesalahan', 'Nomor telepon tutor harus diisi');
      return;
    }
    
    if (!formData.jenis_tutor) {
      Alert.alert('Kesalahan', 'Jenis tutor harus dipilih');
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
    
    // Add photo if selected and it's not a URL (new photo)
    if (photo && !photo.uri.startsWith('http')) {
      const photoName = photo.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(photoName);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      submitData.append('foto', {
        uri: photo.uri,
        name: photoName,
        type
      });
    }
    
    // Dispatch create or update action
    if (isEditMode) {
      dispatch(updateTutor({ 
        id: existingTutor.id_tutor, 
        data: submitData 
      }))
        .unwrap()
        .then(() => {
          Alert.alert('Berhasil', 'Tutor berhasil diperbarui');
          navigation.goBack();
        })
        .catch((error) => {
          Alert.alert('Gagal', error || 'Gagal memperbarui tutor');
        });
    } else {
      dispatch(createTutor(submitData))
        .unwrap()
        .then(() => {
          Alert.alert('Berhasil', 'Tutor berhasil ditambahkan');
          navigation.goBack();
        })
        .catch((error) => {
          Alert.alert('Gagal', error || 'Gagal menambahkan tutor');
        });
    }
  };

  // Determine loading state
  const isLoading = createStatus === 'loading' || updateStatus === 'loading';

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Error Message */}
      {actionError && (
        <ErrorMessage
          message={actionError}
          style={styles.errorMessage}
        />
      )}

      {/* Nama */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nama Tutor *</Text>
        <TextInput
          value={formData.nama}
          onChangeText={(value) => handleChange('nama', value)}
          placeholder="Masukkan nama tutor"
        />
      </View>

      {/* Pendidikan */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Pendidikan</Text>
        <TextInput
          value={formData.pendidikan}
          onChangeText={(value) => handleChange('pendidikan', value)}
          placeholder="Masukkan pendidikan terakhir"
        />
      </View>

      {/* Alamat */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Alamat</Text>
        <TextInput
          value={formData.alamat}
          onChangeText={(value) => handleChange('alamat', value)}
          placeholder="Masukkan alamat"
          multiline
        />
      </View>

      {/* Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="Masukkan email"
          keyboardType="email-address"
        />
      </View>

      {/* Nomor Telepon */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nomor Telepon *</Text>
        <TextInput
          value={formData.no_hp}
          onChangeText={(value) => handleChange('no_hp', value)}
          placeholder="Masukkan nomor telepon"
          keyboardType="phone-pad"
        />
      </View>

      {/* Mata Pelajaran */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Mata Pelajaran</Text>
        <TextInput
          value={formData.maple}
          onChangeText={(value) => handleChange('maple', value)}
          placeholder="Masukkan mata pelajaran"
        />
      </View>

      {/* Jenis Tutor */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Jenis Tutor *</Text>
        <PickerInput
          value={formData.jenis_tutor}
          onValueChange={(value) => handleChange('jenis_tutor', value)}
          items={[
            { label: 'Tahfidz', value: 'tahfidz' },
            { label: 'Non Tahfidz', value: 'non_tahfidz' }
          ]}
          placeholder="Pilih jenis tutor"
        />
      </View>

      {/* Foto Tutor */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Foto Tutor</Text>
        <View style={styles.photoContainer}>
          {photo ? (
            <View style={styles.photoPreview}>
              <Image
                source={{ uri: photo.uri }}
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
          onPress={() => navigation.goBack()}
          type="outline"
          style={styles.cancelButton}
          disabled={isLoading}
        />
        <Button
          title={isEditMode ? "Simpan Perubahan" : "Tambah Tutor"}
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
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  errorMessage: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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

export default TutorFormScreen;