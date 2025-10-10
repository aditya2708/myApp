import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ReportSummaryCard from '../ReportSummaryCard';

const FALLBACK_SUMMARY = {
  total_children: 0,
  total_shelters: 0,
  total_groups: 0,
  total_sessions: 0,
  present_count: 0,
  late_count: 0,
  absent_count: 0,
  attendance_percentage: null,
  low_band_children: 0,
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) {
    return '0%';
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return '0%';
  }

  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
};

const ChildAttendanceSummarySection = ({ summary, period, lastRefreshedAt }) => {
  const effectiveSummary = useMemo(() => ({ ...FALLBACK_SUMMARY, ...(summary || {}) }), [summary]);

  const formattedPeriod = useMemo(() => {
    const start = period?.start_date || period?.startDate;
    const end = period?.end_date || period?.endDate;

    if (!start && !end) {
      return 'Seluruh periode';
    }

    if (start && end) {
      return `${start} – ${end}`;
    }

    if (start) {
      return `Mulai ${start}`;
    }

    return `Hingga ${end}`;
  }, [period]);

  const formattedRefreshed = useMemo(() => {
    if (!lastRefreshedAt) {
      return null;
    }

    const date = new Date(lastRefreshedAt);

    if (Number.isNaN(date.getTime())) {
      return lastRefreshedAt;
    }

    return date.toLocaleString('id-ID');
  }, [lastRefreshedAt]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.title}>Ringkasan Kehadiran Anak</Text>
          <Text style={styles.subtitle}>Periode: {formattedPeriod}</Text>
          {formattedRefreshed ? (
            <Text style={styles.meta}>Pembaruan terakhir: {formattedRefreshed}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardsRow}>
        <ReportSummaryCard
          icon="people"
          color="#0984e3"
          label="Total Anak"
          value={effectiveSummary.total_children}
        />
        <ReportSummaryCard
          icon="school"
          color="#6c5ce7"
          label="Total Shelter"
          value={effectiveSummary.total_shelters}
        />
      </View>

      <View style={styles.cardsRow}>
        <ReportSummaryCard
          icon="layers"
          color="#00b894"
          label="Total Pertemuan"
          value={effectiveSummary.total_sessions}
        />
        <ReportSummaryCard
          icon="analytics"
          color="#e17055"
          label="Rata-rata Kehadiran"
          value={formatPercentage(effectiveSummary.attendance_percentage)}
          description={`${effectiveSummary.low_band_children} anak membutuhkan perhatian`}
        />
      </View>
    </View>
  );
};

ChildAttendanceSummarySection.defaultProps = {
  summary: FALLBACK_SUMMARY,
  period: null,
  lastRefreshedAt: null,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f9ff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerTextWrapper: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e272e',
  },
  subtitle: {
    fontSize: 14,
    color: '#57606f',
  },
  meta: {
    fontSize: 12,
    color: '#8395a7',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default ChildAttendanceSummarySection;
