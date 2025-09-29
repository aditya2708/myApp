import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import {
  formatPercentage,
  calculateAttendancePercentage
} from '../utils/reportUtils';

const ChildSummaryCard = ({ summary }) => {
  if (!summary) return null;

  const totalChildren = summary.total_children;
  const totalAttended = summary.total_attended;
  const totalActivities = summary.total_activities;
  const numericTotalChildren = Number(totalChildren);
  const numericTotalAttended = Number(totalAttended);
  const numericTotalActivities = Number(totalActivities);
  const hasAttendanceDetails =
    totalChildren !== undefined &&
    totalChildren !== null &&
    totalAttended !== undefined &&
    totalAttended !== null &&
    totalActivities !== undefined &&
    totalActivities !== null &&
    !Number.isNaN(numericTotalChildren) &&
    !Number.isNaN(numericTotalAttended) &&
    !Number.isNaN(numericTotalActivities);

  const normalizePercentageValue = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numeric = parseFloat(value.replace('%', '').trim());
      return Number.isNaN(numeric) ? null : numeric;
    }

    const numeric = Number(value);
    return Number.isNaN(numeric) ? null : numeric;
  };

  const candidateAverageKeys = [
    'average_attendance',
    'attendance_rate',
    'average',
    'average_percentage',
    'attendance_percentage',
    'percentage',
    'overall_percentage'
  ];

  const explicitAverage = candidateAverageKeys.reduce((acc, key) => {
    if (acc !== null) return acc;
    return normalizePercentageValue(summary[key]);
  }, null);

  const totalPotentialAttendance = hasAttendanceDetails
    ? numericTotalChildren * numericTotalActivities
    : 0;

  const shouldUseFallback =
    explicitAverage === null &&
    hasAttendanceDetails &&
    totalPotentialAttendance > 0;

  const derivedAverage = shouldUseFallback
    ? normalizePercentageValue(
        calculateAttendancePercentage(numericTotalAttended, totalPotentialAttendance)
      )
    : explicitAverage;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ringkasan</Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.value}>{summary.total_children}</Text>
          <Text style={styles.label}>Total Anak</Text>
        </View>
        <View style={styles.item}>
          <Text style={[styles.value, { color: '#9b59b6' }]}>
            {formatPercentage(derivedAverage ?? 0)}%
          </Text>
          <Text style={styles.label}>Rata-rata Kehadiran</Text>
          {shouldUseFallback && (
            <>
              <Text style={styles.helperText}>
                = total hadir ÷ (total anak × total aktivitas)
              </Text>
              <Text style={styles.helperRatio}>
                {`${totalAttended}/${totalPotentialAttendance}`}
              </Text>
            </>
          )}
        </View>
        <View style={styles.item}>
          <Text style={styles.value}>{summary.total_activities}</Text>
          <Text style={styles.label}>Aktivitas</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  item: {
    alignItems: 'center'
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  helperText: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    textAlign: 'center'
  },
  helperRatio: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    textAlign: 'center'
  }
});

export default ChildSummaryCard;
