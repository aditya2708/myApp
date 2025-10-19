import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CATEGORY_ORDER = ['high', 'medium', 'low', 'no_data'];
const CATEGORY_LABELS = {
  high: 'Baik',
  medium: 'Sedang',
  low: 'Rendah',
  no_data: 'Tidak Ada Data'
};
const CATEGORY_COLORS = {
  high: '#2ecc71',
  medium: '#f39c12',
  low: '#e74c3c',
  no_data: '#95a5a6'
};

const formatRate = (rate) => {
  if (rate === null || rate === undefined) {
    return '-';
  }

  const numericRate = Number(rate);
  if (Number.isNaN(numericRate)) {
    return '-';
  }

  return `${numericRate.toFixed(2)}%`;
};

const TutorAttendanceSummary = ({ summary }) => {
  if (!summary) {
    return null;
  }

  const { total_tutors: totalTutors = 0, average_attendance_rate: averageRate = null, distribution = {} } = summary;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Ringkasan Kehadiran Tutor</Text>
          <Text style={styles.subtitle}>Periode dan filter saat ini</Text>
        </View>

        <View style={styles.metricBubble}>
          <Text style={styles.metricValue}>{formatRate(averageRate)}</Text>
          <Text style={styles.metricLabel}>Rata-rata Kehadiran</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Tutor</Text>
          <Text style={styles.totalValue}>{totalTutors}</Text>
        </View>

        <View style={styles.distributionRow}>
          {CATEGORY_ORDER.map((key) => {
            const item = distribution[key] || { count: 0 };
            const percentageValue = typeof item.percentage === 'number'
              ? item.percentage.toFixed(0)
              : item.percentage ?? 0;
            return (
              <View key={key} style={styles.distributionItem}>
                <View style={[styles.badge, { backgroundColor: CATEGORY_COLORS[key] }]}>
                  <Text style={styles.badgeText}>{CATEGORY_LABELS[key]}</Text>
                </View>
                <Text style={styles.distributionCount}>{item.count ?? 0}</Text>
                <Text style={styles.distributionPercentage}>{`${percentageValue}%`}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50'
  },
  subtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 2
  },
  metricBubble: {
    backgroundColor: '#f1f7ff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2980b9'
  },
  metricLabel: {
    fontSize: 12,
    color: '#2980b9',
    marginTop: 2
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  totalCard: {
    minWidth: 110,
    backgroundColor: '#fdf4f5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 12,
    color: '#e74c3c'
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e74c3c'
  },
  distributionRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12
  },
  distributionItem: {
    alignItems: 'center',
    flex: 1
  },
  badge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  distributionCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50'
  },
  distributionPercentage: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2
  }
});

export default TutorAttendanceSummary;
