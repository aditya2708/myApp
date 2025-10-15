import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getInitials } from '../../screens/reports/child/utils/childReportTransformers';

const ChildReportSummaryCard = ({
  child,
  bandMeta,
  totals,
  attendanceRateLabel,
  dateRangeLabel,
}) => {
  const safeChild = child || {};
  const safeTotals = totals || {};
  const resolvedBandMeta = bandMeta || {};

  const photoUrl =
    safeChild.photoUrl ||
    safeChild.photo_url ||
    safeChild.avatarUrl ||
    safeChild.avatar_url ||
    null;

  const displayName =
    safeChild.name || safeChild.fullName || safeChild.full_name || 'Nama tidak tersedia';
  const identifier = safeChild.identifier || safeChild.code || safeChild.childCode || null;
  const shelterName = safeChild?.shelter?.name || safeChild?.shelterName || '-';
  const groupName = safeChild?.group?.name || safeChild?.groupName || '-';

  const bandLabel = resolvedBandMeta.label || 'Tidak ada band';
  const bandBackgroundColor = resolvedBandMeta.backgroundColor || 'rgba(9, 132, 227, 0.1)';
  const bandColor = resolvedBandMeta.color || '#0984e3';

  const totalsWithFallback = useMemo(() => {
    const coalesceNumber = (...candidates) => {
      for (const value of candidates) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      return null;
    };

    const rawHadir = coalesceNumber(
      safeTotals.hadir,
      safeTotals.hadirCount,
      safeTotals.totalHadir,
      safeTotals.total_hadir,
    );
    const present = coalesceNumber(
      safeTotals.present,
      safeTotals.presentCount,
      safeTotals.present_count,
    );
    const late = coalesceNumber(
      safeTotals.late,
      safeTotals.lateCount,
      safeTotals.late_count,
      safeTotals.terlambat,
    );
    const tidakHadir =
      coalesceNumber(
        safeTotals.tidakHadir,
        safeTotals.tidak_hadir,
        safeTotals.tidak_hadir_count,
        safeTotals.tidakHadirCount,
        safeTotals.absent,
        safeTotals.absentCount,
        safeTotals.absent_count,
      ) ?? 0;
    const totalAktivitasCandidate = coalesceNumber(
      safeTotals.totalAktivitas,
      safeTotals.total_aktivitas,
      safeTotals.totalActivities,
      safeTotals.total_activities,
      safeTotals.totalSessions,
      safeTotals.total_sessions,
      safeTotals.sessions,
    );

    const hadirCombined =
      rawHadir ?? (present ?? 0) + (late ?? 0);
    const totalAktivitas =
      totalAktivitasCandidate ?? hadirCombined + tidakHadir;

    return {
      hadir: hadirCombined,
      tidakHadir,
      totalAktivitas,
    };
  }, [safeTotals]);

  const attendanceLabel = attendanceRateLabel || '0%';
  const initials = getInitials(displayName);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTopRow}>
        <View style={styles.avatarWrapper}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={[styles.bandPill, { backgroundColor: bandBackgroundColor }]}>
            <Ionicons name="ribbon" size={14} color={bandColor} style={styles.bandIcon} />
            <Text style={[styles.bandLabel, { color: bandColor }]}>{bandLabel}</Text>
          </View>
        </View>

        <View style={styles.summaryInfo}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryName} numberOfLines={2}>
              {displayName}
            </Text>
          </View>
          {identifier ? <Text style={styles.summaryIdentifier}>ID: {identifier}</Text> : null}
          <View style={styles.summaryRow}>
            <Ionicons name="home-outline" size={16} color="#636e72" />
            <Text style={styles.summaryRowText} numberOfLines={1}>
              {shelterName}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="people-circle-outline" size={16} color="#636e72" />
            <Text style={styles.summaryRowText} numberOfLines={1}>
              {groupName}
            </Text>
          </View>
          {dateRangeLabel ? (
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={16} color="#636e72" />
              <Text style={styles.summaryRowText} numberOfLines={1}>
                {dateRangeLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.summaryMetrics}>
        <View style={styles.totalsRow}>
          <View style={styles.totalsItem} testID="totals-hadir">
            <Text style={styles.totalLabel}>Hadir</Text>
            <Text style={[styles.totalValue, styles.totalValuePositive]} testID="totals-hadir-value">
              {totalsWithFallback.hadir.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.totalsItem} testID="totals-tidak-hadir">
            <Text style={styles.totalLabel}>Tidak Hadir</Text>
            <Text style={[styles.totalValue, styles.totalValueNegative]} testID="totals-tidak-hadir-value">
              {totalsWithFallback.tidakHadir.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.totalsItem} testID="totals-aktivitas">
            <Text style={styles.totalLabel}>Total Aktivitas</Text>
            <Text style={styles.totalValue} testID="totals-aktivitas-value">
              {totalsWithFallback.totalAktivitas.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.totalsItem} testID="totals-persentase">
            <Text style={styles.totalLabel}>Persentase</Text>
            <Text style={[styles.totalValue, styles.totalValueInfo]} testID="totals-persentase-value">
              {attendanceLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
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
    marginBottom: 20,
  },
  summaryTopRow: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    marginRight: 16,
    alignItems: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dfe6e9',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0984e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  bandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 10,
  },
  bandIcon: {
    marginRight: 6,
  },
  bandLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    flex: 1,
  },
  summaryIdentifier: {
    marginTop: 4,
    fontSize: 13,
    color: '#95a5a6',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  summaryRowText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#636e72',
    flex: 1,
  },
  summaryMetrics: {
    marginTop: 16,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  totalsItem: {
    width: '48%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  totalLabel: {
    fontSize: 12,
    color: '#95a5a6',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
    color: '#2d3436',
  },
  totalValuePositive: {
    color: '#2ecc71',
  },
  totalValueNegative: {
    color: '#e74c3c',
  },
  totalValueInfo: {
    color: '#0984e3',
  },
});

export default memo(ChildReportSummaryCard);
