import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import TutorAttendanceList from '../../components/TutorAttendanceList';
import TutorAttendanceFilters from '../../components/TutorAttendanceFilters';
import TutorAttendanceEmptyState from '../../components/TutorAttendanceEmptyState';
import {
  fetchTutorAttendanceSummary,
  selectTutorAttendanceSummary,
  selectTutorAttendanceSummaryError,
  selectTutorAttendanceSummaryLoading
} from '../../redux/tutorAttendanceSlice';

const DEFAULT_FILTERS = {
  date_from: null,
  date_to: null,
  jenis_kegiatan: 'all'
};

const CATEGORY_LABELS = {
  high: 'Baik',
  medium: 'Sedang',
  low: 'Rendah',
  no_data: 'Tidak Ada Data'
};

const deriveCategoryFromRate = (rate) => {
  if (typeof rate !== 'number' || Number.isNaN(rate)) {
    return 'no_data';
  }

  if (rate >= 80) {
    return 'high';
  }

  if (rate >= 60) {
    return 'medium';
  }

  if (rate >= 0) {
    return 'low';
  }

  return 'no_data';
};

const deriveCategoryLabel = (category) => CATEGORY_LABELS[category] || CATEGORY_LABELS.no_data;

const normalizeActivityTypes = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeTutorRecord = (record = {}) => {
  const totalActivities = Number(record.total_activities ?? record.total_assignments ?? 0) || 0;
  const verifiedPresent = Number(record.verified_present_count ?? record.present_count ?? 0) || 0;
  const verifiedLate = Number(record.verified_late_count ?? record.late_count ?? 0) || 0;
  const verifiedAbsent = Number(record.verified_absent_count ?? record.absent_count ?? 0) || 0;
  const verifiedAttendanceCount = Number(
    record.verified_attendance_count ?? (verifiedPresent + verifiedLate + verifiedAbsent)
  ) || 0;
  const attendedCount = verifiedPresent + verifiedLate;
  const attendanceRate = totalActivities > 0
    ? Number((((attendedCount) / totalActivities) * 100).toFixed(1))
    : null;
  const category = record.category || deriveCategoryFromRate(attendanceRate);
  const categoryLabel = record.category_label || deriveCategoryLabel(category);
  const maple = record.maple || record.mata_pelajaran || record.subject || null;
  const activityTypes = normalizeActivityTypes(record.activity_types);

  return {
    ...record,
    maple,
    activity_types: activityTypes,
    total_activities: totalActivities,
    present_count: verifiedPresent,
    late_count: verifiedLate,
    absent_count: verifiedAbsent,
    verified_present_count: verifiedPresent,
    verified_late_count: verifiedLate,
    verified_absent_count: verifiedAbsent,
    verified_attendance_count: verifiedAttendanceCount,
    verified_attended_count: attendedCount,
    attended_count: attendedCount,
    attendance_rate: attendanceRate,
    category,
    category_label: categoryLabel
  };
};

const summarizeTutorMetrics = (tutorMetrics = []) => {
  if (!Array.isArray(tutorMetrics) || tutorMetrics.length === 0) {
    return {
      total_tutors: 0,
      average_attendance_rate: 0,
      distribution: {
        high: { count: 0, percentage: 0 },
        medium: { count: 0, percentage: 0 },
        low: { count: 0, percentage: 0 },
        no_data: { count: 0, percentage: 0 }
      }
    };
  }

  const totalTutors = tutorMetrics.length;
  const totalRate = tutorMetrics.reduce((acc, tutor) => (
    typeof tutor.attendance_rate === 'number' ? acc + tutor.attendance_rate : acc
  ), 0);
  const averageAttendanceRate = Number((totalRate / totalTutors).toFixed(1));

  const distributionCounts = tutorMetrics.reduce((acc, tutor) => {
    const category = tutor.category || deriveCategoryFromRate(tutor.attendance_rate);
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += 1;
    return acc;
  }, { high: 0, medium: 0, low: 0, no_data: 0 });

  const distribution = Object.entries(distributionCounts).reduce((acc, [key, count]) => {
    const percentage = totalTutors > 0 ? Math.round((count / totalTutors) * 100) : 0;
    acc[key] = { count, percentage };
    return acc;
  }, {});

  return {
    total_tutors: totalTutors,
    average_attendance_rate: averageAttendanceRate,
    distribution: {
      high: distribution.high || { count: 0, percentage: 0 },
      medium: distribution.medium || { count: 0, percentage: 0 },
      low: distribution.low || { count: 0, percentage: 0 },
      no_data: distribution.no_data || { count: 0, percentage: 0 }
    }
  };
};

const buildJenisOptions = (tutorMetrics = []) => {
  const optionsSet = new Set();

  tutorMetrics.forEach((tutor) => {
    normalizeActivityTypes(tutor.activity_types).forEach((item) => optionsSet.add(item));
  });

  return Array.from(optionsSet)
    .filter(Boolean)
    .map(item => ({ key: item, label: item }));
};

const composeQueryParams = ({ dateRange, activityType }) => {
  const params = {};

  if (dateRange?.start) {
    params.date_from = dateRange.start;
  }

  if (dateRange?.end) {
    params.date_to = dateRange.end;
  }

  if (activityType && activityType !== 'all') {
    params.jenis_kegiatan = activityType;
  }

  return params;
};

const TutorAttendanceReportScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const summary = useSelector(selectTutorAttendanceSummary);
  const summaryLoading = useSelector(selectTutorAttendanceSummaryLoading);
  const summaryError = useSelector(selectTutorAttendanceSummaryError);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = useMemo(() => composeQueryParams({
    dateRange: { start: filters.date_from, end: filters.date_to },
    activityType: filters.jenis_kegiatan
  }), [filters]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerFilterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={22} color="#1f2933" />
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  useEffect(() => {
    dispatch(fetchTutorAttendanceSummary(queryParams));
  }, [dispatch, queryParams]);

  const tutorMetrics = useMemo(
    () => (Array.isArray(summary) ? summary.map(normalizeTutorRecord) : []),
    [summary]
  );

  const filteredTutorMetrics = useMemo(() => {
    if (filters.jenis_kegiatan === 'all') {
      return tutorMetrics;
    }

    return tutorMetrics.filter((tutor) => {
      const activityTypes = normalizeActivityTypes(tutor.activity_types);
      return activityTypes.includes(filters.jenis_kegiatan)
        || tutor.jenis_kegiatan === filters.jenis_kegiatan;
    });
  }, [filters.jenis_kegiatan, tutorMetrics]);

  const attendanceSummary = useMemo(
    () => summarizeTutorMetrics(filteredTutorMetrics),
    [filteredTutorMetrics]
  );

  const jenisOptions = useMemo(
    () => buildJenisOptions(tutorMetrics),
    [tutorMetrics]
  );

  const isInitialLoading = summaryLoading && (!summary || summary.length === 0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchTutorAttendanceSummary(queryParams)).unwrap();
    } catch (error) {
      // noop - error handled by slice state
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, queryParams]);

  const handleApplyFilters = useCallback((nextFilters) => {
    setFilters(prev => ({
      ...prev,
      ...nextFilters
    }));
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback((defaults) => {
    setFilters(defaults || DEFAULT_FILTERS);
    setShowFilters(false);
  }, []);

  const handleTutorPress = useCallback((tutor) => {
    if (!tutor?.id_tutor) {
      return;
    }

    navigation.navigate('TutorActivityHistory', {
      id_tutor: tutor.id_tutor,
      nama: tutor.nama
    });
  }, [navigation]);

  if (isInitialLoading) {
    return (
      <View style={styles.centeredContainer}>
        <LoadingSpinner message="Memuat ringkasan kehadiran tutor..." />
      </View>
    );
  }

  if (summaryError) {
    return (
      <View style={styles.centeredContainer}>
        <ErrorMessage
          message={summaryError}
          onRetry={handleRefresh}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TutorAttendanceList
        tutors={filteredTutorMetrics}
        summary={attendanceSummary}
        refreshing={refreshing || summaryLoading}
        onRefresh={handleRefresh}
        onTutorPress={handleTutorPress}
        ListEmptyComponent={(
          <TutorAttendanceEmptyState
            title="Belum ada kehadiran terverifikasi"
            subtitle="Coba ubah rentang tanggal atau jenis kegiatan untuk melihat data lainnya."
          />
        )}
      />

      <TutorAttendanceFilters
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        jenisOptions={jenisOptions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb'
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
    padding: 16
  },
  headerFilterButton: {
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20
  }
});

export default TutorAttendanceReportScreen;
