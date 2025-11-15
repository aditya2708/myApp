import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert,
  ActivityIndicator, SafeAreaView, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isFuture, isPast, startOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

import { adminShelterAnakApi } from '../../api/adminShelterAnakApi';
import { adminShelterKelompokApi } from '../../api/adminShelterKelompokApi';
import { aktivitasApi } from '../../api/aktivitasApi';

import {
  recordAttendanceManually, selectAttendanceLoading, selectAttendanceError,
  selectDuplicateError, resetAttendanceError
} from '../../redux/attendanceSlice';
import OfflineSync from '../../utils/offlineSync';
import {
  MANUAL_ATTENDANCE_ACTIVITY_SET,
  MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET,
} from '../../constants/activityTypes';
import { isActivityCompleted, blockIfCompleted } from '../../utils/activityStatusHelper';

const STATUS_COLOR_MAP = {
  absent: '#e74c3c',
  late: '#f39c12',
  present: '#2ecc71'
};

const STATUS_ICON_MAP = {
  absent: 'close-circle',
  late: 'time',
  present: 'checkmark-circle'
};

const getStatusColor = (status) => STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP.present;
const getStatusIcon = (status) => STATUS_ICON_MAP[status] || STATUS_ICON_MAP.present;

const ManualAttendanceScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  
  const { 
    id_aktivitas, activityName, activityDate, kelompokId, kelompokIds, kelompokName, activityType, activityStatus 
  } = route.params || {};
  
  const loading = useSelector(selectAttendanceLoading);
  const error = useSelector(selectAttendanceError);
  const duplicateError = useSelector(selectDuplicateError);

  const resolvedKelompokIds = useMemo(() => {
    const ids = [];

    if (Array.isArray(kelompokIds)) {
      ids.push(...kelompokIds.filter(Boolean));
    }

    if (kelompokId) {
      ids.push(kelompokId);
    }

    return Array.from(new Set(ids));
  }, [kelompokId, kelompokIds]);

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [expectedStatus, setExpectedStatus] = useState('present');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const flatListRef = useRef(null);
  const footerPropsRef = useRef({});
  const ineligibleWarningShown = useRef(false);

  const dateStatus = useMemo(() => {
    if (!activityDate) {
      return 'unknown';
    }

    const today = startOfDay(new Date());
    const actDate = startOfDay(new Date(activityDate));

    if (isFuture(actDate)) {
      return 'future';
    }

    if (isPast(actDate)) {
      return 'past';
    }

    return 'valid';
  }, [activityDate]);

  const activityDetailQuery = useQuery({
    queryKey: ['manualAttendanceActivityDetail', id_aktivitas],
    enabled: !!id_aktivitas,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      if (!id_aktivitas) {
        return null;
      }

      const response = await aktivitasApi.getAktivitasDetail(id_aktivitas);
      return response?.data?.data || null;
    },
  });

  const activityDetails = activityDetailQuery.data || null;
  const loadingActivity = activityDetailQuery.isFetching;

  const effectiveActivityType = useMemo(() => {
    if (activityDetails?.jenis_kegiatan) {
      return activityDetails.jenis_kegiatan;
    }
    return activityType || null;
  }, [activityDetails?.jenis_kegiatan, activityType]);

  const isManualEligible = useMemo(() => {
    if (!effectiveActivityType) {
      return false;
    }

    if (MANUAL_ATTENDANCE_ACTIVITY_SET.has(effectiveActivityType)) {
      return true;
    }

    return MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET.has(effectiveActivityType.toLowerCase());
  }, [effectiveActivityType]);

  const studentsQuery = useQuery({
    queryKey: [
      'manualAttendanceStudents',
      {
        id: id_aktivitas || 'manual',
        groups: resolvedKelompokIds,
        eligible: isManualEligible,
        kelompok: kelompokId || null,
        dateStatus,
      },
    ],
    enabled: dateStatus === 'valid',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    queryFn: async () => {
      const uniqueGroupIds = Array.from(new Set(resolvedKelompokIds.filter(Boolean)));

      if (uniqueGroupIds.length > 0) {
        const responses = await Promise.all(
          uniqueGroupIds.map(async (groupId) => {
            try {
              return await adminShelterKelompokApi.getGroupChildren(groupId);
            } catch (error) {
              console.error('Error fetching kelompok students:', error);
              throw error;
            }
          })
        );

        const uniqueStudentsMap = new Map();

        responses.forEach((response) => {
          const list = response?.data?.data;
          if (!Array.isArray(list)) {
            return;
          }

          list.forEach((student) => {
            if (!student?.id_anak) {
              return;
            }
            if (student.status_validasi && student.status_validasi !== 'aktif') {
              return;
            }
            uniqueStudentsMap.set(student.id_anak, student);
          });
        });

        return Array.from(uniqueStudentsMap.values());
      }

      if (isManualEligible && kelompokId) {
        try {
          const response = await adminShelterKelompokApi.getGroupChildren(kelompokId);
          const list = response?.data?.data || [];
          return list.filter(
            (student) =>
              !student.status_validasi || student.status_validasi === 'aktif'
          );
        } catch (error) {
          console.error('Error fetching kelompok students:', error);
          throw error;
        }
      }

      try {
        let allStudents = [];
        const response = await adminShelterAnakApi.getAllAnak({ page: 1 });
        const pagination = response?.data?.pagination;
        const initialData = response?.data?.data || [];
        allStudents = [...initialData];

        if (pagination?.last_page && pagination.last_page > 1) {
          for (let page = 2; page <= pagination.last_page; page++) {
            const pageResponse = await adminShelterAnakApi.getAllAnak({ page });
            const pageData = pageResponse?.data?.data;
            if (Array.isArray(pageData)) {
              allStudents = allStudents.concat(pageData);
            }
          }
        } else if (!pagination) {
          const fallbackResponse = await adminShelterAnakApi.getAllAnak({ per_page: 1000 });
          allStudents = fallbackResponse?.data?.data || [];
        }

        return allStudents.filter(
          (student) => student.status_validasi === 'aktif'
        );
      } catch (error) {
        console.error('Gagal mengambil siswa:', error);
        throw error;
      }
    },
  });

  const students = dateStatus === 'valid' ? studentsQuery.data || [] : [];

  useEffect(() => {
    if (dateStatus === 'valid' && studentsQuery.isSuccess) {
      setSelectedStudents([]);
    }
  }, [dateStatus, studentsQuery.data, studentsQuery.isSuccess]);

  const studentErrorMessage = useMemo(() => {
    if (!studentsQuery.error) {
      return null;
    }

    const error = studentsQuery.error;
    if (typeof error?.message === 'string') {
      return error.message;
    }

    return 'Gagal memuat siswa. Silakan coba lagi.';
  }, [studentsQuery.error]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });
    return unsubscribe;
  }, []);
  
  useEffect(() => {
    if (duplicateError) setShowDuplicate(true);
    return () => dispatch(resetAttendanceError());
  }, [duplicateError, dispatch]);
  
  useEffect(() => {
    updateExpectedStatus();
  }, [arrivalTime, activityDetails, dateStatus]);

  useEffect(() => {
    if (
      effectiveActivityType &&
      !isManualEligible &&
      !ineligibleWarningShown.current
    ) {
      ineligibleWarningShown.current = true;
      Alert.alert(
        'Absen Manual Tidak Tersedia',
        'Jenis kegiatan ini tidak mendukung absen manual.',
        [
          {
            text: 'Oke',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    }
  }, [effectiveActivityType, isManualEligible, navigation]);

  // Check if activity is completed and block access
  useEffect(() => {
    const effectiveActivityStatus = activityStatus || activityDetails?.status;
    if (blockIfCompleted(effectiveActivityStatus, navigation, 'absen manual')) {
      return;
    }
  }, [activityStatus, activityDetails?.status, navigation]);
  
  const updateExpectedStatus = () => {
    if (!activityDetails || !arrivalTime) return;
    
    let status = 'present';
    
    if (dateStatus === 'past') {
      setExpectedStatus('absent');
      return;
    }
    
    if (activityDetails.end_time) {
      const actDate = new Date(activityDetails.tanggal);
      const [hours, minutes] = activityDetails.end_time.split(':');
      const endTime = new Date(actDate);
      endTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      
      if (arrivalTime > endTime) status = 'absent';
    }
    
    if (status !== 'absent' && activityDetails.start_time) {
      const actDate = new Date(activityDetails.tanggal);
      const [hours, minutes] = activityDetails.start_time.split(':');
      const startTime = new Date(actDate);
      startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      
      if (activityDetails.late_threshold) {
        const [lH, lM] = activityDetails.late_threshold.split(':');
        const lateThreshold = new Date(actDate);
        lateThreshold.setHours(parseInt(lH, 10), parseInt(lM, 10));
        
        if (arrivalTime > lateThreshold) status = 'late';
      } else if (activityDetails.late_minutes_threshold) {
        const lateThreshold = new Date(startTime);
        lateThreshold.setMinutes(lateThreshold.getMinutes() + activityDetails.late_minutes_threshold);
        
        if (arrivalTime > lateThreshold) status = 'late';
      }
    }
    
    setExpectedStatus(status);
  };
  
  const handleTimeChange = useCallback((event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setArrivalTime(selectedTime);
  }, []);

  const filteredStudents = students.filter(student =>
    (student.full_name || student.nick_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStudentSelection = (student) => {
    if (dateStatus !== 'valid') return;

    setSelectedStudents(prevSelected => {
      const isAlreadySelected = prevSelected.some(item => item.id_anak === student.id_anak);
      return isAlreadySelected
        ? prevSelected.filter(item => item.id_anak !== student.id_anak)
        : [...prevSelected, student];
    });
  };

  const renderStudentItem = ({ item }) => {
    const isSelected = selectedStudents.some(student => student.id_anak === item.id_anak);

    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => toggleStudentSelection(item)}
        disabled={dateStatus !== 'valid'}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#95a5a6" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>
            {item.full_name || item.nick_name || `Siswa ${item.id_anak}`}
          </Text>
          {item.id_anak && <Text style={styles.id}>ID: {item.id_anak}</Text>}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#3498db" />
        )}
      </TouchableOpacity>
    );
  };
  
  const handleSubmit = () => {
    if (dateStatus === 'future') {
      Alert.alert('Error', 'Aktivitas belum dimulai. Silakan tunggu sampai tanggal aktivitas.');
      return;
    }
    
    if (!selectedStudents.length) {
      Alert.alert('Error', 'Silakan pilih minimal satu siswa');
      return;
    }

    if (!notes) {
      Alert.alert('Error', 'Silakan masukkan catatan verifikasi');
      return;
    }

    const formattedTime = format(arrivalTime, 'yyyy-MM-dd HH:mm:ss');
    const attendancePayloads = selectedStudents.map(student => ({
      id_anak: student.id_anak,
      id_aktivitas,
      status: null,
      notes,
      arrival_time: formattedTime
    }));

    if (dateStatus === 'past') {
      Alert.alert(
        'Aktivitas Lampau',
        'Aktivitas ini sudah berlalu. Kehadiran akan ditandai sebagai tidak hadir. Lanjutkan?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Lanjutkan', onPress: () => submitStudentAttendance(attendancePayloads) }
        ]
      );
      return;
    }

    submitStudentAttendance(attendancePayloads);
  };

  const submitStudentAttendance = async (attendanceList) => {
    if (!attendanceList || !attendanceList.length) {
      return;
    }

    const currentSelection = [...selectedStudents];
    const successIds = [];
    const duplicateIds = [];
    const errorDetails = [];

    for (const attendanceData of attendanceList) {
      try {
        if (isConnected) {
          await dispatch(recordAttendanceManually(attendanceData)).unwrap();
        } else {
          await OfflineSync.processAttendance(attendanceData, 'manual');
        }
        successIds.push(attendanceData.id_anak);
      } catch (err) {
        if (err?.isDuplicate) {
          duplicateIds.push(attendanceData.id_anak);
        } else {
          errorDetails.push({ id: attendanceData.id_anak, message: err?.message });
        }
      }
    }

    const getStudentName = (id) => {
      const student = currentSelection.find(item => item.id_anak === id)
        || students.find(item => item.id_anak === id);
      return student?.full_name || student?.nick_name || `Siswa ${id}`;
    };

    const formatList = (ids) => ids.map(getStudentName).join(', ');

    const successCount = successIds.length;
    const duplicateCount = duplicateIds.length;
    const errorCount = errorDetails.length;

    let summaryTitle = 'Ringkasan';
    let summaryMessage = '';

    if (successCount > 0) {
      summaryMessage += isConnected
        ? `Berhasil memproses kehadiran untuk ${successCount} siswa.`
        : `Berhasil menyimpan ${successCount} kehadiran siswa untuk sinkronisasi offline.`;
    }

    if (duplicateCount > 0) {
      if (summaryMessage) summaryMessage += '\n';
      summaryMessage += `Duplikat (${duplicateCount}): ${formatList(duplicateIds)}.`;
    }

    if (errorCount > 0) {
      if (summaryMessage) summaryMessage += '\n';
      const errorNames = errorDetails.map(({ id, message }) =>
        `${getStudentName(id)}${message ? ` (${message})` : ''}`
      ).join(', ');
      summaryMessage += `Gagal (${errorCount}): ${errorNames}.`;
    }

    if (!summaryMessage) {
      summaryMessage = 'Tidak ada perubahan yang dicatat.';
    }

    if (successCount > 0) {
      setSelectedStudents([]);
    }

    Alert.alert(
      summaryTitle,
      summaryMessage,
      [
        {
          text: 'OK',
          onPress: () => {
            if (successCount > 0) {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };
  
  const closeDuplicateAlert = () => {
    setShowDuplicate(false);
    dispatch(resetAttendanceError());
  };

  const getDateStatusInfo = () => {
    if (!isManualEligible) {
      return {
        show: true,
        color: '#7f8c8d',
        icon: 'information-circle-outline',
        text: 'Jenis kegiatan ini tidak mendukung absen manual - form dinonaktifkan',
      };
    }

    switch(dateStatus) {
      case 'future':
        return { show: true, color: '#f39c12', icon: 'time-outline', text: 'Aktivitas belum dimulai - form dinonaktifkan' };
      case 'past':
        return { show: true, color: '#e74c3c', icon: 'alert-circle', text: 'Aktivitas lampau - kehadiran akan ditandai tidak hadir' };
      default:
        return { show: false };
    }
  };

  const isFormDisabled = dateStatus === 'future' || !isManualEligible;
  const statusInfo = getDateStatusInfo();
  const handleOpenTimePicker = useCallback(() => {
    if (!isFormDisabled) {
      setShowTimePicker(true);
    }
  }, [isFormDisabled, setShowTimePicker]);

  const handleNotesFocus = useCallback(() => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  footerPropsRef.current = {
    isFormDisabled,
    arrivalTime,
    onOpenTimePicker: handleOpenTimePicker,
    showTimePicker,
    onTimeChange: handleTimeChange,
    expectedStatus,
    notes,
    onChangeNotes: setNotes,
    onNotesFocus: handleNotesFocus,
    loading,
    onSubmit: handleSubmit,
    onCancel: handleCancel
  };

  const renderFooter = useCallback(
    () => <AttendanceFooter {...footerPropsRef.current} />,
    []
  );

  const Header = () => (
    <>
      <Text style={styles.label}>
        {`Siswa${isManualEligible ? ` dari ${kelompokName || 'kelompok ini'}` : ''}`}
      </Text>

      {!isFormDisabled && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari siswa..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            editable={!isFormDisabled}
          />
        </View>
      )}
    </>
  );
  
  const isAnyLoading = loading || studentsQuery.isFetching || loadingActivity;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior="padding"
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 30}
      >
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{activityName || 'Aktivitas'}</Text>
          <Text style={styles.activityDate}>{activityDate || 'Tanggal tidak ditentukan'}</Text>
          
          {isManualEligible && kelompokName && (
            <View style={styles.kelompokContainer}>
              <Text style={styles.kelompokInfo}>Kelompok: {kelompokName}</Text>
            </View>
          )}
        </View>
        
        {statusInfo.show && (
          <View style={[styles.statusAlert, { backgroundColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon} size={18} color="#fff" />
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        )}
        
        {!isConnected && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline" size={18} color="#fff" />
            <Text style={styles.offlineText}>Mode Offline - Data akan disinkronkan nanti</Text>
          </View>
        )}
        
        {showDuplicate && (
          <View style={styles.duplicateAlert}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.duplicateText}>
              {duplicateError || 'Beberapa catatan kehadiran sudah ada untuk aktivitas ini'}
            </Text>
            <TouchableOpacity style={styles.duplicateClose} onPress={closeDuplicateAlert}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        {error && <ErrorMessage message={error} />}
        {studentErrorMessage && (
          <ErrorMessage
            message={studentErrorMessage}
            onRetry={() => studentsQuery.refetch()}
          />
        )}
        
        <View style={styles.formContainer}>
          {isAnyLoading ? (
            <ActivityIndicator size="large" color="#3498db" style={styles.loadingIndicator} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={isFormDisabled ? [] : filteredStudents}
              renderItem={renderStudentItem}
              keyExtractor={(item) => item.id_anak.toString()}
              ListHeaderComponent={Header}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={!isFormDisabled ? <Text style={styles.emptyText}>Tidak ada siswa ditemukan</Text> : null}
              contentContainerStyle={[styles.listContent, { paddingBottom: isFormDisabled ? 24 : 160 }]}
              keyboardShouldPersistTaps="handled"
              extraData={{
                notes,
                selectedStudents,
                showTimePicker,
                expectedStatus,
                isFormDisabled,
                loading
              }}
            />
          )}
        </View>
        
        {isAnyLoading && (
          <LoadingSpinner
            fullScreen
            message="Mencatat kehadiran siswa..."
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  statusAlert: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    marginHorizontal: 16, marginBottom: 16, borderRadius: 8
  },
  statusText: {
    color: '#fff', marginLeft: 8, fontSize: 14, fontWeight: '500', flex: 1
  },
  disabledButton: { opacity: 0.5 },
  disabledInput: { backgroundColor: '#f5f5f5', color: '#999' },
  disabledSubmit: { backgroundColor: '#bdc3c7' },
  disabledSubmitText: { color: '#7f8c8d' },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  activityInfo: { backgroundColor: '#3498db', padding: 16, alignItems: 'center' },
  activityName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  activityDate: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  kelompokContainer: {
    marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.3)'
  },
  kelompokInfo: { fontSize: 14, color: '#fff' },
  offlineIndicator: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c', padding: 12
  },
  offlineText: { color: '#fff', marginLeft: 8, fontSize: 14 },
  duplicateAlert: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f39c12', padding: 12
  },
  duplicateText: { color: '#fff', marginLeft: 8, fontSize: 14, flex: 1 },
  duplicateClose: { padding: 5 },
  formContainer: { flex: 1, backgroundColor: '#f9f9f9' },
  label: {
    fontSize: 16, fontWeight: '500', marginTop: 16, marginBottom: 8,
    color: '#2c3e50', paddingHorizontal: 16
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 8, paddingHorizontal: 12, marginHorizontal: 16,
    marginBottom: 8, borderWidth: 1, borderColor: '#ddd'
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 16 },
  listContent: { flexGrow: 1, paddingBottom: 20 },
  item: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    marginHorizontal: 16, backgroundColor: '#fff'
  },
  selectedItem: { backgroundColor: '#e1f5fe' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: '#333' },
  id: { fontSize: 12, color: '#777' },
  emptyText: { textAlign: 'center', padding: 20, color: '#7f8c8d' },
  loadingIndicator: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  formSection: { marginBottom: 16, paddingHorizontal: 16 },
  timeButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 16
  },
  timeText: { fontSize: 16, marginLeft: 10, color: '#2c3e50' },
  expectedStatus: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2ecc71', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8
  },
  expectedText: { color: '#fff', fontSize: 16, fontWeight: '500', marginLeft: 8 },
  helperText: { fontSize: 12, color: '#95a5a6', marginTop: 6, fontStyle: 'italic' },
  notesInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, padding: 12, fontSize: 16, minHeight: 100
  },
  buttonSection: { marginTop: 8, marginBottom: 24, paddingHorizontal: 16 },
  submitButton: {
    backgroundColor: '#3498db', paddingVertical: 14, borderRadius: 8,
    alignItems: 'center', marginBottom: 12
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: {
    borderWidth: 1, borderColor: '#bdc3c7', paddingVertical: 14,
    borderRadius: 8, alignItems: 'center'
  },
  cancelText: { color: '#7f8c8d', fontSize: 16 },
});

const AttendanceFooter = React.memo(({
  isFormDisabled,
  arrivalTime,
  onOpenTimePicker,
  showTimePicker,
  onTimeChange,
  expectedStatus,
  notes,
  onChangeNotes,
  onNotesFocus,
  loading,
  onSubmit,
  onCancel
}) => (
  <>
    {!isFormDisabled && (
      <>
        <View style={styles.formSection}>
          <Text style={styles.label}>Waktu Kedatangan</Text>
          <TouchableOpacity 
            style={[styles.timeButton, isFormDisabled && styles.disabledButton]}
            onPress={onOpenTimePicker}
            disabled={isFormDisabled}
          >
            <Ionicons name="time-outline" size={20} color="#3498db" />
            <Text style={styles.timeText}>{format(arrivalTime, 'HH:mm')}</Text>
          </TouchableOpacity>
          
          {showTimePicker && (
            <DateTimePicker
              value={arrivalTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={onTimeChange}
            />
          )}
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.label}>Status yang Diharapkan</Text>
          <View style={[styles.expectedStatus, { backgroundColor: getStatusColor(expectedStatus) }]}>
            <Ionicons name={getStatusIcon(expectedStatus)} size={20} color="#fff" />
            <Text style={styles.expectedText}>
              {expectedStatus === 'present' ? 'Hadir' : expectedStatus === 'late' ? 'Terlambat' : 'Tidak Hadir'}
            </Text>
          </View>
          <Text style={styles.helperText}>
            Status ditentukan otomatis berdasarkan jadwal aktivitas dan waktu kedatangan
          </Text>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.label}>Catatan Verifikasi (Wajib)</Text>
          <TextInput
            style={[styles.notesInput, isFormDisabled && styles.disabledInput]}
            placeholder="Masukkan catatan verifikasi..."
            value={notes}
            onChangeText={onChangeNotes}
            onFocus={onNotesFocus}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isFormDisabled}
          />
        </View>
      </>
    )}
    
    <View style={styles.buttonSection}>
      <TouchableOpacity 
        style={[styles.submitButton, isFormDisabled && styles.disabledSubmit]}
        onPress={onSubmit}
        disabled={loading || isFormDisabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[styles.submitText, isFormDisabled && styles.disabledSubmitText]}>
            {isFormDisabled ? 'Form Dinonaktifkan' : 'Catat Kehadiran Siswa'}
          </Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={onCancel}
        disabled={loading}
      >
        <Text style={styles.cancelText}>Batal</Text>
      </TouchableOpacity>
    </View>
  </>
));

export default ManualAttendanceScreen;
