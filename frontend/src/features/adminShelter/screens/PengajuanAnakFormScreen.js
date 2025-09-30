import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView,
  Platform, TouchableOpacity, Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';

import TextInput from '../../../common/components/TextInput';
import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminShelterPengajuanAnakApi } from '../api/adminShelterPengajuanAnakApi';

const PengajuanAnakFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { keluarga } = route.params || {};
  
  const [formData, setFormData] = useState({
    no_kk: keluarga?.no_kk || '', jenjang: '', kelas: '', nama_sekolah: '', 
    alamat_sekolah: '', jurusan: '', semester: '', nama_pt: '', alamat_pt: '', 
    nik_anak: '', anak_ke: '', dari_bersaudara: '', nick_name: '', full_name: '', 
    agama: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', 
    tinggal_bersama: '', hafalan: '', pelajaran_favorit: '', hobi: '', 
    prestasi: '', jarak_rumah: '', transportasi: '', foto: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  useEffect(() => {
    navigation.setOptions({ headerTitle: 'Tambah Anak Binaan' });
  }, [navigation]);
  
  const options = {
    religion: [
      { label: '-- Pilih Agama --', value: '' },
      { label: 'Islam', value: 'Islam' }, { label: 'Kristen', value: 'Kristen' },
      { label: 'Katolik', value: 'Katolik' }, { label: 'Hindu', value: 'Hindu' },
      { label: 'Buddha', value: 'Buddha' }, { label: 'Konghucu', value: 'Konghucu' },
    ],
    gender: [
      { label: '-- Pilih Jenis Kelamin --', value: '' },
      { label: 'Laki-laki', value: 'Laki-laki' }, { label: 'Perempuan', value: 'Perempuan' },
    ],
    livingWith: [
      { label: '-- Pilih Tinggal Bersama --', value: '' },
      { label: 'Ayah', value: 'Ayah' }, { label: 'Ibu', value: 'Ibu' }, { label: 'Wali', value: 'Wali' },
    ],
    hafalan: [
      { label: '-- Pilih Jenis Hafalan --', value: '' },
      { label: 'Tahfidz', value: 'Tahfidz' }, { label: 'Non-Tahfidz', value: 'Non-Tahfidz' },
    ],
    education: [
      { label: '-- Pilih Tingkat Pendidikan --', value: '' },
      { label: 'Belum Sekolah', value: 'belum_sd' }, { label: 'SD / Sederajat', value: 'sd' },
      { label: 'SMP / Sederajat', value: 'smp' }, { label: 'SMA / Sederajat', value: 'sma' },
      { label: 'Perguruan Tinggi', value: 'perguruan_tinggi' },
    ],
    transportation: [
      { label: '-- Pilih Transportasi --', value: '' },
      { label: 'Jalan Kaki', value: 'Jalan Kaki' }, { label: 'Sepeda', value: 'Sepeda' },
      { label: 'Sepeda Motor', value: 'Sepeda Motor' }, { label: 'Angkutan Umum', value: 'Angkutan Umum' },
      { label: 'Mobil', value: 'Mobil' }, { label: 'Lainnya', value: 'Lainnya' },
    ],
  };
  
  const getGradeOptions = () => {
    const grades = {
      sd: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'],
      smp: ['Kelas 7', 'Kelas 8', 'Kelas 9'],
      sma: ['Kelas 10', 'Kelas 11', 'Kelas 12'],
    };
    return [
      { label: '-- Pilih Kelas --', value: '' },
      ...(grades[formData.jenjang] || []).map(grade => ({ label: grade, value: grade }))
    ];
  };
  
  const smaMajorOptions = [
    { label: '-- Pilih Jurusan --', value: '' },
    { label: 'IPA', value: 'IPA' }, { label: 'IPS', value: 'IPS' },
    { label: 'Bahasa', value: 'Bahasa' }, { label: 'Agama', value: 'Agama' },
    { label: 'Kejuruan', value: 'Kejuruan' },
  ];
  
  const semesterOptions = [
    { label: '-- Pilih Semester --', value: '' },
    ...Array.from({ length: 9 }, (_, i) => ({
      label: i === 8 ? '> Semester 8' : `Semester ${i + 1}`,
      value: (i + 1).toString()
    }))
  ];
  
  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  
  const toggleDatePicker = () => setShowDatePicker(!showDatePicker);
  
  const handleDateChange = (event, selectedDate) => {
    toggleDatePicker();
    
    // Only update if user didn't cancel (selectedDate exists and event type is not dismissed)
    if (selectedDate && event.type !== 'dismissed') {
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      handleChange('tanggal_lahir', `${day}-${month}-${year}`);
    }
    // If user canceled (event.type === 'dismissed' or no selectedDate), do nothing
  };
  
  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin akses galeri diperlukan');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        handleChange('foto', result.assets[0]);
      }
    } catch (error) {
      console.error('Error memilih gambar:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };
  
  const validateForm = () => {
    if (!formData.jenjang) {
      Alert.alert('Informasi Kurang Lengkap', 'Silakan pilih tingkat pendidikan');
      return false;
    }
    
    const requiredFields = [
      'nik_anak', 'anak_ke', 'dari_bersaudara', 'nick_name', 'full_name',
      'agama', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
      'tinggal_bersama', 'hafalan', 'transportasi'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      Alert.alert('Informasi Kurang Lengkap', 'Silakan lengkapi semua field yang wajib diisi');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const formDataObj = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '' || (key === 'foto' && !value)) return;
        
        if (key === 'foto' && value) {
          const filename = value.uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formDataObj.append('foto', { uri: value.uri, type, name: filename });
        } else {
          formDataObj.append(key, value.toString());
        }
      });
      
      const response = await adminShelterPengajuanAnakApi.submitAnak(formDataObj);
      
      if (response.data.success) {
        Alert.alert(
          'Berhasil',
          'Anak berhasil ditambahkan ke keluarga',
          [{ text: 'OK', onPress: () => navigation.navigate('AnakManagement') }]
        );
      } else {
        setError(response.data.message || 'Gagal menambahkan anak');
      }
    } catch (err) {
      console.error('Error mengirim form:', err);
      
      if (err.response?.status === 422) {
        const validationErrors = err.response.data?.errors || {};
        const errorMessages = Object.values(validationErrors).flat().join('\n');
        setError(`Error Validasi:\n${errorMessages || err.response.data?.message}`);
      } else {
        setError(err.response?.data?.message || 'Gagal menambahkan anak');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderPicker = (label, value, options, field, required = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && '*'}</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={value} onValueChange={(val) => handleChange(field, val)} style={styles.picker}>
          {options.map((option, index) => (
            <Picker.Item key={index} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
  
  const renderInfoCard = () => (
    <View style={styles.familyInfoCard}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>No. KK:</Text>
        <Text style={styles.infoValue}>{keluarga?.no_kk || 'N/A'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Kepala Keluarga:</Text>
        <Text style={styles.infoValue}>{keluarga?.kepala_keluarga || 'N/A'}</Text>
      </View>
      {keluarga?.shelter && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Shelter:</Text>
          <Text style={styles.infoValue}>{keluarga.shelter.nama_shelter || 'N/A'}</Text>
        </View>
      )}
    </View>
  );
  
  if (loading) return <LoadingSpinner fullScreen message="Memuat formulir..." />;
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
        
        {/* Family Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Keluarga</Text>
          {renderInfoCard()}
        </View>
        
        {/* Education Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Pendidikan</Text>
          
          {renderPicker('Tingkat Pendidikan', formData.jenjang, options.education, 'jenjang', true)}
          
          {formData.jenjang && formData.jenjang !== 'belum_sd' && formData.jenjang !== 'perguruan_tinggi' && (
            <>
              {renderPicker('Kelas', formData.kelas, getGradeOptions(), 'kelas')}
              
              {formData.jenjang === 'sma' && 
                renderPicker('Jurusan', formData.jurusan, smaMajorOptions, 'jurusan')
              }
              
              <TextInput
                label="Nama Sekolah" value={formData.nama_sekolah}
                onChangeText={(value) => handleChange('nama_sekolah', value)}
                placeholder="Masukkan nama sekolah"
                leftIcon={<Ionicons name="school-outline" size={20} color="#777" />}
              />
              
              <TextInput
                label="Alamat Sekolah" value={formData.alamat_sekolah}
                onChangeText={(value) => handleChange('alamat_sekolah', value)}
                placeholder="Masukkan alamat sekolah" multiline
                inputProps={{ numberOfLines: 3 }}
              />
            </>
          )}
          
          {formData.jenjang === 'perguruan_tinggi' && (
            <>
              {renderPicker('Semester', formData.semester, semesterOptions, 'semester')}
              
              <TextInput
                label="Jurusan" value={formData.jurusan}
                onChangeText={(value) => handleChange('jurusan', value)}
                placeholder="Masukkan jurusan"
                leftIcon={<Ionicons name="book-outline" size={20} color="#777" />}
              />
              
              <TextInput
                label="Perguruan Tinggi" value={formData.nama_pt}
                onChangeText={(value) => handleChange('nama_pt', value)}
                placeholder="Masukkan nama perguruan tinggi"
                leftIcon={<Ionicons name="school-outline" size={20} color="#777" />}
              />
              
              <TextInput
                label="Alamat Perguruan Tinggi" value={formData.alamat_pt}
                onChangeText={(value) => handleChange('alamat_pt', value)}
                placeholder="Masukkan alamat perguruan tinggi"
                leftIcon={<Ionicons name="location-outline" size={20} color="#777" />}
                multiline inputProps={{ numberOfLines: 3 }}
              />
            </>
          )}
        </View>
        
        {/* Child Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Anak</Text>
          
          {/* Photo */}
          <View style={styles.photoContainer}>
            <Text style={styles.label}>Foto Anak</Text>
            <View style={styles.photoContent}>
              {formData.foto ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: formData.foto.uri }} style={styles.photoPreview} />
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={40} color="#ddd" />
                </View>
              )}
              
              <Button
                title={formData.foto ? "Ganti Foto" : "Pilih Foto"}
                onPress={handleSelectImage} type="outline" size="small"
                style={styles.photoButton}
                leftIcon={<Ionicons name="camera-outline" size={18} color="#3498db" />}
              />
            </View>
          </View>
          
          <TextInput
            label="NIK Anak*" value={formData.nik_anak}
            onChangeText={(value) => handleChange('nik_anak', value)}
            placeholder="Masukkan NIK"
            leftIcon={<Ionicons name="card-outline" size={20} color="#777" />}
            inputProps={{ maxLength: 16, keyboardType: 'numeric' }}
          />
          
          <TextInput
            label="Anak ke*" value={formData.anak_ke}
            onChangeText={(value) => handleChange('anak_ke', value)}
            placeholder="contoh: 2"
            leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
            inputProps={{ keyboardType: 'numeric' }}
          />
          
          <TextInput
            label="Dari berapa bersaudara*" value={formData.dari_bersaudara}
            onChangeText={(value) => handleChange('dari_bersaudara', value)}
            placeholder="contoh: 3"
            leftIcon={<Ionicons name="people-outline" size={20} color="#777" />}
            inputProps={{ keyboardType: 'numeric' }}
          />
          
          <TextInput
            label="Nama Panggilan*" value={formData.nick_name}
            onChangeText={(value) => handleChange('nick_name', value)}
            placeholder="Masukkan nama panggilan"
            leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
          />
          
          <TextInput
            label="Nama Lengkap*" value={formData.full_name}
            onChangeText={(value) => handleChange('full_name', value)}
            placeholder="Masukkan nama lengkap anak"
            leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
          />
          
          {renderPicker('Jenis Kelamin', formData.jenis_kelamin, options.gender, 'jenis_kelamin', true)}
          {renderPicker('Agama', formData.agama, options.religion, 'agama', true)}
          
          <TextInput
            label="Tempat Lahir*" value={formData.tempat_lahir}
            onChangeText={(value) => handleChange('tempat_lahir', value)}
            placeholder="Masukkan tempat lahir"
            leftIcon={<Ionicons name="location-outline" size={20} color="#777" />}
          />
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tanggal Lahir*</Text>
            <TouchableOpacity style={styles.dateInput} onPress={toggleDatePicker}>
              <Ionicons name="calendar-outline" size={20} color="#777" style={styles.dateIcon} />
              <Text style={styles.dateText}>
                {formData.tanggal_lahir || 'Pilih tanggal'}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={formData.tanggal_lahir ? new Date(formData.tanggal_lahir.split('-').reverse().join('-')) : new Date()}
                mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()}
              />
            )}
          </View>
          
          {renderPicker('Tinggal Bersama', formData.tinggal_bersama, options.livingWith, 'tinggal_bersama', true)}
        </View>
        
        {/* Program Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Program</Text>
          {renderPicker('Jenis Hafalan', formData.hafalan, options.hafalan, 'hafalan', true)}
        </View>
        
        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Tambahan</Text>
          
          <TextInput
            label="Pelajaran Favorit" value={formData.pelajaran_favorit}
            onChangeText={(value) => handleChange('pelajaran_favorit', value)}
            placeholder="Masukkan pelajaran favorit"
            leftIcon={<Ionicons name="book-outline" size={20} color="#777" />}
          />
          
          <TextInput
            label="Hobi" value={formData.hobi}
            onChangeText={(value) => handleChange('hobi', value)}
            placeholder="Masukkan hobi"
            leftIcon={<Ionicons name="happy-outline" size={20} color="#777" />}
          />
          
          <TextInput
            label="Prestasi" value={formData.prestasi}
            onChangeText={(value) => handleChange('prestasi', value)}
            placeholder="Masukkan prestasi"
            leftIcon={<Ionicons name="trophy-outline" size={20} color="#777" />}
          />
          
          <TextInput
            label="Jarak dari Rumah (km)" value={formData.jarak_rumah}
            onChangeText={(value) => handleChange('jarak_rumah', value)}
            placeholder="Masukkan jarak dalam km"
            leftIcon={<Ionicons name="navigate-outline" size={20} color="#777" />}
            inputProps={{ keyboardType: 'numeric' }}
          />
          
          {renderPicker('Transportasi', formData.transportasi, options.transportation, 'transportasi', true)}
        </View>
        
        {/* Form Actions */}
        <View style={styles.formActions}>
          <Button title="Batal" onPress={() => navigation.goBack()} type="outline" style={styles.actionButton} />
          <Button
            title="Simpan" onPress={handleSubmit} type="primary"
            loading={submitting} disabled={submitting} style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 16, paddingBottom: 32 },
  section: {
    backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8,
  },
  familyInfoCard: {
    backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#eee',
  },
  infoRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  infoLabel: { minWidth: 100, fontSize: 14, fontWeight: '500', color: '#666' },
  infoValue: { flex: 1, fontSize: 14, color: '#333' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 8, flexWrap: 'wrap' },
  pickerContainer: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 4,
    backgroundColor: '#fff', overflow: 'hidden',
  },
  picker: { height: 50 },
  dateInput: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: '#ddd', borderRadius: 4, paddingHorizontal: 12,
    paddingVertical: 12, backgroundColor: '#fff',
  },
  dateIcon: { marginRight: 8 },
  dateText: { fontSize: 16, color: '#333' },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  inputHalf: { flex: 1 },
  photoContainer: { marginBottom: 16 },
  photoContent: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  photoPreviewContainer: {
    width: 100, height: 100, borderRadius: 50, overflow: 'hidden',
    marginRight: 16, marginBottom: 8,
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
    borderColor: '#ddd', marginRight: 16, marginBottom: 8,
  },
  photoButton: { flex: 1, minWidth: 150 },
  formActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 16 },
  actionButton: { flex: 1 },
});

export default PengajuanAnakFormScreen;