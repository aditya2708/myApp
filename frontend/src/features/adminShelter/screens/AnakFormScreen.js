import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  TouchableOpacity,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import { format, isValid } from 'date-fns';
import parse from 'date-fns/parse';
import { id } from 'date-fns/locale';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import DatePicker from '../../../common/components/DatePicker';
import PickerInput from '../../../common/components/PickerInput';
import { adminShelterAnakApi } from '../api/adminShelterAnakApi';

const parseDateValue = (dateString) => {
  if (!dateString) return null;

  const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
  if (isValid(parsed)) {
    return parsed;
  }

  const fallback = new Date(dateString);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const AnakFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { anakData } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    nick_name: '',
    nik_anak: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    jenis_kelamin: 'Laki-laki',
    agama: 'Islam',
    anak_ke: '',
    dari_bersaudara: '',
    tinggal_bersama: 'Ayah',
    jenis_anak_binaan: 'BCPB',
    hafalan: 'Tahfidz',
    jenjang: '',
    kelas: '',
    nama_sekolah: '',
    alamat_sekolah: '',
    jurusan: '',
    semester: '',
    nama_pt: '',
    alamat_pt: '',
    pelajaran_favorit: '',
    hobi: '',
    prestasi: '',
    background_story: '',
    educational_goals: '',
    personality_traits: '',
    special_needs: '',
    marketplace_featured: false,
    foto: null
  });

  const [imageUri, setImageUri] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBirthDate, setSelectedBirthDate] = useState(
    () => parseDateValue(anakData?.tanggal_lahir) || null
  );

  const genderOptions = [
    { label: 'Laki-laki', value: 'Laki-laki' },
    { label: 'Perempuan', value: 'Perempuan' },
  ];

  const religionOptions = [
    { label: 'Islam', value: 'Islam' },
    { label: 'Kristen', value: 'Kristen' },
    { label: 'Budha', value: 'Budha' },
    { label: 'Hindu', value: 'Hindu' },
    { label: 'Konghucu', value: 'Konghucu' },
  ];

  const livingWithOptions = [
    { label: 'Ayah dan Ibu', value: 'Ayah dan Ibu' },
    { label: 'Ayah', value: 'Ayah' },
    { label: 'Ibu', value: 'Ibu' },
    { label: 'Wali', value: 'Wali' },
  ];

  const childTypeOptions = [
    { label: 'BCPB', value: 'BCPB' },
    { label: 'NPB', value: 'NPB' },
  ];

  const hafalanOptions = [
    { label: 'Tahfidz', value: 'Tahfidz' },
    { label: 'Non-Tahfidz', value: 'Non-Tahfidz' },
  ];

  const educationLevelOptions = [
    { label: 'Belum Sekolah', value: 'belum_sd' },
    { label: 'SD / Sederajat', value: 'sd' },
    { label: 'SMP / Sederajat', value: 'smp' },
    { label: 'SMA / Sederajat', value: 'sma' },
    { label: 'Perguruan Tinggi', value: 'perguruan_tinggi' },
  ];

  const getGradeOptions = () => {
    const grades = {
      sd: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'],
      smp: ['Kelas 7', 'Kelas 8', 'Kelas 9'],
      sma: ['Kelas 10', 'Kelas 11', 'Kelas 12'],
    };

    return (grades[formData.jenjang] || []).map(grade => ({
      label: grade,
      value: grade,
    }));
  };

  const smaMajorOptions = [
    { label: 'IPA', value: 'IPA' },
    { label: 'IPS', value: 'IPS' },
    { label: 'Bahasa', value: 'Bahasa' },
    { label: 'Agama', value: 'Agama' },
    { label: 'Kejuruan', value: 'Kejuruan' },
  ];

  const semesterOptions = Array.from({ length: 9 }, (_, index) => ({
    label: index === 8 ? '> Semester 8' : `Semester ${index + 1}`,
    value: (index + 1).toString(),
  }));

  useEffect(() => {
    if (anakData) {
      const pendidikan = anakData.anakPendidikan || {};
      setFormData({
        full_name: anakData.full_name || '',
        nick_name: anakData.nick_name || '',
        nik_anak: anakData.nik_anak || '',
        tempat_lahir: anakData.tempat_lahir || '',
        tanggal_lahir: anakData.tanggal_lahir || '',
        alamat: anakData.alamat || '',
        jenis_kelamin: anakData.jenis_kelamin || 'Laki-laki',
        agama: anakData.agama || 'Islam',
        anak_ke: anakData.anak_ke?.toString() || '',
        dari_bersaudara: anakData.dari_bersaudara?.toString() || '',
        tinggal_bersama: anakData.tinggal_bersama || 'Ayah',
        jenis_anak_binaan: anakData.jenis_anak_binaan || 'BCPB',
        hafalan: anakData.hafalan || 'Tahfidz',
        jenjang: pendidikan.jenjang || '',
        kelas: pendidikan.kelas || '',
        nama_sekolah: pendidikan.nama_sekolah || '',
        alamat_sekolah: pendidikan.alamat_sekolah || '',
        jurusan: pendidikan.jurusan || '',
        semester: pendidikan.semester?.toString() || '',
        nama_pt: pendidikan.nama_pt || '',
        alamat_pt: pendidikan.alamat_pt || '',
        pelajaran_favorit: anakData.pelajaran_favorit || '',
        hobi: anakData.hobi || '',
        prestasi: anakData.prestasi || '',
        background_story: anakData.background_story || '',
        educational_goals: anakData.educational_goals || '',
        personality_traits: Array.isArray(anakData.personality_traits) 
          ? anakData.personality_traits.join(', ') 
          : anakData.personality_traits || '',
        special_needs: anakData.special_needs || '',
        marketplace_featured:
          anakData.marketplace_featured === true ||
          anakData.marketplace_featured === 1 ||
          anakData.marketplace_featured === '1',
        foto: null
      });
      setImageUri(anakData.foto_url);
      setSelectedBirthDate(parseDateValue(anakData.tanggal_lahir) || null);
    }
  }, [anakData]);

  const updateField = (field, value) => {
    setFormData(prev => {
      if (field === 'jenjang') {
        return {
          ...prev,
          jenjang: value,
          kelas: '',
          nama_sekolah: '',
          alamat_sekolah: '',
          jurusan: '',
          semester: '',
          nama_pt: '',
          alamat_pt: '',
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setFormData(prev => ({ ...prev, foto: result.assets[0] }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const submitData = new FormData();
      const parseIntegerField = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const normalizedValue = String(value).trim();
        if (!/^\d+$/.test(normalizedValue)) {
          return '';
        }
        return Number(normalizedValue);
      };

      const sanitizedData = {
        ...formData,
        anak_ke: parseIntegerField(formData.anak_ke),
        dari_bersaudara: parseIntegerField(formData.dari_bersaudara),
        semester:
          formData.jenjang === 'perguruan_tinggi'
            ? parseIntegerField(formData.semester)
            : '',
      };

      Object.entries(sanitizedData).forEach(([key, value]) => {
        if (key === 'foto') {
          if (value) {
            submitData.append('foto', {
              uri: value.uri,
              type: 'image/jpeg',
              name: 'photo.jpg',
            });
          }
          return;
        }

        if (key === 'marketplace_featured') {
          submitData.append(key, value ? '1' : '0');
          return;
        }

        if (key === 'personality_traits') {
          const formattedTraits = value
            ? value
                .split(',')
                .map(trait => trait.trim())
                .filter(Boolean)
                .join(',')
            : '';
          submitData.append(key, formattedTraits);
          return;
        }

        if (value === null || value === undefined) {
          submitData.append(key, '');
          return;
        }

        if (typeof value === 'string') {
          submitData.append(key, value);
        } else {
          submitData.append(key, value.toString());
        }
      });

      const response = await adminShelterAnakApi.updateAnak(anakData.id_anak, submitData);

      if (response.data.success) {
        Alert.alert(
          'Sukses',
          'Data anak berhasil diperbarui',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Gagal memperbarui data');
      }
    } catch (error) {
      console.error('Error updating anak:', error);
      Alert.alert('Error', 'Gagal memperbarui data anak');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memperbarui data..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Foto Anak</Text>
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color="#999" />
              <Text style={styles.imagePlaceholderText}>Pilih Foto</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Dasar</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) => updateField('full_name', text)}
            placeholder="Masukkan nama lengkap"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Panggilan</Text>
          <TextInput
            style={styles.input}
            value={formData.nick_name}
            onChangeText={(text) => updateField('nick_name', text)}
            placeholder="Masukkan nama panggilan"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NIK</Text>
          <TextInput
            style={styles.input}
            value={formData.nik_anak}
            onChangeText={(text) => updateField('nik_anak', text)}
            placeholder="Masukkan NIK"
            keyboardType="numeric"
            maxLength={16}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tempat Lahir</Text>
          <TextInput
            style={styles.input}
            value={formData.tempat_lahir}
            onChangeText={(text) => updateField('tempat_lahir', text)}
            placeholder="Masukkan tempat lahir"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alamat</Text>
          <TextInput
            style={styles.textArea}
            value={formData.alamat}
            onChangeText={(text) => updateField('alamat', text)}
            placeholder="Masukkan alamat lengkap"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tanggal Lahir</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={[
                styles.dateText,
                !selectedBirthDate && styles.placeholderText,
              ]}
            >
              {selectedBirthDate
                ? format(selectedBirthDate, 'dd MMMM yyyy', { locale: id })
                : 'Pilih tanggal lahir'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DatePicker
              value={selectedBirthDate || new Date()}
              onChange={(date) => {
                if (date) {
                  setSelectedBirthDate(date);
                  updateField('tanggal_lahir', format(date, 'dd/MM/yyyy'));
                }
                setShowDatePicker(false);
              }}
              onCancel={() => setShowDatePicker(false)}
              title="Pilih Tanggal Lahir"
            />
          )}
        </View>

        <PickerInput
          label="Jenis Kelamin"
          value={formData.jenis_kelamin}
          onValueChange={(value) => updateField('jenis_kelamin', value)}
          items={genderOptions}
          placeholder="Pilih Jenis Kelamin"
          style={styles.pickerGroup}
        />

        <PickerInput
          label="Agama"
          value={formData.agama}
          onValueChange={(value) => updateField('agama', value)}
          items={religionOptions}
          placeholder="Pilih Agama"
          style={styles.pickerGroup}
        />

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Anak Ke</Text>
            <TextInput
              style={styles.input}
              value={formData.anak_ke}
              onChangeText={(text) => updateField('anak_ke', text)}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Dari Bersaudara</Text>
            <TextInput
              style={styles.input}
              value={formData.dari_bersaudara}
              onChangeText={(text) => updateField('dari_bersaudara', text)}
              placeholder="3"
              keyboardType="numeric"
            />
          </View>
        </View>

        <PickerInput
          label="Tinggal Bersama"
          value={formData.tinggal_bersama}
          onValueChange={(value) => updateField('tinggal_bersama', value)}
          items={livingWithOptions}
          placeholder="Pilih Tinggal Bersama"
          style={styles.pickerGroup}
        />

        <PickerInput
          label="Jenis Anak Binaan"
          value={formData.jenis_anak_binaan}
          onValueChange={(value) => updateField('jenis_anak_binaan', value)}
          items={childTypeOptions}
          placeholder="Pilih Jenis Anak Binaan"
          style={styles.pickerGroup}
        />

        <PickerInput
          label="Hafalan"
          value={formData.hafalan}
          onValueChange={(value) => updateField('hafalan', value)}
          items={hafalanOptions}
          placeholder="Pilih Hafalan"
          style={styles.pickerGroup}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Pendidikan</Text>

        <PickerInput
          label="Jenjang Pendidikan"
          value={formData.jenjang}
          onValueChange={(value) => updateField('jenjang', value)}
          items={educationLevelOptions}
          placeholder="Pilih Jenjang Pendidikan"
          style={styles.pickerGroup}
        />

        {formData.jenjang &&
          formData.jenjang !== 'belum_sd' &&
          formData.jenjang !== 'perguruan_tinggi' && (
            <>
              <PickerInput
                label="Kelas"
                value={formData.kelas}
                onValueChange={(value) => updateField('kelas', value)}
                items={getGradeOptions()}
                placeholder="Pilih Kelas"
                style={styles.pickerGroup}
              />

              {formData.jenjang === 'sma' && (
                <PickerInput
                  label="Jurusan"
                  value={formData.jurusan}
                  onValueChange={(value) => updateField('jurusan', value)}
                  items={smaMajorOptions}
                  placeholder="Pilih Jurusan"
                  style={styles.pickerGroup}
                />
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Sekolah</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nama_sekolah}
                  onChangeText={(text) => updateField('nama_sekolah', text)}
                  placeholder="Masukkan nama sekolah"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Alamat Sekolah</Text>
                <TextInput
                  style={styles.textArea}
                  value={formData.alamat_sekolah}
                  onChangeText={(text) => updateField('alamat_sekolah', text)}
                  placeholder="Masukkan alamat sekolah"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}

        {formData.jenjang === 'perguruan_tinggi' && (
          <>
            <PickerInput
              label="Semester"
              value={formData.semester}
              onValueChange={(value) => updateField('semester', value)}
              items={semesterOptions}
              placeholder="Pilih Semester"
              style={styles.pickerGroup}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jurusan</Text>
              <TextInput
                style={styles.input}
                value={formData.jurusan}
                onChangeText={(text) => updateField('jurusan', text)}
                placeholder="Masukkan jurusan"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Perguruan Tinggi</Text>
              <TextInput
                style={styles.input}
                value={formData.nama_pt}
                onChangeText={(text) => updateField('nama_pt', text)}
                placeholder="Masukkan nama perguruan tinggi"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat Perguruan Tinggi</Text>
              <TextInput
                style={styles.textArea}
                value={formData.alamat_pt}
                onChangeText={(text) => updateField('alamat_pt', text)}
                placeholder="Masukkan alamat perguruan tinggi"
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Tambahan</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pelajaran Favorit</Text>
          <TextInput
            style={styles.input}
            value={formData.pelajaran_favorit}
            onChangeText={(text) => updateField('pelajaran_favorit', text)}
            placeholder="Masukkan pelajaran favorit"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hobi</Text>
          <TextInput
            style={styles.input}
            value={formData.hobi}
            onChangeText={(text) => updateField('hobi', text)}
            placeholder="Masukkan hobi"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prestasi</Text>
          <TextInput
            style={styles.textArea}
            value={formData.prestasi}
            onChangeText={(text) => updateField('prestasi', text)}
            placeholder="Masukkan prestasi yang pernah diraih"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Marketplace</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cerita Latar Belakang</Text>
          <TextInput
            style={styles.textArea}
            value={formData.background_story}
            onChangeText={(text) => updateField('background_story', text)}
            placeholder="Ceritakan latar belakang anak..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tujuan Pendidikan</Text>
          <TextInput
            style={styles.textArea}
            value={formData.educational_goals}
            onChangeText={(text) => updateField('educational_goals', text)}
            placeholder="Tuliskan tujuan dan aspirasi pendidikan anak..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sifat Kepribadian</Text>
          <Text style={styles.helperText}>Pisahkan dengan koma (contoh: Rajin, Cerdas, Ramah)</Text>
          <TextInput
            style={styles.input}
            value={formData.personality_traits}
            onChangeText={(text) => updateField('personality_traits', text)}
            placeholder="Rajin, Cerdas, Ramah, Kreatif"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.warningLabel]}>Kebutuhan Khusus</Text>
          <Text style={styles.warningText}>Informasi medis atau kebutuhan khusus yang perlu diperhatikan</Text>
          <TextInput
            style={[styles.textArea, styles.warningInput]}
            value={formData.special_needs}
            onChangeText={(text) => updateField('special_needs', text)}
            placeholder="Jelaskan kebutuhan khusus jika ada..."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>Tampilkan di Marketplace</Text>
            <Text style={styles.helperText}>Anak akan ditampilkan sebagai featured child</Text>
          </View>
          <Switch
            value={formData.marketplace_featured}
            onValueChange={(value) => updateField('marketplace_featured', value)}
            trackColor={{ false: '#ccc', true: '#e74c3c' }}
            thumbColor={formData.marketplace_featured ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Simpan Perubahan"
          onPress={handleSubmit}
          type="primary"
          loading={loading}
          style={styles.saveButton}
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
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  imageContainer: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  warningLabel: {
    color: '#e74c3c',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  warningInput: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  pickerGroup: {
    marginBottom: 16,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
  },
  saveButton: {
    marginBottom: 16,
  },
});

export default AnakFormScreen;