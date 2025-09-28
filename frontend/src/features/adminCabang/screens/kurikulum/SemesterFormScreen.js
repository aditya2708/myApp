import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
  kurikulumApi
} from '../../api/kurikulumApi';

const resolveKurikulumIdValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return 'Pilih tanggal';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const SemesterFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { selectedKurikulumId, selectedKurikulum } = useSelector(state => state?.kurikulum || {});

  const {
    mode = 'create',
    semester: semesterParam = null,
    kurikulumId: paramKurikulumId,
    kurikulumName: paramKurikulumName,
  } = route.params || {};

  const activeKurikulumId = useMemo(() => (
    paramKurikulumId
    ?? selectedKurikulumId
    ?? selectedKurikulum?.id_kurikulum
    ?? selectedKurikulum?.kurikulum_id
    ?? selectedKurikulum?.id
    ?? null
  ), [paramKurikulumId, selectedKurikulumId, selectedKurikulum]);

  const activeKurikulumName = paramKurikulumName
    ?? selectedKurikulum?.nama_kurikulum
    ?? '';

  const { defaultStartDate, defaultEndDate } = useMemo(() => {
    const start = new Date();
    return {
      defaultStartDate: start,
      defaultEndDate: new Date(start.getFullYear() + 1, start.getMonth(), start.getDate()),
    };
  }, []);

  const [formData, setFormData] = useState({
    nama_semester: '',
    tahun_ajaran: new Date().getFullYear().toString(),
    periode: 'ganjil',
    tanggal_mulai: '',
    tanggal_selesai: '',
    kurikulum_id: activeKurikulumId ?? '',
  });
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const isEditMode = mode === 'edit' && !!semesterParam;

  const [createSemester, { isLoading: isCreating }] = useCreateSemesterMutation();
  const [updateSemester, { isLoading: isUpdating }] = useUpdateSemesterMutation();

  useEffect(() => {
    if (isEditMode) {
      const semesterKurikulumId = semesterParam.kurikulum_id
        ?? semesterParam.id_kurikulum
        ?? activeKurikulumId
        ?? '';

      setFormData({
        nama_semester: semesterParam.nama_semester || '',
        tahun_ajaran: semesterParam.tahun_ajaran || '',
        periode: semesterParam.periode || 'ganjil',
        tanggal_mulai: semesterParam.tanggal_mulai || '',
        tanggal_selesai: semesterParam.tanggal_selesai || '',
        kurikulum_id: semesterKurikulumId,
      });

      if (semesterParam.tanggal_mulai) {
        setStartDate(new Date(semesterParam.tanggal_mulai));
      }

      if (semesterParam.tanggal_selesai) {
        setEndDate(new Date(semesterParam.tanggal_selesai));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        kurikulum_id: activeKurikulumId ?? '',
      }));
      setStartDate(defaultStartDate);
      setEndDate(defaultEndDate);
    }
  }, [isEditMode, semesterParam, activeKurikulumId, defaultStartDate, defaultEndDate]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditMode ? 'Edit Semester' : 'Tambah Semester',
    });
  }, [navigation, isEditMode]);

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, tanggal_mulai: formattedDate }));
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, tanggal_selesai: formattedDate }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.nama_semester || !formData.tahun_ajaran) {
      Alert.alert('Error', 'Nama semester dan tahun ajaran harus diisi');
      return;
    }

    const normalizedKurikulumId = resolveKurikulumIdValue(formData.kurikulum_id ?? activeKurikulumId);
    if (!normalizedKurikulumId) {
      Alert.alert('Error', 'Kurikulum belum dipilih atau tidak valid');
      return;
    }

    const payload = {
      ...formData,
      kurikulum_id: normalizedKurikulumId,
    };

    try {
      if (isEditMode) {
        const semesterId = semesterParam?.id_semester ?? semesterParam?.id;

        if (!semesterId) {
          Alert.alert('Error', 'ID semester tidak ditemukan');
          return;
        }

        await updateSemester({
          id: semesterId,
          ...payload,
        }).unwrap();
        Alert.alert('Berhasil', 'Semester berhasil diupdate');
      } else {
        await createSemester(payload).unwrap();
        Alert.alert('Berhasil', 'Semester berhasil ditambahkan');
      }

      dispatch(kurikulumApi.util.invalidateTags([
        { type: 'Semester', id: 'LIST' },
        { type: 'Semester', id: 'ACTIVE' },
        'Statistics',
      ]));

      navigation.navigate({
        name: 'SemesterManagement',
        params: { refreshTimestamp: Date.now() },
        merge: true,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Error',
        error?.data?.message
          || (isEditMode ? 'Gagal mengupdate semester' : 'Gagal menambahkan semester')
      );
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nama Semester</Text>
          <TextInput
            style={styles.formInput}
            value={formData.nama_semester}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, nama_semester: text }))}
            placeholder="Contoh: Semester Ganjil 2024"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Tahun Ajaran</Text>
          <TextInput
            style={styles.formInput}
            value={formData.tahun_ajaran}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, tahun_ajaran: text }))}
            placeholder="Contoh: 2024/2025"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>ID Kurikulum</Text>
          <TextInput
            style={[styles.formInput, styles.readOnlyInput]}
            value={formData.kurikulum_id ? String(formData.kurikulum_id) : ''}
            editable={false}
            selectTextOnFocus={false}
            placeholder="ID kurikulum terpilih"
          />
          {(semesterParam?.kurikulum?.nama_kurikulum || activeKurikulumName) ? (
            <Text style={styles.helperText} numberOfLines={2}>
              Kurikulum: {semesterParam?.kurikulum?.nama_kurikulum || activeKurikulumName}
            </Text>
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Periode</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioOption, formData.periode === 'ganjil' && styles.radioSelected]}
              onPress={() => setFormData((prev) => ({ ...prev, periode: 'ganjil' }))}
            >
              <Text style={[styles.radioText, formData.periode === 'ganjil' && styles.radioTextSelected]}>Ganjil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioOption, formData.periode === 'genap' && styles.radioSelected]}
              onPress={() => setFormData((prev) => ({ ...prev, periode: 'genap' }))}
            >
              <Text style={[styles.radioText, formData.periode === 'genap' && styles.radioTextSelected]}>Genap</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Tanggal Mulai</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={[styles.datePickerText, !formData.tanggal_mulai && styles.datePickerPlaceholder]}>
              {formatDisplayDate(formData.tanggal_mulai)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6c757d" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Tanggal Selesai</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={[styles.datePickerText, !formData.tanggal_selesai && styles.datePickerPlaceholder]}>
              {formatDisplayDate(formData.tanggal_selesai)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6c757d" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{isEditMode ? 'Update' : 'Simpan'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#343a40',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  readOnlyInput: {
    backgroundColor: '#f1f3f5',
    color: '#495057',
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 6,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  radioSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  radioText: {
    fontSize: 14,
    color: '#6c757d',
  },
  radioTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 14,
    color: '#343a40',
  },
  datePickerPlaceholder: {
    color: '#6c757d',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#28a745',
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.8,
  },
  submitButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default SemesterFormScreen;
