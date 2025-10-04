import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import ReportSummaryCard from './ReportSummaryCard';
import {
  calculateAttendancePercentage,
  formatPercentage,
  getPercentageColor,
} from '../../../adminShelter/utils/reportUtils';

const normalizePercentageValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    const numeric = parseFloat(value.replace('%', '').trim());
    return Number.isNaN(numeric) ? null : numeric;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const CabangChildSummaryCard = ({ summary, variant = 'default' }) => {
  const { width } = useWindowDimensions();
  const isMdUp = width >= 768;

  const metrics = useMemo(() => {
    if (!summary) {
      return null;
    }

    const totalChildren = summary.total_children ?? summary.total ?? 0;
    const totalActivities = summary.total_activities ?? summary.totalActivities ?? 0;
    const totalAttended = summary.total_attended ?? summary.totalAttended ?? null;
    const totalAttendanceOpportunities =
      summary.total_attendance_opportunities ??
      summary.attendance_opportunities_total ??
      summary.totalAttendanceOpportunities ??
      summary.total_attendance_opportunity ??
      summary.totalAttendanceOpportunity ??
      null;

    const numericTotalChildren = Number(totalChildren);
    const numericTotalActivities = Number(totalActivities);
    const numericTotalAttended =
      totalAttended !== null && totalAttended !== undefined ? Number(totalAttended) : null;
    const numericTotalAttendanceOpportunities =
      totalAttendanceOpportunities !== null && totalAttendanceOpportunities !== undefined
        ? Number(totalAttendanceOpportunities)
        : null;

    const candidateAverageKeys = [
      'average_attendance',
      'attendance_rate',
      'average',
      'average_percentage',
      'attendance_percentage',
      'percentage',
      'overall_percentage',
    ];

    const explicitAverage = candidateAverageKeys.reduce((acc, key) => {
      if (acc !== null) {
        return acc;
      }

      return normalizePercentageValue(summary[key]);
    }, null);

    const hasValidAttended =
      numericTotalAttended !== null &&
      numericTotalAttended !== undefined &&
      !Number.isNaN(numericTotalAttended);

    const hasAttendanceDetails =
      !Number.isNaN(numericTotalChildren) &&
      !Number.isNaN(numericTotalActivities) &&
      numericTotalChildren !== null &&
      numericTotalActivities !== null;

    const hasAttendanceOpportunityDetails =
      numericTotalAttendanceOpportunities !== null &&
      !Number.isNaN(numericTotalAttendanceOpportunities);

    const totalPotentialAttendance =
      hasAttendanceDetails && Number.isFinite(numericTotalChildren) && Number.isFinite(numericTotalActivities)
        ? numericTotalChildren * numericTotalActivities
        : null;

    const fallbackAttendanceOpportunities = hasAttendanceOpportunityDetails
      ? numericTotalAttendanceOpportunities
      : totalPotentialAttendance;

    const shouldUseFallback =
      explicitAverage === null &&
      hasValidAttended &&
      fallbackAttendanceOpportunities !== null &&
      Number.isFinite(fallbackAttendanceOpportunities) &&
      fallbackAttendanceOpportunities > 0;

    const attendancePercentage = shouldUseFallback
      ? calculateAttendancePercentage(numericTotalAttended, fallbackAttendanceOpportunities)
      : explicitAverage ?? 0;

    const safeAttendancePercentage = normalizePercentageValue(attendancePercentage) ?? 0;

    return {
      attendancePercentage: safeAttendancePercentage,
      cards: [
        {
          key: 'children',
          label: 'Total Anak',
          value: totalChildren ?? 0,
          icon: 'people',
          color: '#2980b9',
        },
        {
          key: 'attendance',
          label: 'Rata-rata Kehadiran',
          value: `${formatPercentage(safeAttendancePercentage)}%`,
          icon: 'stats-chart',
          color: getPercentageColor(safeAttendancePercentage),
        },
        {
          key: 'activities',
          label: 'Aktivitas',
          value: totalActivities ?? 0,
          icon: 'calendar',
          color: '#e67e22',
        },
      ],
    };
  }, [summary]);

  if (!metrics) {
    return null;
  }

  const cardsContainerStyle = [styles.cardsContainer, isMdUp ? styles.cardsContainerMd : styles.cardsContainerSm];
  const cardWrapperStyle = [styles.cardWrapper, isMdUp ? styles.cardWrapperMd : styles.cardWrapperSm];

  return (
    <View style={styles.container}>
      <View style={cardsContainerStyle}>
        {metrics.cards.map((card) => (
          <View
            key={card.key}
            style={cardWrapperStyle}
          >
            <ReportSummaryCard
              label={card.label}
              value={card.value}
              icon={card.icon}
              color={card.color}
              variant={variant}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    marginBottom: 8,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  cardWrapper: {
    paddingBottom: 8,
  },
  cardsContainerSm: {
    marginHorizontal: -4,
  },
  cardsContainerMd: {
    marginHorizontal: -6,
  },
  cardWrapperSm: {
    flexBasis: '100%',
    maxWidth: '100%',
    paddingHorizontal: 4,
  },
  cardWrapperMd: {
    flexBasis: '50%',
    maxWidth: '50%',
    paddingHorizontal: 6,
  },
});

export default CabangChildSummaryCard;
