import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSelector } from 'react-redux';
import TextInput from '../../../../common/components/TextInput';
import PickerInput from '../../../../common/components/PickerInput';
import Button from '../../../../common/components/Button';
import {
  useCreateMateriMutation,
  useUpdateMateriMutation,
  useAddKurikulumMateriMutation
} from '../../api/kurikulumApi';

const getFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

/**
 * Materi Form Screen - API Integrated
 * Form for adding/editing learning materials
 */
const MateriFormScreen = ({ navigation, route }) => {
  const { jenjang, kelas, mataPelajaran, isEdit, materi, kurikulumId: routeKurikulumId, kurikulum } = route.params || {};

  const kurikulumState = useSelector(state => state?.kurikulum);
  const kurikulumId = getFirstDefined(
    routeKurikulumId,
    kurikulum?.id_kurikulum,
    kurikulum?.id,
    kurikulumState?.selectedKurikulumId,
    kurikulumState?.selectedKurikulum?.id_kurikulum,
    kurikulumState?.selectedKurikulum?.kurikulum_id,
    materi?.kurikulum_id,
    materi?.id_kurikulum,
    materi?.pivot?.id_kurikulum,
    kurikulumState?.currentMataPelajaran?.id_kurikulum,
    kurikulumState?.currentMataPelajaran?.kurikulum_id,
    kurikulumState?.currentKelas?.id_kurikulum,
    kurikulumState?.currentKelas?.kurikulum_id,
    kurikulumState?.currentJenjang?.id_kurikulum,
    kurikulumState?.currentJenjang?.kurikulum_id,
    kelas?.id_kurikulum,
    kelas?.kurikulum_id,
    mataPelajaran?.id_kurikulum,
    mataPelajaran?.kurikulum_id,
    jenjang?.id_kurikulum,
    jenjang?.kurikulum_id
  );

  const [formData, setFormData] = useState({
    nama_materi: isEdit ? materi?.nama_materi || '' : '',
    deskripsi: isEdit ? materi?.deskripsi || '' : '',
    kategori: isEdit ? materi?.kategori || 'pembelajaran' : 'pembelajaran',
    urutan: isEdit ? materi?.urutan?.toString() || '' : '',
  });

  const [selectedFile, setSelectedFile] = useState(null);

  // API mutations
  const [createMateri, { isLoading: isCreating }] = useCreateMateriMutation();
  const [updateMateri, { isLoading: isUpdating }] = useUpdateMateriMutation();
  const [addKurikulumMateri, { isLoading: isLinkingKurikulum }] = useAddKurikulumMateriMutation();

  const loading = isCreating || isUpdating || isLinkingKurikulum;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
          size: file.size
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih file');
    }
  };

  const handleSubmit = async () => {
    if (!formData.nama_materi.trim()) {
      Alert.alert('Error', 'Nama materi harus diisi');
      return;
    }

    if (!isEdit && !kurikulumId) {
      Alert.alert('Error', 'Kurikulum tidak ditemukan. Mohon kembali dan pilih kurikulum terlebih dahulu.');
      return;
    }

    try {
      const parsedUrutan = parseInt(formData.urutan, 10);
      const sanitizedUrutan = Number.isNaN(parsedUrutan) ? 1 : parsedUrutan;

      const submitData = {
        nama_materi: formData.nama_materi,
        deskripsi: formData.deskripsi,
        kategori: formData.kategori,
        urutan: sanitizedUrutan,
        id_mata_pelajaran: mataPelajaran.id_mata_pelajaran,
        id_kelas: kelas.id_kelas,
        kurikulum_id: kurikulumId
      };

      // Add file if selected
      if (selectedFile) {
        submitData.file = {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type
        };
      }

      if (isEdit) {
        await updateMateri({
          id: materi.id_materi,
          ...submitData
        }).unwrap();
      } else {
        const createdMateri = await createMateri(submitData).unwrap();

        if (kurikulumId) {
          const materiId = getFirstDefined(
            createdMateri?.data?.id_materi,
            createdMateri?.data?.id,
            createdMateri?.id_materi,
            createdMateri?.id,
            createdMateri?.materi?.id_materi,
            createdMateri?.materi?.id
          );

          if (materiId) {
            await addKurikulumMateri({
              kurikulumId,
              mataPelajaranId: mataPelajaran.id_mata_pelajaran,
              materiId,
              urutan: sanitizedUrutan
            }).unwrap();
          } else {
            console.warn('Materi ID tidak ditemukan pada respons createMateri, melewati sinkronisasi kurikulum.');
          }
        }
      }

      Alert.alert(
        'Sukses',
        `Materi berhasil ${isEdit ? 'diupdate' : 'ditambahkan'}!`,
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal menyimpan materi');
    }
  };

  const kategoriOptions = [
    { label: 'Pembelajaran', value: 'pembelajaran' },
    { label: 'Latihan', value: 'latihan' },
    { label: 'Evaluasi', value: 'evaluasi' },
    { label: 'Referensi', value: 'referensi' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEdit ? 'Edit Materi' : 'Tambah Materi'}
        </Text>
        <Text style={styles.subtitle}>
          {mataPelajaran.nama_mata_pelajaran} - {kelas.nama_kelas}
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Nama Materi *"
          value={formData.nama_materi}
          onChangeText={(value) => handleInputChange('nama_materi', value)}
          placeholder="Masukkan nama materi"
        />

        <TextInput
          label="Deskripsi"
          value={formData.deskripsi}
          onChangeText={(value) => handleInputChange('deskripsi', value)}
          placeholder="Masukkan deskripsi materi"
          multiline
          numberOfLines={3}
        />

        <TextInput
          label="Urutan"
          value={formData.urutan}
          onChangeText={(value) => handleInputChange('urutan', value)}
          placeholder="Masukkan urutan materi (angka)"
          keyboardType="numeric"
        />

        <PickerInput
          label="Kategori"
          selectedValue={formData.kategori}
          onValueChange={(value) => handleInputChange('kategori', value)}
          items={kategoriOptions}
        />

        {/* File Upload Section */}
        <View style={styles.fileSection}>
          <Text style={styles.fileLabel}>File Materi</Text>
          <TouchableOpacity 
            style={styles.fileButton}
            onPress={handleFileSelect}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#007bff" />
            <Text style={styles.fileButtonText}>
              {selectedFile ? selectedFile.name : 'Pilih File'}
            </Text>
          </TouchableOpacity>
          {selectedFile && (
            <View style={styles.fileInfo}>
              <Ionicons name="document" size={16} color="#28a745" />
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Ionicons name="close-circle" size={16} color="#dc3545" />
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.fileHint}>
            Supported: PDF, DOC, DOCX, JPG, PNG (Max: 10MB)
          </Text>
        </View>

        <Button
          title={isEdit ? 'Update Materi' : 'Simpan Materi'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#17a2b8" />
          <Text style={styles.infoText}>
            Form materi sudah terintegrasi dengan backend API. 
            File upload mendukung PDF, DOC, DOCX, dan gambar.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  form: {
    padding: 20,
  },
  fileSection: {
    marginBottom: 20,
  },
  fileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 8,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderStyle: 'dashed',
  },
  fileButtonText: {
    marginLeft: 10,
    color: '#007bff',
    fontSize: 14,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#28a745',
  },
  fileHint: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0056b3',
    marginLeft: 10,
    lineHeight: 16,
  },
});

export default MateriFormScreen;