import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AttendanceProgressBar from './AttendanceProgressBar';

const ShelterAttendanceCard = ({ shelter, band, onPress }) => {
  if (!shelter) {
    return null;
  }

  const { name, wilbin, attendanceRate, summary, totalSessions } = shelter;
  const safeSummary = summary || {};
  const presentCount = safeSummary.present?.count ?? 0;
  const presentPercentage = safeSummary.present?.percentage ?? 0;
  const lateCount = safeSummary.late?.count ?? 0;
  const latePercentage = safeSummary.late?.percentage ?? 0;
  const absentCount = safeSummary.absent?.count ?? 0;
  const absentPercentage = safeSummary.absent?.percentage ?? 0;
  const badgeColor = band?.color || '#0984e3';
  const badgeBackground = band?.backgroundColor || 'rgba(9, 132, 227, 0.12)';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { borderColor: badgeColor, backgroundColor: badgeBackground }]}
      onPress={() => (onPress ? onPress(shelter) : undefined)}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.name}>{name}</Text>
          {wilbin ? (
            <View style={styles.wilbinBadge}>
              <Ionicons name="location-outline" size={14} color="#636e72" />
              <Text style={styles.wilbinLabel} numberOfLines={1}>
                {typeof wilbin === 'string' ? wilbin : wilbin?.name || wilbin?.label || 'Wilayah'}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.rateBadge, { backgroundColor: '#ffffff', borderColor: badgeColor }]}>
          <Text style={[styles.rateLabel, { color: badgeColor }]}>Kehadiran</Text>
          <Text style={[styles.rateValue, { color: badgeColor }]}>{`${Number(attendanceRate || 0).toFixed(1)}%`}</Text>
          {band ? <Text style={styles.bandLabel}>{band.label}</Text> : null}
        </View>
      </View>

      <View style={styles.progressGroup}>
        <View style={styles.progressItem}>
          <AttendanceProgressBar
            label="Hadir"
            count={presentCount}
            percentage={presentPercentage}
            color="#2ecc71"
            icon="checkmark-circle"
          />
        </View>
        <View style={styles.progressItem}>
          <AttendanceProgressBar
            label="Terlambat"
            count={lateCount}
            percentage={latePercentage}
            color="#f1c40f"
            icon="time"
          />
        </View>
        <View style={[styles.progressItem, styles.progressItemLast]}>
          <AttendanceProgressBar
            label="Tidak Hadir"
            count={absentCount}
            percentage={absentPercentage}
            color="#e74c3c"
            icon="close-circle"
          />
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <Ionicons name="layers-outline" size={16} color="#0984e3" />
          <Text style={styles.footerLabel}>Total Sesi</Text>
          <Text style={styles.footerValue}>{(totalSessions || 0).toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
          <Text style={styles.footerLabel}>Hadir</Text>
          <Text style={styles.footerValue}>{presentCount.toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time" size={16} color="#f1c40f" />
          <Text style={styles.footerLabel}>Terlambat</Text>
          <Text style={styles.footerValue}>{lateCount.toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="close-circle" size={16} color="#e74c3c" />
          <Text style={styles.footerLabel}>Tidak Hadir</Text>
          <Text style={styles.footerValue}>{absentCount.toLocaleString('id-ID')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

ShelterAttendanceCard.defaultProps = {
  shelter: null,
  band: null,
  onPress: undefined,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 18,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  wilbinBadge: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 110, 114, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 220,
  },
  wilbinLabel: {
    fontSize: 12,
    color: '#636e72',
    marginLeft: 6,
  },
  rateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  bandLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#636e72',
  },
  progressGroup: {
    marginTop: 4,
  },
  progressItem: {
    marginBottom: 10,
  },
  progressItemLast: {
    marginBottom: 0,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    marginHorizontal: -8,
  },
  footerItem: {
    minWidth: 70,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  footerLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#636e72',
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 2,
  },
});

export default ShelterAttendanceCard;
