import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Alert, Animated, SafeAreaView, Vibration
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { Audio } from 'expo-av';
import { format, startOfDay, isFuture, isPast } from 'date-fns';

import QrScanner from '../../components/QrScanner';
import {
  validateToken, selectQrTokenLoading, selectValidationResult, resetValidationResult
} from '../../redux/qrTokenSlice';
import {
  recordAttendanceByQr, selectAttendanceLoading, selectAttendanceError,
  selectDuplicateError, resetAttendanceError
} from '../../redux/attendanceSlice';
import {
  recordTutorAttendanceByQr, selectTutorAttendanceLoading,
  selectTutorAttendanceError, selectTutorDuplicateError, resetTutorAttendanceError
} from '../../redux/tutorAttendanceSlice';

import OfflineSync from '../../utils/offlineSync';
import { adminShelterKelompokApi } from '../../api/adminShelterKelompokApi';
import { tutorAttendanceApi } from '../../api/tutorAttendanceApi';

const QrScannerScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sound = useRef(null);
  
  const { 
    id_aktivitas, activityName, activityDate, activityType, kelompokId, kelompokIds, kelompokName
  } = route.params || {};
  
  const tokenLoading = useSelector(selectQrTokenLoading);
  const validationResult = useSelector(selectValidationResult);
  const attendanceLoading = useSelector(selectAttendanceLoading);
  const attendanceError = useSelector(selectAttendanceError);
  const duplicateError = useSelector(selectDuplicateError);
  const tutorAttendanceLoading = useSelector(selectTutorAttendanceLoading);
  const tutorAttendanceError = useSelector(selectTutorAttendanceError);
  const tutorDuplicateError = useSelector(selectTutorDuplicateError);
  
  const [isConnected, setIsConnected] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isBimbelActivity, setIsBimbelActivity] = useState(activityType === 'Bimbel');
  const [kelompokStudentIds, setKelompokStudentIds] = useState([]);
  const [loadingKelompokData, setLoadingKelompokData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activityDateStatus, setActivityDateStatus] = useState('valid');

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

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound: cameraSound } = await Audio.Sound.createAsync(
          require('../../../../assets/sounds/camera-shutter.wav')
        );
        sound.current = cameraSound;
      } catch (error) {
        console.error('Gagal memuat suara', error);
      }
    };
    
    loadSound();
    return () => sound.current?.unloadAsync();
  }, []);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });
    return unsubscribe;
  }, []);
  
  useEffect(() => {
    return () => {
      dispatch(resetValidationResult());
      dispatch(resetAttendanceError());
      dispatch(resetTutorAttendanceError());
    };
  }, [dispatch]);
  
  useEffect(() => {
    setIsBimbelActivity(activityType === 'Bimbel');

    if (activityType === 'Bimbel') {
      if (resolvedKelompokIds.length > 0) {
        fetchKelompokStudents(resolvedKelompokIds);
      } else {
        setKelompokStudentIds([]);
      }
    } else {
      setKelompokStudentIds([]);
    }

    validateActivityDate();
  }, [activityType, resolvedKelompokIds, activityDate, id_aktivitas, fetchKelompokStudents]);
  
  useEffect(() => {
    if (duplicateError || tutorDuplicateError) {
      showToast(duplicateError || tutorDuplicateError, 'warning');
    }
  }, [duplicateError, tutorDuplicateError]);
  
  useEffect(() => {
    if (validationResult?.valid && validationResult?.token && validationResult?.anak) {
      if (isBimbelActivity && kelompokStudentIds.length > 0) {
        const studentId = validationResult.anak.id_anak;
        if (!kelompokStudentIds.includes(studentId)) {
          showToast(`Siswa tidak dalam kelompok ${kelompokName || 'yang dipilih'}`, 'error');
          return;
        }
      }
      
      handleAttendanceRecording(
        validationResult.token.token,
        validationResult.anak.id_anak
      );
    }
  }, [validationResult, isBimbelActivity, kelompokStudentIds, handleAttendanceRecording]);
  
  const validateActivityDate = () => {
    if (!activityDate) {
      setActivityDateStatus('unknown');
      return;
    }
    
    const today = startOfDay(new Date());
    const actDate = startOfDay(new Date(activityDate));
    
    if (isFuture(actDate)) {
      setActivityDateStatus('future');
    } else if (isPast(actDate)) {
      setActivityDateStatus('past');
    } else {
      setActivityDateStatus('valid');
    }
  };
  
  const fetchKelompokStudents = useCallback(async (idsParam) => {
    const uniqueIds = Array.from(
      new Set((Array.isArray(idsParam) ? idsParam : [idsParam]).filter(Boolean)),
    );

    if (uniqueIds.length === 0) {
      setKelompokStudentIds([]);
      return;
    }

    setLoadingKelompokData(true);
    try {
      const responses = await Promise.all(
        uniqueIds.map(id => adminShelterKelompokApi.getGroupChildren(id)),
      );

      const studentSet = new Set();
      responses.forEach(response => {
        if (response?.data?.data && Array.isArray(response.data.data)) {
          response.data.data.forEach(student => {
            if (!student?.id_anak) return;
            if (student.status_validasi && student.status_validasi !== 'aktif') return;
            studentSet.add(student.id_anak);
          });
        }
      });

      setKelompokStudentIds(Array.from(studentSet));
    } catch (error) {
      console.error('Error mengambil siswa kelompok:', error);
      setKelompokStudentIds([]);
    } finally {
      setLoadingKelompokData(false);
    }
  }, []);
  
  const playSound = useCallback(async () => {
    try {
      if (sound.current) {
        await sound.current.setPositionAsync(0);
        await sound.current.playAsync();
      } else {
        Vibration.vibrate(100);
      }
    } catch (error) {
      console.error('Error memainkan suara', error);
      Vibration.vibrate(100);
    }
  }, []);
  
  const showToast = useCallback((message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 300, useNativeDriver: true
    }).start();
    
    setTimeout(hideToast, 2000);
  }, [fadeAnim]);
  
  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 300, useNativeDriver: true
    }).start(() => setToastVisible(false));
  }, [fadeAnim]);
  
  const handleScan = useCallback(async (qrData) => {
    if (!id_aktivitas || isProcessing) return;
    
    if (!id_aktivitas) {
      Alert.alert('Error', 'Tidak ada aktivitas yang dipilih. Silakan kembali dan pilih aktivitas terlebih dahulu.');
      return;
    }
    
    if (activityDateStatus === 'future') {
      Alert.alert('Aktivitas Belum Dimulai', 'Aktivitas ini belum dimulai. Silakan tunggu sampai tanggal aktivitas.');
      return;
    }
    
    if (activityDateStatus === 'past') {
      Alert.alert(
        'Aktivitas Lampau', 
        'Aktivitas ini sudah berlalu. Kehadiran akan ditandai sebagai tidak hadir.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Lanjutkan', onPress: () => proceedWithScan(qrData) }
        ]
      );
      return;
    }
    
    proceedWithScan(qrData);
  }, [id_aktivitas, isProcessing, activityDateStatus]);
  
  const proceedWithScan = useCallback(async (qrData) => {
    setIsProcessing(true);
    
    try {
      const isTutorToken = await validateIfTutorToken(qrData.token);
      setTimeout(() => {
        if (isTutorToken) {
          handleTutorAttendanceRecording(qrData.token);
        } else {
          dispatch(validateToken(qrData.token));
        }
      }, 100);
    } catch (error) {
      console.error('Error menentukan jenis token:', error);
      setTimeout(() => dispatch(validateToken(qrData.token)), 100);
    } finally {
      setTimeout(() => setIsProcessing(false), 1000);
    }
  }, [dispatch, handleTutorAttendanceRecording]);
  
  const validateIfTutorToken = useCallback(async (token) => {
    try {
      const response = await tutorAttendanceApi.validateTutorToken(token);
      return response.data.success;
    } catch (error) {
      return false;
    }
  }, []);
  
  const handleAttendanceRecording = useCallback(async (token, id_anak) => {
    try {
      if (isConnected) {
        const now = new Date();
        const formattedArrivalTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        const result = await dispatch(recordAttendanceByQr({ 
          id_anak, id_aktivitas, status: null, token, arrival_time: formattedArrivalTime
        })).unwrap();
        
        await playSound();
        
        const studentName = validationResult?.anak?.full_name || 'Siswa';
        let status = 'Hadir', toastType = 'success';
        
        if (result.data?.absen) {
          if (result.data.absen === 'Tidak') {
            status = 'Tidak Hadir';
            toastType = 'error';
          } else if (result.data.absen === 'Terlambat') {
            status = 'Terlambat';
            toastType = 'warning';
          }
        }
        
        setTimeout(() => showToast(`${status}: ${studentName}`, toastType), 100);
      } else {
        const offlineNow = new Date();
        const offlineFormattedTime = `${offlineNow.getFullYear()}-${String(offlineNow.getMonth() + 1).padStart(2, '0')}-${String(offlineNow.getDate()).padStart(2, '0')} ${String(offlineNow.getHours()).padStart(2, '0')}:${String(offlineNow.getMinutes()).padStart(2, '0')}:${String(offlineNow.getSeconds()).padStart(2, '0')}`;
        const result = await OfflineSync.processAttendance({
          id_anak, id_aktivitas, status: null, token,
          arrival_time: offlineFormattedTime
        }, 'qr');
        
        await playSound();
        setTimeout(() => showToast('Disimpan untuk sinkronisasi saat online', 'warning'), 100);
      }
    } catch (error) {
      if (!error.isDuplicate) {
        setTimeout(() => showToast(error.message || 'Gagal merekam', 'error'), 100);
      }
    }
  }, [isConnected, dispatch, id_aktivitas, validationResult, playSound, showToast]);
  
  const handleTutorAttendanceRecording = useCallback(async (token) => {
    try {
      if (isConnected) {
        const now = new Date();
        const formattedArrivalTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        const result = await dispatch(recordTutorAttendanceByQr({
          id_aktivitas, token, arrival_time: formattedArrivalTime
        })).unwrap();
        
        await playSound();
        
        let status = 'Hadir', toastType = 'success';
        
        if (result.data?.absen) {
          if (result.data.absen === 'Tidak') {
            status = 'Tidak Hadir';
            toastType = 'error';
          } else if (result.data.absen === 'Terlambat') {
            status = 'Terlambat';
            toastType = 'warning';
          }
        }
        
        const tutorName = result.data?.absen_user?.tutor?.nama || 'Tutor';
        setTimeout(() => showToast(`${status}: ${tutorName} (Tutor)`, toastType), 100);
      } else {
        const tutorOfflineNow = new Date();
        const tutorOfflineFormattedTime = `${tutorOfflineNow.getFullYear()}-${String(tutorOfflineNow.getMonth() + 1).padStart(2, '0')}-${String(tutorOfflineNow.getDate()).padStart(2, '0')} ${String(tutorOfflineNow.getHours()).padStart(2, '0')}:${String(tutorOfflineNow.getMinutes()).padStart(2, '0')}:${String(tutorOfflineNow.getSeconds()).padStart(2, '0')}`;
        await OfflineSync.processAttendance({
          id_aktivitas, token, arrival_time: tutorOfflineFormattedTime,
          type: 'tutor'
        }, 'qr');
        
        await playSound();
        setTimeout(() => showToast('Disimpan untuk sinkronisasi saat online', 'warning'), 100);
      }
    } catch (error) {
      if (!error.isDuplicate) {
        setTimeout(() => showToast(error.message || 'Gagal merekam kehadiran tutor', 'error'), 100);
      }
    }
  }, [isConnected, dispatch, id_aktivitas, playSound, showToast]);
  
  const handleClose = useCallback(() => navigation.goBack(), [navigation]);
  
  const isLoading = tokenLoading || attendanceLoading || loadingKelompokData || tutorAttendanceLoading || isProcessing;
  
  const getToastStyle = () => ({
    error: styles.errorToast,
    warning: styles.warningToast,
    success: styles.successToast
  }[toastType] || styles.successToast);
  
  const getToastIcon = () => ({
    error: 'close-circle',
    warning: 'alert-circle',
    success: 'checkmark-circle'
  }[toastType] || 'checkmark-circle');

  const getActivityStatusInfo = () => {
    switch(activityDateStatus) {
      case 'future':
        return {
          show: true, color: '#f39c12', icon: 'time-outline',
          text: 'Aktivitas belum dimulai'
        };
      case 'past':
        return {
          show: true, color: '#e74c3c', icon: 'alert-circle',
          text: 'Aktivitas lampau - kehadiran akan ditandai tidak hadir'
        };
      default:
        return { show: false };
    }
  };

  const activityStatus = getActivityStatusInfo();

  return (
    <SafeAreaView style={styles.container}>
      <QrScanner 
        onScan={handleScan}
        onClose={handleClose}
        isLoading={isLoading}
        disabled={activityDateStatus === 'future'}
      />
      
      <View style={styles.bottomBar}>
        <Text style={styles.activityName}>
          {activityName || 'Tidak ada aktivitas dipilih'}
        </Text>
        
        {isBimbelActivity && kelompokName && (
          <Text style={styles.kelompokInfo}>
            Kelompok: {kelompokName}
          </Text>
        )}
        
        {activityStatus.show && (
          <View style={[styles.activityStatusNote, { backgroundColor: activityStatus.color }]}>
            <Ionicons name={activityStatus.icon} size={16} color="#fff" />
            <Text style={styles.activityStatusText}>
              {activityStatus.text}
            </Text>
          </View>
        )}
        
        {activityDateStatus === 'valid' && (
          <View style={styles.autoDetectionNote}>
            <Ionicons name="time-outline" size={16} color="#fff" />
            <Text style={styles.autoDetectionText}>
              Status kehadiran akan ditentukan otomatis berdasarkan jadwal
            </Text>
          </View>
        )}
        
        {!isConnected && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline" size={16} color="#fff" />
            <Text style={styles.offlineText}>Mode Offline</Text>
          </View>
        )}
      </View>
      
      {toastVisible && (
        <Animated.View style={[styles.toast, getToastStyle(), { opacity: fadeAnim }]}>
          <Ionicons name={getToastIcon()} size={20} color="#fff" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', padding: 16, paddingBottom: 30
  },
  activityName: { color: '#fff', fontSize: 14, textAlign: 'center', marginBottom: 6 },
  kelompokInfo: { color: '#fff', fontSize: 12, textAlign: 'center', marginBottom: 10, opacity: 0.8 },
  activityStatusNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 10, borderRadius: 6, marginBottom: 10
  },
  activityStatusText: { color: '#fff', marginLeft: 8, fontSize: 12, textAlign: 'center', fontWeight: '500' },
  autoDetectionNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.7)', padding: 10, borderRadius: 6, marginBottom: 10
  },
  autoDetectionText: { color: '#fff', marginLeft: 8, fontSize: 12, textAlign: 'center' },
  offlineIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e74c3c', padding: 6, borderRadius: 4
  },
  offlineText: { color: '#fff', marginLeft: 6, fontSize: 12 },
  toast: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 3, elevation: 5
  },
  successToast: { backgroundColor: 'rgba(46, 204, 113, 0.9)' },
  warningToast: { backgroundColor: 'rgba(243, 156, 18, 0.9)' },
  errorToast: { backgroundColor: 'rgba(231, 76, 60, 0.9)' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500', marginLeft: 10, flex: 1 }
});

export default QrScannerScreen;
