import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import TextInput from '../../../../common/components/TextInput';
import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

import { adminShelterRiwayatApi } from '../../api/adminShelterRiwayatApi';

const RiwayatFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { anakId, riwayatData, isEdit, anakData } = route.params;

  const [formData, setFormData] = useState({
    jenis_histori: '',
    nama_histori: '',
    di_opname: 'TIDAK',
    dirawat_id: '',
    tanggal: new Date()
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && riwayatData) {
      setFormData({
        jenis_histori: riwayatData.jenis_histori || '',
        nama_histori: riwayatData.nama_histori || '',
        di_opname: riwayatData.di_opname || 'TIDAK',
        dirawat_id: riwayatData.dirawat_id || '',
        tanggal: new Date(riwayatData.tanggal)
      });
      if (riwayatData.foto_url) {
        setSelectedImage({ uri: riwayatData.foto_url });
      }
    }
  }, [isEdit, riwayatData]);

  const diOpnameOptions = [
    { label: 'Tidak Dirawat', value: 'TIDAK' },
    { label: 'Dirawat', value: 'YA' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.jenis_histori.trim()) {
      newErrors.jenis_histori = 'Jenis histori wajib diisi';
    }

    if (!formData.nama_histori.trim()) {
      newErrors.nama_histori = 'Nama histori wajib diisi';
    }

    if (formData.di_opname === 'YA' && !formData.dirawat_id.trim()) {
      newErrors.dirawat_id = 'ID rawat wajib diisi jika dirawat';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'di_opname' && value === 'TIDAK') {
      setFormData(prev => ({
        ...prev,
        dirawat_id: ''
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        tanggal: selectedDate
      }));
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Izin akses galeri diperlukan');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = new FormData();
      submitData.append('jenis_histori', formData.jenis_histori);
      submitData.append('nama_histori', formData.nama_histori);
      submitData.append('di_opname', formData.di_opname);
      submitData.append('tanggal', formData.tanggal.toISOString().split('T')[0]);

      if (formData.di_opname === 'YA' && formData.dirawat_id) {
        submitData.append('dirawat_id', formData.dirawat_id);
      }

      if (selectedImage && selectedImage.uri && !selectedImage.uri.startsWith('http')) {
        submitData.append('foto', {
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: 'riwayat.jpg',
        });
      }

      let response;
      if (isEdit) {
        response = await adminShelterRiwayatApi.updateRiwayat(
          anakId,
          riwayatData.id_histori,
          submitData
        );
      } else {
        response = await adminShelterRiwayatApi.createRiwayat(anakId, submitData);
      }

      if (response.data.success) {
        Alert.alert(
          'Sukses',
          `Riwayat berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setError(response.data.message || 'Gagal menyimpan riwayat');
      }
    } catch (err) {
      console.error('Error submitting riwayat:', err);
      setError('Gagal menyimpan riwayat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Menyimpan riwayat..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEdit ? 'Edit Riwayat' : 'Tambah Riwayat'}
        </Text>
        <Text style={styles.subtitle}>
          {anakData?.full_name || anakData?.nick_name || 'Anak'}
        </Text>
      </View>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
          retryText="Tutup"
        />
      )}

      <View style={styles.form}>
        <TextInput
          label="Jenis Histori *"
          value={formData.jenis_histori}
          onChangeText={(value) => handleInputChange('jenis_histori', value)}
          placeholder="Contoh: Sakit, Operasi, dll"
          error={errors.jenis_histori}
        />

        <TextInput
          label="Nama Histori *"
          value={formData.nama_histori}
          onChangeText={(value) => handleInputChange('nama_histori', value)}
          placeholder="Contoh: Demam tinggi, Patah tulang, dll"
          error={errors.nama_histori}
          multiline
          numberOfLines={3}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Status Rawat *</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={formData.di_opname}
              onValueChange={(value) => handleInputChange('di_opname', value)}
            >
              <Picker.Item label="Tidak Dirawat" value="TIDAK" />
              <Picker.Item label="Dirawat" value="YA" />
            </Picker>
          </View>
        </View>

        {formData.di_opname === 'YA' && (
          <TextInput
            label="ID Rawat *"
            value={formData.dirawat_id}
            onChangeText={(value) => handleInputChange('dirawat_id', value)}
            placeholder="Contoh: RS001, HOSPITAL123, dll"
            error={errors.dirawat_id}
          />
        )}

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Tanggal *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {format(formData.tanggal, 'dd MMMM yyyy', { locale: id })}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.tanggal}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.photoSection}>
          <Text style={styles.photoLabel}>Foto</Text>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Ionicons name="camera-outline" size={40} color="#666" />
              <Text style={styles.imagePickerText}>Pilih Foto</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Batal"
            onPress={() => navigation.goBack()}
            type="secondary"
            style={styles.button}
          />
          <Button
            title={isEdit ? 'Perbarui' : 'Simpan'}
            onPress={handleSubmit}
            type="primary"
            style={styles.button}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#e74c3c',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#f8f8f8',
  },
  form: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  photoSection: {
    marginBottom: 24,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  imagePicker: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: 50,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 0.48,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default RiwayatFormScreen;