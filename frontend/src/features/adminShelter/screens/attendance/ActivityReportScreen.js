import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Alert, ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import LocationCaptureCard from '../../../../common/components/LocationCaptureCard';
import MapPreview from '../../../../common/components/MapPreview';
import { useLocationCapture } from '../../../../common/hooks/useLocationCapture';

import {
  createActivityReport,
  fetchActivityReport,
  selectActivityReportCache,
  ACTIVITY_REPORT_CACHE_TTL,
  ACTIVITY_REPORT_ERROR_RETRY_DELAY
} from '../../redux/aktivitasSlice';
import CampaignShareModal from '../../components/CampaignShareModal';
import { isActivityCompleted, blockIfCompleted } from '../../utils/activityStatusHelper';
import {
  completeQuickFlow,
  selectIsQuickFlowActive,
  selectQuickFlowActivityId,
  setQuickFlowActivity,
  updateQuickFlowStep,
  selectQuickFlowStatus,
  resetQuickFlow,
} from '../../redux/quickFlowSlice';

const ActivityReportScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { id_aktivitas, activityName, activityDate, activityStatus } = route.params || {};
  
  const { reportLoading, reportError } = useSelector(state => state.aktivitas);
  const reportCache = useSelector(selectActivityReportCache);
  const cachedReportEntry = id_aktivitas ? reportCache?.[id_aktivitas] : null;
  const quickFlowActive = useSelector(selectIsQuickFlowActive);
  const quickFlowActivityId = useSelector(selectQuickFlowActivityId);
  const quickFlowStatus = useSelector(selectQuickFlowStatus);
  const isQuickFlow = (route?.params?.quickFlow || quickFlowActive) && (!quickFlowActivityId || quickFlowActivityId === id_aktivitas);
  
  const [photos, setPhotos] = useState({ foto_1: null, foto_2: null, foto_3: null });
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  
  // Campaign share validation states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [hasSharedCampaign, setHasSharedCampaign] = useState(false);
  const [sharedCampaign, setSharedCampaign] = useState(null);
  
  // Debug logging
  console.log('ActivityReportScreen state:', {
    showCampaignModal,
    hasSharedCampaign,
    sharedCampaign: !!sharedCampaign
  });

  const {
    data: locationPayload,
    capturing: capturingLocation,
    error: locationError,
    isStale: isLocationStale,
    lastCapturedAt: locationCapturedAt,
    captureLocation,
    ensureFreshLocation,
  } = useLocationCapture({ ttl: 60 * 1000 });

  useEffect(() => {
    captureLocation();
  }, [captureLocation]);

  const navigateToActivityDetail = useCallback(() => {
    if (!id_aktivitas) {
      navigation.goBack();
      return;
    }

    if (isQuickFlow) {
      dispatch(setQuickFlowActivity({ activityId: id_aktivitas, status: 'reported' }));
      dispatch(updateQuickFlowStep('activityDetail'));
    }

    navigation.replace('ActivityDetail', {
      id_aktivitas,
      activityName,
      activityDate,
      activityStatus: 'reported',
      quickFlow: isQuickFlow,
    });
  }, [activityDate, activityName, dispatch, id_aktivitas, isQuickFlow, navigation]);

  const resolveReportPayload = useCallback((payload) => (
    payload?.data && typeof payload.data === 'object' ? payload.data : payload
  ), []);

  const cacheMeta = useMemo(() => {
    if (!cachedReportEntry) {
      return null;
    }

    const fetchedAt = cachedReportEntry.fetchedAt ?? 0;
    const cacheAge = Date.now() - fetchedAt;
    const ttl = cachedReportEntry.status === 'error'
      ? ACTIVITY_REPORT_ERROR_RETRY_DELAY
      : ACTIVITY_REPORT_CACHE_TTL;

    return {
      cacheAge,
      ttl,
      isFresh: cacheAge < ttl,
    };
  }, [cachedReportEntry]);

  const shouldSkipFetch = cacheMeta?.isFresh ?? false;

  const initialReportData = useMemo(() => {
    if (!cachedReportEntry) {
      return undefined;
    }

    return {
      status: cachedReportEntry.status || null,
      data: cachedReportEntry.data || null,
    };
  }, [cachedReportEntry]);

  const reportStatusQuery = useQuery({
    queryKey: ['adminShelterActivityReportStatus', id_aktivitas],
    enabled: !!id_aktivitas && !shouldSkipFetch,
    initialData: initialReportData,
    initialDataUpdatedAt: cachedReportEntry?.fetchedAt,
    staleTime: ACTIVITY_REPORT_CACHE_TTL,
    gcTime: ACTIVITY_REPORT_CACHE_TTL,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    queryFn: async () => {
      if (!id_aktivitas) {
        return { status: 'missing', data: null };
      }

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

        console.error('Error fetching activity report:', err);
        return {
          status: 'error',
          data: null,
          error: err,
        };
      }
    },
  });

  const reportStatusData = reportStatusQuery.data;
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (!isQuickFlow || !id_aktivitas) {
      return;
    }

    const status = activityStatus || quickFlowStatus || '';
    if (typeof status === 'string') {
      const normalized = status.toLowerCase();
      if (normalized === 'reported' || normalized === 'selesai' || normalized === 'complete' || normalized === 'done') {
        dispatch(resetQuickFlow());
        return;
      }
    }

    dispatch(setQuickFlowActivity({ activityId: id_aktivitas, status }));
    dispatch(updateQuickFlowStep('activityReport'));
  }, [activityStatus, dispatch, id_aktivitas, isQuickFlow, quickFlowStatus]);

  useEffect(() => {
    if (!id_aktivitas) {
      setCheckingExisting(false);
      return;
    }

    const status = reportStatusData?.status;

    if (status === 'exists' && reportStatusData?.data && !hasNavigatedRef.current) {
      if (isQuickFlow) {
        dispatch(completeQuickFlow());
      }
      hasNavigatedRef.current = true;
      navigation.replace('ViewReportScreen', {
        report: reportStatusData.data,
        activityName,
        activityDate
      });
      return;
    }

    if (
      status === 'missing' ||
      status === 'error' ||
      (!reportStatusQuery.isFetching && status)
    ) {
      setCheckingExisting(false);
    }

    if (reportStatusQuery.isError) {
      setCheckingExisting(false);
    }

    if (shouldSkipFetch && !status) {
      setCheckingExisting(false);
    }
  }, [
    id_aktivitas,
    activityName,
    activityDate,
    navigation,
    reportStatusData,
    reportStatusQuery.isFetching,
    reportStatusQuery.isError,
    shouldSkipFetch
  ]);

  // Check if activity is completed and block access
  useEffect(() => {
    if (blockIfCompleted(activityStatus, navigation, 'laporan kegiatan')) {
      return;
    }
  }, [activityStatus, navigation]);
  
  const confirmProceedWithoutLocation = useCallback((reason) => new Promise((resolve) => {
    Alert.alert(
      'Lokasi belum tersedia',
      `${reason || 'Tidak dapat mengambil lokasi saat ini.'}\nAnda dapat melanjutkan tanpa koordinat, tetapi laporan akan ditandai untuk review.`,
      [
        { text: 'Ambil Ulang', style: 'default', onPress: () => resolve(false) },
        { text: 'Lanjutkan', onPress: () => resolve(true) },
      ]
    );
  }), []);
  
  const handleTakePhoto = async (photoKey) => {
    if (isCapturingPhoto) {
      return;
    }

    setIsCapturingPhoto(true);

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Kami memerlukan izin kamera untuk mengambil foto.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.65,
        skipProcessing: true,
      });
      
      if (!result.canceled && result.assets?.[0]) {
        const image = result.assets[0];
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            image.uri,
            [{ resize: { width: 1400 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
          );
          setPhotos(prev => ({ ...prev, [photoKey]: manipulated.uri }));
        } catch (manipErr) {
          console.warn('Compress failed, using original:', manipErr);
          setPhotos(prev => ({ ...prev, [photoKey]: image.uri }));
        }
      }
    } catch (error) {
      console.error('Error mengambil foto:', error);
      Alert.alert('Error', 'Gagal mengambil foto');
    } finally {
      setIsCapturingPhoto(false);
    }
  };
  
  const handleRemovePhoto = (photoKey) => {
    setPhotos(prev => ({ ...prev, [photoKey]: null }));
  };
  
  const validateForm = () => {
    const photoCount = Object.values(photos).filter(Boolean).length;
    if (photoCount === 0) {
      Alert.alert('Error Validasi', 'Minimal ambil 1 foto untuk laporan');
      return false;
    }
    return true;
  };

  const compressPhotosForSubmission = useCallback(async (photoMap) => {
    const entries = Object.entries(photoMap || {});
    const compressed = {};

    for (const [key, uri] of entries) {
      if (!uri) {
        compressed[key] = null;
        continue;
      }
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1400 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
        );
        compressed[key] = manipulated.uri;
      } catch (err) {
        console.warn('Compress submit failed, using original:', err);
        compressed[key] = uri;
      }
    }

    return compressed;
  }, []);

  // Show loading while checking existing report
  if (checkingExisting) {
    return (
      <View style={styles.checkingContainer}>
        <LoadingSpinner message="Memeriksa laporan kegiatan..." />
      </View>
    );
  }

  const handleCancel = () => {
    if (isQuickFlow) {
      dispatch(completeQuickFlow());
    }
    navigation.goBack();
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called, hasSharedCampaign:', hasSharedCampaign);
    
    if (!hasSharedCampaign) {
      console.log('Opening campaign modal...');
      setShowCampaignModal(true);
      return;
    }
    
    if (!validateForm()) return;

    let gpsDataForSubmission = locationPayload && !isLocationStale ? locationPayload : null;
    if (!gpsDataForSubmission) {
      const captureResult = await ensureFreshLocation();
      if (captureResult.success) {
        gpsDataForSubmission = captureResult.gpsData;
      } else {
        const proceed = await confirmProceedWithoutLocation(captureResult.error);
        if (!proceed) {
          return;
        }
      }
    }
    
    // Debug: capture file info before submission
    const photoDebug = await Promise.all(
      Object.entries(photos).map(async ([key, uri]) => {
        if (!uri) {
          return { key, present: false };
        }
        try {
          const info = await FileSystem.getInfoAsync(uri);
          return {
            key,
            present: true,
            uri,
            size: info?.size,
            mime: 'image/jpeg',
          };
        } catch (fileErr) {
          console.warn('Failed to read file info for', key, fileErr);
          return { key, present: true, uri, size: null, mime: 'image/jpeg' };
        }
      })
    );
    console.log('ActivityReport submit debug', {
      id_aktivitas,
      photoDebug,
      gpsData: gpsDataForSubmission,
    });

    setLoading(true);
    setError(null);
    
    try {
      const compressedPhotos = await compressPhotosForSubmission(photos);
      const formData = new FormData();
      formData.append('id_aktivitas', id_aktivitas);
      
      Object.entries(compressedPhotos).forEach(([key, uri]) => {
        if (uri) {
          formData.append(key, {
            uri,
            name: `${key}_${Date.now()}.jpg`,
            type: 'image/jpeg'
          });
        }
      });

      if (gpsDataForSubmission) {
        const locationFields = {
          latitude: gpsDataForSubmission.latitude,
          longitude: gpsDataForSubmission.longitude,
          location_accuracy: gpsDataForSubmission.gps_accuracy,
          location_recorded_at: gpsDataForSubmission.gps_recorded_at,
        };

        Object.entries(locationFields).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });
      }
      
      const formKeys = formData?._parts?.map?.(([k]) => k) || [];
      console.log('ActivityReport FormData keys:', formKeys);

      const result = await dispatch(createActivityReport(formData)).unwrap();

      const flagLines = result?.flags?.length
        ? result.flags
            .map((flag) => `• ${flag.message || flag.code || 'Perlu peninjauan'}`)
            .join('\n')
        : '';
      
      const successMessage = flagLines
        ? `Laporan kegiatan berhasil dikirim.\n\nCatatan lokasi:\n${flagLines}`
        : 'Laporan kegiatan berhasil dikirim';

      Alert.alert(
        'Berhasil',
        successMessage,
        [
          {
            text: 'Lihat Detail',
            onPress: navigateToActivityDetail
          }
        ],
        { cancelable: false }
      );
    } catch (err) {
      console.error('Error mengirim laporan:', err);
      const backendErrors =
        err?.errors ||
        err?.response?.data?.errors ||
        err?.data?.errors ||
        null;
      if (backendErrors) {
        console.warn('Backend validation errors:', backendErrors);
      }
      // Cek apakah laporan sebenarnya sudah tersimpan meski ada error jaringan
      try {
        const reportPayload = await dispatch(fetchActivityReport(id_aktivitas)).unwrap();
        const reportData = resolveReportPayload(reportPayload);
        if (reportData) {
          const fallbackMessage = 'Laporan kemungkinan sudah tersimpan meski ada gangguan jaringan.';

          Alert.alert(
            'Berhasil (dikonfirmasi ulang)',
            fallbackMessage,
            [
              { text: 'Lihat Detail', onPress: navigateToActivityDetail },
            ],
          );
          return;
        }
      } catch (verifyErr) {
        console.warn('Verification after failure failed:', verifyErr);
      }

      setError(err?.message || err || 'Gagal mengirim laporan');
    } finally {
      setLoading(false);
    }
  };

  // Handle campaign share completion
  const handleCampaignShareComplete = (campaign) => {
    setHasSharedCampaign(true);
    setSharedCampaign(campaign);
    setShowCampaignModal(false);
    
    // Show success message and let user manually submit
    Alert.alert(
      'Berhasil!',
      `Terima kasih telah membagikan kampanye "${campaign.title}". Sekarang Anda dapat melanjutkan dengan mengirim laporan aktivitas.`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Just close the alert, user can now submit the form manually
            console.log('Campaign shared successfully:', campaign.title);
          }
        }
      ]
    );
  };

  // Handle campaign skip completion (when API error occurs)
  const handleCampaignSkipComplete = () => {
    console.log('Campaign skipped due to API error - allowing report submission');
    setHasSharedCampaign(true);
    setSharedCampaign({ title: 'Dilewati (API Error)' });
    setShowCampaignModal(false);
    
    // Show information message to user
    Alert.alert(
      'Informasi',
      'Anda telah melewati berbagi kampanye karena API tidak dapat diakses. Sekarang Anda dapat melanjutkan dengan mengirim laporan aktivitas.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Just close the alert, user can now submit the form manually
            console.log('Campaign skipped due to API error');
          }
        }
      ]
    );
  };

  const PhotoBox = ({ photoKey, uri, onTakePhoto, onRemove }) => (
    <View style={styles.photoBox}>
      {uri ? (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri }} style={styles.photoPreview} />
          <TouchableOpacity style={styles.removePhotoButton} onPress={() => onRemove(photoKey)}>
            <Ionicons name="close-circle" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={() => onTakePhoto(photoKey)}
          disabled={isCapturingPhoto}
        >
          <Ionicons name="camera" size={32} color="#bdc3c7" />
          <Text style={styles.addPhotoText}>{photoKey.replace('foto_', 'Foto ')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
      >
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
      
      <View style={styles.header}>
        <Text style={styles.title}>Laporan Kegiatan</Text>
        <Text style={styles.subtitle}>{activityName}</Text>
        {activityDate && <Text style={styles.date}>{activityDate}</Text>}
      </View>
      
      <View style={styles.instructionContainer}>
        <Ionicons name="information-circle" size={20} color="#3498db" />
        <Text style={styles.instructionText}>
          Ambil foto dokumentasi kegiatan menggunakan kamera. Minimal 1 foto, maksimal 3 foto.
        </Text>
      </View>

      <View style={styles.locationCardContainer}>
        <LocationCaptureCard
          title="Lokasi Dokumentasi"
          description="Koordinat disertakan agar pusat dapat melihat konteks lokasi. Data disimpan 60 detik."
          location={locationPayload}
          isStale={isLocationStale}
          capturing={capturingLocation}
          error={locationError}
          lastCapturedAt={locationCapturedAt}
          onCapturePress={captureLocation}
        />
      </View>

      <View style={styles.mapPreviewContainer}>
        <MapPreview
          location={locationPayload}
          isStale={isLocationStale}
          label="Lokasi Dokumentasi"
          height={200}
        />
      </View>

      {/* Campaign Share Status */}
      <View style={styles.campaignShareSection}>
        <Text style={styles.campaignShareTitle}>Status Berbagi Kampanye</Text>
        {hasSharedCampaign && sharedCampaign ? (
          <View style={styles.campaignSharedContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
            <Text style={styles.campaignSharedText}>
              Sudah berbagi: {sharedCampaign.title}
            </Text>
          </View>
        ) : (
          <View style={styles.campaignNotSharedContainer}>
            <Ionicons name="alert-circle" size={20} color="#e74c3c" />
            <Text style={styles.campaignNotSharedText}>
              Wajib berbagi kampanye sebelum mengirim laporan
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Foto Dokumentasi<Text style={styles.required}>*</Text></Text>
        <View style={styles.photosContainer}>
          {['foto_1', 'foto_2', 'foto_3'].map(key => (
            <PhotoBox
              key={key}
              photoKey={key}
              uri={photos[key]}
              onTakePhoto={handleTakePhoto}
              onRemove={handleRemovePhoto}
            />
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Kirim Laporan"
          onPress={() => {
            console.log('Button clicked, disabled:', loading);
            handleSubmit();
          }}
          loading={loading}
          disabled={loading}
          fullWidth
        />
        
        <Button
          title="Batal"
          onPress={handleCancel}
          type="outline"
          disabled={loading}
          fullWidth
          style={styles.cancelButton}
        />
      </View>
      
      {loading && (
        <LoadingSpinner 
          fullScreen 
          message="Mengirim laporan kegiatan..."
        />
      )}
      </ScrollView>
      
      {/* Campaign Share Modal - Outside ScrollView */}
      <CampaignShareModal
        visible={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        onShareComplete={handleCampaignShareComplete}
        onSkipCampaign={handleCampaignSkipComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  checkingContainer: { 
    flex: 1, 
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#3498db', marginTop: 4, textAlign: 'center' },
  date: { fontSize: 14, color: '#7f8c8d', marginTop: 2, textAlign: 'center' },
  instructionContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f4f8',
    padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#bce0f4'
  },
  locationCardContainer: {
    marginBottom: 20,
  },
  mapPreviewContainer: {
    marginBottom: 20,
    height: 200,
  },
  instructionText: { flex: 1, marginLeft: 8, color: '#2c88a6', fontSize: 14 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, color: '#34495e', marginBottom: 12, fontWeight: '500' },
  required: { color: '#e74c3c' },
  photosContainer: {
    flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'
  },
  photoBox: { width: '32%', aspectRatio: 1, marginBottom: 10, borderRadius: 8, overflow: 'hidden' },
  addPhotoButton: {
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center'
  },
  addPhotoText: { color: '#7f8c8d', marginTop: 4, fontSize: 12, textAlign: 'center' },
  photoPreviewContainer: { width: '100%', height: '100%', position: 'relative' },
  photoPreview: { width: '100%', height: '100%', borderRadius: 8 },
  removePhotoButton: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 12
  },
  buttonContainer: { marginTop: 20 },
  cancelButton: { marginTop: 12 },
  // Campaign share styles
  campaignShareSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  campaignShareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  campaignSharedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  campaignSharedText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#155724',
    fontWeight: '500',
  },
  campaignNotSharedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  campaignNotSharedText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#721c24',
    fontWeight: '500',
  }
});

export default ActivityReportScreen;
