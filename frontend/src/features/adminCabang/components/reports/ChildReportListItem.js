import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_PHOTO = require('../../../../assets/images/logo.png');

const normalizeToDisplayString = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const nestedValue = value?.name ?? value?.wilbin ?? null;

    if (typeof nestedValue === 'string') {
      return nestedValue;
    }

    try {
      return JSON.stringify(value);
    } catch (error) {
      return '';
    }
  }

  return String(value);
};

const pickDisplayString = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeToDisplayString(candidate);
    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
};

const formatAttendancePercentage = (rawValue) => {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }

  let numericValue;

  if (typeof rawValue === 'string') {
    const cleanedString = rawValue.replace(/%/g, '').trim();
    numericValue = Number.parseFloat(cleanedString);
  } else {
    numericValue = Number(rawValue);
  }

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (numericValue <= 1 && numericValue >= 0) {
    numericValue *= 100;
  }

  const formattedValue = numericValue.toFixed(1);

  return `${formattedValue}%`;
};

const ChildReportListItem = ({ child, onPress }) => {
  const {
    displayName,
    nickname,
    shelterName,
    wilayahName,
    attendancePercentage,
    attendanceSummary,
    lastActivity,
    photoUrl,
  } = useMemo(() => {
    const totalAttended =
      child.total_attended ?? child.attended_count ?? child.totalAktivitasHadir;
    const totalOpportunities =
      child.total_attendance_opportunities ??
      child.attendance_opportunities_total ??
      child.totalAttendanceOpportunities ??
      child.total_attendance_opportunity ??
      child.totalAttendanceOpportunity ??
      child.total_activities ??
      child.activities_count ??
      child.totalAktivitas;
    const percentage = child.attendance_percentage ?? child.overall_percentage ?? child.percentage ?? null;

    return {
      displayName: pickDisplayString(child.full_name, child.name, child.nama) ?? 'Anak Binaan',
      nickname: pickDisplayString(child.nick_name, child.nickname),
      shelterName: pickDisplayString(
        child.shelter_name,
        child.shelter,
        child.nama_shelter,
      ),
      wilayahName:
        normalizeToDisplayString(child.wilayah_name) ??
        normalizeToDisplayString(child.wilbin_name) ??
        normalizeToDisplayString(child.nama_wilayah) ??
        null,
      attendancePercentage: formatAttendancePercentage(percentage),
      attendanceSummary:
        totalAttended !== undefined &&
        totalAttended !== null &&
        totalOpportunities !== undefined &&
        totalOpportunities !== null
          ? `${totalAttended}/${totalOpportunities} peluang kehadiran`
        : null,
      lastActivity: pickDisplayString(child.last_activity, child.latest_activity),
      photoUrl: child.photo_url || child.foto_url || child.avatar_url || null,
    };
  }, [child]);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(child)}
      activeOpacity={0.85}
      style={styles.card}
    >
      <View style={styles.header}>
        <Image
          source={photoUrl ? { uri: photoUrl } : DEFAULT_PHOTO}
          style={styles.avatar}
        />
        <View style={styles.titleWrapper}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {nickname && (
            <Text style={styles.nickname} numberOfLines={1}>
              ({nickname})
            </Text>
          )}
          <View style={styles.metaRow}>
            {shelterName && (
              <View style={styles.metaItem}>
                <Ionicons name="home" size={14} color="#7f8c8d" style={styles.metaIcon} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {shelterName}
                </Text>
              </View>
            )}
            {wilayahName && (
              <View style={styles.metaItem}>
                <Ionicons name="map" size={14} color="#7f8c8d" style={styles.metaIcon} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {wilayahName}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
      </View>

      <View style={styles.body}>
        {attendanceSummary && (
          <View style={styles.statItem}>
            <Ionicons name="clipboard" size={16} color="#2c3e50" style={styles.statIcon} />
            <Text style={styles.statValue}>{attendanceSummary}</Text>
          </View>
        )}
        {attendancePercentage && (
          <View style={styles.statItem}>
            <Ionicons name="stats-chart" size={16} color="#27ae60" style={styles.statIcon} />
            <Text style={[styles.statValue, styles.statHighlight]}>{attendancePercentage}</Text>
          </View>
        )}
        {lastActivity && (
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={16} color="#2980b9" style={styles.statIcon} />
            <Text style={styles.statValue} numberOfLines={1}>
              {lastActivity}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f2f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    backgroundColor: '#ecf0f1',
  },
  titleWrapper: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  nickname: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#7f8c8d',
    maxWidth: 150,
  },
  body: {
    marginTop: 14,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    marginRight: 8,
  },
  statValue: {
    fontSize: 13,
    color: '#2c3e50',
  },
  statHighlight: {
    fontWeight: '600',
    color: '#27ae60',
  },
});

// Dev Notes (Manual QA):
// - attendancePercentage handles string input "85%" ➜ renders "85.0%".
// - attendancePercentage handles numeric ratio 0.82 ➜ renders "82.0%".

export default ChildReportListItem;
