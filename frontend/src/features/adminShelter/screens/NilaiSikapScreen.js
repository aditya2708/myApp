import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

import { raportApi } from '../api/raportApi';
import { semesterApi } from '../api/semesterApi';

const NilaiSikapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    anakId,
    anakData,
    semesterId: semesterIdParam,
    semesterName: semesterNameParam,
    onNilaiSikapUpdated
  } = route.params || {};

  const [activeSemester, setActiveSemester] = useState(null);
  const [semesterInfo, setSemesterInfo] = useState(null);
  const [nilaiSikap, setNilaiSikap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const childName = anakData?.full_name || anakData?.nick_name;
    navigation.setOptions({
      title: childName ? `Nilai Sikap - ${childName}` : 'Nilai Sikap'
    });
  }, [anakData, navigation]);

  const loadData = useCallback(
    async ({ showLoading = true } = {}) => {
      if (!anakId) {
        return;
      }

      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        setError(null);

        let semesterData = null;
        let activeData = null;

        try {
          const activeResponse = await semesterApi.getActive();
          if (activeResponse.data.success) {
            activeData = activeResponse.data.data;
            setActiveSemester(activeData);
            if (activeData) {
              semesterData = activeData;
            }
          }
        } catch (activeErr) {
          console.error('Error fetching active semester:', activeErr);
        }

        if (semesterIdParam) {
          const isDifferentSemester = !semesterData || semesterData.id !== semesterIdParam;
          if (isDifferentSemester) {
            try {
              const semesterDetailResponse = await semesterApi.getSemesterDetail(semesterIdParam);
              if (semesterDetailResponse.data.success) {
                semesterData = semesterDetailResponse.data.data;
              }
            } catch (detailErr) {
              console.error('Error fetching semester detail:', detailErr);
            }
          }
        }

        if (!semesterData && semesterNameParam) {
          semesterData = {
            id: semesterIdParam,
            nama: semesterNameParam
          };
        }

        if (semesterData) {
          setSemesterInfo(semesterData);
          try {
            const nilaiResponse = await raportApi.getNilaiSikap(anakId, semesterData.id);
            if (nilaiResponse.data.success) {
              setNilaiSikap(nilaiResponse.data.data);
            } else {
              setNilaiSikap(null);
            }
          } catch (nilaiErr) {
            if (nilaiErr.response?.status === 404) {
              setNilaiSikap(null);
            } else {
              console.error('Error fetching nilai sikap:', nilaiErr);
              setError('Gagal memuat nilai sikap. Silakan coba lagi.');
            }
          }
        } else {
          setSemesterInfo(null);
          setNilaiSikap(null);
          setError('Semester aktif belum tersedia. Silakan hubungi admin cabang.');
        }
      } catch (err) {
        console.error('Error loading nilai sikap data:', err);
        setError('Gagal memuat data nilai sikap. Silakan coba lagi.');
      } finally {
        if (showLoading) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [anakId, semesterIdParam, semesterNameParam]
  );

  useFocusEffect(
    useCallback(() => {
      loadData({ showLoading: true });
    }, [loadData])
  );

  const handleRefresh = useCallback(() => {
    loadData({ showLoading: false });
  }, [loadData]);

  const handleAddOrEdit = () => {
    if (!semesterInfo?.id) {
      return;
    }

    navigation.navigate('NilaiSikapForm', {
      anakId,
      anakData,
      semesterId: semesterInfo.id,
      nilaiSikap,
      onSuccess: async () => {
        await loadData({ showLoading: false });
        if (typeof onNilaiSikapUpdated === 'function') {
          onNilaiSikapUpdated();
        }
      }
    });
  };

  const getPredikat = (nilai) => {
    if (nilai >= 90) return 'Sangat Baik';
    if (nilai >= 80) return 'Baik';
    if (nilai >= 70) return 'Cukup';
    return 'Perlu Pembinaan';
  };

  const getPredikatColor = (nilai) => {
    if (nilai >= 90) return '#2ecc71';
    if (nilai >= 80) return '#3498db';
    if (nilai >= 70) return '#f39c12';
    return '#e74c3c';
  };

  const calculateAverage = () => {
    if (!nilaiSikap) return 0;
    const values = [
      Number(nilaiSikap.kedisiplinan || 0),
      Number(nilaiSikap.kerjasama || 0),
      Number(nilaiSikap.tanggung_jawab || 0),
      Number(nilaiSikap.sopan_santun || 0)
    ];
    const total = values.reduce((sum, value) => sum + value, 0);
    return values.length ? total / values.length : 0;
  };

  const renderNilaiItem = (label, field, icon) => (
    <View style={styles.nilaiItem} key={field}>
      <View style={styles.nilaiIcon}>
        <Ionicons name={icon} size={24} color="#3498db" />
      </View>
      <View style={styles.nilaiContent}>
        <Text style={styles.nilaiLabel}>{label}</Text>
        <Text style={styles.nilaiValue}>{Math.round(Number(nilaiSikap?.[field] || 0))}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data nilai sikap..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3498db"]} />
      }
    >
      {error && <ErrorMessage message={error} />}

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Informasi Anak</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#3498db" />
            <Text style={styles.infoText}>{anakData?.full_name || anakData?.nick_name || '-'}</Text>
          </View>
          {semesterInfo && (
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={20} color="#3498db" />
              <Text style={styles.infoText}>
                Semester: {semesterInfo.nama || semesterInfo.nama_semester || 'Tidak diketahui'}
              </Text>
            </View>
          )}
          {activeSemester && semesterInfo && activeSemester.id !== semesterInfo.id && (
            <Text style={styles.semesterNote}>
              Menampilkan semester terpilih: {semesterInfo.nama || semesterInfo.nama_semester}
            </Text>
          )}
        </View>

        {nilaiSikap ? (
          <View style={styles.nilaiContainer}>
            <View style={styles.averageCard}>
              <Text style={styles.averageLabel}>Nilai Rata-rata</Text>
              <Text style={styles.averageValue}>{calculateAverage().toFixed(1)}</Text>
              <Text style={[styles.averagePredikat, { color: getPredikatColor(calculateAverage()) }] }>
                {getPredikat(calculateAverage())}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detail Nilai Sikap</Text>
              {renderNilaiItem('Kedisiplinan', 'kedisiplinan', 'time-outline')}
              {renderNilaiItem('Kerjasama', 'kerjasama', 'people-outline')}
              {renderNilaiItem('Tanggung Jawab', 'tanggung_jawab', 'shield-checkmark-outline')}
              {renderNilaiItem('Sopan Santun', 'sopan_santun', 'happy-outline')}
            </View>

            {nilaiSikap.catatan_sikap ? (
              <View style={styles.catatanCard}>
                <Text style={styles.sectionTitle}>Catatan Sikap</Text>
                <Text style={styles.catatanText}>{nilaiSikap.catatan_sikap}</Text>
              </View>
            ) : null}

            <Button
              title="Edit Nilai Sikap"
              onPress={handleAddOrEdit}
              style={styles.actionButton}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="information-circle-outline" size={48} color="#95a5a6" />
            <Text style={styles.emptyTitle}>Belum ada nilai sikap</Text>
            <Text style={styles.emptyDescription}>
              Masukkan penilaian sikap anak untuk melengkapi data raport semester ini.
            </Text>
            {semesterInfo?.id && (
              <Button title="Tambah Nilai Sikap" onPress={handleAddOrEdit} style={styles.actionButton} />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 12,
    flex: 1,
  },
  semesterNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#7f8c8d',
  },
  nilaiContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  averageCard: {
    backgroundColor: '#3498db',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  averageLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  averageValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  averagePredikat: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  nilaiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  nilaiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecf5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nilaiContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nilaiLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  nilaiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  catatanCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  catatanText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  }
});

export default NilaiSikapScreen;
