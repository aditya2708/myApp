import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import GroupStudentsList from '../../components/GroupStudentsList';
import { useGpsNavigation } from '../../../../common/hooks/useGpsNavigation';
import { qrTokenApi } from '../../api/qrTokenApi';
import {
  MANUAL_ATTENDANCE_ACTIVITY_SET,
  MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET,
} from '../../constants/activityTypes';

import {
  fetchAktivitasDetail,
  deleteAktivitas,
  selectAktivitasDetail,
  selectAktivitasLoading,
  selectAktivitasError,
  selectKelompokDetail,
  fetchActivityReport,
  selectAktivitasAttendanceSummary,
  selectActivityReportCache,
  ACTIVITY_REPORT_CACHE_TTL
} from '../../redux/aktivitasSlice';
import {
  selectIsQuickFlowActive,
  selectQuickFlowStep,
  setQuickFlowActivity,
  updateQuickFlowStep,
  selectQuickFlowStatus,
  resetQuickFlow,
} from '../../redux/quickFlowSlice';

const ActivityDetailScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const {
    id_aktivitas,
    attendanceSummary: routeAttendanceSummary,
    activityType: routeActivityType,
    activityDate: routeActivityDate,
    activityStatus: routeActivityStatus,
  } = route.params || {};
  
  const activity = useSelector(selectAktivitasDetail);
  const loading = useSelector(selectAktivitasLoading);
  const error = useSelector(selectAktivitasError);
  const kelompokDetail = useSelector(selectKelompokDetail);
  const { profile } = useSelector(state => state.auth);
  const cachedAttendanceSummary = useSelector(selectAktivitasAttendanceSummary);
  const reportCache = useSelector(selectActivityReportCache);
  const reportCacheEntry = id_aktivitas ? reportCache?.[id_aktivitas] : null;
  const quickFlowActive = useSelector(selectIsQuickFlowActive);
  const quickFlowStep = useSelector(selectQuickFlowStep);
  const quickFlowStatus = useSelector(selectQuickFlowStatus);
  const isQuickFlow = route?.params?.quickFlow || quickFlowActive;
  
  const manualEligibleActivity = useMemo(() => {
    const resolvedType = activity?.jenis_kegiatan || routeActivityType || null;

    if (!resolvedType) {
      return false;
    }

    if (MANUAL_ATTENDANCE_ACTIVITY_SET.has(resolvedType)) {
      return true;
    }

    return MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET.has(resolvedType.toLowerCase());
  }, [activity?.jenis_kegiatan, routeActivityType]);

  const [activePhoto, setActivePhoto] = useState(0);

  const kelompokIds = useMemo(() => {
    if (!activity) return [];

    if (Array.isArray(activity.kelompok_ids) && activity.kelompok_ids.length > 0) {
      return activity.kelompok_ids.filter(Boolean);
    }

    if (Array.isArray(activity.selectedKelompokIds) && activity.selectedKelompokIds.length > 0) {
      return activity.selectedKelompokIds.filter(Boolean);
    }

    const fallbackId =
      activity.selectedKelompokId ||
      activity.kelompok_id ||
      activity.kelompokId ||
      kelompokDetail?.id_kelompok ||
      null;
    return fallbackId ? [fallbackId] : [];
  }, [activity, kelompokDetail]);

  const primaryKelompokId = useMemo(
    () => (kelompokIds.length === 1 ? kelompokIds[0] : null),
    [kelompokIds],
  );

  const hasKelompokContext = kelompokIds.length > 0;
  const studentsHeaderNote = useMemo(
    () => (kelompokIds.length > 1 ? 'Menampilkan gabungan semua kelompok' : null),
    [kelompokIds],
  );
  
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
        const hasGpsRequirement = !!shelter.require_gps;
        
        if (hasGpsRequirement || hasGpsCoords) {
          const config = {
            require_gps: !!shelter.require_gps,
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

  const {
    refetch: refetchActivityDetail,
  } = useQuery({
    queryKey: ['adminShelterAktivitasDetail', id_aktivitas],
    queryFn: () => dispatch(fetchAktivitasDetail(id_aktivitas)).unwrap(),
    enabled: !!id_aktivitas,
    staleTime: 30 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const gpsConfigQuery = useQuery({
    queryKey: ['activityGpsConfig', id_aktivitas],
    enabled: !!id_aktivitas && !shelterGpsConfig,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      try {
        const result = await qrTokenApi.getActivityGpsConfig(id_aktivitas);
        const apiData = result?.data;

        if (apiData?.success && apiData?.data) {
          return apiData.data;
        }

        return null;
      } catch (error) {
        console.error('Error fetching GPS config:', error);
        return null;
      }
    },
  });

  const finalGpsConfig = useMemo(
    () => shelterGpsConfig || gpsConfigQuery.data || null,
    [shelterGpsConfig, gpsConfigQuery.data]
  );

  const resolveReportPayload = useCallback((payload) => {
    if (!payload) {
      return null;
    }

    if (payload?.data && typeof payload.data === 'object') {
      return payload.data;
    }

    return payload;
  }, []);

  const initialReportData = useMemo(() => {
    if (!reportCacheEntry) {
      return undefined;
    }

    return {
      status: reportCacheEntry.status || null,
      data: reportCacheEntry.data || null,
    };
  }, [reportCacheEntry]);

  const initialReportFetchedAt = reportCacheEntry?.fetchedAt ?? undefined;

  const {
    data: reportStatusData,
    refetch: refetchActivityReportStatus,
  } = useQuery({
    queryKey: ['adminShelterActivityReportStatus', id_aktivitas],
    enabled: !!id_aktivitas,
    initialData: initialReportData,
    initialDataUpdatedAt: initialReportFetchedAt,
    staleTime: ACTIVITY_REPORT_CACHE_TTL,
    gcTime: ACTIVITY_REPORT_CACHE_TTL,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    queryFn: async () => {
      try {
        const reportPayload = await dispatch(fetchActivityReport(id_aktivitas)).unwrap();
        const reportData = resolveReportPayload(reportPayload);
        return {
          status: reportData ? 'exists' : 'missing',
          data: reportData,
        };
      } catch (err) {
        const statusCode = err?.status || err?.response?.status || err?.originalStatus;
        const rawMessage = typeof err === 'string' ? err : err?.message;
        const normalizedMessage = typeof rawMessage === 'string' ? rawMessage.toLowerCase() : '';
        const isNotFound =
          statusCode === 404 ||
          normalizedMessage.includes('tidak ditemukan') ||
          normalizedMessage.includes('not found');

        if (isNotFound) {
          return {
            status: 'missing',
            data: null,
          };
        }

        console.error('Error checking activity report:', err);
        return {
          status: 'error',
          data: null,
          error: err,
        };
      }
    },
  });

  const reportStatus = reportStatusData?.status || null;
  const reportExists = reportStatus === 'exists';
  const resolvedStatus = useMemo(
    () => activity?.status || routeActivityStatus || quickFlowStatus || null,
    [activity?.status, routeActivityStatus, quickFlowStatus]
  );

  const activityDateRaw = activity?.tanggal || null;
  const activityDateLabel = useMemo(() => {
    if (activityDateRaw) {
      try {
        return format(new Date(activityDateRaw), 'EEEE, dd MMMM yyyy', { locale: id });
      } catch (err) {
        return null;
      }
    }

    return routeActivityDate || null;
  }, [activityDateRaw, routeActivityDate]);

  const hasFocusedOnceRef = useRef(false);
  const isScreenFocused = useIsFocused();

  useEffect(() => {
    hasFocusedOnceRef.current = false;
  }, [id_aktivitas]);

  const isReportSubmitted = useMemo(() => {
    const normalizedStatus = typeof resolvedStatus === 'string' ? resolvedStatus.toLowerCase() : '';
    return reportExists || normalizedStatus === 'reported' || normalizedStatus === 'selesai' || normalizedStatus === 'complete' || normalizedStatus === 'done';
  }, [reportExists, resolvedStatus]);

  const isActivityFinished = useMemo(() => {
    const status = resolvedStatus || '';
    if (!status || typeof status !== 'string') return false;
    const normalized = status.toLowerCase();
    return normalized === 'selesai' || normalized === 'reported' || normalized === 'complete' || normalized === 'done';
  }, [resolvedStatus]);

  useEffect(() => {
    if (!isQuickFlow || !id_aktivitas) {
      return;
    }

    if (isActivityFinished) {
      dispatch(resetQuickFlow());
      return;
    }

    dispatch(setQuickFlowActivity({ activityId: id_aktivitas, status: resolvedStatus || null }));
    if (quickFlowStep !== 'activityDetail') {
      dispatch(updateQuickFlowStep('activityDetail'));
    }
  }, [dispatch, id_aktivitas, isActivityFinished, isQuickFlow, quickFlowStep, resolvedStatus]);

  useFocusEffect(
    useCallback(() => {
      if (!id_aktivitas) {
        return;
      }

      if (hasFocusedOnceRef.current) {
        refetchActivityDetail();
        refetchActivityReportStatus();
      } else {
        hasFocusedOnceRef.current = true;
      }
    }, [id_aktivitas, refetchActivityDetail, refetchActivityReportStatus])
  );
  
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
    if (!activity) {
      return;
    }

    if (typeof navigation?.setParams === 'function' && isScreenFocused) {
      navigation.setParams({
        activityStatus: resolvedStatus,
        attendanceSummary: cachedAttendanceSummary || routeAttendanceSummary || null
      });
    }
  }, [activity, cachedAttendanceSummary, navigation, resolvedStatus, routeAttendanceSummary, isScreenFocused]);
  
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
        activityDate: activityDateLabel,
        activityDateRaw,
        activityType: activity.jenis_kegiatan,
        kelompokId: primaryKelompokId,
        kelompokIds,
        kelompokName: activity.nama_kelompok || null,
        activityStatus: resolvedStatus,
        attendanceSummary: cachedAttendanceSummary || routeAttendanceSummary || null
      });
    };
    
    checkGpsAndNavigate(navigationCallback, id_aktivitas, activity.jenis_kegiatan, finalGpsConfig);
  };
  
  const handleManualAttendance = () => {
    if (!activity) return;

    if (!manualEligibleActivity) {
      Alert.alert('Absen Manual Tidak Tersedia', 'Jenis kegiatan ini tidak mendukung absen manual.', [
        { text: 'Mengerti', style: 'default' },
      ]);
      return;
    }
    
    const navigationCallback = () => {
      if (isQuickFlow) {
        dispatch(setQuickFlowActivity({ activityId: id_aktivitas, status: resolvedStatus }));
        dispatch(updateQuickFlowStep('manualAttendance'));
      }

      navigation.navigate('ManualAttendance', {
        id_aktivitas,
        activityName: activity.jenis_kegiatan,
        activityDate: activityDateLabel,
        activityDateRaw,
        activityType: activity.jenis_kegiatan,
        kelompokId: primaryKelompokId,
        kelompokIds,
        kelompokName: activity.nama_kelompok || null,
        activityStatus: resolvedStatus,
        quickFlow: isQuickFlow,
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
        activityDate: activityDateLabel,
        activityDateRaw,
        activityType: activity.jenis_kegiatan,
        kelompokId: primaryKelompokId,
        kelompokIds,
        kelompokName: activity.nama_kelompok || null,
        initialTab: 'AttendanceList',
        activityStatus: resolvedStatus,
        attendanceSummary: cachedAttendanceSummary || routeAttendanceSummary || null
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
        activityDate: activityDateLabel,
        activityDateRaw,
        activityType: activity.jenis_kegiatan,
        kelompokId: primaryKelompokId,
        kelompokIds,
        kelompokName: activity.nama_kelompok || null,
        level: activity.level || null,
        completeActivity: activity,
        initialTab: 'QrTokenGeneration',
        activityStatus: resolvedStatus,
        attendanceSummary: cachedAttendanceSummary || routeAttendanceSummary || null
      });
    };
    
    checkGpsAndNavigate(navigationCallback, id_aktivitas, activity.jenis_kegiatan, finalGpsConfig);
  };
  
  const handleActivityReport = () => {
    if (!activity) return;
    
    // Navigation will handle checking if report exists and redirect accordingly
    if (isQuickFlow) {
      dispatch(setQuickFlowActivity({ activityId: id_aktivitas, status: resolvedStatus }));
      dispatch(updateQuickFlowStep('activityReport'));
    }

    navigation.navigate('ActivityReport', {
      id_aktivitas,
      activityName: activity.jenis_kegiatan,
      activityDate: activityDateLabel,
      activityDateRaw,
      activityStatus: resolvedStatus,
      attendanceSummary: cachedAttendanceSummary || routeAttendanceSummary || null,
      quickFlow: isQuickFlow,
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
  
  const kelompokId = primaryKelompokId;
  
  const DetailItem = ({ label, value, color }) => (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, color && { color }]}>{value || 'Tidak ditentukan'}</Text>
    </View>
  );

  const ActionButton = ({ onPress, icon, text, style, disabled }) => (
    <TouchableOpacity
      style={[
        styles.attendanceButton,
        style,
        disabled && styles.attendanceButtonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={24} color={disabled ? '#ecf0f1' : '#fff'} />
      <Text
        style={[
          styles.attendanceButtonText,
          disabled && styles.attendanceButtonTextDisabled
        ]}
      >
        {text}
      </Text>
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
      {!isReportSubmitted && (
        <Text style={styles.reportInfoText}>Belum ada laporan kegiatan. Gunakan tombol di bawah untuk membuatnya.</Text>
      )}
      {isReportSubmitted && (
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

      {hasKelompokContext ? (
        <GroupStudentsList
          kelompokId={kelompokId}
          kelompokIds={kelompokIds}
          showTitle={false}
          headerNote={studentsHeaderNote}
          onRefresh={() => dispatch(fetchAktivitasDetail(id_aktivitas))}
        />
      ) : (
        <View style={styles.noGroupContainer}>
          <Ionicons name="people-outline" size={48} color="#bdc3c7" />
          <Text style={styles.noGroupText}>Tidak ada kelompok terkait dengan aktivitas ini</Text>
          <Text style={styles.noGroupSubtext}>
            Edit aktivitas untuk menentukan kelompok yang akan mengikuti aktivitas ini.
          </Text>
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
              {activityDateLabel || 'Tidak ada tanggal'}
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
            text="Absen QR"
            style={styles.fullWidthButton}
            disabled={!hasKelompokContext}
          />
          {manualEligibleActivity && (
            <ActionButton
              onPress={handleManualAttendance}
              icon="create"
              text="Absen Manual"
              style={styles.manualButton}
              disabled={!hasKelompokContext}
            />
          )}
        </View>
        <ActionButton
            onPress={handleActivityReport}
            icon={isReportSubmitted ? "document-text" : "camera"}
            text={isReportSubmitted ? "Lihat Laporan" : "Buat Laporan"}
            style={[
              styles.reportButtonFullWidth,
              isReportSubmitted ? styles.viewReportButton : styles.reportButton
            ]}
          />
          <ActionButton
            onPress={handleViewAttendanceRecords}
            icon="list"
            text="Daftar Kehadiran"
            style={[styles.reportButtonFullWidth, styles.recordsButton]}
            disabled={!hasKelompokContext}
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
  attendanceButtonDisabled: {
    backgroundColor: '#bdc3c7'
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
  attendanceButtonTextDisabled: { color: '#ecf0f1' },
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
