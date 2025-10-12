import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getInitials, resolveBandMeta } from '../../../screens/reports/child/utils/childReportTransformers';

const ChildAttendanceCard = ({
  child,
  loading = false,
  style,
  onPress,
  onViewDetail,
  actionLabel = 'Lihat Detail',
  disabled = false,
}) => {
  const { bandMeta, attendanceRateLabel, totals, lastActivity } = useMemo(() => {
    const decorateBandMeta = (meta) =>
      meta?.code === 'unknown' ? { ...meta, label: 'Perlu Data' } : meta;

    const coalesceNumber = (...candidates) => {
      for (const value of candidates) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      return null;
    };

    const extractTotals = (source = {}) => {
      const rawHadir = coalesceNumber(
        source.hadir,
        source.hadirCount,
        source.totalHadir,
        source.total_hadir,
      );
      const present = coalesceNumber(
        source.present,
        source.presentCount,
        source.present_count,
      );
      const late = coalesceNumber(
        source.late,
        source.lateCount,
        source.late_count,
        source.terlambat,
      );
      const tidakHadir =
        coalesceNumber(
          source.tidakHadir,
          source.tidak_hadir,
          source.tidakHadirCount,
          source.absent,
          source.absentCount,
          source.absent_count,
        ) ?? 0;
      const totalAktivitasCandidate = coalesceNumber(
        source.totalAktivitas,
        source.total_aktivitas,
        source.totalActivities,
        source.total_activities,
        source.totalSessions,
        source.total_sessions,
        source.sessions,
      );

      const hadirCombined = rawHadir ?? (present ?? 0) + (late ?? 0);
      const totalAktivitas =
        totalAktivitasCandidate ?? hadirCombined + tidakHadir;

      return {
        hadir: hadirCombined,
        tidakHadir,
        totalAktivitas,
      };
    };

    if (!child) {
      return {
        bandMeta: decorateBandMeta(resolveBandMeta(null, null)),
        attendanceRateLabel: '0%',
        totals: { hadir: 0, tidakHadir: 0, totalAktivitas: 0 },
        lastActivity: null,
      };
    }

    const bandValue =
      child?.attendanceBand ??
      child?.band ??
      child?.attendance_band ??
      child?.attendance?.attendance_band ??
      child?.attendance?.band ??
      null;

    const attendanceRateValue =
      child?.attendanceRate?.value ??
      child?.attendanceRate ??
      child?.attendance?.attendance_percentage;

    return {
      bandMeta: decorateBandMeta(resolveBandMeta(bandValue, attendanceRateValue)),
      attendanceRateLabel:
        child?.attendanceRate?.label ??
        child?.attendance_label ??
        (Number.isFinite(Number(attendanceRateValue))
          ? `${Number(attendanceRateValue).toFixed(
              Number(attendanceRateValue) % 1 === 0 ? 0 : 1
            )}%`
          : '0%'),
      totals: (() => {
        if (child?.totals) {
          return extractTotals(child.totals);
        }

        if (child?.attendance?.totals) {
          return extractTotals(child.attendance.totals);
        }

        return extractTotals({
          hadir: child?.attendance?.hadir,
          hadirCount: child?.attendance?.hadir_count,
          present: child?.attendance?.present_count,
          late: child?.attendance?.late_count,
          tidakHadir: child?.attendance?.absent_count,
          totalAktivitas: child?.attendance?.total_activities,
          totalSessions: child?.attendance?.totalSessions,
          total_sessions: child?.attendance?.total_sessions,
        });
      })(),
      lastActivity: child?.last_activity ?? null,
    };
  }, [child]);

  if (loading) {
    return (
      <View style={[styles.card, style]}>
        <View style={styles.cardContent}>
          <View style={styles.avatarSkeleton} />
          <View style={styles.infoSkeleton}>
            <View style={styles.lineSkeleton} />
            <View style={[styles.lineSkeleton, styles.lineSkeletonShort]} />
            <View style={[styles.lineSkeleton, styles.lineSkeletonShort]} />
          </View>
        </View>
        <ActivityIndicator color="#0984e3" style={styles.loadingIndicator} />
      </View>
    );
  }

  if (!child) return null;

  const photoUrl =
    child?.photoUrl ?? child?.photo_url ?? child?.avatarUrl ?? child?.avatar_url ?? null;
  const displayName = child?.name || child?.fullName || child?.full_name || 'Nama tidak tersedia';
  const identifier = child?.identifier || child?.code || child?.childCode || child?.attendance_code || null;
  const shelterName = child?.shelter?.name || child?.shelterName || '-';
  const groupName = child?.group?.name || child?.groupName || '-';

  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled, style]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardContent}>
        <View style={styles.avatarContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
            </View>
          )}
          <View style={[styles.bandBadge, { backgroundColor: bandMeta.backgroundColor }]}>
            <Ionicons name="ribbon" size={12} color={bandMeta.color} style={styles.bandIcon} />
            <Text style={[styles.bandText, { color: bandMeta.color }]} numberOfLines={1}>
              {bandMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.infoWrapper}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {identifier ? <Text style={styles.identifier}>ID: {identifier}</Text> : null}

          <View style={styles.metaRow}>
            <Ionicons name="home-outline" size={14} color="#636e72" />
            <Text style={styles.metaText} numberOfLines={1}>
              {shelterName}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="people-circle-outline" size={14} color="#636e72" />
            <Text style={styles.metaText} numberOfLines={1}>
              {groupName}
            </Text>
          </View>

          {/* Attendance Breakdown */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Hadir</Text>
              <Text style={[styles.statValue, styles.statValuePositive]}>
                {totals.hadir.toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tidak Hadir</Text>
              <Text style={[styles.statValue, styles.statValueNegative]}>
                {totals.tidakHadir.toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Aktivitas</Text>
              <Text style={[styles.statValue, styles.statValueNeutral]}>
                {totals.totalAktivitas.toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Persentase</Text>
              <Text style={[styles.statValue, styles.statValueInfo]}>{attendanceRateLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerRow}>
        {(onViewDetail || onPress) && (
          <TouchableOpacity
            style={styles.detailButton}
            onPress={onViewDetail || onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.detailButtonText}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {lastActivity ? (
        <View style={styles.footerActivity}>
          <Text style={styles.footerLabel}>Aktivitas terakhir</Text>
          <Text style={styles.footerText} numberOfLines={1}>
            {lastActivity.activity_name} • {lastActivity.date} • {lastActivity.status}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  cardDisabled: { opacity: 0.6 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarContainer: { marginRight: 16, alignItems: 'center' },
  avatarImage: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dfe6e9' },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0984e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  bandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 10,
    maxWidth: 120,
  },
  bandIcon: { marginRight: 6 },
  bandText: { fontSize: 11, fontWeight: '600' },
  infoWrapper: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#2d3436' },
  identifier: { marginTop: 2, fontSize: 12, color: '#95a5a6' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { marginLeft: 6, fontSize: 13, color: '#636e72', flex: 1 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  statItem: { width: '48%', marginBottom: 12 },
  statLabel: { fontSize: 12, color: '#95a5a6', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statValuePositive: { color: '#2ecc71' },
  statValueNegative: { color: '#e74c3c' },
  statValueNeutral: { color: '#2d3436' },
  statValueInfo: { color: '#0984e3' },
  footerRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0984e3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  detailButtonText: { color: '#fff', fontSize: 13, fontWeight: '600', marginRight: 6 },
  footerActivity: {
    marginTop: 12,
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
  footerText: { fontSize: 12, color: '#2d3436' },
  loadingIndicator: { marginTop: 12 },
  avatarSkeleton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0f0f0' },
  infoSkeleton: { flex: 1, marginLeft: 16 },
  lineSkeleton: { height: 14, backgroundColor: '#f0f0f0', borderRadius: 6, marginBottom: 8 },
  lineSkeletonShort: { width: '60%' },
});

export default ChildAttendanceCard;
