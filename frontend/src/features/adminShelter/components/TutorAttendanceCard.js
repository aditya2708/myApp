import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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

  return `${Number.isInteger(numericRate) ? numericRate : numericRate.toFixed(1)}%`;
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
    absent_count
  } = tutor;

  const badgeColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.no_data;

  const stats = [
    { label: 'Penugasan', value: total_activities },
    { label: 'Hadir', value: present_count },
    { label: 'Terlambat', value: late_count },
    { label: 'Tidak Hadir', value: absent_count }
  ];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{nama}</Text>
          {maple ? <Text style={styles.subtitle}>{maple}</Text> : null}
        </View>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeLabel}>{category_label}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.rateContainer}>
          <Text style={styles.rateValue}>{formatRate(attendance_rate)}</Text>
          <Text style={styles.rateLabel}>Tingkat Kehadiran</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          {stats.map(stat => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value ?? 0}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footerHint}>Ketuk untuk melihat riwayat aktivitas tutor</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerInfo: {
    flex: 1,
    paddingRight: 12
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50'
  },
  subtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 2
  },
  badge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start'
  },
  badgeLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  body: {
    backgroundColor: '#f9fbfc',
    borderRadius: 12,
    padding: 12,
    gap: 12
  },
  rateContainer: {
    alignItems: 'center'
  },
  rateValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50'
  },
  rateLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50'
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 2
  },
  footerHint: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center'
  }
});

export default TutorAttendanceCard;
