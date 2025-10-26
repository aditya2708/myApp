import React, { useMemo } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';

import ReportSummaryCard from '../../ReportSummaryCard';
import { buildTutorSummaryCards } from '../../../utils/tutorReportHelpers';

const TutorAttendanceSummary = ({ summary, style }) => {
  const cards = useMemo(() => buildTutorSummaryCards(summary), [summary]);
  const { width } = useWindowDimensions();
  const isCompact = width < 720;

  if (!cards.length) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Ringkasan Kehadiran Tutor</Text>
        <Text style={styles.subtitle}>Ikhtisar performa tutor cabang berdasarkan filter aktif.</Text>
      </View>

      <View style={[styles.cardsGrid, isCompact && styles.cardsGridCompact]}>
        {cards.map((card) => (
          <View
            key={card.id}
            style={[styles.cardWrapper, isCompact && styles.cardWrapperCompact]}
          >
            <ReportSummaryCard
              icon={card.icon}
              label={card.label}
              value={card.value}
              description={card.description}
              color={card.color}
              variant={isCompact ? 'compact' : 'default'}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cardsGridCompact: {
    flexDirection: 'column',
    marginHorizontal: 0,
  },
  cardWrapper: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  cardWrapperCompact: {
    width: '100%',
    paddingHorizontal: 0,
  },
});

export default TutorAttendanceSummary;
