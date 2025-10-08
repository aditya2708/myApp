import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AttendanceProgressBar from './AttendanceProgressBar';

const formatNumber = (value) => {
  if (typeof value === 'number') {
    return value.toLocaleString('id-ID');
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return null;
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
  }

  const stringValue = String(value);

  if (!stringValue.trim()) {
    return null;
  }

  return stringValue.includes('%') ? stringValue : `${stringValue}%`;
};

const ShelterGroupCard = ({ group, onPress, style }) => {
  if (!group) {
    return null;
  }

  const attendanceRate = useMemo(() => formatPercentage(group?.summary?.attendanceRate), [group?.summary]);
  const membersLabel = useMemo(() => {
    const count = formatNumber(group?.membersCount);

    if (!count) {
      return null;
    }

    return `${count} anggota`;
  }, [group?.membersCount]);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      style={[styles.card, style]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.name}>{group?.name || 'Kelompok Tanpa Nama'}</Text>
          {group?.mentor ? <Text style={styles.mentor}>{`Pendamping: ${group.mentor}`}</Text> : null}
          {membersLabel ? <Text style={styles.members}>{membersLabel}</Text> : null}
        </View>

        <View style={styles.badgeWrapper}>
          {attendanceRate ? <Text style={styles.rateValue}>{attendanceRate}</Text> : null}
          <Text style={styles.rateLabel}>Rata-rata hadir</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color="#0984e3"
            style={[styles.chevron, onPress ? null : styles.chevronDisabled]}
          />
        </View>
      </View>

      <View style={styles.progressGroup}>
        <View style={styles.progressItem}>
          <AttendanceProgressBar
            label="Hadir"
            count={group?.summary?.present?.count}
            percentage={group?.summary?.present?.percentage}
            color="#2ecc71"
            icon="checkmark-circle"
          />
        </View>
        <View style={styles.progressItem}>
          <AttendanceProgressBar
            label="Terlambat"
            count={group?.summary?.late?.count}
            percentage={group?.summary?.late?.percentage}
            color="#f1c40f"
            icon="time"
          />
        </View>
        <View>
          <AttendanceProgressBar
            label="Tidak Hadir"
            count={group?.summary?.absent?.count}
            percentage={group?.summary?.absent?.percentage}
            color="#e74c3c"
            icon="close-circle"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

ShelterGroupCard.defaultProps = {
  group: null,
  onPress: undefined,
  style: null,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  mentor: {
    marginTop: 6,
    fontSize: 13,
    color: '#636e72',
  },
  members: {
    marginTop: 4,
    fontSize: 12,
    color: '#636e72',
  },
  badgeWrapper: {
    alignItems: 'flex-end',
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0984e3',
  },
  rateLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#636e72',
  },
  chevron: {
    marginTop: 12,
  },
  chevronDisabled: {
    opacity: 0.4,
  },
  progressGroup: {
    marginTop: 4,
  },
  progressItem: {
    marginBottom: 12,
  },
});

export default ShelterGroupCard;
