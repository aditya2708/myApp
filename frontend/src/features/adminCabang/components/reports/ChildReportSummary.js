import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import CabangChildSummaryCard from './CabangChildSummaryCard';
import ReportSummaryCard from './ReportSummaryCard';

const ChildReportSummary = ({ summary }) => {
  const normalizedSummary = useMemo(() => {
    if (!summary) {
      return null;
    }

    return {
      ...summary,
      total_children: summary.total_children ?? summary.children_total ?? summary.totalAnak ?? summary.total ?? 0,
      average_attendance: summary.average_attendance ?? summary.attendance_rate ?? summary.average ?? 0,
      total_activities: summary.total_activities ?? summary.activities_total ?? summary.totalActivities ?? 0,
      total_attended:
        summary.total_attended ??
        summary.attended_count ??
        summary.totalAttended ??
        summary.attendedCount ??
        null,
      total_attendance_opportunities:
        summary.total_attendance_opportunities ??
        summary.attendance_opportunities_total ??
        summary.totalAttendanceOpportunities ??
        summary.total_attendance_opportunity ??
        summary.totalAttendanceOpportunity ??
        null,
      total_wilayah: summary.total_wilayah ?? summary.wilayah_total ?? summary.totalWilayah ?? null,
      total_shelters: summary.total_shelters ?? summary.shelter_total ?? summary.totalShelter ?? null,
      active_programs: summary.active_programs ?? summary.programs_active ?? null,
    };
  }, [summary]);

  const extraCards = useMemo(() => {
    if (!summary) {
      return [];
    }

    const cards = [];

    if (summary.total_shelters ?? summary.shelter_total ?? summary.totalShelter) {
      cards.push({
        key: 'shelters',
        label: 'Total Shelter',
        value: summary.total_shelters ?? summary.shelter_total ?? summary.totalShelter,
        icon: 'home',
        color: '#e67e22',
        description: summary.shelter_description,
      });
    }

    if (summary.total_wilayah ?? summary.wilayah_total ?? summary.totalWilayah) {
      cards.push({
        key: 'wilayah',
        label: 'Wilayah Binaan',
        value: summary.total_wilayah ?? summary.wilayah_total ?? summary.totalWilayah,
        icon: 'map',
        color: '#16a085',
        description: summary.wilayah_description,
      });
    }

    if (summary.active_programs ?? summary.programs_active) {
      cards.push({
        key: 'programs',
        label: 'Program Aktif',
        value: summary.active_programs ?? summary.programs_active,
        icon: 'layers',
        color: '#9b59b6',
        description: summary.programs_description,
      });
    }

    if (summary.attendance_trend) {
      cards.push({
        key: 'trend',
        label: 'Tren Kehadiran',
        value: summary.attendance_trend.value ?? summary.attendance_trend.label,
        icon: summary.attendance_trend.value >= 0 ? 'trending-up' : 'trending-down',
        color: summary.attendance_trend.value >= 0 ? '#27ae60' : '#c0392b',
        description: summary.attendance_trend.description,
      });
    }

    return cards;
  }, [summary]);

  const { width } = useWindowDimensions();
  const isMdUp = width >= 768;

  const cardsGridStyle = useMemo(
    () => [styles.cardsGrid, isMdUp ? styles.cardsGridMd : styles.cardsGridSm],
    [isMdUp],
  );

  const summaryCardWrapperStyle = useMemo(
    () => [styles.summaryCardWrapper, isMdUp ? styles.summaryCardWrapperMd : styles.summaryCardWrapperSm],
    [isMdUp],
  );

  if (!normalizedSummary) {
    return null;
  }

  return (
    <View style={styles.container}>
      <CabangChildSummaryCard summary={normalizedSummary} variant="compact" />
      {extraCards.length > 0 && (
        <View style={cardsGridStyle}>
          {extraCards.map((card) => (
            <View key={card.key} style={summaryCardWrapperStyle}>
              <ReportSummaryCard
                label={card.label}
                value={card.value}
                icon={card.icon}
                color={card.color}
                description={card.description}
                variant="compact"
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    marginTop: 8,
  },
  summaryCardWrapper: {
    paddingBottom: 8,
  },
  cardsGridSm: {
    marginHorizontal: -4,
  },
  cardsGridMd: {
    marginHorizontal: -6,
  },
  summaryCardWrapperSm: {
    flexBasis: '100%',
    maxWidth: '100%',
    paddingHorizontal: 4,
  },
  summaryCardWrapperMd: {
    flexBasis: '50%',
    maxWidth: '50%',
    paddingHorizontal: 6,
  },
});

export default ChildReportSummary;
