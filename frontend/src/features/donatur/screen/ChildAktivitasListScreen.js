import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturAktivitasApi } from '../api/donaturAktivitasApi';

const ChildAktivitasListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName } = route.params;

  const [aktivitasList, setAktivitasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: `Aktivitas - ${childName}`,
    });
  }, [navigation, childName]);

  const fetchAktivitasList = async () => {
    try {
      setError(null);
      const response = await donaturAktivitasApi.getAktivitasList(childId);
      setAktivitasList(response.data.data);
    } catch (err) {
      console.error('Error fetching aktivitas:', err);
      setError('Gagal memuat aktivitas. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAktivitasList();
  }, [childId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAktivitasList();
  };

  const handleViewAktivitas = (aktivitasId) => {
    navigation.navigate('ChildAktivitasDetail', { 
      childId, 
      aktivitasId, 
      childName
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
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

  const renderAktivitasItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.aktivitasCard}
      onPress={() => handleViewAktivitas(item.id_aktivitas)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.activityInfo}>
          <Text style={styles.activityType}>{item.jenis_kegiatan}</Text>
          <Text style={styles.activityDate}>{formatDate(item.tanggal)}</Text>
        </View>
        
        <View style={[styles.attendanceStatus, { backgroundColor: getAttendanceColor(item.attendance_status) }]}>
          <Ionicons name={getAttendanceIcon(item.attendance_status)} size={16} color="#ffffff" />
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.activityTitle}>{item.materi}</Text>
        
        {item.level && item.nama_kelompok && (
          <Text style={styles.levelGroup}>{item.level} - {item.nama_kelompok}</Text>
        )}
        
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.timeText}>{item.start_time} - {item.end_time}</Text>
        </View>

        {item.materi_data && (
          <View style={styles.materialInfo}>
            <Ionicons name="book-outline" size={14} color="#9b59b6" />
            <Text style={styles.materialText}>
              {item.materi_data.mata_pelajaran} - {item.materi_data.nama_materi}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.attendanceInfo}>
          <Text style={styles.attendanceLabel}>Kehadiran:</Text>
          <Text style={[styles.attendanceText, { color: getAttendanceColor(item.attendance_status) }]}>
            {item.attendance_status}
          </Text>
          {item.attendance_verified && (
            <Ionicons name="shield-checkmark" size={14} color="#2ecc71" />
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#cccccc" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat aktivitas..." />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchAktivitasList}
        />
      )}

      {aktivitasList.length > 0 ? (
        <FlatList
          data={aktivitasList}
          renderItem={renderAktivitasItem}
          keyExtractor={(item) => item.id_aktivitas.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color="#cccccc" />
          <Text style={styles.emptyText}>Belum Ada Aktivitas</Text>
          <Text style={styles.emptySubText}>
            Aktivitas pembelajaran {childName} akan tampil di sini jika tersedia
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: { padding: 16 },
  aktivitasCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityInfo: { flex: 1 },
  activityType: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 2 },
  activityDate: { fontSize: 14, color: '#666666' },
  attendanceStatus: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 16 },
  activityTitle: { fontSize: 16, color: '#333333', marginBottom: 8, lineHeight: 22 },
  levelGroup: { fontSize: 12, color: '#9b59b6', fontWeight: '500', marginBottom: 8 },
  timeInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  timeText: { fontSize: 12, color: '#666666', marginLeft: 4 },
  materialInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  materialText: { fontSize: 12, color: '#9b59b6', marginLeft: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attendanceInfo: { flexDirection: 'row', alignItems: 'center' },
  attendanceLabel: { fontSize: 12, color: '#666666', marginRight: 8 },
  attendanceText: { fontSize: 12, fontWeight: '600', marginRight: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#999999', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 20 },
});

export default ChildAktivitasListScreen;