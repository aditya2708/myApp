import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

// Import components
import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

// Import API
import { penilaianApi } from '../../api/penilaianApi';
import { aktivitasApi } from '../../api/aktivitasApi';
import { kurikulumShelterApi } from '../../api/kurikulumShelterApi';
import { attendanceApi } from '../../api/attendanceApi';
import {
  filterActivitiesForChild,
  formatDateForQuery,
  parseDateSafe,
  toIdString
} from './utils/penilaianAktivitasUtils';

const formatMateriLabel = (subject, materi) => {
  const parts = [];
  if (subject && subject.toString().trim()) {
    parts.push(subject.toString().trim());
  }
  if (materi && materi.toString().trim()) {
    parts.push(materi.toString().trim());
  }
  return parts.join(' - ');
};

const PenilaianFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { anakId, anakData, penilaian, semesterId, initialActivityDate } = route.params || {};
  
  const isEdit = !!penilaian;

  const resolvedPenilaianDate = penilaian && penilaian.tanggal_penilaian
    ? new Date(penilaian.tanggal_penilaian)
    : new Date();
  const resolvedAktivitasDate = parseDateSafe(
    initialActivityDate ||
    penilaian?.aktivitas?.tanggal ||
    penilaian?.tanggal_penilaian
  ) || new Date();

  const [formData, setFormData] = useState({
    id_anak: anakId,
    id_aktivitas: penilaian?.id_aktivitas || '',
    id_materi: penilaian?.id_materi || '',
    id_jenis_penilaian: penilaian?.id_jenis_penilaian || '',
    id_semester: semesterId || penilaian?.id_semester || '',
    nilai: penilaian?.nilai?.toString() || '',
    deskripsi_tugas: penilaian?.deskripsi_tugas || '',
    tanggal_penilaian: resolvedPenilaianDate,
    catatan: penilaian?.catatan || ''
  });

  const [aktivitasList, setAktivitasList] = useState([]);
  const [allMateriList, setAllMateriList] = useState([]);
  const [materiList, setMateriList] = useState([]);
  const [jenisPenilaianList, setJenisPenilaianList] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [materiText, setMateriText] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualMateri, setManualMateri] = useState('');
  const [selectedAktivitasDate, setSelectedAktivitasDate] = useState(resolvedAktivitasDate);
  const [showAktivitasDatePicker, setShowAktivitasDatePicker] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Penilaian' : 'Tambah Penilaian'
    });
    
    if (!anakId) {
      setError('Data anak tidak tersedia');
      setLoadingData(false);
      return;
    }
  }, [anakId, isEdit, navigation]);

  // Filter materi based on selected aktivitas
  useEffect(() => {
    if (formData.id_aktivitas && aktivitasList.length > 0) {
      const selectedAktivitas = aktivitasList.find(
        a => a.id_aktivitas.toString() === formData.id_aktivitas.toString()
      );

      if (!selectedAktivitas) return;

      const useManual = Boolean(selectedAktivitas.pakai_materi_manual) ||
        (!selectedAktivitas.id_materi &&
          (!!selectedAktivitas.mata_pelajaran_manual || !!selectedAktivitas.materi_manual));

      if (!useManual && selectedAktivitas.id_materi) {
        const filtered = allMateriList.filter(
          m => m.id_materi === selectedAktivitas.id_materi
        );
        setMateriList(filtered);
        setManualSubject('');
        setManualMateri('');
        setMateriText('');
        if (filtered.length === 1) {
          updateFormData('id_materi', filtered[0].id_materi);
        } else {
          updateFormData('id_materi', '');
        }
      } else {
        setMateriList([]);
        updateFormData('id_materi', '');
        const subject = selectedAktivitas.mata_pelajaran_manual || '';
        const materiManualValue = selectedAktivitas.materi_manual || '';
        setManualSubject(subject);
        setManualMateri(materiManualValue);
        setMateriText(formatMateriLabel(subject, materiManualValue || selectedAktivitas.materi));
      }
    } else {
      setMateriList([]);
      updateFormData('id_materi', '');
      setMateriText('');
      setManualSubject('');
      setManualMateri('');
    }
  }, [formData.id_aktivitas, aktivitasList, allMateriList]);
  

  const targetAnakId = toIdString(anakId);
  const currentSemesterId = formData.id_semester;

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      // Use Promise.all for concurrent API calls
      const promises = [];

      // Fetch aktivitas with kelompok filter
      const aktivitasParams = {
        limit: 100,
        semester_id: currentSemesterId
      };

      const aktivitasDateQuery = formatDateForQuery(selectedAktivitasDate);
      if (aktivitasDateQuery) {
        aktivitasParams.date_from = aktivitasDateQuery;
        aktivitasParams.date_to = aktivitasDateQuery;
      }
      
      // Add nama_kelompok filter if anak has kelompok
      if (anakData?.kelompok?.nama_kelompok) {
        aktivitasParams.nama_kelompok = anakData.kelompok.nama_kelompok;
      }

      const aktivitasPromise = aktivitasApi.getAllAktivitas(aktivitasParams);
      const jenisPenilaianPromise = penilaianApi.getJenisPenilaian();
      const materiPromise = kurikulumShelterApi.getAllMateri();
      const existingPenilaianPromise = anakId && currentSemesterId
        ? penilaianApi
            .getByAnakSemester(anakId, currentSemesterId)
            .catch(err => {
              console.warn('Failed to fetch existing penilaian:', err?.response?.data || err);
              return null;
            })
        : Promise.resolve(null);
      
      promises.push(aktivitasPromise);

      // Fetch jenis penilaian
      promises.push(jenisPenilaianPromise);

      // Fetch materi from kurikulum
      promises.push(materiPromise);

      // Fetch existing penilaian so we can hide used activities when creating new records
      promises.push(existingPenilaianPromise);

      const [
        aktivitasResponse,
        jenisPenilaianResponse,
        materiResponse,
        existingPenilaianResponse
      ] = await Promise.all(promises);

      const aktivitasData = aktivitasResponse?.data?.data || [];

      const existingPenilaian = Array.isArray(existingPenilaianResponse?.data?.data)
        ? existingPenilaianResponse.data.data
        : [];

      const usedAktivitasIds = new Set(
        existingPenilaian
          .map(item => toIdString(item?.id_aktivitas))
          .filter(Boolean)
      );

      const { list: filteredActivities, unresolved } = await filterActivitiesForChild(
        aktivitasData,
        usedAktivitasIds,
        {
          allowedActivityId: penilaian?.id_aktivitas,
          targetAnakId,
          anakData,
          attendanceApi
        }
      );

      // Handle aktivitas response
      if (aktivitasResponse?.data?.success) {
        setAktivitasList(filteredActivities);

        if (
          formData.id_aktivitas &&
          !filteredActivities.some(
            aktivitas => toIdString(aktivitas.id_aktivitas) === toIdString(formData.id_aktivitas)
          )
        ) {
          updateFormData('id_aktivitas', isEdit ? penilaian?.id_aktivitas || '' : '');
        }

        if (unresolved > 0) {
          console.warn(
            `Unable to verify membership for ${unresolved} aktivitas. These were excluded from the picker.`
          );
        }
      } else {
        console.warn('Failed to fetch aktivitas:', aktivitasResponse?.data?.message);
        setAktivitasList([]);
      }

      // Handle jenis penilaian response
      if (jenisPenilaianResponse?.data?.success) {
        setJenisPenilaianList(jenisPenilaianResponse.data.data || []);
      } else {
        console.warn('Failed to fetch jenis penilaian:', jenisPenilaianResponse?.data?.message);
      }

      // Handle materi response - extract from hierarchy structure
      if (materiResponse?.data?.success && materiResponse?.data?.data?.hierarchy?.materi_list) {
        const materiData = materiResponse.data.data.hierarchy.materi_list || [];
        setAllMateriList(materiData);
        setMateriList(materiData);
      } else {
        console.warn('Failed to fetch materi:', materiResponse?.data?.message);
        setAllMateriList([]);
        setMateriList([]);
      }

    } catch (err) {
      console.error('Error fetching initial data:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Gagal memuat data. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setLoadingData(false);
    }
  }, [anakData, anakId, currentSemesterId, penilaian?.id_aktivitas, selectedAktivitasDate, targetAnakId, updateFormData, isEdit]);

  useEffect(() => {
    if (!anakId) return;
    fetchInitialData();
  }, [selectedAktivitasDate, anakId, fetchInitialData]);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        // Pastikan id_materi dikirim null bila kosong agar backend tahu ini bukan pilihan kurikulum
        id_materi: formData.id_materi && formData.id_materi.toString().trim() !== '' ? formData.id_materi : null,
        // Kirim materi_text ketika tidak ada id_materi (atau tetap kirim null)
        materi_text: (!formData.id_materi || formData.id_materi === '') ? (materiText || null) : null,
        mata_pelajaran_manual: manualSubject?.toString().trim() ? manualSubject : null,
        materi_manual: manualMateri?.toString().trim() ? manualMateri : null,
        id_semester: formData.id_semester,
        nilai: parseFloat(formData.nilai),
        tanggal_penilaian: formData.tanggal_penilaian.toISOString().split('T')[0]
      };
      
      

      let response;
      if (isEdit) {
        response = await penilaianApi.updatePenilaian(penilaian.id_penilaian, submitData);
      } else {
        response = await penilaianApi.createPenilaian(submitData);
      }

      if (response.data.success) {
        Alert.alert(
          'Sukses',
          isEdit ? 'Penilaian berhasil diperbarui' : 'Penilaian berhasil ditambahkan',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        const errorMessage = response.data.message || 'Gagal menyimpan penilaian';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error submitting penilaian:', err);
      
      let errorMessage = 'Gagal menyimpan penilaian. Silakan coba lagi.';
      
      if (err?.response?.data) {
        if (err.response.data.errors) {
          // Handle validation errors
          const validationErrors = Object.values(err.response.data.errors).flat();
          errorMessage = validationErrors.join('\n');
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    // Jika tidak ada id_aktivitas
    if (!formData.id_aktivitas) {
      Alert.alert('Error', 'Silakan pilih aktivitas');
      return false;
    }
  
    const isManualAktivitas = Boolean(manualSubject || manualMateri);
    const hasIdMateri = formData.id_materi && formData.id_materi.toString().trim() !== '';
    const hasMateriText = materiText && materiText.toString().trim() !== '';
    const hasManualValues = manualSubject?.toString().trim() && manualMateri?.toString().trim();

    if (isManualAktivitas) {
      if (!hasManualValues) {
        Alert.alert('Error', 'Aktivitas ini menggunakan materi manual. Pastikan mata pelajaran dan materi terisi.');
        return false;
      }
    } else if (!hasIdMateri && !hasMateriText) {
      Alert.alert('Error', 'Silakan pilih materi');
      return false;
    }
  
    if (!formData.id_jenis_penilaian) {
      Alert.alert('Error', 'Silakan pilih jenis penilaian');
      return false;
    }
    if (!formData.nilai || isNaN(formData.nilai)) {
      Alert.alert('Error', 'Silakan masukkan nilai yang valid');
      return false;
    }
    const nilai = parseFloat(formData.nilai);
    if (nilai < 0 || nilai > 100) {
      Alert.alert('Error', 'Nilai harus antara 0-100');
      return false;
    }
    return true;
  };
  

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateFormData('tanggal_penilaian', selectedDate);
    }
  };

  const onAktivitasDateChange = (event, selectedDate) => {
    setShowAktivitasDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedAktivitasDate(selectedDate);
    }
  };

  if (loadingData) {
    return <LoadingSpinner fullScreen message="Memuat data..." />;
  }

  return (
    <ScrollView style={styles.container}>
      {error && <ErrorMessage message={error} />}

      <View style={styles.formContainer}>
        {/* Anak Info */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Nama Anak</Text>
          <Text style={styles.infoText}>{anakData?.full_name || 'Unknown'}</Text>
        </View>

        {/* Aktivitas Date Filter */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tanggal Aktivitas</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowAktivitasDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={20} color="#2c3e50" />
            <Text style={styles.dateText}>
              {selectedAktivitasDate
                ? selectedAktivitasDate.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : 'Pilih tanggal aktivitas'}
            </Text>
          </TouchableOpacity>
          {showAktivitasDatePicker && (
            <DateTimePicker
              value={selectedAktivitasDate || new Date()}
              mode="date"
              display="default"
              onChange={onAktivitasDateChange}
            />
          )}
        </View>

        {/* Aktivitas Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Aktivitas *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.id_aktivitas}
              onValueChange={(value) => updateFormData('id_aktivitas', value)}
              style={styles.picker}
            >
              <Picker.Item label="Pilih Aktivitas" value="" />
              {aktivitasList.map(aktivitas => (
                <Picker.Item
                  key={aktivitas.id_aktivitas}
                  label={`${aktivitas.nama_kelompok || 'Kelompok'} - ${aktivitas.materi || 'Materi'} (${aktivitas.tanggal ? new Date(aktivitas.tanggal).toLocaleDateString('id-ID') : 'Tanggal tidak tersedia'})`}
                  value={aktivitas.id_aktivitas}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Materi Picker */}
     {/* Materi Picker / Text */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Materi *</Text>

  {/* Jika materiList ada (dari kurikulum) → tampilkan Picker */}
  {materiList.length > 0 ? (
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={formData.id_materi}
        onValueChange={(value) => updateFormData('id_materi', value)}
        style={styles.picker}
      >
        <Picker.Item label="Pilih Materi" value="" />
        {materiList.map(materi => (
          <Picker.Item
            key={materi.id_materi}
            label={`${materi.mata_pelajaran?.nama_mata_pelajaran || 'Mata Pelajaran'} - ${materi.nama_materi}`}
            value={materi.id_materi}
          />
        ))}
      </Picker>
    </View>
  ) : (manualSubject || manualMateri) ? (
    <View>
      <View style={styles.materiPreviewBox}>
        <Text style={styles.materiPreviewLabel}>Mata Pelajaran</Text>
        <Text style={styles.materiPreviewValue}>{manualSubject || '-'}</Text>
      </View>
      <View style={[styles.materiPreviewBox, { marginTop: 8 }]}>
        <Text style={styles.materiPreviewLabel}>Materi</Text>
        <Text style={styles.materiPreviewValue}>{manualMateri || '-'}</Text>
      </View>
    </View>
  ) : (
    // Jika tidak ada list dan tidak manual, tampilkan input teks dari aktivitas
    <TextInput
      style={styles.input}
      value={materiText}
      editable={false}
      placeholder="Materi dari aktivitas"
    />
  )}
</View>


        {/* Jenis Penilaian Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Jenis Penilaian *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.id_jenis_penilaian}
              onValueChange={(value) => updateFormData('id_jenis_penilaian', value)}
              style={styles.picker}
            >
              <Picker.Item label="Pilih Jenis Penilaian" value="" />
              {jenisPenilaianList.map(jenis => (
                <Picker.Item
                  key={jenis.id_jenis_penilaian}
                  label={`${jenis.nama_jenis} (${jenis.bobot_persen}%)`}
                  value={jenis.id_jenis_penilaian}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Nilai Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nilai *</Text>
          <TextInput
            style={styles.input}
            value={formData.nilai}
            onChangeText={(value) => updateFormData('nilai', value)}
            keyboardType="numeric"
            placeholder="0-100"
            maxLength={5}
          />
        </View>

        {/* Tanggal Penilaian */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tanggal Penilaian *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#7f8c8d" />
            <Text style={styles.dateText}>
              {formData.tanggal_penilaian.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.tanggal_penilaian}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Deskripsi Tugas */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Deskripsi Tugas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.deskripsi_tugas}
            onChangeText={(value) => updateFormData('deskripsi_tugas', value)}
            placeholder="Deskripsi tugas (opsional)"
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Catatan */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catatan</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.catatan}
            onChangeText={(value) => updateFormData('catatan', value)}
            placeholder="Catatan tambahan (opsional)"
            multiline
            numberOfLines={3}
            maxLength={1000}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isEdit ? 'Perbarui' : 'Simpan'}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
          
          <Button
            title="Batal"
            onPress={() => navigation.goBack()}
            type="outline"
            style={styles.cancelButton}
            disabled={loading}
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
  formContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  materiPreviewBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  materiPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 4,
  },
  materiPreviewValue: {
    fontSize: 15,
    color: '#2c3e50',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  cancelButton: {
    marginTop: 12,
  },
});

export default PenilaianFormScreen;
