import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import ActivityHistoryItem from '../components/ActivityHistoryItem';
import FilterModal from '../components/FilterModal';

import {
  getTutorAttendanceHistory,
  resetTutorAttendanceError,
  selectTutorAttendanceLoading,
  selectTutorAttendanceError,
  selectTutorAttendanceHistory
} from '../redux/tutorAttendanceSlice';

const TutorActivityHistoryScreen = () => {
  const dispatch = useDispatch();
  const route = useRoute();
  const { tutorId, tutorName } = route.params;

  const loading = useSelector(selectTutorAttendanceLoading);
  const error = useSelector(selectTutorAttendanceError);
  const attendanceHistory = useSelector(state => selectTutorAttendanceHistory(state, tutorId));

  const [filters, setFilters] = useState({
    date_from: null,
    date_to: null,
    status: null
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dispatch, tutorId]);

  const fetchData = () => {
    dispatch(getTutorAttendanceHistory({ id_tutor: tutorId, filters }));
  };

  const applyFilters = () => {
    dispatch(getTutorAttendanceHistory({ id_tutor: tutorId, filters }));
    setShowFilters(false);
  };

  const clearFilters = () => {
    const clearedFilters = { date_from: null, date_to: null, status: null };
    setFilters(clearedFilters);
    dispatch(getTutorAttendanceHistory({ id_tutor: tutorId, filters: clearedFilters }));
    setShowFilters(false);
  };

  const renderActivityItem = ({ item }) => (
    <ActivityHistoryItem item={item} />
  );

  if (loading && !attendanceHistory.length) {
    return <LoadingSpinner fullScreen message="Memuat riwayat aktivitas..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => {
          dispatch(resetTutorAttendanceError());
          fetchData();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.tutorName}>{tutorName}</Text>
          <Text style={styles.totalActivities}>
            {attendanceHistory.length} aktivitas
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color="#3498db" />
        </TouchableOpacity>
      </View>

      {attendanceHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#bdc3c7" />
          <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
          <Text style={styles.emptyMessage}>
            Tutor belum memiliki riwayat aktivitas
          </Text>
        </View>
      ) : (
        <FlatList
          data={attendanceHistory}
          renderItem={renderActivityItem}
          keyExtractor={item => item.id_absen.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchData}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      />
    </View>
  );
};

export default TutorActivityHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerContent: {
    flex: 1
  },
  tutorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  totalActivities: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa'
  },
  listContainer: {
    padding: 16
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8
  }
});