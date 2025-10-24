import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';

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

const TutorAttendanceCard = ({ tutor, onPress }) => {
  const {
    nama,
    maple,
    attendance_rate,
    category,
    category_label,
    total_activities,
    present_count,
    late_count,
    absent_count,
  } = tutor;

  const { width } = useWindowDimensions();
  const displayName = tutor.name ?? tutor.nama ?? nama;
  const isStackedLayout = width < 520;
  const isCompactSpacing = width < 360;
  const allowWrappedStats = width < 480;

  const badgeColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.no_data;

  const stats = [
    { label: 'Total Penugasan', value: total_activities },
    { label: 'Hadir', value: present_count },
    { label: 'Terlambat', value: late_count },
    { label: 'Tidak Hadir', value: absent_count },
  ];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCompactSpacing && styles.cardCompact,
        !isCompactSpacing && width > 640 && styles.cardSpacious,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{displayName}</Text>
          {maple ? <Text style={styles.subtitle}>{maple}</Text> : null}
        </View>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeLabel}>{category_label}</Text>
        </View>
      </View>

      <View
        style={[
          styles.body,
          isStackedLayout ? styles.bodyStacked : styles.bodyHorizontal,
          isCompactSpacing && styles.bodyCompact,
        ]}
      >
        <View
          style={[
            styles.rateContainer,
            isStackedLayout ? styles.rateContainerStacked : styles.rateContainerHorizontal,
          ]}
        >
          <Text style={styles.rateValue}>{formatRate(attendance_rate)}</Text>
          <Text style={styles.rateLabel}>Rata-rata Kehadiran</Text>
        </View>

        <View
          style={[
            styles.divider,
            isStackedLayout ? styles.dividerHorizontal : styles.dividerVertical,
          ]}
        />

        <View
          style={[
            styles.statsRow,
            allowWrappedStats && styles.statsRowWrapped,
          ]}
        >
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statItem,
                allowWrappedStats ? styles.statItemWrapped : styles.statItemWide,
              ]}
            >
              <Text style={styles.statValue}>{stat.value ?? 0}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footerHint}>Ketuk untuk melihat detail aktivitas tutor</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardCompact: {
    padding: 12,
    gap: 10,
  },
  cardSpacious: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  bodyCompact: {
    padding: 12,
  },
  bodyHorizontal: {
    flexDirection: 'row',
  },
  bodyStacked: {
    flexDirection: 'column',
  },
  rateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateContainerHorizontal: {
    paddingRight: 16,
    minWidth: 140,
  },
  rateContainerStacked: {
    width: '100%',
    paddingBottom: 8,
  },
  rateValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  rateLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    backgroundColor: '#e2e8f0',
  },
  dividerHorizontal: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  dividerVertical: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: 12,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  statsRowWrapped: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  statItemWide: {
    flex: 1,
    minWidth: 120,
  },
  statItemWrapped: {
    flexBasis: '48%',
    maxWidth: '48%',
    minWidth: '48%',
    flexGrow: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },
  footerHint: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default TutorAttendanceCard;
