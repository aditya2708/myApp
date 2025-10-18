import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import Button from '../../../../common/components/Button';
import {
  fetchAktivitasDetail,
  selectAktivitasDetail,
  resetAktivitasDetail
} from '../../redux/aktivitasSlice';

const ViewReportScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();

  const rawReport = route.params?.report;
  const reportData = rawReport?.data ?? rawReport ?? null;
  const activityId = reportData?.id_aktivitas ?? route.params?.id_aktivitas;
  const activityName =
    route.params?.activityName ||
    reportData?.activity_name ||
    reportData?.aktivitas?.nama ||
    reportData?.nama_aktivitas ||
    'Aktivitas';

  const activityDateParam = route.params?.activityDate || null;

  const activityDetail = useSelector(selectAktivitasDetail);
  const detailMatches = activityDetail?.id_aktivitas === activityId;
  const effectiveActivityDetail = detailMatches ? activityDetail : null;

  useEffect(() => {
    if (!activityId) {
      return;
    }

    if (!detailMatches) {
      dispatch(fetchAktivitasDetail(activityId));
    }
  }, [activityId, detailMatches, dispatch]);

  const cleanupActivityIdRef = useRef(activityId);
  cleanupActivityIdRef.current = activityId;

  useEffect(
    () => () => {
      if (cleanupActivityIdRef.current) {
        dispatch(resetAktivitasDetail());
      }
    },
    [dispatch]
  );

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    []
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    []
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    []
  );

  const safeParseDate = value => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      // Attempt to parse time-only values
      if (typeof value === 'string' && value.includes(':')) {
        const date = new Date();
        const [hours, minutes] = value.split(':');
        date.setHours(Number.parseInt(hours, 10) || 0);
        date.setMinutes(Number.parseInt(minutes, 10) || 0);
        date.setSeconds(0, 0);
        return date;
      }
      return null;
    }
    return parsed;
  };

  const formatDateTime = value => {
    const date = safeParseDate(value);
    return date ? dateTimeFormatter.format(date) : '-';
  };

  const formatDate = value => {
    const date = safeParseDate(value);
    return date ? dateFormatter.format(date) : '-';
  };

  const formatTime = value => {
    const date = safeParseDate(value);
    return date ? timeFormatter.format(date) : '-';
  };

  const photos = [
    { key: 'foto_1', url: reportData?.foto_1_url, label: 'Foto 1' },
    { key: 'foto_2', url: reportData?.foto_2_url, label: 'Foto 2' },
    { key: 'foto_3', url: reportData?.foto_3_url, label: 'Foto 3' }
  ].filter(photo => photo.url); // Only show photos that exist

  const getSubject = () =>
    effectiveActivityDetail?.kurikulum_info?.mata_pelajaran ||
    effectiveActivityDetail?.materi ||
    reportData?.kurikulum_info?.mata_pelajaran ||
    reportData?.materi ||
    '-';

  const getGroupName = () =>
    effectiveActivityDetail?.aktivitas?.nama_kelompok ||
    reportData?.aktivitas?.nama_kelompok ||
    effectiveActivityDetail?.kelompok?.nama ||
    effectiveActivityDetail?.kelompok?.nama_kelompok ||
    reportData?.kelompok?.nama ||
    reportData?.kelompok?.nama_kelompok ||
    reportData?.kelompok_name ||
    reportData?.nama_kelompok ||
    route.params?.kelompokName ||
    '-';

  const getTutorName = () =>
    effectiveActivityDetail?.tutor?.nama ||
    effectiveActivityDetail?.pengajar?.nama ||
    reportData?.tutor?.nama ||
    reportData?.tutor_name ||
    reportData?.pengajar?.nama ||
    '-';


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="document-text" size={32} color="#27ae60" />
        </View>
        <Text style={styles.title}>Laporan Kegiatan</Text>
        <Text style={styles.subtitle}>{activityName}</Text>
        {(effectiveActivityDetail?.tanggal || activityDateParam) && (
          <Text style={styles.date}>
            {effectiveActivityDetail?.tanggal
              ? formatDate(effectiveActivityDetail.tanggal)
              : activityDateParam}
          </Text>
        )}
      </View>

      <View style={styles.statusContainer}>
        <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
        <Text style={styles.statusText}>Laporan sudah dikirim</Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="time-outline" size={18} color="#7f8c8d" />
          <Text style={styles.sectionTitle}>Informasi Laporan</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tanggal Dibuat</Text>
            <Text style={styles.infoValue}>{formatDateTime(reportData?.created_at)}</Text>
          </View>

          {reportData?.updated_at && reportData.updated_at !== reportData.created_at && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Terakhir Diperbarui</Text>
              <Text style={styles.infoValue}>{formatDateTime(reportData.updated_at)}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="information-circle-outline" size={18} color="#7f8c8d" />
          <Text style={styles.sectionTitle}>Info Aktivitas</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Jenis Kegiatan</Text>
            <Text style={styles.infoValue}>
              {effectiveActivityDetail?.jenis_kegiatan || reportData?.jenis_kegiatan || '-'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Mata Pelajaran / Materi</Text>
            <Text style={styles.infoValue}>{getSubject()}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Kelompok</Text>
            <Text style={styles.infoValue}>{getGroupName()}</Text>
          </View>

          {(effectiveActivityDetail?.tanggal || activityDateParam) && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tanggal Kegiatan</Text>
              <Text style={styles.infoValue}>
                {effectiveActivityDetail?.tanggal
                  ? formatDate(effectiveActivityDetail.tanggal)
                  : activityDateParam}
              </Text>
            </View>
          )}

          {(effectiveActivityDetail?.start_time || effectiveActivityDetail?.end_time) && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Waktu</Text>
              <Text style={styles.infoValue}>
                {[
                  effectiveActivityDetail?.start_time
                    ? formatTime(effectiveActivityDetail.start_time)
                    : null,
                  effectiveActivityDetail?.end_time
                    ? formatTime(effectiveActivityDetail.end_time)
                    : null
                ]
                  .filter(Boolean)
                  .join(' - ')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="person-circle-outline" size={18} color="#7f8c8d" />
          <Text style={styles.sectionTitle}>Info Tutor</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nama Tutor</Text>
            <Text style={styles.infoValue}>{getTutorName()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.photosSection}>
        <Text style={styles.sectionTitle}>Foto Dokumentasi ({photos.length})</Text>

        {photos.length === 0 ? (
          <View style={styles.noPhotosContainer}>
            <Ionicons name="image-outline" size={32} color="#bdc3c7" />
            <Text style={styles.noPhotosText}>Tidak ada foto</Text>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={photo.key} style={styles.photoContainer}>
                <Image source={{ uri: photo.url }} style={styles.photo} />
                <Text style={styles.photoLabel}>{photo.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Kembali"
          onPress={() => navigation.goBack()}
          type="outline"
          fullWidth
          leftIcon={<Ionicons name="arrow-back" size={18} color="#3498db" />}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: { 
    padding: 16, 
    paddingBottom: 40 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 18, 
    color: '#3498db', 
    marginTop: 4, 
    textAlign: 'center' 
  },
  date: { 
    fontSize: 14, 
    color: '#7f8c8d', 
    marginTop: 2, 
    textAlign: 'center' 
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9'
  },
  statusText: {
    marginLeft: 8,
    color: '#27ae60',
    fontSize: 16,
    fontWeight: '500'
  },
  sectionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  infoGrid: {},
  infoItem: {
    flexDirection: 'column',
    marginBottom: 12
  },
  infoLabel: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500'
  },
  photosSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16
  },
  noPhotosContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  noPhotosText: {
    marginTop: 8,
    color: '#6c757d',
    fontSize: 14
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  photoContainer: {
    width: '32%',
    marginBottom: 12
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f8f9fa'
  },
  photoLabel: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500'
  },
  buttonContainer: {
    marginTop: 20
  }
});

export default ViewReportScreen;