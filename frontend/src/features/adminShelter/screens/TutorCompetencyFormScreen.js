import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import ErrorMessage from '../../../common/components/ErrorMessage';
import DatePicker from '../../../common/components/DatePicker';

import {
  fetchJenisKompetensi,
  createCompetency,
  updateCompetency,
  selectJenisKompetensi,
  selectCompetencyActionStatus,
  selectCompetencyActionError
} from '../redux/tutorCompetencySlice';

const TutorCompetencyFormScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const { tutorId, tutorName, competency, isEdit } = route.params;

  const jenisKompetensi = useSelector(selectJenisKompetensi);
  const createStatus = useSelector(state => selectCompetencyActionStatus(state, 'create'));
  const updateStatus = useSelector(state => selectCompetencyActionStatus(state, 'update'));
  const actionError = useSelector(state => 
    isEdit 
      ? selectCompetencyActionError(state, 'update') 
      : selectCompetencyActionError(state, 'create')
  );

  const [formData, setFormData] = useState({
    id_jenis_kompetensi: competency?.id_jenis_kompetensi || '',
    nama_competency: competency?.nama_competency || '',
    tanggal_diperoleh: competency?.tanggal_diperoleh ? new Date(competency.tanggal_diperoleh) : new Date(),
    tanggal_kadaluarsa: competency?.tanggal_kadaluarsa ? new Date(competency.tanggal_kadaluarsa) : null,
    instansi_penerbit: competency?.instansi_penerbit || '',
    nomor_sertifikat: competency?.nomor_sertifikat || '',
    deskripsi: competency?.deskripsi || ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [showJenisDropdown, setShowJenisDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState({ type: null, show: false });

  useEffect(() => {
    dispatch(fetchJenisKompetensi());
  }, [dispatch]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (type, date) => {
    if (date) {
      setFormData(prev => ({ ...prev, [type]: date }));
    }
    setShowDatePicker({ type: null, show: false });
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        if (file.size > 2 * 1024 * 1024) {
          Alert.alert('Error', 'Ukuran file maksimal 2MB');
          return;
        }

        setSelectedFile(file);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Gagal memilih file');
    }
  };

  const handleSubmit = async () => {
    if (!formData.nama_competency || !formData.id_jenis_kompetensi || !formData.instansi_penerbit) {
      Alert.alert('Error', 'Mohon lengkapi field yang wajib diisi');
      return;
    }

    try {
      const submitData = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (value instanceof Date) {
            submitData.append(key, value.toISOString().split('T')[0]);
          } else {
            submitData.append(key, String(value));
          }
        }
      });

      if (selectedFile) {
        const fileInfo = await FileSystem.getInfoAsync(selectedFile.uri);
        if (fileInfo.exists) {
          submitData.append('file_sertifikat', {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: 'application/pdf'
          });
        }
      }

      const action = isEdit 
        ? updateCompetency({ 
            tutorId, 
            competencyId: competency.id_competency, 
            competencyData: submitData 
          })
        : createCompetency({ tutorId, competencyData: submitData });

      await dispatch(action).unwrap();
      
      Alert.alert(
        'Berhasil', 
        `Kompetensi berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Gagal', error || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} kompetensi`);
    }
  };

  const selectedJenis = jenisKompetensi.find(j => j.id_jenis_kompetensi == formData.id_jenis_kompetensi);
  const isLoading = createStatus === 'loading' || updateStatus === 'loading';

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {actionError && (
        <ErrorMessage message={actionError} style={styles.errorMessage} />
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Jenis Kompetensi *</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowJenisDropdown(!showJenisDropdown)}
        >
          <Text style={[styles.dropdownText, !selectedJenis && styles.placeholder]}>
            {selectedJenis ? selectedJenis.nama_jenis_kompetensi : 'Pilih jenis kompetensi'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        
        {showJenisDropdown && (
          <View style={styles.dropdownList}>
            {jenisKompetensi.map((jenis) => (
              <TouchableOpacity
                key={jenis.id_jenis_kompetensi}
                style={styles.dropdownItem}
                onPress={() => {
                  handleChange('id_jenis_kompetensi', jenis.id_jenis_kompetensi);
                  setShowJenisDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{jenis.nama_jenis_kompetensi}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nama Kompetensi *</Text>
        <TextInput
          value={formData.nama_competency}
          onChangeText={(value) => handleChange('nama_competency', value)}
          placeholder="Masukkan nama kompetensi"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Instansi Penerbit *</Text>
        <TextInput
          value={formData.instansi_penerbit}
          onChangeText={(value) => handleChange('instansi_penerbit', value)}
          placeholder="Masukkan instansi penerbit"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nomor Sertifikat</Text>
        <TextInput
          value={formData.nomor_sertifikat}
          onChangeText={(value) => handleChange('nomor_sertifikat', value)}
          placeholder="Masukkan nomor sertifikat"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tanggal Diperoleh *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker({ type: 'tanggal_diperoleh', show: true })}
        >
          <Text style={styles.dateText}>
            {formData.tanggal_diperoleh.toLocaleDateString('id-ID')}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tanggal Kadaluarsa</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker({ type: 'tanggal_kadaluarsa', show: true })}
        >
          <Text style={styles.dateText}>
            {formData.tanggal_kadaluarsa 
              ? formData.tanggal_kadaluarsa.toLocaleDateString('id-ID')
              : 'Pilih tanggal kadaluarsa'
            }
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>File Sertifikat (PDF)</Text>
        <TouchableOpacity
          style={styles.fileButton}
          onPress={handleFileSelect}
        >
          <Ionicons name="document-outline" size={20} color="#3498db" />
          <Text style={styles.fileButtonText}>
            {selectedFile ? selectedFile.name : 'Pilih file PDF'}
          </Text>
        </TouchableOpacity>
        {competency?.file_url && !selectedFile && (
          <Text style={styles.existingFileText}>
            File saat ini: {competency.file_sertifikat}
          </Text>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Deskripsi</Text>
        <TextInput
          value={formData.deskripsi}
          onChangeText={(value) => handleChange('deskripsi', value)}
          placeholder="Masukkan deskripsi kompetensi"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Batal"
          onPress={() => navigation.goBack()}
          type="outline"
          style={styles.cancelButton}
          disabled={isLoading}
        />
        <Button
          title={isEdit ? "Simpan Perubahan" : "Tambah Kompetensi"}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        />
      </View>

      {showDatePicker.show && (
        <DatePicker
          value={formData[showDatePicker.type] || new Date()}
          onChange={(date) => handleDateChange(showDatePicker.type, date)}
          onCancel={() => setShowDatePicker({ type: null, show: false })}
        />
      )}
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
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  fileButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  existingFileText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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

export default TutorCompetencyFormScreen;