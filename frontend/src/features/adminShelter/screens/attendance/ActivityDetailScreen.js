import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import GroupStudentsList from '../../components/GroupStudentsList';
import { useGpsNavigation } from '../../../../common/hooks/useGpsNavigation';
import { qrTokenApi } from '../../api/qrTokenApi';

import {
  fetchAktivitasDetail, deleteAktivitas, selectAktivitasDetail,
  selectAktivitasLoading, selectAktivitasError, selectKelompokDetail,
  fetchActivityReport
} from '../../redux/aktivitasSlice';

const ActivityDetailScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { id_aktivitas } = route.params || {};
  
  const activity = useSelector(selectAktivitasDetail);
  const loading = useSelector(selectAktivitasLoading);
  const error = useSelector(selectAktivitasError);
  const kelompokDetail = useSelector(selectKelompokDetail);
  const { activityReport } = useSelector(state => state.aktivitas);
  const { profile } = useSelector(state => state.auth);
  
  const [activePhoto, setActivePhoto] = useState(0);
  
  // GPS Navigation hook
  const { checkGpsAndNavigate, isCheckingGps, gpsError } = useGpsNavigation();
  

  // Get shelter GPS config from profile with multiple fallback paths
  const getShelterGpsConfig = () => {
    // Try different possible paths for shelter data
    const shelterPaths = [
      profile?.shelter,           // Direct shelter
      profile?.data?.shelter,     // Nested in data
      profile?.shelter_info,      // Alternative naming
      profile?.user?.shelter,     // User nested
      profile?.shelterData        // Alternative structure
    ];

    for (let i = 0; i < shelterPaths.length; i++) {
      const shelter = shelterPaths[i];
      if (shelter) {
        // Check if this shelter has GPS configuration
        const hasGpsCoords = shelter.latitude && shelter.longitude;
        const hasGpsRequirement = shelter.require_gps || hasGpsCoords; // GPS required if coords exist
        
        if (hasGpsRequirement || hasGpsCoords) {
          const config = {
            require_gps: shelter.require_gps || hasGpsCoords,
            latitude: shelter.latitude,
            longitude: shelter.longitude,
            max_distance_meters: shelter.max_distance_meters || 50,
            location_name: shelter.location_name || shelter.nama_shelter
          };
          return config;
        }
      }
    }
    
    return null;
  };

  const shelterGpsConfig = getShelterGpsConfig();
  const [reportExists, setReportExists] = useState(false);
  const [dynamicGpsConfig, setDynamicGpsConfig] = useState(null);
  const [loadingGpsConfig, setLoadingGpsConfig] = useState(false);

  // Fetch GPS config from API if not available in profile
  useEffect(() => {
    const fetchGpsConfig = async () => {
      if (shelterGpsConfig || !id_aktivitas) {
        return;
      }

      try {
        setLoadingGpsConfig(true);
        const result = await qrTokenApi.getActivityGpsConfig(id_aktivitas);
        const apiData = result.data; // Axios response

        if (apiData.success && apiData.data) {
          setDynamicGpsConfig(apiData.data);
        }
      } catch (error) {
        console.error('Error fetching GPS config:', error);
      } finally {
        setLoadingGpsConfig(false);
      }
    };

    fetchGpsConfig();
  }, [id_aktivitas, shelterGpsConfig]);

  // Get final GPS config (profile first, then API fallback)
  const finalGpsConfig = shelterGpsConfig || dynamicGpsConfig;
  
  // Parse time string (backend format like "09:35") - memoized
  const parseTimeForStatus = useCallback((timeInput) => {
    if (!timeInput || typeof timeInput !== 'string' || timeInput.trim() === '') {
      return null;
    }
    
    const timeRegex = /^([0-9]|[0-1][0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
    if (!timeRegex.test(timeInput.trim())) {
      return null;
    }
    
    try {
      const [hoursStr, minutesStr] = timeInput.split(':');
      const hours = parseInt(hoursStr);
      const minutes = parseInt(minutesStr);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }
      
      return { hours, minutes };
    } catch (error) {
      return null;
    }
  }, []);

  // Format time safely for display - memoized
  const formatTimeSafe = useCallback((timeInput) => {
    const timeData = parseTimeForStatus(timeInput);
    if (!timeData) return null;
    
    return `${timeData.hours.toString().padStart(2, '0')}:${timeData.minutes.toString().padStart(2, '0')}`;
  }, [parseTimeForStatus]);

  // Get activity status - memoized
  const getActivityStatus = useCallback(() => {
    if (!activity || !activity.start_time || !activity.end_time) {
      return { status: 'Jadwal belum diatur', color: '#95a5a6' };
    }
    
    const startTime = parseTimeForStatus(activity.start_time);
    const endTime = parseTimeForStatus(activity.end_time);
    
    if (!startTime || !endTime) {
      return { status: 'Jadwal belum diatur', color: '#95a5a6' };
    }

    const now = new Date();
    const activityDate = new Date(activity.tanggal);
    
    const startDateTime = new Date(activityDate);
    startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);
    
    const endDateTime = new Date(activityDate);
    endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);

    if (now < startDateTime) {
      return { status: 'Belum dimulai', color: '#f39c12' };
    } else if (now >= startDateTime && now <= endDateTime) {
      return { status: 'Sedang berlangsung', color: '#2ecc71' };
    } else {
      return { status: 'Selesai', color: '#e74c3c' };
    }
  }, [activity?.start_time, activity?.end_time, activity?.tanggal, parseTimeForStatus]);
  
  // Check if activity is completed (current time > end_time) - memoized
  const isActivityCompleted = useCallback(() => {
    if (!activity?.end_time || typeof activity.end_time !== 'string') return false;
    const now = new Date();
    const activityDate = new Date(activity.tanggal);
    const [hours, minutes] = activity.end_time.split(':');
    const endDateTime = new Date(activityDate);
    endDateTime.setHours(parseInt(hours), parseInt(minutes));
    return now > endDateTime;
  }, [activity?.end_time, activity?.tanggal]);
  
  useEffect(() => {
    if (id_aktivitas) dispatch(fetchAktivitasDetail(id_aktivitas));
  }, [dispatch, id_aktivitas]);
  
  // Check if activity report exists once the activity detail is loaded
  useEffect(() => {
    const checkActivityReport = async () => {
      if (!activity || !id_aktivitas) return;

      try {
        await dispatch(fetchActivityReport(id_aktivitas)).unwrap();
        setReportExists(true);
      } catch (err) {
        const statusCode = err?.status || err?.response?.status || err?.originalStatus;
        const rawMessage = typeof err === 'string' ? err : err?.message;
        const normalizedMessage = typeof rawMessage === 'string' ? rawMessage.toLowerCase() : '';
        const isNotFound =
          statusCode === 404 ||
          normalizedMessage.includes('tidak ditemukan') ||
          normalizedMessage.includes('not found');

        if (!isNotFound) {
          console.error('Error checking activity report:', err);
        }
        setReportExists(false);
      }
    };

    if (activity) checkActivityReport();
  }, [dispatch, id_aktivitas, activity]);
  
  const handleEditActivity = () => navigation.navigate('ActivityForm', { activity });
  
  const handleDeleteActivity = () => {
    Alert.alert(
      'Hapus Aktivitas',
      'Yakin ingin menghapus aktivitas ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteAktivitas(id_aktivitas)).unwrap();
              Alert.alert('Berhasil', 'Aktivitas berhasil dihapus');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err || 'Gagal menghapus aktivitas');
            }
          }
        }
      ]
    );
  };
  
  const handleRecordAttendance = () => {
    if (!activity) return;
    
    const navigationCallback = () => {
      navigation.navigate('AttendanceManagement', {
        id_aktivitas,
        activityName: activity.jenis_kegiatan,
        activityDate: activity.tanggal ? format(new Date(activity.tanggal), 'EEEE, dd MMMM yyyy', { locale: id }) : null,
        activityType: activity.jenis_kegiatan,
        kelompokId: activity.selectedKelompokId || kelompokDetail?.id_kelompok || null,
        kelompokName: activity.nama_kelompok || null
      });
    };
    
    checkGpsAndNavigate(navigationCallback, id_aktivitas, activity.jenis_kegiatan, finalGpsConfig);
  };
  
  const handleManualAttendance = () => {
    if (!activity) return;
    
    const navigationCallback = () => {
      navigation.navigate('ManualAttendance', {
        id_aktivitas,
        activityName: activity.jenis_kegiatan,
        activityDate: activity.tanggal ? format(new Date(activity.tanggal), 'EEEE, dd MMMM yyyy', { locale: id }) : null,
        activityType: activity.jenis_kegiatan,
        kelompokId: activity.selectedKelompokId || kelompokDetail?.id_kelompok || null,
        kelompokName: activity.nama_kelompok || null
      });
    };
    
    checkGpsAndNavigate(navigationCallback, id_aktivitas, activity.jenis_kegiatan, finalGpsConfig);
  };
  
  const handleViewAttendanceRecords = () => {
    if (!activity) return;
    
    const navigationCallback = () => {
      navigation.navigate('AttendanceManagement', {
        id_aktivitas,
        activityName: activity.jenis_kegiatan,
        activityDate: activity.tanggal ? format(new Date(activity.tanggal), 'EEEE, dd MMMM yyyy', { locale: id }) : null,
        activityType: activity.jenis_kegiatan,
        kelompokId: activity.selectedKelompokId || kelompokDetail?.id_kelompok || null,
        kelompokName: activity.nama_kelompok || null,
        initialTab: 'AttendanceList'
      });
    };
    
    checkGpsAndNavigate(navigationCallback, id_aktivitas, activity.jenis_kegiatan, finalGpsConfig);
  };
  
  const handleGenerateQrCodes = () => {
    if (!activity) return;
    
    const navigationCallback = () => {
      navigation.navigate('AttendanceManagement', {
        id_aktivitas,
        activityName: activity.jenis_kegiatan,
        activityDate: activity.tanggal ? format(new Date(activity.tanggal), 'EEEE, dd MMMM yyyy', { locale: id }) : null,
        activityType: activity.jenis_kegiatan,
        kelompokId: activity.selectedKelompokId || kelompokDetail?.id_kelompok || null,
        kelompokName: activity.nama_kelompok || null,
        level: activity.level || null,
        completeActivity: activity,
        initialTab: 'QrTokenGeneration'
      });
    };
    
    checkGpsAndNavigate(navigationCallback, id_aktivitas, activity.jenis_kegiatan, finalGpsConfig);
  };
  
  const handleActivityReport = () => {
    if (!activity) return;
    
    // Navigation will handle checking if report exists and redirect accordingly
    navigation.navigate('ActivityReport', {
      id_aktivitas,
      activityName: activity.jenis_kegiatan,
      activityDate: activity.tanggal ? format(new Date(activity.tanggal), 'EEEE, dd MMMM yyyy', { locale: id }) : null
    });
  };
  
  if (loading && !activity) {
    return <LoadingSpinner fullScreen message="Memuat detail aktivitas..." />;
  }
  
  if (error && !activity) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={() => dispatch(fetchAktivitasDetail(id_aktivitas))}
        />
      </View>
    );
  }
  
  if (!activity) return null;
  
  const kelompokId = activity.selectedKelompokId || kelompokDetail?.id_kelompok || null;
  
  const DetailItem = ({ label, value, color }) => (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, color && { color }]}>{value || 'Tidak ditentukan'}</Text>
    </View>
  );

  const ActionButton = ({ onPress, icon, text, style }) => (
    <TouchableOpacity style={[styles.attendanceButton, style]} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#fff" />
      <Text style={styles.attendanceButtonText}>{text}</Text>
    </TouchableOpacity>
  );

  const ActivityPlaceholder = () => (
    <View style={styles.noPhotoPlaceholder}>
      <Ionicons
        name={activity.jenis_kegiatan?.toLowerCase() === 'bimbel' ? 'book' : 'people'}
        size={60}
        color="#bdc3c7"
      />
      <Text style={styles.noPhotoText}>Aktivitas {activity.jenis_kegiatan}</Text>
      {!reportExists && activity.status !== 'reported' && (
        <Text style={styles.reportInfoText}>Belum ada laporan kegiatan. Gunakan tombol di bawah untuk membuatnya.</Text>
      )}
      {(reportExists || activity.status === 'reported') && (
        <Text style={styles.reportExistsText}>Laporan sudah dikirim</Text>
      )}
    </View>
  );

  const TutorInfo = () => activity.tutor && (
    <View style={styles.tutorSection}>
      <Text style={styles.sectionTitle}>Tutor yang Ditugaskan</Text>
      
      <View style={styles.tutorCard}>
        <View style={styles.tutorAvatar}>
          {activity.tutor.foto_url ? (
            <Image source={{ uri: activity.tutor.foto_url }} style={styles.tutorImage} />
          ) : (
            <Ionicons name="person-circle" size={50} color="#bdc3c7" />
          )}
        </View>
        
        <View style={styles.tutorInfo}>
          <Text style={styles.tutorName}>{activity.tutor.nama}</Text>
          <Text style={styles.tutorDetail}>ID: {activity.tutor.id_tutor}</Text>
          {activity.tutor.no_hp && (
            <View style={styles.tutorContact}>
              <Ionicons name="call-outline" size={14} color="#7f8c8d" />
              <Text style={styles.tutorDetail}>{activity.tutor.no_hp}</Text>
            </View>
          )}
          {activity.tutor.email && (
            <View style={styles.tutorContact}>
              <Ionicons name="mail-outline" size={14} color="#7f8c8d" />
              <Text style={styles.tutorDetail}>{activity.tutor.email}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const StudentsSection = () => (
    <View style={styles.studentsSection}>
      <Text style={styles.sectionTitle}>Siswa dalam Kelompok</Text>
      
      {activity.jenis_kegiatan === 'Bimbel' ? (
        kelompokId ? (
          <GroupStudentsList
            kelompokId={kelompokId}
            showTitle={false}
            onRefresh={() => dispatch(fetchAktivitasDetail(id_aktivitas))}
          />
        ) : (
          <View style={styles.noGroupContainer}>
            <Ionicons name="people-outline" size={48} color="#bdc3c7" />
            <Text style={styles.noGroupText}>Tidak ada kelompok terkait dengan aktivitas ini</Text>
            <Text style={styles.noGroupSubtext}>Edit aktivitas untuk menentukan kelompok</Text>
          </View>
        )
      ) : (
        <View style={styles.noGroupContainer}>
          <Ionicons name="information-circle-outline" size={48} color="#bdc3c7" />
          <Text style={styles.noGroupText}>Daftar siswa hanya tersedia untuk aktivitas Bimbel</Text>
        </View>
      )}
    </View>
  );

  // Data for FlatList sections
  const sections = [
    { id: 'photo', component: <ActivityPlaceholder /> },
    { 
      id: 'header', 
      component: (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{activity.jenis_kegiatan}</Text>
            <Text style={styles.date}>
              {activity.tanggal
                ? format(new Date(activity.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })
                : 'Tidak ada tanggal'}
            </Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEditActivity}>
              <Ionicons name="create-outline" size={24} color="#3498db" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleDeleteActivity}>
              <Ionicons name="trash-outline" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>
      )
    },
    {
      id: 'details',
      component: (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Detail</Text>
          <DetailItem label="Tingkat" value={activity.level} />
          <DetailItem label="Kelompok" value={activity.nama_kelompok} />
          <DetailItem label="Materi" value={activity.materi} />
          <DetailItem 
            label="Waktu Mulai" 
            value={formatTimeSafe(activity.start_time)} 
          />
          <DetailItem 
            label="Waktu Selesai" 
            value={formatTimeSafe(activity.end_time)} 
          />
          <DetailItem 
            label="Status" 
            value={getActivityStatus().status}
            color={getActivityStatus().color}
          />
        </View>
      )
    },
    { id: 'tutor', component: <TutorInfo /> },
    {
      id: 'attendanceActions',
      component: (
        <View>
          <View style={styles.attendanceActions}>
            <ActionButton
              onPress={handleRecordAttendance}
              icon="calendar"
              text="Kelola Kehadiran"
              style={styles.fullWidthButton}
            />
            <ActionButton
              onPress={handleManualAttendance}
              icon="create"
              text="Input Manual"
              style={styles.manualButton}
            />
          </View>
          <ActionButton
            onPress={handleActivityReport}
            icon={(reportExists || activity.status === 'reported') ? "document-text" : "camera"}
            text={(reportExists || activity.status === 'reported') ? "Lihat Laporan" : "Buat Laporan"}
            style={[
              styles.reportButtonFullWidth,
              (reportExists || activity.status === 'reported') ? styles.viewReportButton :
              styles.reportButton
            ]}
          />
        </View>
      )
    },
    { id: 'students', component: <StudentsSection /> }
  ];

  return (
    <FlatList
      data={sections}
      renderItem={({ item }) => (
        <View style={item.id === 'photo' ? {} : styles.infoContainer}>
          {item.component}
        </View>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { paddingBottom: 20 },
  noPhotoPlaceholder: {
    height: 200, backgroundColor: '#ecf0f1',
    justifyContent: 'center', alignItems: 'center'
  },
  noPhotoText: { marginTop: 10, color: '#7f8c8d', fontSize: 16 },
  infoContainer: { padding: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16
  },
  titleContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  date: { fontSize: 16, color: '#7f8c8d' },
  actions: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 8 },
  detailsSection: {
    backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  detail: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { width: 100, fontSize: 16, color: '#7f8c8d', fontWeight: '500' },
  detailValue: { flex: 1, fontSize: 16, color: '#34495e' },
  tutorSection: {
    backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  tutorCard: { flexDirection: 'row', alignItems: 'center' },
  tutorAvatar: {
    width: 60, height: 60, borderRadius: 30, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0'
  },
  tutorImage: { width: 60, height: 60, borderRadius: 30 },
  tutorInfo: { flex: 1, marginLeft: 12 },
  tutorName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  tutorDetail: { fontSize: 14, color: '#7f8c8d', marginTop: 2 },
  tutorContact: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  attendanceActions: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16
  },
  attendanceButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3498db', paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 8, marginHorizontal: 4
  },
  manualButton: { backgroundColor: '#9b59b6' },
  recordsButton: { backgroundColor: '#2ecc71' },
  qrButton: { backgroundColor: '#f1c40f', marginBottom: 16 },
  reportButton: { backgroundColor: '#e67e22', marginTop: 8 },
  viewReportButton: { backgroundColor: '#27ae60', marginTop: 8 },
  reportButtonFullWidth: { marginHorizontal: 0, marginTop: 8 },
  reportInfoText: { fontSize: 14, color: '#e67e22', marginTop: 8, fontWeight: '500' },
  reportExistsText: { fontSize: 14, color: '#27ae60', marginTop: 8, fontWeight: '500' },
  fullWidthButton: { marginHorizontal: 0 },
  attendanceButtonText: { color: '#fff', marginLeft: 4, fontWeight: '500', fontSize: 12 },
  studentsSection: {
    backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, minHeight: 200
  },
  noGroupContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  noGroupText: { fontSize: 16, color: '#7f8c8d', marginTop: 16, textAlign: 'center' },
  noGroupSubtext: { fontSize: 14, color: '#95a5a6', marginTop: 8, textAlign: 'center' }
});

export default ActivityDetailScreen;