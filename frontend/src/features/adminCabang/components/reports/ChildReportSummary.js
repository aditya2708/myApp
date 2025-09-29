import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import ChildSummaryCard from '../../../adminShelter/components/ChildSummaryCard';
import ReportSummaryCard from './ReportSummaryCard';

const ChildReportSummary = ({ summary }) => {
  const normalizedSummary = useMemo(() => {
    if (!summary) {
      return null;
    }

    return {
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

  if (!normalizedSummary) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ChildSummaryCard summary={normalizedSummary} />
      {extraCards.length > 0 && (
        <View style={styles.cardsGrid}>
          {extraCards.map((card) => (
            <View key={card.key} style={styles.summaryCardWrapper}>
              <ReportSummaryCard
                label={card.label}
                value={card.value}
                icon={card.icon}
                color={card.color}
                description={card.description}
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
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'column',
    marginTop: 12,
  },
  summaryCardWrapper: {
    marginBottom: 12,
  },
});

export default ChildReportSummary;
