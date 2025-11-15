import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatInteger } from '../../../utils/tutorReportHelpers';

const formatPercentageValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const sanitized = typeof value === 'string' ? value.replace(/%/g, '').trim() : value;
  const numeric = Number(sanitized);
  if (!Number.isFinite(numeric)) {
    return '-';
  }

  const normalized = Math.abs(numeric) <= 1 ? numeric * 100 : numeric;
  const precision = normalized % 1 === 0 ? 0 : 1;
  return `${normalized.toFixed(precision)}%`;
};

const SummaryCard = ({ icon, label, value, accent }) => (
  <View style={styles.card}>
    <View style={[styles.iconBadge, { backgroundColor: accent }]}>
      <Ionicons name={icon} size={16} color="#ffffff" />
    </View>
    <View style={styles.textGroup}>
      <Text style={styles.value}>{value ?? '-'}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  </View>
);

const TutorAttendanceSummary = ({ summary, style }) => {
  const metrics = useMemo(() => {
    const totalTutors = formatInteger(
      summary?.total_tutors
        ?? summary?.totalTutors
        ?? summary?.total
        ?? summary?.count,
    );

    const averageRate = formatPercentageValue(
      summary?.average_attendance_rate
        ?? summary?.averageAttendanceRate
        ?? summary?.attendanceRate
        ?? summary?.attendance_rate
        ?? summary?.rate,
    );

    return {
      totalTutors: totalTutors ?? '-',
      averageRate,
    };
  }, [summary]);

  return (
    <View style={[styles.container, style]}>
      <SummaryCard
        icon="people-outline"
        label="Total Tutor"
        value={metrics.totalTutors}
        accent="#2563eb"
      />
      <SummaryCard
        icon="stats-chart-outline"
        label="Rata-rata Kehadiran"
        value={metrics.averageRate}
        accent="#f97316"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    width: '100%',
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});

export default TutorAttendanceSummary;
