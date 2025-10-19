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

const KNOWN_ATTENDANCE_KEYS = [
  'verified_records',
  'attendance_details',
  'attendance_records',
  'attendance_history',
  'attendances',
  'records',
  'activities',
  'activity_records',
  'detail'
];

const normalizeStatus = (value) => {
  if (!value) {
    return null;
  }

  const text = String(value).toLowerCase();

  if (['ya', 'hadir', 'present', '1'].includes(text)) {
    return 'present';
  }

  if (['terlambat', 'late'].includes(text)) {
    return 'late';
  }

  return 'absent';
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

const extractAttendanceDetails = (record) => {
  if (!record || typeof record !== 'object') {
    return [];
  }

  if (Array.isArray(record.verified_attendance)) {
    return record.verified_attendance;
  }

  for (const key of KNOWN_ATTENDANCE_KEYS) {
    if (Array.isArray(record[key])) {
      return record[key];
    }
  }

  return [];
};

const filterVerifiedAttendance = (records = []) => (
  Array.isArray(records)
    ? records.map(record => {
      const attendanceDetails = extractAttendanceDetails(record);
      const verifiedAttendance = attendanceDetails.filter(detail => detail?.is_verified);

      return {
        record,
        attendanceDetails,
        verifiedAttendance
      };
    })
    : []
);

const countByStatus = (records, status) => (
  records.filter(item => normalizeStatus(item?.absen ?? item?.status) === status).length
);

const resolveTotalActivities = (record, attendanceDetails, verifiedAttendance) => {
  const candidates = [
    record?.total_activities,
    record?.total_assignments,
    record?.assignment_count,
    record?.total_penugasan
  ];

  const firstValid = candidates.find(value => typeof value === 'number' && !Number.isNaN(value));
  if (typeof firstValid === 'number') {
    return firstValid;
  }

  if (Array.isArray(attendanceDetails) && attendanceDetails.length > 0) {
    return attendanceDetails.length;
  }

  if (Array.isArray(record?.activities) && record.activities.length > 0) {
    return record.activities.length;
  }

  return verifiedAttendance.length;
};

const deriveCategoryLabel = (category) => CATEGORY_LABELS[category] || CATEGORY_LABELS.no_data;

const buildTutorMetrics = (verifiedRecords = []) => (
  verifiedRecords.map(({ record, attendanceDetails, verifiedAttendance }) => {
    const totalActivities = resolveTotalActivities(record, attendanceDetails, verifiedAttendance);
    const presentCount = countByStatus(verifiedAttendance, 'present');
    const lateCount = countByStatus(verifiedAttendance, 'late');
    const verifiedAbsent = countByStatus(verifiedAttendance, 'absent');
    const unverifiedCount = Math.max(totalActivities - verifiedAttendance.length, 0);
    const absentCount = verifiedAbsent + unverifiedCount;
    const attendanceRate = totalActivities > 0
      ? Number((((presentCount + lateCount) / totalActivities) * 100).toFixed(1))
      : null;

    const category = record?.category || deriveCategoryFromRate(attendanceRate);
    const categoryLabel = record?.category_label || deriveCategoryLabel(category);
    const maple = record?.maple || record?.mata_pelajaran || record?.subject || null;

    return {
      ...record,
      maple,
      category,
      category_label: categoryLabel,
      total_activities: totalActivities,
      present_count: presentCount,
      late_count: lateCount,
      absent_count: absentCount,
      attendance_rate: attendanceRate,
      verified_attendance: verifiedAttendance,
      attendance_details: attendanceDetails
    };
  })
);

const summarizeVerifiedTutors = (tutorMetrics = []) => {
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

  const verifiedAttendance = useMemo(
    () => filterVerifiedAttendance(summary),
    [summary]
  );

  const tutorMetrics = useMemo(
    () => buildTutorMetrics(verifiedAttendance),
    [verifiedAttendance]
  );

  const filteredTutorMetrics = useMemo(() => {
    if (filters.jenis_kegiatan === 'all') {
      return tutorMetrics;
    }

    return tutorMetrics.filter(tutor => {
      if (tutor.jenis_kegiatan === filters.jenis_kegiatan) {
        return true;
      }

      const allAttendance = Array.isArray(tutor.attendance_details) ? tutor.attendance_details : [];
      const verifiedOnly = Array.isArray(tutor.verified_attendance) ? tutor.verified_attendance : [];

      return (
        allAttendance.some(item => item?.jenis_kegiatan === filters.jenis_kegiatan)
        || verifiedOnly.some(item => item?.jenis_kegiatan === filters.jenis_kegiatan)
      );
    });
  }, [filters.jenis_kegiatan, tutorMetrics]);

  const attendanceSummary = useMemo(
    () => summarizeVerifiedTutors(filteredTutorMetrics),
    [filteredTutorMetrics]
  );

  const jenisOptions = useMemo(() => {
    const optionsSet = new Set();

    verifiedAttendance.forEach(({ record, attendanceDetails, verifiedAttendance: verifiedOnly }) => {
      if (record?.jenis_kegiatan) {
        optionsSet.add(record.jenis_kegiatan);
      }

      attendanceDetails.forEach(detail => {
        if (detail?.jenis_kegiatan) {
          optionsSet.add(detail.jenis_kegiatan);
        }
      });

      verifiedOnly.forEach(detail => {
        if (detail?.jenis_kegiatan) {
          optionsSet.add(detail.jenis_kegiatan);
        }
      });
    });

    return Array.from(optionsSet)
      .filter(Boolean)
      .map(item => ({ key: item, label: item }));
  }, [verifiedAttendance]);

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
