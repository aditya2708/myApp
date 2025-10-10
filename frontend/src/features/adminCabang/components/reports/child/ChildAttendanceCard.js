import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AttendanceProgressBar from '../attendance/AttendanceProgressBar';
import AttendanceStatusChip from '../attendance/AttendanceStatusChip';

const BAND_META = {
  high: {
    label: 'Baik',
    color: '#00b894',
    icon: 'checkmark-circle',
  },
  medium: {
    label: 'Cukup',
    color: '#fdcb6e',
    icon: 'alert-circle',
  },
  low: {
    label: 'Rendah',
    color: '#e17055',
    icon: 'close-circle',
  },
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

const ChildAttendanceCard = ({ child, onPress }) => {
  const attendanceMeta = child?.attendance || {};

  const statusMeta = useMemo(() => {
    const band = attendanceMeta.attendance_band || attendanceMeta.band;
    return BAND_META[band] || {
      label: 'Perlu Data',
      color: '#b2bec3',
      icon: 'help-circle',
    };
  }, [attendanceMeta.attendance_band, attendanceMeta.band]);

  const totalSessions = attendanceMeta.total_sessions ?? attendanceMeta.totalSessions ?? 0;
  const present = attendanceMeta.present_count ?? attendanceMeta.presentCount ?? 0;
  const absent = attendanceMeta.absent_count ?? attendanceMeta.absentCount ?? 0;
  const late = attendanceMeta.late_count ?? attendanceMeta.lateCount ?? 0;

  const breakdown = useMemo(
    () => [
      {
        label: 'Hadir',
        count: present,
        percentage:
          totalSessions > 0 ? Math.round((Number(present) / Number(totalSessions)) * 1000) / 10 : 0,
        color: '#00b894',
        icon: 'checkbox-outline',
      },
      {
        label: 'Terlambat',
        count: late,
        percentage:
          totalSessions > 0 ? Math.round((Number(late) / Number(totalSessions)) * 1000) / 10 : 0,
        color: '#fdcb6e',
        icon: 'time',
      },
      {
        label: 'Tidak Hadir',
        count: absent,
        percentage:
          totalSessions > 0 ? Math.round((Number(absent) / Number(totalSessions)) * 1000) / 10 : 0,
        color: '#e17055',
        icon: 'close-circle',
      },
    ],
    [absent, late, present, totalSessions],
  );

  const photoUri = child?.photo_url || child?.photoUrl;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onPress?.(child)}
    >
      <View style={styles.headerRow}>
        <View style={styles.avatarWrapper}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>
                {(child?.nick_name || child?.full_name || '?')
                  .toString()
                  .trim()
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.name}>{child?.full_name || 'Tanpa Nama'}</Text>
          {child?.nick_name ? <Text style={styles.nickname}>{child.nick_name}</Text> : null}
          <Text style={styles.metaText}>
            {child?.shelter?.name || 'Shelter tidak diketahui'}
            {child?.group?.name ? ` • ${child.group.name}` : ''}
          </Text>
        </View>
        <AttendanceStatusChip
          label={`${statusMeta.label} (${formatPercentage(attendanceMeta.attendance_percentage)})`}
          color={statusMeta.color}
          icon={statusMeta.icon}
          active
          disabled
        />
      </View>

      <View style={styles.progressSection}>
        {breakdown.map((item) => (
          <AttendanceProgressBar
            key={item.label}
            label={item.label}
            count={item.count}
            percentage={item.percentage}
            color={item.color}
            icon={item.icon}
          />
        ))}
      </View>

      {child?.last_activity ? (
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Aktivitas terakhir</Text>
          <Text style={styles.footerText} numberOfLines={1}>
            {child.last_activity.activity_name} • {child.last_activity.date} • {child.last_activity.status}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

ChildAttendanceCard.defaultProps = {
  child: null,
  onPress: undefined,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    marginRight: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#dfe6e9',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  infoSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  nickname: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: '#8395a7',
    marginTop: 6,
  },
  progressSection: {
    gap: 10,
  },
  footer: {
    marginTop: 16,
    backgroundColor: '#f5f9ff',
    borderRadius: 12,
    padding: 12,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0984e3',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#2d3436',
  },
});

export default ChildAttendanceCard;
