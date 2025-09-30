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

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import { adminShelterAnakApi } from '../api/adminShelterAnakApi';

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
    jenis_kelamin: 'Laki-laki',
    agama: 'Islam',
    anak_ke: '',
    dari_bersaudara: '',
    tinggal_bersama: 'Ayah',
    jenis_anak_binaan: 'BCPB',
    hafalan: 'Tahfidz',
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

  useEffect(() => {
    if (anakData) {
      setFormData({
        full_name: anakData.full_name || '',
        nick_name: anakData.nick_name || '',
        nik_anak: anakData.nik_anak || '',
        tempat_lahir: anakData.tempat_lahir || '',
        tanggal_lahir: anakData.tanggal_lahir || '',
        jenis_kelamin: anakData.jenis_kelamin || 'Laki-laki',
        agama: anakData.agama || 'Islam',
        anak_ke: anakData.anak_ke?.toString() || '',
        dari_bersaudara: anakData.dari_bersaudara?.toString() || '',
        tinggal_bersama: anakData.tinggal_bersama || 'Ayah',
        jenis_anak_binaan: anakData.jenis_anak_binaan || 'BCPB',
        hafalan: anakData.hafalan || 'Tahfidz',
        pelajaran_favorit: anakData.pelajaran_favorit || '',
        hobi: anakData.hobi || '',
        prestasi: anakData.prestasi || '',
        background_story: anakData.background_story || '',
        educational_goals: anakData.educational_goals || '',
        personality_traits: Array.isArray(anakData.personality_traits) 
          ? anakData.personality_traits.join(', ') 
          : anakData.personality_traits || '',
        special_needs: anakData.special_needs || '',
        marketplace_featured: anakData.marketplace_featured || false,
        foto: null
      });
      setImageUri(anakData.foto_url);
    }
  }, [anakData]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setFormData(prev => ({ ...prev, foto: result.assets[0] }));
    }
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Nama lengkap harus diisi');
      return false;
    }
    if (!formData.nick_name.trim()) {
      Alert.alert('Error', 'Nama panggilan harus diisi');
      return false;
    }
    if (!formData.tempat_lahir.trim()) {
      Alert.alert('Error', 'Tempat lahir harus diisi');
      return false;
    }
    if (!formData.tanggal_lahir) {
      Alert.alert('Error', 'Tanggal lahir harus diisi');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'foto' && formData[key]) {
          submitData.append('foto', {
            uri: formData[key].uri,
            type: 'image/jpeg',
            name: 'photo.jpg',
          });
        } else if (key === 'personality_traits') {
          submitData.append(key, formData[key]);
        } else if (key === 'marketplace_featured') {
          submitData.append(key, formData[key] ? '1' : '0');
        } else if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key].toString());
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
          <Text style={styles.label}>Nama Lengkap *</Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) => updateField('full_name', text)}
            placeholder="Masukkan nama lengkap"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Panggilan *</Text>
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
          <Text style={styles.label}>Tempat Lahir *</Text>
          <TextInput
            style={styles.input}
            value={formData.tempat_lahir}
            onChangeText={(text) => updateField('tempat_lahir', text)}
            placeholder="Masukkan tempat lahir"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tanggal Lahir * (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={formData.tanggal_lahir}
            onChangeText={(text) => updateField('tanggal_lahir', text)}
            placeholder="2010-01-01"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Jenis Kelamin</Text>
          <View style={styles.radioGroup}>
            {['Laki-laki', 'Perempuan'].map(option => (
              <TouchableOpacity
                key={option}
                style={styles.radioOption}
                onPress={() => updateField('jenis_kelamin', option)}
              >
                <View style={[
                  styles.radio,
                  formData.jenis_kelamin === option && styles.radioSelected
                ]} />
                <Text style={styles.radioText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Agama</Text>
          <View style={styles.selectGroup}>
            {['Islam', 'Kristen', 'Budha', 'Hindu', 'Konghucu'].map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  formData.agama === option && styles.selectOptionSelected
                ]}
                onPress={() => updateField('agama', option)}
              >
                <Text style={[
                  styles.selectOptionText,
                  formData.agama === option && styles.selectOptionTextSelected
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tinggal Bersama</Text>
          <View style={styles.selectGroup}>
            {['Ayah', 'Ibu', 'Wali'].map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  formData.tinggal_bersama === option && styles.selectOptionSelected
                ]}
                onPress={() => updateField('tinggal_bersama', option)}
              >
                <Text style={[
                  styles.selectOptionText,
                  formData.tinggal_bersama === option && styles.selectOptionTextSelected
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Jenis Anak Binaan</Text>
          <View style={styles.radioGroup}>
            {['BCPB', 'NPB'].map(option => (
              <TouchableOpacity
                key={option}
                style={styles.radioOption}
                onPress={() => updateField('jenis_anak_binaan', option)}
              >
                <View style={[
                  styles.radio,
                  formData.jenis_anak_binaan === option && styles.radioSelected
                ]} />
                <Text style={styles.radioText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hafalan</Text>
          <View style={styles.radioGroup}>
            {['Tahfidz', 'Non-Tahfidz'].map(option => (
              <TouchableOpacity
                key={option}
                style={styles.radioOption}
                onPress={() => updateField('hafalan', option)}
              >
                <View style={[
                  styles.radio,
                  formData.hafalan === option && styles.radioSelected
                ]} />
                <Text style={styles.radioText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  radioGroup: {
    flexDirection: 'row',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: '#e74c3c',
    backgroundColor: '#e74c3c',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  selectGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  selectOptionSelected: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectOptionTextSelected: {
    color: '#fff',
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