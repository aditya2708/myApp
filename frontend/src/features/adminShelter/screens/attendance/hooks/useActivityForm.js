import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import {
  createAktivitas,
  updateAktivitas,
  selectAktivitasLoading,
  selectAktivitasError,
  selectAktivitasConflicts,
  fetchAllMateri,
  setSelectedMateri,
  selectMateriCache,
  selectMateriCacheLoading,
  selectSelectedMateri,
  clearSelectedMateri,
} from '../../../redux/aktivitasSlice';
import {
  MIN_ACTIVITY_DURATION,
  parseBackendTime,
  calculateDurationMinutes,
  formatTimeDisplay,
  buildConflictAlertMessage,
  deriveKelompokDisplayLevel,
} from '../utils/activityFormUtils';
import useActivityResources from './useActivityResources';

const CONFLICT_SUGGESTIONS = [
  '- Pilih waktu yang berbeda',
  '- Pilih tutor lain yang tersedia',
  '- Untuk Bimbel, pilih kelompok yang berbeda',
];

const initialFormState = {
  jenis_kegiatan: '',
  id_kegiatan: null,
  level: '',
  nama_kelompok: '',
  materi: '',
  id_materi: null,
  tanggal: new Date(),
  selectedKelompokId: null,
  selectedKelompokIds: [],
  selectedKelompokObject: null,
  start_time: null,
  end_time: null,
  late_threshold: null,
  late_minutes_threshold: 15,
  id_tutor: null,
  pakai_materi_manual: false,
  mata_pelajaran_manual: '',
  materi_manual: '',
};

const initialUiState = {
  showDatePicker: false,
  showStartTimePicker: false,
  showEndTimePicker: false,
  showLateThresholdPicker: false,
  useCustomLateThreshold: false,
};

const useActivityForm = ({ activity, onSuccess }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const isEditing = Boolean(activity);

  const loading = useSelector(selectAktivitasLoading);
  const error = useSelector(selectAktivitasError);
  const conflicts = useSelector(selectAktivitasConflicts);

  const materiCache = useSelector(selectMateriCache);
  const materiCacheLoading = useSelector(selectMateriCacheLoading);
  const selectedMateriFromStore = useSelector(selectSelectedMateri);

  const [formData, setFormData] = useState(initialFormState);
  const [uiState, setUIState] = useState(initialUiState);
  const [conflictWarning, setConflictWarning] = useState(null);

  const {
    kegiatanOptions,
    kegiatanOptionsLoading,
    kegiatanOptionsError,
    kelompokList,
    tutorList,
    loadingStates,
    errors,
    fetchTutorData,
    fetchKelompokData,
    refetchKegiatanOptions,
  } = useActivityResources({
    activity,
    isEditing,
    formData,
    setFormData,
  });

  const selectedKegiatan = useMemo(
    () => kegiatanOptions.find(option => option.id_kegiatan === formData.id_kegiatan),
    [kegiatanOptions, formData.id_kegiatan],
  );

  const jenisKegiatan = selectedKegiatan?.nama_kegiatan || formData.jenis_kegiatan || '';
  const hasSelectedKegiatan = Boolean(formData.id_kegiatan);

  const initializeEditForm = useCallback(() => {
    if (!activity) return;

    const isManualMaterial = Boolean(activity.pakai_materi_manual) ||
      (!activity.id_materi && (!!activity.mata_pelajaran_manual || !!activity.materi_manual));
    const rawKelompokIds = Array.isArray(activity.kelompok_ids)
      ? activity.kelompok_ids.filter(Boolean)
      : [];
    const fallbackSelectedIds = Array.isArray(activity.selectedKelompokIds)
      ? activity.selectedKelompokIds.filter(Boolean)
      : [];
    const derivedSelectedId = activity.selectedKelompokId ||
      rawKelompokIds[0] ||
      fallbackSelectedIds[0] ||
      null;
    const initialKelompokIds = derivedSelectedId ? [derivedSelectedId] : [];
    const isAllKelompok = (activity.nama_kelompok || '').toLowerCase() === 'semua kelompok';
    const safeNamaKelompok = isAllKelompok ? '' : (activity.nama_kelompok || '');

    setFormData(prev => ({
      ...prev,
      jenis_kegiatan: activity.jenis_kegiatan || '',
      id_kegiatan: activity.id_kegiatan || activity.kegiatan?.id_kegiatan || null,
      level: activity.level || '',
      nama_kelompok: safeNamaKelompok,
      selectedKelompokId: derivedSelectedId,
      selectedKelompokIds: initialKelompokIds,
      materi: isManualMaterial
        ? (activity.materi_manual || activity.materi || '')
        : (activity.materi || ''),
      id_materi: isManualMaterial ? null : (activity.id_materi || null),
      tanggal: activity.tanggal ? new Date(activity.tanggal) : new Date(),
      start_time: parseBackendTime(activity.start_time),
      end_time: parseBackendTime(activity.end_time),
      late_threshold: parseBackendTime(activity.late_threshold),
      late_minutes_threshold: activity.late_minutes_threshold || 15,
      id_tutor: activity.tutor?.id_tutor || null,
      pakai_materi_manual: isManualMaterial,
      mata_pelajaran_manual: activity.mata_pelajaran_manual || '',
      materi_manual: activity.materi_manual || '',
    }));

    if (isManualMaterial) {
      dispatch(clearSelectedMateri());
    }

    setUIState(prev => ({
      ...prev,
      useCustomLateThreshold: activity.late_threshold !== null,
    }));
  }, [activity, dispatch]);

  useEffect(() => {
    if (isEditing && activity) {
      initializeEditForm();
    }
  }, [activity, initializeEditForm, isEditing]);

  useEffect(() => {
    dispatch(fetchAllMateri());
  }, [dispatch]);

  useEffect(() => {
    if (formData.id_materi && materiCache.length > 0) {
      const foundMateri = materiCache.find(m => m.id_materi === formData.id_materi);
      if (foundMateri) {
        dispatch(setSelectedMateri(foundMateri));
      } else {
        dispatch(clearSelectedMateri());
      }
    } else if (!formData.id_materi) {
      dispatch(clearSelectedMateri());
    }
  }, [dispatch, formData.id_materi, materiCache]);

  useEffect(() => {
    if (
      isEditing &&
      activity &&
      materiCache.length > 0 &&
      activity.id_materi &&
      !selectedMateriFromStore
    ) {
      const foundMateri = materiCache.find(m => m.id_materi === activity.id_materi);
      if (foundMateri) {
        dispatch(setSelectedMateri(foundMateri));
      }
    }
  }, [activity, dispatch, isEditing, materiCache, selectedMateriFromStore]);

  const handleChange = useCallback((name, value) => {
    if (name === 'id_tutor' || name === 'tanggal') {
      setFormData(prev => ({ ...prev, [name]: value }));
      setConflictWarning(null);
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleKegiatanChange = useCallback((kegiatanId) => {
    const normalizedId = kegiatanId || null;
    const selected = kegiatanOptions.find(option => option.id_kegiatan === normalizedId) || null;
    const nextJenis = selected?.nama_kegiatan || '';

    setFormData(prev => ({
      ...prev,
      id_kegiatan: normalizedId,
      jenis_kegiatan: nextJenis,
      level: '',
      nama_kelompok: '',
      selectedKelompokId: null,
      selectedKelompokIds: [],
      selectedKelompokObject: null,
      id_materi: null,
      materi: '',
      pakai_materi_manual: false,
      mata_pelajaran_manual: '',
      materi_manual: '',
    }));

    dispatch(clearSelectedMateri());
    setConflictWarning(null);
  }, [dispatch, kegiatanOptions]);

  const handleKelompokChange = useCallback((kelompokValue) => {
    const normalizedId = typeof kelompokValue === 'number'
      ? kelompokValue
      : (kelompokValue ? Number(kelompokValue) : null);
    const selected = normalizedId
      ? kelompokList.find(k => k.id_kelompok === normalizedId)
      : null;

    setFormData(prev => ({
      ...prev,
      selectedKelompokId: normalizedId,
      selectedKelompokIds: normalizedId ? [normalizedId] : [],
      selectedKelompokObject: selected || null,
      nama_kelompok: selected?.nama_kelompok || '',
      level: deriveKelompokDisplayLevel(selected),
      id_materi: null,
      materi: '',
    }));

    dispatch(clearSelectedMateri());
    setConflictWarning(null);
  }, [dispatch, kelompokList]);

  const toggleManualMateri = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      pakai_materi_manual: value,
      id_materi: value ? null : prev.id_materi,
      materi: value ? '' : prev.materi,
    }));

    if (value) {
      dispatch(clearSelectedMateri());
    }
  }, [dispatch]);

  const handleMateriSelect = useCallback((materi) => {
    if (!materi) {
      setFormData(prev => ({
        ...prev,
        id_materi: null,
        materi: '',
      }));
      dispatch(clearSelectedMateri());
      return;
    }

    setFormData(prev => ({
      ...prev,
      id_materi: materi.id_materi,
      materi: `${(materi.mataPelajaran?.nama_mata_pelajaran || materi.mata_pelajaran?.nama_mata_pelajaran || '').toString()} - ${(materi.nama_materi || '').toString()}`,
    }));
    dispatch(setSelectedMateri(materi));
  }, [dispatch]);

  const handleTimeChange = useCallback((event, selectedTime, field, pickerField) => {
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
  }, []);

  const toggleCustomLateThreshold = useCallback((value) => {
    setUIState(prev => ({ ...prev, useCustomLateThreshold: value }));

    if (!value) {
      handleChange('late_threshold', null);
    } else if (formData.start_time && !formData.late_threshold) {
      const lateTime = new Date(formData.start_time);
      lateTime.setMinutes(lateTime.getMinutes() + formData.late_minutes_threshold);
      handleChange('late_threshold', lateTime);
    }
  }, [formData.late_minutes_threshold, formData.late_threshold, formData.start_time, handleChange]);

  const durationMinutes = useMemo(
    () => calculateDurationMinutes(formData.start_time, formData.end_time),
    [formData.start_time, formData.end_time],
  );

  useEffect(() => {
    const checkPotentialConflicts = () => {
      if (!formData.tanggal || !formData.start_time || !formData.end_time || !formData.id_tutor) {
        setConflictWarning(null);
        return;
      }

      if (formData.start_time >= formData.end_time) {
        setConflictWarning(null);
        return;
      }

      const selectedTutor = tutorList.find(t => t.id_tutor === formData.id_tutor);
      const tutorName = selectedTutor?.nama || 'Tutor terpilih';
      const timeRange = `${formatTimeDisplay(formData.start_time)} - ${formatTimeDisplay(formData.end_time)}`;
      const dateStr = format(formData.tanggal, 'dd/MM/yyyy', { locale: id });

      setConflictWarning(
        `Pastikan tidak ada konflik: ${tutorName} pada ${dateStr} jam ${timeRange}${
          formData.nama_kelompok ? ` untuk kelompok ${formData.nama_kelompok}` : ''
        }`,
      );
    };

    const timeoutId = setTimeout(() => {
      checkPotentialConflicts();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    formData.end_time,
    formData.id_tutor,
    formData.nama_kelompok,
    formData.start_time,
    formData.tanggal,
    tutorList,
  ]);

  const validateForm = useCallback(() => {
    if (!formData.id_kegiatan || !jenisKegiatan || !formData.tanggal) {
      Alert.alert('Error Validasi', 'Jenis kegiatan dan tanggal wajib diisi');
      return false;
    }

    if (!formData.id_tutor) {
      Alert.alert('Error Validasi', 'Silakan pilih tutor untuk aktivitas ini');
      return false;
    }

    if (!formData.selectedKelompokId) {
      Alert.alert('Error Validasi', 'Silakan pilih kelompok untuk aktivitas ini');
      return false;
    }

    if (formData.pakai_materi_manual) {
      if (!formData.mata_pelajaran_manual?.trim() || !formData.materi_manual?.trim()) {
        Alert.alert('Error Validasi', 'Silakan isi mata pelajaran dan materi manual');
        return false;
      }
    } else if (!formData.id_materi) {
      Alert.alert('Error Validasi', 'Silakan pilih materi dari daftar');
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

    if (
      uiState.useCustomLateThreshold &&
      formData.late_threshold &&
      formData.start_time &&
      formData.late_threshold < formData.start_time
    ) {
      Alert.alert('Error Validasi', 'Batas terlambat harus setelah waktu mulai');
      return false;
    }

    return true;
  }, [
    durationMinutes,
    formData.end_time,
    formData.id_kegiatan,
    formData.id_materi,
    formData.id_tutor,
    formData.late_threshold,
    formData.materi_manual,
    formData.mata_pelajaran_manual,
    formData.pakai_materi_manual,
    formData.selectedKelompokId,
    formData.start_time,
    formData.tanggal,
    jenisKegiatan,
    uiState.useCustomLateThreshold,
  ]);

  const prepareFormData = useCallback(() => {
    const effectiveKelompokId = formData.selectedKelompokId ||
      (
        Array.isArray(formData.selectedKelompokIds) &&
        formData.selectedKelompokIds.find(id => !!id)
      ) ||
      null;

    const resolvedKelompokObject = formData.selectedKelompokObject ||
      (effectiveKelompokId
        ? kelompokList.find(item => item.id_kelompok === effectiveKelompokId)
        : null);

    const resolvedKelompokName = resolvedKelompokObject?.nama_kelompok ||
      (
        formData.nama_kelompok &&
        formData.nama_kelompok.toLowerCase() !== 'semua kelompok'
          ? formData.nama_kelompok
          : ''
      ) ||
      '';

    const resolvedLevel = resolvedKelompokObject
      ? deriveKelompokDisplayLevel(resolvedKelompokObject)
      : (formData.level || '');

    if (isEditing) {
      const data = {
        jenis_kegiatan: jenisKegiatan,
        id_kegiatan: formData.id_kegiatan,
        tanggal: format(formData.tanggal, 'yyyy-MM-dd'),
      };

      if (formData.id_tutor) data.id_tutor = formData.id_tutor;

      data.level = resolvedLevel;
      data.nama_kelompok = resolvedKelompokName;

      if (effectiveKelompokId) {
        data.kelompok_id = effectiveKelompokId;
        data.kelompok_ids = [effectiveKelompokId];
      }

      const materiPayload = formData.pakai_materi_manual
        ? formData.materi_manual || ''
        : formData.materi || '';

      if (formData.pakai_materi_manual) {
        data.id_materi = null;
      } else if (formData.id_materi) {
        data.id_materi = formData.id_materi;
      }

      data.materi = materiPayload;
      data.pakai_materi_manual = formData.pakai_materi_manual;
      data.mata_pelajaran_manual = formData.pakai_materi_manual ? formData.mata_pelajaran_manual : '';
      data.materi_manual = formData.pakai_materi_manual ? formData.materi_manual : '';

      if (formData.start_time) data.start_time = format(formData.start_time, 'HH:mm:ss');
      if (formData.end_time) data.end_time = format(formData.end_time, 'HH:mm:ss');

      if (uiState.useCustomLateThreshold && formData.late_threshold) {
        data.late_threshold = format(formData.late_threshold, 'HH:mm:ss');
      } else {
        data.late_minutes_threshold = formData.late_minutes_threshold;
      }

      return data;
    }

    const data = new FormData();
    data.append('jenis_kegiatan', jenisKegiatan);
    data.append('id_kegiatan', String(formData.id_kegiatan));

    if (formData.id_tutor) data.append('id_tutor', formData.id_tutor);

    data.append('level', resolvedLevel);
    data.append('nama_kelompok', resolvedKelompokName);

    if (effectiveKelompokId) {
      data.append('kelompok_id', String(effectiveKelompokId));
      data.append('kelompok_ids', JSON.stringify([effectiveKelompokId]));
    }

    const materiPayload = formData.pakai_materi_manual
      ? formData.materi_manual || ''
      : formData.materi || '';

    data.append('materi', materiPayload);
    data.append('pakai_materi_manual', formData.pakai_materi_manual ? '1' : '0');
    data.append('mata_pelajaran_manual', formData.pakai_materi_manual ? formData.mata_pelajaran_manual : '');
    data.append('materi_manual', formData.pakai_materi_manual ? formData.materi_manual : '');

    if (!formData.pakai_materi_manual && formData.id_materi) {
      data.append('id_materi', String(formData.id_materi));
    }

    data.append('tanggal', format(formData.tanggal, 'yyyy-MM-dd'));
    if (formData.start_time) data.append('start_time', format(formData.start_time, 'HH:mm:ss'));
    if (formData.end_time) data.append('end_time', format(formData.end_time, 'HH:mm:ss'));

    if (uiState.useCustomLateThreshold && formData.late_threshold) {
      data.append('late_threshold', format(formData.late_threshold, 'HH:mm:ss'));
    } else {
      data.append('late_minutes_threshold', String(formData.late_minutes_threshold));
    }

    return data;
  }, [
    formData.end_time,
    formData.id_kegiatan,
    formData.id_materi,
    formData.id_tutor,
    formData.late_minutes_threshold,
    formData.late_threshold,
    formData.level,
    formData.materi,
    formData.materi_manual,
    formData.mata_pelajaran_manual,
    formData.nama_kelompok,
    formData.selectedKelompokIds,
    formData.selectedKelompokId,
    formData.selectedKelompokObject,
    formData.pakai_materi_manual,
    formData.start_time,
    formData.tanggal,
    kelompokList,
    isEditing,
    jenisKegiatan,
    uiState.useCustomLateThreshold,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const data = prepareFormData();

    try {
      if (isEditing) {
        const result = await dispatch(updateAktivitas({ 
          id: activity.id_aktivitas, 
          aktivitasData: data, 
          queryClient 
        })).unwrap();
        Alert.alert('Berhasil', 'Aktivitas berhasil diperbarui', [
          { text: 'Oke', onPress: () => onSuccess?.(result?.data || result) },
        ]);
      } else {
        const result = await dispatch(createAktivitas({ 
          aktivitasData: data, 
          queryClient 
        })).unwrap();
        Alert.alert('Berhasil', 'Aktivitas berhasil dibuat', [
          { text: 'Oke', onPress: () => onSuccess?.(result?.data || result) },
        ]);
      }
    } catch (err) {
      console.error('Error menyimpan aktivitas:', err);

      const errorConflicts = err?.conflicts || err?.response?.data?.conflicts || conflicts;
      const errorMessage = err?.message || err?.response?.data?.message || error || 'Gagal menyimpan aktivitas';

      if (errorConflicts && errorConflicts.length > 0) {
        const conflictList = buildConflictAlertMessage(errorConflicts);

        Alert.alert(
          'Jadwal Bentrok Ditemukan',
          `${errorMessage}\n\nDetail konflik:\n${conflictList}\n\nSaran penyelesaian:\n${CONFLICT_SUGGESTIONS.join('\n')}`,
          [{ text: 'Mengerti', style: 'default' }],
        );
      } else {
        Alert.alert('Gagal Menyimpan', errorMessage, [{ text: 'Oke' }]);
      }
    }
  }, [activity, conflicts, dispatch, error, isEditing, onSuccess, prepareFormData, queryClient, validateForm]);

  return {
    isEditing,
    loading,
    error,
    materiCache,
    materiCacheLoading,
    selectedMateriFromStore,
    kegiatanOptions,
    kegiatanOptionsLoading,
    kegiatanOptionsError,
    kelompokList,
    tutorList,
    loadingStates,
    errors,
    formData,
    uiState,
    conflictWarning,
    durationMinutes,
    hasSelectedKegiatan,
    setUIState,
    handleChange,
    handleKegiatanChange,
    handleKelompokChange,
    toggleManualMateri,
    handleMateriSelect,
    handleTimeChange,
    toggleCustomLateThreshold,
    fetchTutorData,
    fetchKelompokData,
    refetchKegiatanOptions,
    handleSubmit,
  };
};

export default useActivityForm;
