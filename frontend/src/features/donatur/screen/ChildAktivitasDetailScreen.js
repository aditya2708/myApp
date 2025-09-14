import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturAktivitasApi } from '../api/donaturAktivitasApi';

const { width } = Dimensions.get('window');

const ChildAktivitasDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, aktivitasId, childName } = route.params;

  const [aktivitas, setAktivitas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: `Aktivitas - ${childName}`,
    });
  }, [navigation, childName]);

  const fetchAktivitasDetail = async () => {
    try {
      setError(null);
      const response = await donaturAktivitasApi.getAktivitasDetail(childId, aktivitasId);
      setAktivitas(response.data.data);
    } catch (err) {
      console.error('Error fetching aktivitas detail:', err);
      setError('Gagal memuat detail aktivitas. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAktivitasDetail();
  }, [childId, aktivitasId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'Ya': return '#2ecc71';
      case 'Terlambat': return '#f39c12';
      case 'Tidak Hadir': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'Ya': return 'checkmark-circle';
      case 'Terlambat': return 'time';
      case 'Tidak Hadir': return 'close-circle';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat aktivitas..." />;
  }

  if (error || !aktivitas) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error || "Aktivitas tidak ditemukan"}
          onRetry={fetchAktivitasDetail}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.activityType}>{aktivitas.jenis_kegiatan}</Text>
          <View style={[styles.attendanceStatus, { backgroundColor: getAttendanceColor(aktivitas.attendance_status) }]}>
            <Ionicons name={getAttendanceIcon(aktivitas.attendance_status)} size={20} color="#ffffff" />
          </View>
        </View>
        
        <Text style={styles.activityTitle}>{aktivitas.materi}</Text>
        <Text style={styles.activityDate}>{formatDate(aktivitas.tanggal)}</Text>
        
        {aktivitas.level && aktivitas.nama_kelompok && (
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>{aktivitas.level} - {aktivitas.nama_kelompok}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jadwal</Text>
        <View style={styles.timeGrid}>
          <View style={styles.timeItem}>
            <Ionicons name="play" size={20} color="#2ecc71" />
            <Text style={styles.timeLabel}>Waktu Mulai</Text>
            <Text style={styles.timeValue}>{aktivitas.start_time}</Text>
          </View>
          <View style={styles.timeItem}>
            <Ionicons name="stop" size={20} color="#e74c3c" />
            <Text style={styles.timeLabel}>Waktu Selesai</Text>
            <Text style={styles.timeValue}>{aktivitas.end_time}</Text>
          </View>
          {aktivitas.late_threshold && (
            <View style={styles.timeItem}>
              <Ionicons name="warning" size={20} color="#f39c12" />
              <Text style={styles.timeLabel}>Terlambat Setelah</Text>
              <Text style={styles.timeValue}>{aktivitas.late_threshold}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Kehadiran</Text>
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceHeader}>
            <View style={[styles.attendanceIcon, { backgroundColor: getAttendanceColor(aktivitas.attendance_status) }]}>
              <Ionicons name={getAttendanceIcon(aktivitas.attendance_status)} size={24} color="#ffffff" />
            </View>
            <Text style={[styles.attendanceStatusText, { color: getAttendanceColor(aktivitas.attendance_status) }]}>
              {aktivitas.attendance_status}
            </Text>
          </View>
          
          <View style={styles.attendanceDetails}>
            {aktivitas.attendance_time && (
              <View style={styles.attendanceDetail}>
                <Text style={styles.detailLabel}>Waktu Kedatangan</Text>
                <Text style={styles.detailValue}>
                  {new Date(aktivitas.attendance_time).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
            
            <View style={styles.attendanceDetail}>
              <Text style={styles.detailLabel}>Status Verifikasi</Text>
              <View style={styles.verificationStatus}>
                <Text style={[styles.detailValue, { color: aktivitas.attendance_verified ? '#2ecc71' : '#f39c12' }]}>
                  {aktivitas.attendance_verified ? 'Terverifikasi' : 'Menunggu'}
                </Text>
                <Ionicons 
                  name={aktivitas.attendance_verified ? "shield-checkmark" : "time"} 
                  size={16} 
                  color={aktivitas.attendance_verified ? '#2ecc71' : '#f39c12'} 
                />
              </View>
            </View>
            
            {aktivitas.attendance_notes && (
              <View style={styles.attendanceDetail}>
                <Text style={styles.detailLabel}>Catatan</Text>
                <Text style={styles.detailValue}>{aktivitas.attendance_notes}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {(aktivitas.foto_1_url || aktivitas.foto_2_url || aktivitas.foto_3_url) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto Aktivitas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScrollContainer}>
            {[aktivitas.foto_1_url, aktivitas.foto_2_url, aktivitas.foto_3_url].filter(url => url).map((url, index) => (
              <TouchableOpacity key={index} style={styles.photoWrapper}>
                <Image source={{ uri: url }} style={styles.activityPhoto} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {aktivitas.materi_data && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materi Pembelajaran</Text>
          <View style={styles.materialCard}>
            <View style={styles.materialHeader}>
              <Ionicons name="book" size={24} color="#9b59b6" />
              <Text style={styles.materialSubject}>{aktivitas.materi_data.mata_pelajaran}</Text>
            </View>
            <Text style={styles.materialName}>{aktivitas.materi_data.nama_materi}</Text>
            {aktivitas.materi_data.level_anak_binaan && (
              <Text style={styles.materialLevel}>Level: {aktivitas.materi_data.level_anak_binaan.nama_level}</Text>
            )}
          </View>
        </View>
      )}

      {aktivitas.shelter && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Shelter</Text>
          <View style={styles.shelterCard}>
            <Text style={styles.shelterName}>{aktivitas.shelter.nama_shelter}</Text>
            <Text style={styles.shelterAddress}>{aktivitas.shelter.alamat}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { paddingBottom: 20 },
  header: {
    backgroundColor: '#9b59b6',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  activityType: { fontSize: 16, color: '#ffffff', fontWeight: '600' },
  attendanceStatus: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  activityTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, lineHeight: 26 },
  activityDate: { fontSize: 14, color: '#ffffff', opacity: 0.9, marginBottom: 12 },
  levelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  levelText: { fontSize: 12, color: '#ffffff', fontWeight: '500' },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginBottom: 16 },
  timeGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  timeItem: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8, marginHorizontal: 4 },
  timeLabel: { fontSize: 12, color: '#666666', marginTop: 8, marginBottom: 4 },
  timeValue: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  attendanceCard: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16 },
  attendanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  attendanceIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  attendanceStatusText: { fontSize: 18, fontWeight: 'bold' },
  attendanceDetails: { gap: 12 },
  attendanceDetail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14, color: '#666666' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#333333' },
  verificationStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  photosScrollContainer: { paddingRight: 16 },
  photoWrapper: { marginRight: 12, borderRadius: 8, overflow: 'hidden' },
  activityPhoto: { width: 150, height: 100, borderRadius: 8 },
  materialCard: {
    backgroundColor: '#f0e6f5',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  materialHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  materialSubject: { fontSize: 16, fontWeight: 'bold', color: '#9b59b6', marginLeft: 8 },
  materialName: { fontSize: 16, color: '#333333', marginBottom: 4 },
  materialLevel: { fontSize: 12, color: '#666666', fontStyle: 'italic' },
  shelterCard: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16 },
  shelterName: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 4 },
  shelterAddress: { fontSize: 14, color: '#666666' },
});

export default ChildAktivitasDetailScreen;