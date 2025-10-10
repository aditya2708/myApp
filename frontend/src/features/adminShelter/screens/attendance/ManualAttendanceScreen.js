import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert,
  ActivityIndicator, SafeAreaView, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isToday, isFuture, isPast, startOfDay } from 'date-fns';
import NetInfo from '@react-native-community/netinfo';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

import { adminShelterAnakApi } from '../../api/adminShelterAnakApi';
import { adminShelterKelompokApi } from '../../api/adminShelterKelompokApi';
import { aktivitasApi } from '../../api/aktivitasApi';
import { adminShelterTutorApi } from '../../api/adminShelterTutorApi';

import {
  recordAttendanceManually, selectAttendanceLoading, selectAttendanceError,
  selectDuplicateError, resetAttendanceError
} from '../../redux/attendanceSlice';
import {
  recordTutorAttendanceManually, selectTutorAttendanceLoading,
  selectTutorAttendanceError, resetTutorAttendanceError
} from '../../redux/tutorAttendanceSlice';

import OfflineSync from '../../utils/offlineSync';

const ManualAttendanceScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  
  const { 
    id_aktivitas, activityName, activityDate, kelompokId, kelompokName, activityType 
  } = route.params || {};
  
  const loading = useSelector(selectAttendanceLoading);
  const error = useSelector(selectAttendanceError);
  const duplicateError = useSelector(selectDuplicateError);
  const tutorLoading = useSelector(selectTutorAttendanceLoading);
  const tutorError = useSelector(selectTutorAttendanceError);
  
  const [mode, setMode] = useState('student');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [notes, setNotes] = useState('');
  const [students, setStudents] = useState([]);
  const [tutorList, setTutorList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [studentError, setStudentError] = useState(null);
  const [tutorLoadError, setTutorError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isBimbel, setIsBimbel] = useState(activityType === 'Bimbel');
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [activityTutor, setActivityTutor] = useState(null);
  const [activityDetails, setActivityDetails] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [expectedStatus, setExpectedStatus] = useState('present');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [dateStatus, setDateStatus] = useState('valid');
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });
    return unsubscribe;
  }, []);
  
  useEffect(() => {
    setIsBimbel(activityType === 'Bimbel');
    fetchActivityDetails();
    fetchActivityTutor();
    validateDate();
  }, [activityType, id_aktivitas, activityDate]);
  
  useEffect(() => {
    if (mode === 'student' && dateStatus === 'valid') {
      isBimbel && kelompokId ? fetchStudentsByGroup(kelompokId) : fetchAllStudents();
    }
  }, [mode, isBimbel, kelompokId, dateStatus]);
  
  useEffect(() => {
    if (mode === 'tutor' && dateStatus === 'valid') {
      fetchTutors();
    }
  }, [mode, dateStatus]);
  
  useEffect(() => {
    if (duplicateError) setShowDuplicate(true);
    return () => dispatch(resetAttendanceError());
  }, [duplicateError, dispatch]);
  
  useEffect(() => {
    updateExpectedStatus();
  }, [arrivalTime, activityDetails]);
  
  const validateDate = () => {
    if (!activityDate) { setDateStatus('unknown'); return; }
    
    const today = startOfDay(new Date());
    const actDate = startOfDay(new Date(activityDate));
    
    setDateStatus(isFuture(actDate) ? 'future' : isPast(actDate) ? 'past' : 'valid');
  };
  
  const fetchActivityDetails = async () => {
    if (!id_aktivitas) return;
    setLoadingActivity(true);
    try {
      const response = await aktivitasApi.getAktivitasDetail(id_aktivitas);
      if (response.data?.data) setActivityDetails(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil detail aktivitas:', err);
    } finally {
      setLoadingActivity(false);
    }
  };
  
  const fetchActivityTutor = async () => {
    if (!id_aktivitas) return;
    try {
      const response = await aktivitasApi.getAktivitasDetail(id_aktivitas);
      if (response.data?.data?.tutor) setActivityTutor(response.data.data.tutor);
    } catch (error) {
      console.error('Error mengambil tutor aktivitas:', error);
    }
  };
  
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
  
  const fetchAllStudents = async () => {
    setLoadingStudents(true);
    setStudentError(null);
    try {
      let allStudents = [];
      const response = await adminShelterAnakApi.getAllAnak({ page: 1 });
      
      if (response.data?.pagination) {
        const { last_page } = response.data.pagination;
        allStudents = [...response.data.data];
        
        if (last_page > 1) {
          for (let page = 2; page <= last_page; page++) {
            const pageResponse = await adminShelterAnakApi.getAllAnak({ page });
            if (pageResponse.data?.data) {
              allStudents = [...allStudents, ...pageResponse.data.data];
            }
          }
        }
      } else {
        const fallback = await adminShelterAnakApi.getAllAnak({ per_page: 1000 });
        allStudents = fallback.data?.data || [];
      }
      
      setStudents(allStudents.filter(s => s.status_validasi === 'aktif'));
    } catch (err) {
      console.error('Gagal mengambil siswa:', err);
      setStudentError('Gagal memuat siswa. Silakan coba lagi.');
    } finally {
      setLoadingStudents(false);
    }
  };
  
  const fetchStudentsByGroup = async (kelompokId) => {
    setLoadingStudents(true);
    setStudentError(null);
    try {
      const response = await adminShelterKelompokApi.getGroupChildren(kelompokId);
      if (response.data?.data) {
        setStudents(response.data.data.filter(s => s.status_validasi === 'aktif'));
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Gagal mengambil siswa kelompok:', err);
      setStudentError('Gagal memuat siswa kelompok. Menggunakan semua siswa.');
      fetchAllStudents();
    } finally {
      setLoadingStudents(false);
    }
  };
  
  const fetchTutors = async () => {
    setLoadingTutors(true);
    setTutorLoadError(null);
    try {
      const response = await adminShelterTutorApi.getActiveTutors();
      setTutorList(response.data?.data || []);
    } catch (err) {
      console.error('Gagal mengambil tutor:', err);
      setTutorLoadError('Gagal memuat tutor...');
    } finally {
      setLoadingTutors(false);
    }
  };
  
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setArrivalTime(selectedTime);
  };

  const filteredStudents = students.filter(student => 
    (student.full_name || student.nick_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const renderStudentItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, selectedStudent?.id_anak === item.id_anak && styles.selectedItem]}
      onPress={() => setSelectedStudent(item)}
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
      {selectedStudent?.id_anak === item.id_anak && (
        <Ionicons name="checkmark-circle" size={24} color="#3498db" />
      )}
    </TouchableOpacity>
  );
  
  const handleSubmit = () => {
    if (dateStatus === 'future') {
      Alert.alert('Error', 'Aktivitas belum dimulai. Silakan tunggu sampai tanggal aktivitas.');
      return;
    }
    
    if (mode === 'student') {
      if (!selectedStudent) {
        Alert.alert('Error', 'Silakan pilih siswa');
        return;
      }
      
      if (!notes) {
        Alert.alert('Error', 'Silakan masukkan catatan verifikasi');
        return;
      }
      
      if (dateStatus === 'past') {
        Alert.alert(
          'Aktivitas Lampau', 
          'Aktivitas ini sudah berlalu. Kehadiran akan ditandai sebagai tidak hadir. Lanjutkan?',
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Lanjutkan', onPress: () => {
              const formattedTime = format(arrivalTime, 'yyyy-MM-dd HH:mm:ss');
              const attendanceData = {
                id_anak: selectedStudent.id_anak, id_aktivitas, status: null,
                notes, arrival_time: formattedTime
              };
              submitStudentAttendance(attendanceData);
            }}
          ]
        );
        return;
      }

      const formattedTime = format(arrivalTime, 'yyyy-MM-dd HH:mm:ss');
      const attendanceData = {
        id_anak: selectedStudent.id_anak, id_aktivitas, status: null,
        notes, arrival_time: formattedTime
      };
      submitStudentAttendance(attendanceData);
    } else {
      if (!selectedTutor) {
        Alert.alert('Error', 'Silakan pilih tutor');
        return;
      }
      
      if (!notes) {
        Alert.alert('Error', 'Silakan masukkan catatan verifikasi');
        return;
      }
      
      if (!activityTutor || activityTutor.id_tutor !== selectedTutor.id_tutor) {
        Alert.alert('Error', 'Tutor yang dipilih tidak ditugaskan untuk aktivitas ini');
        return;
      }
      
      if (dateStatus === 'past') {
        Alert.alert(
          'Aktivitas Lampau', 
          'Aktivitas ini sudah berlalu. Kehadiran akan ditandai sebagai tidak hadir. Lanjutkan?',
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Lanjutkan', onPress: () => {
              const formattedTime = format(arrivalTime, 'yyyy-MM-dd HH:mm:ss');
              const tutorData = {
                id_tutor: selectedTutor.id_tutor, id_aktivitas, status: null,
                notes, arrival_time: formattedTime
              };
              submitTutorAttendance(tutorData);
            }}
          ]
        );
        return;
      }

      const formattedTime = format(arrivalTime, 'yyyy-MM-dd HH:mm:ss');
      const tutorData = {
        id_tutor: selectedTutor.id_tutor, id_aktivitas, status: null,
        notes, arrival_time: formattedTime
      };
      submitTutorAttendance(tutorData);
    }
  };

  const submitStudentAttendance = async (attendanceData) => {
    try {
      if (isConnected) {
        await dispatch(recordAttendanceManually(attendanceData)).unwrap();
        Alert.alert('Berhasil', 'Kehadiran siswa berhasil dicatat', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const result = await OfflineSync.processAttendance(attendanceData, 'manual');
        Alert.alert('Mode Offline', result.message || 'Disimpan untuk sinkronisasi saat online', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      if (!err.isDuplicate) {
        Alert.alert('Error', err.message || 'Gagal mencatat kehadiran');
      }
    }
  };
  
  const submitTutorAttendance = async (tutorData) => {
    try {
      if (isConnected) {
        await dispatch(recordTutorAttendanceManually(tutorData)).unwrap();
        Alert.alert('Berhasil', 'Kehadiran tutor berhasil dicatat', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const result = await OfflineSync.processTutorAttendance(tutorData, 'manual');
        Alert.alert('Mode Offline', result.message || 'Disimpan untuk sinkronisasi saat online', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      if (!err.isDuplicate) {
        Alert.alert('Error', err.message || 'Gagal mencatat kehadiran tutor');
      }
    }
  };
  
  const closeDuplicateAlert = () => {
    setShowDuplicate(false);
    dispatch(resetAttendanceError());
  };

  const getStatusColor = (status) => ({
    absent: '#e74c3c', late: '#f39c12', present: '#2ecc71'
  }[status] || '#2ecc71');

  const getStatusIcon = (status) => ({
    absent: 'close-circle', late: 'time', present: 'checkmark-circle'
  }[status] || 'checkmark-circle');

  const getDateStatusInfo = () => {
    switch(dateStatus) {
      case 'future':
        return { show: true, color: '#f39c12', icon: 'time-outline', text: 'Aktivitas belum dimulai - form dinonaktifkan' };
      case 'past':
        return { show: true, color: '#e74c3c', icon: 'alert-circle', text: 'Aktivitas lampau - kehadiran akan ditandai tidak hadir' };
      default:
        return { show: false };
    }
  };

  const isFormDisabled = dateStatus === 'future';
  const statusInfo = getDateStatusInfo();
  
  const Header = () => (
    <>
      {mode === 'student' ? (
        <>
          <Text style={styles.label}>
            {`Siswa${isBimbel ? ` dari ${kelompokName || 'kelompok ini'}` : ''}`}
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
      ) : (
        <>
          <Text style={styles.label}>Tutor</Text>
          
          {loadingTutors ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.loadingText}>Memuat tutor...</Text>
            </View>
          ) : tutorLoadError ? (
            <ErrorMessage message={tutorLoadError} onRetry={fetchTutors} style={styles.errorContainer} />
          ) : !isFormDisabled ? (
            <View style={styles.tutorContainer}>
              {tutorList.map(tutor => (
                <TouchableOpacity
                  key={tutor.id_tutor}
                  style={[
                    styles.tutorItem,
                    selectedTutor?.id_tutor === tutor.id_tutor && styles.selectedTutorItem,
                    activityTutor?.id_tutor === tutor.id_tutor && styles.assignedTutorItem,
                    isFormDisabled && styles.disabledItem
                  ]}
                  onPress={() => !isFormDisabled && setSelectedTutor(tutor)}
                  disabled={isFormDisabled}
                >
                  <View style={styles.tutorAvatar}>
                    <Ionicons name="person" size={24} color="#95a5a6" />
                  </View>
                  <View style={styles.tutorInfo}>
                    <Text style={styles.tutorName}>{tutor.nama}</Text>
                    <Text style={styles.tutorId}>ID: {tutor.id_tutor}</Text>
                    {activityTutor?.id_tutor === tutor.id_tutor && (
                      <Text style={styles.assignedLabel}>Ditugaskan untuk Aktivitas</Text>
                    )}
                  </View>
                  {selectedTutor?.id_tutor === tutor.id_tutor && (
                    <Ionicons name="checkmark-circle" size={24} color="#3498db" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </>
      )}
    </>
  );
  
  const Footer = () => (
    <>
      {!isFormDisabled && (
        <>
          <View style={styles.formSection}>
            <Text style={styles.label}>Waktu Kedatangan</Text>
            <TouchableOpacity 
              style={[styles.timeButton, isFormDisabled && styles.disabledButton]}
              onPress={() => !isFormDisabled && setShowTimePicker(true)}
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
                onChange={handleTimeChange}
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
              onChangeText={setNotes}
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
          onPress={handleSubmit}
          disabled={loading || tutorLoading || isFormDisabled}
        >
          {(loading || tutorLoading) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.submitText, isFormDisabled && styles.disabledSubmitText]}>
              {isFormDisabled ? 'Form Dinonaktifkan' : `Catat Kehadiran ${mode === 'student' ? 'Siswa' : 'Tutor'}`}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading || tutorLoading}
        >
          <Text style={styles.cancelText}>Batal</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const isAnyLoading = loading || tutorLoading || loadingStudents || loadingTutors || loadingActivity;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{activityName || 'Aktivitas'}</Text>
          <Text style={styles.activityDate}>{activityDate || 'Tanggal tidak ditentukan'}</Text>
          
          {isBimbel && kelompokName && (
            <View style={styles.kelompokContainer}>
              <Text style={styles.kelompokInfo}>Kelompok: {kelompokName}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.modeContainer}>
          <Text style={styles.modeLabel}>Mode Kehadiran</Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'student' && styles.modeButtonActive,
                isFormDisabled && styles.disabledButton
              ]}
              onPress={() => !isFormDisabled && setMode('student')}
              disabled={isFormDisabled}
            >
              <Text style={[
                styles.modeButtonText,
                mode === 'student' && styles.modeButtonTextActive
              ]}>
                Siswa
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'tutor' && styles.modeButtonActive,
                isFormDisabled && styles.disabledButton
              ]}
              onPress={() => !isFormDisabled && setMode('tutor')}
              disabled={isFormDisabled}
            >
              <Text style={[
                styles.modeButtonText,
                mode === 'tutor' && styles.modeButtonTextActive
              ]}>
                Tutor
              </Text>
            </TouchableOpacity>
          </View>
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
              {duplicateError || 'Catatan kehadiran ini sudah ada untuk aktivitas ini'}
            </Text>
            <TouchableOpacity style={styles.duplicateClose} onPress={closeDuplicateAlert}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        {(error || tutorError) && <ErrorMessage message={error || tutorError} />}
        {studentError && <ErrorMessage message={studentError} onRetry={fetchAllStudents} />}
        
        <View style={styles.formContainer}>
          {isAnyLoading ? (
            <ActivityIndicator size="large" color="#3498db" style={styles.loadingIndicator} />
          ) : (
            mode === 'student' ? (
              <FlatList
                data={isFormDisabled ? [] : filteredStudents}
                renderItem={renderStudentItem}
                keyExtractor={(item) => item.id_anak.toString()}
                ListHeaderComponent={Header}
                ListFooterComponent={Footer}
                ListEmptyComponent={!isFormDisabled ? <Text style={styles.emptyText}>Tidak ada siswa ditemukan</Text> : null}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <FlatList
                data={[]}
                renderItem={() => null}
                ListHeaderComponent={Header}
                ListFooterComponent={Footer}
                contentContainerStyle={styles.listContent}
              />
            )
          )}
        </View>
        
        {isAnyLoading && (
          <LoadingSpinner
            fullScreen
            message={`Mencatat kehadiran ${mode === 'student' ? 'siswa' : 'tutor'}...`}
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
  disabledItem: { opacity: 0.5 },
  disabledSubmit: { backgroundColor: '#bdc3c7' },
  disabledSubmitText: { color: '#7f8c8d' },
  modeContainer: { backgroundColor: '#f8f9fa', padding: 16, marginBottom: 16 },
  modeLabel: { fontSize: 16, fontWeight: '500', color: '#2c3e50', marginBottom: 12 },
  modeButtons: {
    flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 8, padding: 4
  },
  modeButton: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 6, alignItems: 'center'
  },
  modeButtonActive: { backgroundColor: '#3498db' },
  modeButtonText: { fontSize: 14, fontWeight: '500', color: '#6c757d' },
  modeButtonTextActive: { color: '#fff' },
  tutorContainer: { backgroundColor: '#fff', borderRadius: 8, marginHorizontal: 16 },
  tutorItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  selectedTutorItem: { backgroundColor: '#e1f5fe' },
  assignedTutorItem: { backgroundColor: '#e8f5e8' },
  tutorAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: 16, fontWeight: '500', color: '#333' },
  tutorId: { fontSize: 12, color: '#777', marginTop: 2 },
  assignedLabel: { fontSize: 11, color: '#28a745', fontWeight: '500', marginTop: 2 },
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
  loadingContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20
  },
  loadingText: { marginLeft: 10, color: '#7f8c8d' },
  errorContainer: { margin: 16 }
});

export default ManualAttendanceScreen;
