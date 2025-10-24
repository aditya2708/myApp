import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

const CATEGORY_ORDER = ['high', 'medium', 'low', 'no_data'];
const CATEGORY_LABELS = {
  high: 'Baik',
  medium: 'Sedang',
  low: 'Rendah',
  no_data: 'Tidak Ada Data',
};
const CATEGORY_COLORS = {
  high: '#16a34a',
  medium: '#f59e0b',
  low: '#ef4444',
  no_data: '#94a3b8',
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

  const { width } = useWindowDimensions();
  const isCompact = width < 600;

  const {
    total_tutors: totalTutors = 0,
    average_attendance_rate: averageRate = null,
    distribution = {},
  } = summary;

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <View style={[styles.headerRow, isCompact && styles.headerRowCompact]}>
        <View style={isCompact ? styles.headerTextWrapper : undefined}>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>Ringkasan Kehadiran Tutor Cabang</Text>
          <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
            Menampilkan performa tutor berdasarkan filter aktif
          </Text>
        </View>

        <View style={[styles.metricBubble, isCompact && styles.metricBubbleCompact]}>
          <Text style={[styles.metricValue, isCompact && styles.metricValueCompact]}>{formatRate(averageRate)}</Text>
          <Text style={[styles.metricLabel, isCompact && styles.metricLabelCompact]}>Rata-rata Kehadiran</Text>
        </View>
      </View>

      <View style={[styles.summaryRow, isCompact && styles.summaryRowCompact]}>
        <View style={[styles.totalCard, isCompact && styles.totalCardCompact]}>
          <Text style={styles.totalLabel}>Total Tutor</Text>
          <Text style={[styles.totalValue, isCompact && styles.totalValueCompact]}>{totalTutors}</Text>
        </View>

        <View style={[styles.distributionRow, isCompact && styles.distributionRowCompact]}>
          {CATEGORY_ORDER.map((key) => {
            const item = distribution[key] || { count: 0 };
            const percentageValue = typeof item.percentage === 'number'
              ? item.percentage.toFixed(0)
              : item.percentage ?? 0;

            return (
              <View key={key} style={[styles.distributionItem, isCompact && styles.distributionItemCompact]}>
                <View style={[styles.badge, { backgroundColor: CATEGORY_COLORS[key] }]}>
                  <Text style={[styles.badgeText, isCompact && styles.badgeTextCompact]}>{CATEGORY_LABELS[key]}</Text>
                </View>
                <Text style={styles.distributionCount}>{item.count ?? 0}</Text>
                <Text style={[styles.distributionPercentage, isCompact && styles.distributionPercentageCompact]}>
                  {`${percentageValue}%`}
                </Text>
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  containerCompact: {
    padding: 18,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  titleCompact: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  subtitleCompact: {
    fontSize: 12,
  },
  headerTextWrapper: {
    width: '100%',
  },
  metricBubble: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  metricBubbleCompact: {
    alignSelf: 'stretch',
    paddingVertical: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0284c7',
  },
  metricValueCompact: {
    fontSize: 18,
  },
  metricLabel: {
    fontSize: 12,
    color: '#0284c7',
    marginTop: 2,
  },
  metricLabelCompact: {
    fontSize: 11,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryRowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 20,
  },
  totalCard: {
    minWidth: 110,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  totalCardCompact: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  totalLabel: {
    fontSize: 12,
    color: '#ef4444',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
  },
  totalValueCompact: {
    fontSize: 22,
  },
  distributionRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  distributionRowCompact: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
  },
  distributionItem: {
    alignItems: 'center',
    flex: 1,
  },
  distributionItemCompact: {
    minWidth: '45%',
    flexGrow: 1,
    paddingVertical: 4,
  },
  badge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeTextCompact: {
    fontSize: 11,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  distributionCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  distributionPercentage: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  distributionPercentageCompact: {
    fontSize: 11,
  },
});

export default TutorAttendanceSummary;
