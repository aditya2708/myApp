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

  const totalsWithFallback = useMemo(
    () => ({
      present: safeTotals.present ?? 0,
      late: safeTotals.late ?? 0,
      absent: safeTotals.absent ?? 0,
      totalSessions: safeTotals.totalSessions ?? 0,
    }),
    [safeTotals.absent, safeTotals.late, safeTotals.present, safeTotals.totalSessions],
  );

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
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Persentase Kehadiran</Text>
          <Text style={styles.metricValue}>{attendanceLabel}</Text>
        </View>
        <View style={styles.totalsRow}>
          <View style={styles.totalsItem} testID="totals-present">
            <Text style={styles.totalLabel}>Hadir</Text>
            <Text style={[styles.totalValue, styles.totalValuePositive]} testID="totals-present-value">
              {totalsWithFallback.present}
            </Text>
          </View>
          <View style={styles.totalsItem} testID="totals-late">
            <Text style={styles.totalLabel}>Terlambat</Text>
            <Text style={[styles.totalValue, styles.totalValueWarning]} testID="totals-late-value">
              {totalsWithFallback.late}
            </Text>
          </View>
          <View style={styles.totalsItem} testID="totals-absent">
            <Text style={styles.totalLabel}>Tidak hadir</Text>
            <Text style={[styles.totalValue, styles.totalValueNegative]} testID="totals-absent-value">
              {totalsWithFallback.absent}
            </Text>
          </View>
          <View style={styles.totalsItem} testID="totals-sessions">
            <Text style={styles.totalLabel}>Total sesi</Text>
            <Text style={styles.totalValue} testID="totals-sessions-value">
              {totalsWithFallback.totalSessions}
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
  metricBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 132, 227, 0.08)',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 13,
    color: '#0984e3',
    fontWeight: '600',
  },
  metricValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '700',
    color: '#0984e3',
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
  totalValueWarning: {
    color: '#f39c12',
  },
  totalValueNegative: {
    color: '#e74c3c',
  },
});

export default memo(ChildReportSummaryCard);
