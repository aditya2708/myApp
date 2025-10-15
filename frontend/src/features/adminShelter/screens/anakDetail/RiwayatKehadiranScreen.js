import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import ActivityHistoryItem from '../../components/ActivityHistoryItem';
import { attendanceApi } from '../../api/attendanceApi';

const RiwayatKehadiranScreen = () => {
  const route = useRoute();
  const { anakId, anakData } = route.params || {};

  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = useCallback(async () => {
    if (!anakId) {
      setAttendanceList([]);
      setError('ID anak tidak ditemukan.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await attendanceApi.getAttendanceByStudent(anakId);
      const data = response?.data?.data;

      setAttendanceList(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal memuat riwayat kehadiran.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [anakId]);

  useFocusEffect(
    useCallback(() => {
      fetchAttendance();
    }, [fetchAttendance])
  );

  const renderActivityItem = useCallback(({ item }) => (
    <ActivityHistoryItem item={item} />
  ), []);

  const keyExtractor = useCallback((item, index) => {
    if (item?.id_absen) {
      return item.id_absen.toString();
    }

    return `${item?.aktivitas?.id_aktivitas || 'attendance'}-${index}`;
  }, []);

  if (loading && attendanceList.length === 0 && !error) {
    return (
      <LoadingSpinner
        fullScreen
        message="Memuat riwayat kehadiran..."
      />
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <ErrorMessage
          message={error}
          retryText="Coba Lagi"
          onRetry={fetchAttendance}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.childName}>
          {anakData?.full_name || anakData?.nick_name || 'Data Anak'}
        </Text>
        <Text style={styles.totalActivities}>
          {attendanceList.length} aktivitas
        </Text>
      </View>

      {attendanceList.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Belum Ada Riwayat Kehadiran"
          message="Anak belum memiliki riwayat aktivitas."
          retryButtonText="Muat Ulang"
          onRetry={fetchAttendance}
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={attendanceList}
          renderItem={renderActivityItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchAttendance}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default RiwayatKehadiranScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  childName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50'
  },
  totalActivities: {
    marginTop: 6,
    fontSize: 14,
    color: '#7f8c8d'
  },
  listContent: {
    padding: 16
  },
  emptyState: {
    paddingHorizontal: 32
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff'
  }
});
