import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturRaportApi } from '../api/donaturRaportApi';

const ChildRaportDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, raportId, childName } = route.params;
  const [raport, setRaport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: `Rapor - ${childName}` });
  }, [navigation, childName]);

  const fetchRaportDetail = async () => {
    try {
      setError(null);
      const response = await donaturRaportApi.getRaportDetail(childId, raportId);
      setRaport(response.data.data);
    } catch (err) {
      console.error('Error fetching raport detail:', err);
      setError('Gagal memuat rapor. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRaportDetail(); }, [childId, raportId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return '#2ecc71';
    if (grade >= 80) return '#3498db';
    if (grade >= 70) return '#f39c12';
    if (grade >= 60) return '#e67e22';
    return '#e74c3c';
  };

  const getGradeLetter = (grade) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'E';
  };

  if (loading) return <LoadingSpinner fullScreen message="Memuat rapor..." />;
  if (error || !raport) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error || "Rapor tidak ditemukan"} onRetry={fetchRaportDetail} />
      </View>
    );
  }

  const averageGrade = raport.nilai_rata_rata || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.semesterTitle}>
          {raport.semester?.nama_semester || 'Rapor Semester'}
        </Text>
        <Text style={styles.tahunAjaran}>{raport.semester?.tahun_ajaran || ''}</Text>
        <View style={styles.gradeOverview}>
          <View style={[styles.averageGrade, { backgroundColor: getGradeColor(averageGrade) }]}>
            <Text style={styles.averageNumber}>{averageGrade.toFixed(1)}</Text>
            <Text style={styles.averageLetter}>{getGradeLetter(averageGrade)}</Text>
          </View>
          <Text style={styles.averageLabel}>Rata-rata Keseluruhan</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ringkasan Akademik</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#3498db" />
            <Text style={styles.statNumber}>
              {raport.persentase_kehadiran ? `${raport.persentase_kehadiran}%` : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Kehadiran</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bar-chart" size={24} color="#9b59b6" />
            <Text style={styles.statNumber}>
              {raport.ranking ? `#${raport.ranking}` : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Peringkat Kelas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#2ecc71" />
            <Text style={styles.statNumber}>{raport.total_kehadiran || 0}</Text>
            <Text style={styles.statLabel}>Hari Hadir</Text>
          </View>
        </View>
      </View>

      {raport.raport_detail && raport.raport_detail.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nilai Mata Pelajaran</Text>
          {raport.raport_detail.map((subject, index) => (
            <View key={index} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{subject.mata_pelajaran}</Text>
                <View style={[styles.subjectGrade, { backgroundColor: getGradeColor(subject.nilai_akhir) }]}>
                  <Text style={styles.subjectGradeText}>
                    {subject.nilai_huruf || getGradeLetter(subject.nilai_akhir)}
                  </Text>
                </View>
              </View>
              <View style={styles.subjectDetails}>
                <View style={styles.subjectDetail}>
                  <Text style={styles.detailLabel}>Nilai</Text>
                  <Text style={styles.detailValue}>{subject.nilai_akhir}</Text>
                </View>
                <View style={styles.subjectDetail}>
                  <Text style={styles.detailLabel}>KKM</Text>
                  <Text style={styles.detailValue}>{subject.kkm || 70}</Text>
                </View>
                <View style={styles.subjectDetail}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { 
                    color: subject.nilai_akhir >= (subject.kkm || 70) ? '#2ecc71' : '#e74c3c' 
                  }]}>
                    {subject.keterangan || (subject.nilai_akhir >= (subject.kkm || 70) ? 'Lulus' : 'Tidak Lulus')}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {raport.catatan_wali_kelas && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Catatan Guru</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{raport.catatan_wali_kelas}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informasi Rapor</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tanggal Terbit</Text>
            <Text style={styles.infoValue}>{formatDate(raport.tanggal_terbit)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: '#2ecc71' }]}>
              {raport.status === 'published' ? 'Diterbitkan' : raport.status}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { paddingBottom: 20 },
  header: {
    backgroundColor: '#9b59b6',
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  semesterTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 4 },
  tahunAjaran: { fontSize: 16, color: '#ffffff', opacity: 0.9, marginBottom: 20 },
  gradeOverview: { alignItems: 'center' },
  averageGrade: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  averageNumber: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  averageLetter: { fontSize: 16, color: '#ffffff', opacity: 0.9 },
  averageLabel: { fontSize: 14, color: '#ffffff', opacity: 0.8 },
  card: {
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
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, alignItems: 'center', padding: 12, marginHorizontal: 4, backgroundColor: '#f8f9fa', borderRadius: 8 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#333333', marginVertical: 4 },
  statLabel: { fontSize: 12, color: '#666666', textAlign: 'center' },
  subjectCard: { borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 8, padding: 12, marginBottom: 12 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectName: { fontSize: 16, fontWeight: '600', color: '#333333', flex: 1 },
  subjectGrade: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  subjectGradeText: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  subjectDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectDetail: { alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#666666', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#333333' },
  notesCard: { backgroundColor: '#f8f9fa', padding: 16, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#9b59b6' },
  notesText: { fontSize: 14, color: '#333333', lineHeight: 20, fontStyle: 'italic' },
  infoGrid: { gap: 12 },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 14, color: '#666666' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#333333' },
});

export default ChildRaportDetailScreen;