import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image,
  Alert, Platform, ActivityIndicator, Switch
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

import {
  createAktivitas, updateAktivitas, selectAktivitasLoading, selectAktivitasError, selectAktivitasConflicts,
  fetchAllMateri, setSelectedMateri, selectMateriCache, selectMateriCacheLoading,
  selectSelectedMateri, clearSelectedMateri
} from '../../redux/aktivitasSlice';

import { adminShelterKelompokApi } from '../../api/adminShelterKelompokApi';
import { adminShelterTutorApi } from '../../api/adminShelterTutorApi';
import SmartMateriSelector from '../../components/kelola/SmartMateriSelector';

const ActivityFormScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { activity } = route.params || {};
  const isEditing = !!activity;
  
  const loading = useSelector(selectAktivitasLoading);
  const error = useSelector(selectAktivitasError);
  const conflicts = useSelector(selectAktivitasConflicts);
  
  // NEW: Kurikulum selectors
  const materiCache = useSelector(selectMateriCache);
  const materiCacheLoading = useSelector(selectMateriCacheLoading);
  const selectedMateriFromStore = useSelector(selectSelectedMateri);
  
  const [formData, setFormData] = useState({
    jenis_kegiatan: '', level: '', nama_kelompok: '', materi: '', id_materi: null,
    tanggal: new Date(), selectedKelompokId: null, selectedKelompokObject: null, start_time: null,
    end_time: null, late_threshold: null, late_minutes_threshold: 15, id_tutor: null
  });
  
  const [uiState, setUIState] = useState({
    showDatePicker: false, showStartTimePicker: false, showEndTimePicker: false,
    showLateThresholdPicker: false, useCustomLateThreshold: false, useCustomMateri: false
  });
  
  const MIN_ACTIVITY_DURATION = 45;

  const [kelompokList, setKelompokList] = useState([]);
  const [tutorList, setTutorList] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    kelompok: false, tutor: false
  });
  const [errors, setErrors] = useState({ kelompok: null, tutor: null });
  const [conflictWarning, setConflictWarning] = useState(null);
  
  useEffect(() => {
    if (isEditing && activity) initializeEditForm();
    fetchTutorData();
    // Fetch materi cache on component mount
    dispatch(fetchAllMateri());
  }, [isEditing, activity, dispatch]);
  
  useEffect(() => {
    if (formData.jenis_kegiatan === 'Bimbel') fetchKelompokData();
  }, [formData.jenis_kegiatan]);
  
  // NEW: Update selected materi in store when form data changes
  useEffect(() => {
    if (formData.id_materi && materiCache.length > 0) {
      const foundMateri = materiCache.find(m => m.id_materi === formData.id_materi);
      if (foundMateri) {
        dispatch(setSelectedMateri(foundMateri));
      } else {
        // If materi not found in cache, clear selection
        console.log('Materi not found in cache for id:', formData.id_materi);
      }
    } else if (!formData.id_materi) {
      dispatch(clearSelectedMateri());
    }
  }, [formData.id_materi, materiCache, dispatch]);

  // Additional effect to handle edit mode initialization when cache becomes available
  useEffect(() => {
    if (isEditing && activity && materiCache.length > 0 && activity.id_materi && !selectedMateriFromStore) {
      const foundMateri = materiCache.find(m => m.id_materi === activity.id_materi);
      if (foundMateri) {
        dispatch(setSelectedMateri(foundMateri));
      }
    }
  }, [isEditing, activity, materiCache, selectedMateriFromStore, dispatch]);
  
  const initializeEditForm = () => {
    const parseTime = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string' || timeStr.trim() === '') {
        return null;
      }
      
      // Validate time format (H:mm, HH:mm or HH:mm:ss) - flexible for backend format
      const timeRegex = /^([0-9]|[0-1][0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
      if (!timeRegex.test(timeStr.trim())) {
        console.warn('Invalid time format:', timeStr);
        return null;
      }
      
      try {
        const date = new Date(`2000-01-01T${timeStr.trim()}`);
        if (isNaN(date.getTime())) {
          console.warn('Invalid time value:', timeStr);
          return null;
        }
        return date;
      } catch (error) {
        console.warn('Error parsing time:', timeStr, error);
        return null;
      }
    };
    
    setFormData({
      ...formData,
      jenis_kegiatan: activity.jenis_kegiatan || '',
      level: activity.level || '',
      nama_kelompok: activity.nama_kelompok || '',
      materi: activity.materi || '',
      id_materi: activity.id_materi || null,
      tanggal: activity.tanggal ? new Date(activity.tanggal) : new Date(),
      start_time: parseTime(activity.start_time),
      end_time: parseTime(activity.end_time),
      late_threshold: parseTime(activity.late_threshold),
      late_minutes_threshold: activity.late_minutes_threshold || 15,
      id_tutor: activity.tutor?.id_tutor || null
    });
    
    
    setUIState(prev => ({
      ...prev,
      useCustomLateThreshold: activity.late_threshold !== null,
      useCustomMateri: !activity.id_materi
    }));
    
    if (activity.jenis_kegiatan === 'Bimbel') fetchKelompokData();
  };
  
  const fetchData = async (apiCall, setData, setLoading, setError, key) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));
    
    try {
      const response = await apiCall();
      setData(response.data?.data || []);
    } catch (err) {
      console.error(`Error mengambil ${key}:`, err);
      setErrors(prev => ({ ...prev, [key]: `Gagal memuat data ${key}` }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };
  
  const fetchKelompokData = () => fetchData(
    adminShelterKelompokApi.getAllKelompok,
    (data) => {
      setKelompokList(data);
      if (isEditing && formData.nama_kelompok) {
        const match = data.find(k => k.nama_kelompok === formData.nama_kelompok);
        if (match) {
          setFormData(prev => ({
            ...prev,
            selectedKelompokId: match.id_kelompok,
            selectedKelompokObject: match,
            level: getKelompokDisplayLevel(match)
          }));
        }
      }
    },
    setLoadingStates,
    setErrors,
    'kelompok'
  );
  
  // NEW: Helper function to get display level from kelas_gabungan
  const getKelompokDisplayLevel = (kelompok) => {
    if (!kelompok.kelas_gabungan || kelompok.kelas_gabungan.length === 0) {
      return kelompok.level_anak_binaan?.nama_level_binaan || '';
    }
    
    // For kelas_gabungan, show combined class names
    return `Gabungan ${kelompok.kelas_gabungan.length} kelas`;
  };
  
  // REMOVED: fetchMateriData - replaced with SmartMateriSelector
  
  const fetchTutorData = () => fetchData(
    adminShelterTutorApi.getActiveTutors,
    setTutorList,
    setLoadingStates,
    setErrors,
    'tutor'
  );
  
  const handleChange = (name, value) => {
    if (name === 'jenis_kegiatan') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        level: value === 'Bimbel' ? prev.level : '',
        nama_kelompok: value === 'Bimbel' ? prev.nama_kelompok : '',
        selectedKelompokId: value === 'Bimbel' ? prev.selectedKelompokId : null,
        selectedLevelId: value === 'Bimbel' ? prev.selectedLevelId : null,
        id_materi: value === 'Bimbel' ? prev.id_materi : null
      }));
      
      if (value !== 'Bimbel') {
        setUIState(prev => ({ ...prev, useCustomMateri: false }));
      }
      // Clear conflict warning when activity type changes
      setConflictWarning(null);
    } else if (name === 'id_tutor' || name === 'tanggal') {
      setFormData(prev => ({ ...prev, [name]: value }));
      // Clear conflict warning when tutor or date changes
      setConflictWarning(null);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleKelompokChange = (kelompokId) => {
    const selected = kelompokList.find(k => k.id_kelompok === kelompokId);
    
    setFormData(prev => ({
      ...prev,
      selectedKelompokId: kelompokId,
      selectedKelompokObject: selected,
      nama_kelompok: selected?.nama_kelompok || '',
      level: selected ? getKelompokDisplayLevel(selected) : '',
      id_materi: null,
      materi: ''
    }));
    
    // Clear selected materi when kelompok changes
    dispatch(clearSelectedMateri());
    // Clear conflict warning when kelompok changes
    setConflictWarning(null);
  };
  
  // NEW: Handle materi selection from SmartMateriSelector
  const handleMateriSelect = (materi) => {
    if (!materi) {
      setFormData(prev => ({
        ...prev,
        id_materi: null,
        materi: ''
      }));
      dispatch(clearSelectedMateri());
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      id_materi: materi.id_materi,
      materi: `${(materi.mataPelajaran?.nama_mata_pelajaran || materi.mata_pelajaran?.nama_mata_pelajaran || '').toString()} - ${(materi.nama_materi || '').toString()}`
    }));
    
    dispatch(setSelectedMateri(materi));
  };
  
  const toggleCustomMateri = (value) => {
    setUIState(prev => ({ ...prev, useCustomMateri: value }));
    setFormData(prev => ({ ...prev, id_materi: null, materi: '' }));
    
    // Clear selected materi when toggling custom mode
    dispatch(clearSelectedMateri());
  };
  
  const calculateDurationMinutes = (start, end) => {
    if (!start || !end) return null;
    const difference = end.getTime() - start.getTime();
    if (difference <= 0) return null;
    return Math.round(difference / 60000);
  };

  const handleTimeChange = (event, selectedTime, field, pickerField) => {
    setUIState(prev => ({ ...prev, [pickerField]: false }));
    if (!selectedTime) return;

    let shouldClearConflict = false;
    setFormData(prev => {
      const updated = { ...prev, [field]: selectedTime };

      if (updated.start_time && updated.end_time) {
        if (updated.start_time >= updated.end_time) {
          Alert.alert('Error Validasi', 'Waktu selesai harus setelah waktu mulai');
          return prev;
        }

        const duration = calculateDurationMinutes(updated.start_time, updated.end_time);
        if (duration !== null && duration < MIN_ACTIVITY_DURATION) {
          Alert.alert('Durasi Tidak Valid', `Durasi kegiatan minimal ${MIN_ACTIVITY_DURATION} menit.`);
          return prev;
        }
      }

      shouldClearConflict = true;
      return updated;
    });

    if (shouldClearConflict) {
      setConflictWarning(null);
    }
  };
  
  const toggleCustomLateThreshold = (value) => {
    setUIState(prev => ({ ...prev, useCustomLateThreshold: value }));
    
    if (!value) {
      handleChange('late_threshold', null);
    } else if (formData.start_time && !formData.late_threshold) {
      const lateTime = new Date(formData.start_time);
      lateTime.setMinutes(lateTime.getMinutes() + formData.late_minutes_threshold);
      handleChange('late_threshold', lateTime);
    }
  };
  
  
  const formatTime = (time) => !time ? 'Belum diatur' : format(time, 'HH:mm');
  
  // Check conflicts when relevant form data changes
  useEffect(() => {
    const checkPotentialConflicts = () => {
      // Clear warning if required fields are not complete
      if (!formData.tanggal || !formData.start_time || !formData.end_time || !formData.id_tutor) {
        setConflictWarning(null);
        return;
      }
      
      const isValidTimeRange = formData.start_time < formData.end_time;
      if (!isValidTimeRange) {
        setConflictWarning(null);
        return;
      }
      
      // Show advisory warning when all required data is present
      const selectedTutor = tutorList.find(t => t.id_tutor === formData.id_tutor);
      const tutorName = selectedTutor?.nama || 'Tutor terpilih';
      const timeRange = `${formatTime(formData.start_time)} - ${formatTime(formData.end_time)}`;
      const dateStr = format(formData.tanggal, 'dd/MM/yyyy', { locale: id });
      
      setConflictWarning(
        `Pastikan tidak ada konflik: ${tutorName} pada ${dateStr} jam ${timeRange}${
          formData.jenis_kegiatan === 'Bimbel' && formData.nama_kelompok 
            ? ` untuk kelompok ${formData.nama_kelompok}` 
            : ''
        }`
      );
    };

    const timeoutId = setTimeout(() => {
      checkPotentialConflicts();
    }, 1000); // Debounce to avoid too many checks
    
    return () => clearTimeout(timeoutId);
  }, [formData.tanggal, formData.start_time, formData.end_time, formData.id_tutor, formData.nama_kelompok, formData.jenis_kegiatan, tutorList]);
  
  const durationMinutes = useMemo(
    () => calculateDurationMinutes(formData.start_time, formData.end_time),
    [formData.start_time, formData.end_time]
  );

  const validateForm = () => {
    if (!formData.jenis_kegiatan || !formData.tanggal) {
      Alert.alert('Error Validasi', 'Jenis aktivitas dan tanggal wajib diisi');
      return false;
    }
    
    if (!formData.id_tutor) {
      Alert.alert('Error Validasi', 'Silakan pilih tutor untuk aktivitas ini');
      return false;
    }
    
    if (formData.jenis_kegiatan === 'Bimbel' && !formData.selectedKelompokId) {
      Alert.alert('Error Validasi', 'Silakan pilih kelompok untuk aktivitas Bimbel');
      return false;
    }
    
    if (formData.jenis_kegiatan === 'Bimbel' && !uiState.useCustomMateri && !formData.id_materi) {
      Alert.alert('Error Validasi', 'Silakan pilih materi dari daftar');
      return false;
    }
    
    if ((formData.jenis_kegiatan === 'Kegiatan' || uiState.useCustomMateri) && !formData.materi) {
      Alert.alert('Error Validasi', 'Materi tidak boleh kosong');
      return false;
    }
    
    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        Alert.alert('Error Validasi', 'Waktu selesai harus setelah waktu mulai');
        return false;
      }

      if (durationMinutes !== null && durationMinutes < MIN_ACTIVITY_DURATION) {
        Alert.alert('Error Validasi', `Durasi kegiatan minimal ${MIN_ACTIVITY_DURATION} menit`);
        return false;
      }
    }
    
    if (uiState.useCustomLateThreshold && formData.late_threshold && formData.start_time && 
        formData.late_threshold < formData.start_time) {
      Alert.alert('Error Validasi', 'Batas terlambat harus setelah waktu mulai');
      return false;
    }
    
    return true;
  };
  
  const prepareFormData = () => {
    if (isEditing) {
      // For updates, use JSON object (photos will be handled separately if needed)
      const data = {
        jenis_kegiatan: formData.jenis_kegiatan,
        tanggal: format(formData.tanggal, 'yyyy-MM-dd')
      };
      
      if (formData.id_tutor) data.id_tutor = formData.id_tutor;
      
      if (formData.jenis_kegiatan === 'Bimbel') {
        data.level = formData.level || '';
        data.nama_kelompok = formData.nama_kelompok || '';
        
        if (!uiState.useCustomMateri && formData.id_materi) {
          data.id_materi = formData.id_materi;
        } else {
          data.materi = formData.materi || '';
        }
      } else {
        data.level = '';
        data.nama_kelompok = '';
        data.materi = formData.materi || '';
      }
      
      if (formData.start_time) data.start_time = format(formData.start_time, 'HH:mm:ss');
      if (formData.end_time) data.end_time = format(formData.end_time, 'HH:mm:ss');
      
      if (uiState.useCustomLateThreshold && formData.late_threshold) {
        data.late_threshold = format(formData.late_threshold, 'HH:mm:ss');
      } else {
        data.late_minutes_threshold = formData.late_minutes_threshold;
      }
      
      return data;
    } else {
      // For creating, use FormData (for file uploads)
      const data = new FormData();
      
      data.append('jenis_kegiatan', formData.jenis_kegiatan);
      
      if (formData.id_tutor) data.append('id_tutor', formData.id_tutor);
      
      if (formData.jenis_kegiatan === 'Bimbel') {
        data.append('level', formData.level || '');
        data.append('nama_kelompok', formData.nama_kelompok || '');
        
        if (!uiState.useCustomMateri && formData.id_materi) {
          data.append('id_materi', formData.id_materi);
        } else {
          data.append('materi', formData.materi || '');
        }
      } else {
        data.append('level', '');
        data.append('nama_kelompok', '');
        data.append('materi', formData.materi || '');
      }
      
      data.append('tanggal', format(formData.tanggal, 'yyyy-MM-dd'));
      
      if (formData.start_time) data.append('start_time', format(formData.start_time, 'HH:mm:ss'));
      if (formData.end_time) data.append('end_time', format(formData.end_time, 'HH:mm:ss'));
      
      if (uiState.useCustomLateThreshold && formData.late_threshold) {
        data.append('late_threshold', format(formData.late_threshold, 'HH:mm:ss'));
      } else {
        data.append('late_minutes_threshold', formData.late_minutes_threshold.toString());
      }
      
      
      return data;
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const data = prepareFormData();
    
    try {
      if (isEditing) {
        await dispatch(updateAktivitas({ id: activity.id_aktivitas, aktivitasData: data })).unwrap();
        Alert.alert('Berhasil', 'Aktivitas berhasil diperbarui', [
          { text: 'Oke', onPress: () => navigation.goBack() }
        ]);
      } else {
        await dispatch(createAktivitas(data)).unwrap();
        Alert.alert('Berhasil', 'Aktivitas berhasil dibuat', [
          { text: 'Oke', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      console.error('Error menyimpan aktivitas:', err);
      
      // Handle conflict validation errors from backend (both from direct API and Redux)
      // Priority: thrown payload > direct API response > Redux store (for race condition)
      const errorConflicts = err?.conflicts || err?.response?.data?.conflicts || conflicts;
      const errorMessage = err?.message || err?.response?.data?.message || error || 'Gagal menyimpan aktivitas';
      
      if (errorConflicts && errorConflicts.length > 0) {
        // Format conflict messages with better structure
        const conflictList = errorConflicts.map((conflict, index) => 
          `${index + 1}. ${conflict}`
        ).join('\n');
        
        const suggestions = [
          '• Pilih waktu yang berbeda',
          '• Pilih tutor lain yang tersedia', 
          '• Untuk Bimbel, pilih kelompok yang berbeda'
        ];
        
        Alert.alert(
          'Jadwal Bentrok Ditemukan', 
          `${errorMessage}\n\nDetail konflik:\n${conflictList}\n\nSaran penyelesaian:\n${suggestions.join('\n')}`,
          [{ text: 'Mengerti', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Gagal Menyimpan', 
          errorMessage,
          [{ text: 'Oke' }]
        );
      }
    }
  };

  const TypeButton = ({ type, label, active, onPress }) => (
    <TouchableOpacity
      style={[styles.typeButton, active && styles.typeButtonActive]}
      onPress={() => onPress(type)}
    >
      <Text style={[styles.typeButtonText, active && styles.typeButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const TimePickerButton = ({ time, placeholder, onPress, icon = "time" }) => (
    <TouchableOpacity style={styles.timeButton} onPress={onPress}>
      <Text style={styles.timeText}>{formatTime(time) === 'Belum diatur' ? placeholder : formatTime(time)}</Text>
      <Ionicons name={icon} size={24} color="#3498db" />
    </TouchableOpacity>
  );


  const LoadingIndicator = ({ loading, text }) => loading && (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#3498db" />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );

  const PickerSection = ({ data, loading, error, onRetry, placeholder, selectedValue, onValueChange, labelKey, valueKey }) => {
    if (loading) return <LoadingIndicator loading={loading} text="Memuat..." />;
    if (error) return <ErrorMessage message={error} onRetry={onRetry} style={styles.errorContainer} />;
    
    return (
      <View style={styles.pickerContainer}>
        <Picker selectedValue={selectedValue || ''} onValueChange={onValueChange} style={styles.picker}>
          <Picker.Item label={placeholder} value="" />
          {data.map(item => (
            <Picker.Item key={item[valueKey]} label={item[labelKey]} value={item[valueKey]} />
          ))}
        </Picker>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error && <ErrorMessage message={error} />}
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Jenis Aktivitas<Text style={styles.required}>*</Text></Text>
        <View style={styles.typeButtons}>
          <TypeButton 
            type="Bimbel" 
            label="Bimbel" 
            active={formData.jenis_kegiatan === 'Bimbel'}
            onPress={(type) => handleChange('jenis_kegiatan', type)}
          />
          <TypeButton 
            type="Kegiatan" 
            label="Kegiatan" 
            active={formData.jenis_kegiatan === 'Kegiatan'}
            onPress={(type) => handleChange('jenis_kegiatan', type)}
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tutor yang Ditugaskan<Text style={styles.required}>*</Text></Text>
        <PickerSection
          data={tutorList}
          loading={loadingStates.tutor}
          error={errors.tutor}
          onRetry={fetchTutorData}
          placeholder="Pilih tutor"
          selectedValue={formData.id_tutor}
          onValueChange={(value) => handleChange('id_tutor', value || null)}
          labelKey="nama"
          valueKey="id_tutor"
        />
      </View>
      
      {formData.jenis_kegiatan === 'Bimbel' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kelompok<Text style={styles.required}>*</Text></Text>
            <PickerSection
              data={kelompokList}
              loading={loadingStates.kelompok}
              error={errors.kelompok}
              onRetry={fetchKelompokData}
              placeholder="Pilih kelompok"
              selectedValue={formData.selectedKelompokId}
              onValueChange={handleKelompokChange}
              labelKey="nama_kelompok"
              valueKey="id_kelompok"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tingkat</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.level}
              editable={false}
              placeholder="Tingkat akan terisi otomatis"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Input materi manual</Text>
              <Switch
                value={uiState.useCustomMateri}
                onValueChange={toggleCustomMateri}
                trackColor={{ false: '#bdc3c7', true: '#2ecc71' }}
                thumbColor={uiState.useCustomMateri ? '#27ae60' : '#ecf0f1'}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Materi<Text style={styles.required}>*</Text></Text>
            {uiState.useCustomMateri ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.materi}
                onChangeText={(value) => handleChange('materi', value)}
                placeholder="Deskripsi Materi"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <SmartMateriSelector
                allMateri={materiCache}
                selectedKelompok={formData.selectedKelompokObject}
                selectedMateri={selectedMateriFromStore}
                onMateriSelect={handleMateriSelect}
                loading={materiCacheLoading}
                placeholder="Pilih materi dari daftar"
                showPreview={true}
              />
            )}
          </View>
        </>
      )}
      
      {formData.jenis_kegiatan === 'Kegiatan' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Materi<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.materi}
            onChangeText={(value) => handleChange('materi', value)}
            placeholder="Deskripsi Materi"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      )}
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tanggal<Text style={styles.required}>*</Text></Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setUIState(prev => ({ ...prev, showDatePicker: true }))}
        >
          <Text style={styles.dateText}>{format(formData.tanggal, 'dd MMMM yyyy')}</Text>
          <Ionicons name="calendar" size={24} color="#3498db" />
        </TouchableOpacity>
        
        {uiState.showDatePicker && (
          <DateTimePicker
            value={formData.tanggal}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setUIState(prev => ({ ...prev, showDatePicker: false }));
              if (date) handleChange('tanggal', date);
            }}
          />
        )}
      </View>
      
      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={20} color="#3498db" style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Jadwal Kegiatan</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Waktu Mulai</Text>
        <TimePickerButton
          time={formData.start_time}
          placeholder="Ketuk untuk mengatur waktu mulai"
          onPress={() => setUIState(prev => ({ ...prev, showStartTimePicker: true }))}
        />
        
        {uiState.showStartTimePicker && (
          <DateTimePicker
            value={formData.start_time || new Date()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, time) => handleTimeChange(event, time, 'start_time', 'showStartTimePicker')}
          />
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Waktu Selesai</Text>
        <TimePickerButton
          time={formData.end_time}
          placeholder="Ketuk untuk mengatur waktu selesai"
          onPress={() => setUIState(prev => ({ ...prev, showEndTimePicker: true }))}
        />

        {uiState.showEndTimePicker && (
          <DateTimePicker
            value={formData.end_time || new Date()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, time) => handleTimeChange(event, time, 'end_time', 'showEndTimePicker')}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Durasi Kegiatan</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={durationMinutes !== null
            ? `${durationMinutes} menit`
            : 'Durasi belum tersedia'}
          editable={false}
        />
        {durationMinutes !== null && durationMinutes < MIN_ACTIVITY_DURATION && (
          <Text style={[styles.helperText, styles.durationWarning]}>
            Durasi minimal kegiatan adalah {MIN_ACTIVITY_DURATION} menit.
          </Text>
        )}
      </View>
      
      <View style={styles.sectionHeader}>
        <Ionicons name="alert-circle-outline" size={20} color="#e74c3c" style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Pengaturan Keterlambatan</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Gunakan waktu terlambat khusus</Text>
          <Switch
            value={uiState.useCustomLateThreshold}
            onValueChange={toggleCustomLateThreshold}
            trackColor={{ false: '#bdc3c7', true: '#2ecc71' }}
            thumbColor={uiState.useCustomLateThreshold ? '#27ae60' : '#ecf0f1'}
          />
        </View>
        
        {uiState.useCustomLateThreshold ? (
          <View style={styles.nestedInput}>
            <Text style={styles.nestedLabel}>Waktu Terlambat</Text>
            <TimePickerButton
              time={formData.late_threshold}
              placeholder="Ketuk untuk mengatur batas terlambat"
              onPress={() => setUIState(prev => ({ ...prev, showLateThresholdPicker: true }))}
              icon="alert-circle"
            />
            
            {uiState.showLateThresholdPicker && (
              <DateTimePicker
                value={formData.late_threshold || new Date()}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, time) => handleTimeChange(event, time, 'late_threshold', 'showLateThresholdPicker')}
              />
            )}
            <Text style={styles.helperText}>
              Siswa dianggap terlambat jika datang setelah waktu ini
            </Text>
          </View>
        ) : (
          <View style={styles.nestedInput}>
            <Text style={styles.nestedLabel}>Batas Waktu Terlambat (menit)</Text>
            <TextInput
              style={styles.minutesInput}
              value={formData.late_minutes_threshold.toString()}
              onChangeText={(value) => handleChange('late_minutes_threshold', parseInt(value) || 0)}
              keyboardType="number-pad"
              placeholder="15"
            />
            <Text style={styles.helperText}>
              Siswa dianggap terlambat jika datang {formData.late_minutes_threshold} menit setelah waktu mulai
            </Text>
          </View>
        )}
      </View>
      
      {/* NEW: Conflict warning display */}
      {conflictWarning && (
        <View style={styles.warningContainer}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={20} color="#f39c12" />
          </View>
          <Text style={styles.warningText}>{conflictWarning}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button
          title={isEditing ? 'Perbarui Aktivitas' : 'Buat Aktivitas'}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          fullWidth
        />
        
        <Button
          title="Batal"
          onPress={() => navigation.goBack()}
          type="outline"
          disabled={loading}
          fullWidth
          style={styles.cancelButton}
        />
      </View>
      
      {loading && (
        <LoadingSpinner 
          fullScreen 
          message={isEditing ? 'Memperbarui aktivitas...' : 'Membuat aktivitas...'}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, color: '#34495e', marginBottom: 8, fontWeight: '500' },
  required: { color: '#e74c3c' },
  typeButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  typeButton: {
    flex: 1, backgroundColor: '#f5f5f5', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 8, alignItems: 'center', marginHorizontal: 4,
    borderWidth: 1, borderColor: '#ddd'
  },
  typeButtonActive: { backgroundColor: '#3498db', borderColor: '#3498db' },
  typeButtonText: { fontSize: 16, color: '#34495e', fontWeight: '500' },
  typeButtonTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16
  },
  disabledInput: { backgroundColor: '#f0f0f0', color: '#7f8c8d' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerContainer: {
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, overflow: 'hidden'
  },
  picker: { height: 50 },
  infoContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f4f8',
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bce0f4'
  },
  infoText: { flex: 1, marginLeft: 8, color: '#2c88a6', fontSize: 14 },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10
  },
  dateText: { fontSize: 16, color: '#34495e' },
  timeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10
  },
  timeText: { fontSize: 16, color: '#34495e' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
  switchContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12
  },
  switchLabel: { fontSize: 16, color: '#34495e' },
  nestedInput: {
    marginTop: 8, marginLeft: 8, paddingLeft: 12,
    borderLeftWidth: 2, borderLeftColor: '#f0f0f0'
  },
  nestedLabel: { fontSize: 14, color: '#7f8c8d', marginBottom: 6 },
  minutesInput: {
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 16, width: '50%'
  },
  helperText: {
    fontSize: 12, color: '#95a5a6', marginTop: 6, fontStyle: 'italic'
  },
  durationWarning: {
    color: '#e67e22'
  },
  buttonContainer: { marginTop: 20 },
  cancelButton: { marginTop: 12 },
  loadingContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd'
  },
  loadingText: { marginLeft: 8, color: '#7f8c8d' },
  errorContainer: { marginVertical: 0 },
  // NEW: Warning styles
  warningContainer: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff3cd', borderWidth: 1, borderColor: '#ffeaa7',
    borderRadius: 8, padding: 12, marginBottom: 16
  },
  warningIcon: { marginRight: 8, marginTop: 2 },
  warningText: {
    flex: 1, fontSize: 14, color: '#856404',
    lineHeight: 18
  }
});

export default ActivityFormScreen;