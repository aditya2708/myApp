import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value.toLocaleString('id-ID');
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
};

const SummaryMetric = ({ icon, label, value, color }) => {
  const formattedValue = useMemo(() => formatNumber(value) ?? '0', [value]);

  return (
    <View style={styles.metric}>
      <View style={[styles.metricIconWrapper, { backgroundColor: `${color}1a` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.metricValue}>{formattedValue}</Text>
      <Text style={[styles.metricLabel, { color }]}>{label}</Text>
    </View>
  );
};

SummaryMetric.defaultProps = {
  icon: 'ellipse-outline',
  value: 0,
  color: '#2d3436',
};

const GroupAttendanceSummaryCard = ({
  groupName,
  shelterName,
  mentor,
  membersCount,
  periodLabel,
  summary,
}) => {
  const attendanceRate = useMemo(() => formatPercentage(summary?.attendanceRate), [summary?.attendanceRate]);
  const membersLabel = useMemo(() => {
    const normalized = formatNumber(membersCount);
    return normalized ? `${normalized} anggota` : null;
  }, [membersCount]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.groupName}>{groupName || 'Kelompok Tanpa Nama'}</Text>
          {shelterName ? <Text style={styles.shelterName}>{shelterName}</Text> : null}
          {mentor ? <Text style={styles.mentor}>{`Pendamping: ${mentor}`}</Text> : null}
          {membersLabel ? <Text style={styles.members}>{membersLabel}</Text> : null}
          {periodLabel ? <Text style={styles.period}>{periodLabel}</Text> : null}
        </View>
        <View style={styles.rateWrapper}>
          <Text style={styles.rateValue}>{attendanceRate ?? '-'}</Text>
          <Text style={styles.rateLabel}>Rata-rata hadir</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <SummaryMetric
          icon="checkmark-circle"
          label="Hadir"
          value={summary?.present?.count}
          color="#2ecc71"
        />
        <SummaryMetric icon="time" label="Terlambat" value={summary?.late?.count} color="#f1c40f" />
        <SummaryMetric
          icon="close-circle"
          label="Tidak Hadir"
          value={summary?.absent?.count}
          color="#e74c3c"
        />
      </View>
    </View>
  );
};

GroupAttendanceSummaryCard.defaultProps = {
  groupName: null,
  shelterName: null,
  mentor: null,
  membersCount: null,
  periodLabel: null,
  summary: null,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
    paddingRight: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  shelterName: {
    marginTop: 6,
    fontSize: 13,
    color: '#636e72',
  },
  mentor: {
    marginTop: 6,
    fontSize: 13,
    color: '#636e72',
  },
  members: {
    marginTop: 6,
    fontSize: 12,
    color: '#636e72',
  },
  period: {
    marginTop: 6,
    fontSize: 12,
    color: '#636e72',
  },
  rateWrapper: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rateValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0984e3',
  },
  rateLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#636e72',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GroupAttendanceSummaryCard;
