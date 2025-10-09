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

const ShelterActivityCard = ({ activity, onPress, style }) => {
  if (!activity) {
    return null;
  }

  const scheduleEntries = useMemo(() => {
    if (!Array.isArray(activity.schedule)) {
      return [];
    }

    return activity.schedule.filter((entry) => typeof entry === 'string' && entry.trim());
  }, [activity.schedule]);

  const participantsLabel = useMemo(() => {
    const count = formatNumber(activity.participantsCount ?? activity.participants);

    if (!count) {
      return null;
    }

    return `${count} peserta`;
  }, [activity.participants, activity.participantsCount]);

  const attendanceRate = useMemo(
    () => formatPercentage(activity.attendanceRate ?? activity.summary?.attendanceRate),
    [activity.attendanceRate, activity.summary?.attendanceRate],
  );

  const summary = activity.summary || {};

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => (onPress ? onPress(activity) : undefined)}
      activeOpacity={onPress ? 0.85 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleWrapper}>
          <Text style={styles.name} numberOfLines={2}>
            {activity.name || 'Aktivitas Tanpa Nama'}
          </Text>
          {activity.tutor ? (
            <Text style={styles.tutor} numberOfLines={1}>
              Tutor: {activity.tutor}
            </Text>
          ) : null}
          {participantsLabel ? <Text style={styles.participants}>{participantsLabel}</Text> : null}
        </View>

        <View style={styles.rateWrapper}>
          {attendanceRate ? <Text style={styles.rateValue}>{attendanceRate}</Text> : null}
          <Text style={styles.rateLabel}>Rata-rata hadir</Text>
          {onPress ? (
            <Ionicons name="chevron-forward" size={18} color="#0984e3" style={styles.chevron} />
          ) : null}
        </View>
      </View>

      {scheduleEntries.length ? (
        <View style={styles.scheduleWrapper}>
          {scheduleEntries.map((entry) => (
            <View style={styles.scheduleBadge} key={entry}>
              <Ionicons name="calendar-outline" size={14} color="#0984e3" style={styles.scheduleIcon} />
              <Text style={styles.scheduleText}>{entry}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.progressGroup}>
        <View style={styles.progressItem}>
          <AttendanceProgressBar
            label="Hadir"
            count={summary.present?.count}
            percentage={summary.present?.percentage}
            color="#2ecc71"
            icon="checkmark-circle"
          />
        </View>
        <View style={styles.progressItem}>
          <AttendanceProgressBar
            label="Terlambat"
            count={summary.late?.count}
            percentage={summary.late?.percentage}
            color="#f1c40f"
            icon="time"
          />
        </View>
        <View style={styles.progressItem}>
          <AttendanceProgressBar
            label="Tidak Hadir"
            count={summary.absent?.count}
            percentage={summary.absent?.percentage}
            color="#e74c3c"
            icon="close-circle"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

ShelterActivityCard.defaultProps = {
  activity: null,
  onPress: undefined,
  style: null,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  tutor: {
    marginTop: 6,
    fontSize: 13,
    color: '#636e72',
  },
  participants: {
    marginTop: 4,
    fontSize: 12,
    color: '#636e72',
  },
  rateWrapper: {
    alignItems: 'flex-end',
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0984e3',
  },
  rateLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#636e72',
  },
  chevron: {
    marginTop: 12,
  },
  scheduleWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginHorizontal: -4,
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 132, 227, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  scheduleIcon: {
    marginRight: 6,
  },
  scheduleText: {
    fontSize: 12,
    color: '#0984e3',
    fontWeight: '600',
  },
  progressGroup: {
    marginTop: 16,
  },
  progressItem: {
    marginBottom: 12,
  },
});

export default ShelterActivityCard;
