import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '../../../../../common/components/EmptyState';
import AttendanceProgressBar from '../attendance/AttendanceProgressBar';

const BAND_STYLES = {
  high: {
    label: 'Kehadiran Tinggi',
    color: '#2ecc71',
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  medium: {
    label: 'Kehadiran Sedang',
    color: '#f39c12',
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
  },
  low: {
    label: 'Kehadiran Rendah',
    color: '#e74c3c',
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  unknown: {
    label: 'Band tidak diketahui',
    color: '#636e72',
    backgroundColor: 'rgba(99, 110, 114, 0.12)',
  },
};

const getInitials = (name) => {
  if (!name) {
    return 'AN';
  }

  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

const resolveBandMeta = (band, percentage) => {
  const normalizedBand = band ? String(band).toLowerCase() : null;

  if (normalizedBand && BAND_STYLES[normalizedBand]) {
    return BAND_STYLES[normalizedBand];
  }

  const numeric = Number(percentage);

  if (!Number.isFinite(numeric)) {
    return BAND_STYLES.unknown;
  }

  if (numeric >= 85) {
    return BAND_STYLES.high;
  }

  if (numeric >= 60) {
    return BAND_STYLES.medium;
  }

  return BAND_STYLES.low;
};

const resolveMonthlyItems = (child, monthly) => {
  if (Array.isArray(monthly) && monthly.length) {
    return monthly;
  }

  const fromChild = child?.monthlyBreakdown || child?.monthly || child?.monthly_breakdown;

  if (Array.isArray(fromChild)) {
    return fromChild;
  }

  return [];
};

const resolveTimelineItems = (timeline, child) => {
  if (Array.isArray(timeline) && timeline.length) {
    return timeline;
  }

  const fromChild = child?.timeline || child?.attendanceTimeline || child?.activities;

  if (Array.isArray(fromChild)) {
    return fromChild;
  }

  return [];
};

const getStatusColor = (status) => {
  const normalized = status ? String(status).toLowerCase() : '';

  if (normalized.includes('hadir') || normalized === 'present' || normalized === 'attended') {
    return '#2ecc71';
  }

  if (normalized.includes('terlambat') || normalized === 'late') {
    return '#f39c12';
  }

  if (normalized.includes('tidak') || normalized === 'absent' || normalized === 'alfa') {
    return '#e74c3c';
  }

  return '#636e72';
};

const formatDateLabel = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const ChildAttendanceDetailModal = ({
  visible,
  onClose,
  child,
  monthlyBreakdown,
  timeline,
  loading = false,
  onRefresh,
}) => {
  const safeChild = child || {};

  const bandMeta = useMemo(() => {
    const bandValue =
      safeChild?.attendanceBand ??
      safeChild?.band ??
      safeChild?.attendance?.attendance_band ??
      safeChild?.attendance?.band ??
      null;

    const percentageValue =
      safeChild?.attendanceRate?.value ??
      safeChild?.attendanceRate ??
      safeChild?.attendance?.attendance_percentage ??
      safeChild?.summary?.attendanceRate?.value ??
      null;

    return resolveBandMeta(bandValue, percentageValue);
  }, [safeChild]);

  const attendanceRateLabel = useMemo(() => {
    const value =
      safeChild?.attendanceRate?.label ??
      safeChild?.attendance_label ??
      safeChild?.summary?.attendanceRate?.label ??
      (Number.isFinite(Number(safeChild?.attendanceRate?.value))
        ? `${Number(safeChild?.attendanceRate?.value).toFixed(
            Number(safeChild?.attendanceRate?.value) % 1 === 0 ? 0 : 1,
          )}%`
        : '0%');

    return value;
  }, [safeChild]);

  const monthlyItems = useMemo(
    () =>
      resolveMonthlyItems(safeChild, monthlyBreakdown).map((item, index) => ({
        id: item?.id ?? item?.month ?? `month-${index}`,
        label: item?.label ?? item?.monthName ?? item?.name ?? `Periode ${index + 1}`,
        percentage:
          item?.attendanceRate?.value ??
          item?.attendanceRate ??
          item?.attendance_percentage ??
          item?.percentage ??
          0,
        totals: item?.totals ?? {
          present: item?.presentCount ?? item?.present_count ?? item?.attended_count ?? 0,
          late: item?.lateCount ?? item?.late_count ?? 0,
          absent: item?.absentCount ?? item?.absent_count ?? 0,
        },
      })),
    [monthlyBreakdown, safeChild],
  );

  const timelineItems = useMemo(
    () =>
      resolveTimelineItems(timeline, safeChild).map((item, index, list) => {
        const statusColor = item?.statusColor || item?.status_color || getStatusColor(item?.status);

        return {
          id: item?.id ?? item?.timeline_id ?? item?.value ?? `timeline-${index}`,
          date: formatDateLabel(item?.date),
          status: item?.statusLabel ?? item?.status_label ?? item?.status ?? 'Status tidak diketahui',
          note: item?.note ?? item?.notes ?? null,
          activity: item?.activity ?? item?.activityName ?? item?.activity_name ?? 'Kegiatan',
          mentor: item?.mentor ?? item?.mentorName ?? item?.mentor_name ?? null,
          verification: item?.verificationLabel ?? item?.verification_label ?? item?.verificationStatus ?? null,
          statusColor,
          isLast: index === list.length - 1,
        };
      }),
    [safeChild, timeline],
  );

  const totals = safeChild?.totals || safeChild?.attendance?.totals || {
    present: safeChild?.attendance?.present_count ?? 0,
    late: safeChild?.attendance?.late_count ?? 0,
    absent: safeChild?.attendance?.absent_count ?? 0,
    totalSessions:
      safeChild?.totals?.totalSessions ??
      safeChild?.attendance?.totalSessions ??
      safeChild?.attendance?.total_sessions ??
      safeChild?.summary?.totalSessions ??
      0,
  };

  const photoUrl =
    safeChild?.photoUrl ?? safeChild?.photo_url ?? safeChild?.avatarUrl ?? safeChild?.avatar_url ?? null;
  const displayName = safeChild?.name || safeChild?.fullName || safeChild?.full_name || 'Nama tidak tersedia';
  const identifier = safeChild?.identifier || safeChild?.code || safeChild?.childCode || null;
  const shelterName = safeChild?.shelter?.name || safeChild?.shelterName || '-';
  const groupName = safeChild?.group?.name || safeChild?.groupName || '-';
  const dateRangeLabel = safeChild?.summary?.dateRange?.label || safeChild?.dateRange?.label || null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={22} color="#2d3436" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Kehadiran Anak</Text>
          <View style={styles.headerSpacer}>
            {onRefresh ? (
              <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
                <Ionicons name="refresh" size={20} color="#2d3436" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0984e3" />
            <View style={styles.loadingSkeleton}>
              <View style={styles.loadingLine} />
              <View style={[styles.loadingLine, styles.loadingLineShort]} />
              <View style={[styles.loadingLine, styles.loadingLineShort]} />
            </View>
          </View>
        ) : !child ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              title="Data belum tersedia"
              message="Pilih anak untuk melihat detail laporan kehadiran."
              icon="clipboard-outline"
              iconSize={60}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View style={styles.avatarWrapper}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                    </View>
                  )}
                  <View style={[styles.bandPill, { backgroundColor: bandMeta.backgroundColor }]}>
                    <Ionicons name="ribbon" size={14} color={bandMeta.color} style={styles.bandIcon} />
                    <Text style={[styles.bandLabel, { color: bandMeta.color }]}>{bandMeta.label}</Text>
                  </View>
                </View>

                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryName} numberOfLines={2}>
                    {displayName}
                  </Text>
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
                  <Text style={styles.metricValue}>{attendanceRateLabel}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <View style={styles.totalsItem}>
                    <Text style={styles.totalLabel}>Hadir</Text>
                    <Text style={[styles.totalValue, styles.totalValuePositive]}>{totals.present ?? 0}</Text>
                  </View>
                  <View style={styles.totalsItem}>
                    <Text style={styles.totalLabel}>Terlambat</Text>
                    <Text style={[styles.totalValue, styles.totalValueWarning]}>{totals.late ?? 0}</Text>
                  </View>
                  <View style={styles.totalsItem}>
                    <Text style={styles.totalLabel}>Tidak hadir</Text>
                    <Text style={[styles.totalValue, styles.totalValueNegative]}>{totals.absent ?? 0}</Text>
                  </View>
                  <View style={styles.totalsItem}>
                    <Text style={styles.totalLabel}>Total sesi</Text>
                    <Text style={styles.totalValue}>{totals.totalSessions ?? 0}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performa Bulanan</Text>
              {monthlyItems.length ? (
                <View style={styles.monthlyList}>
                  {monthlyItems.map((item) => {
                    const percentageValue = Number(item.percentage) || 0;
                    const color = percentageValue >= 85 ? '#2ecc71' : percentageValue >= 60 ? '#f39c12' : '#e74c3c';

                    return (
                      <View key={item.id} style={styles.monthlyItem}>
                        <AttendanceProgressBar
                          label={item.label}
                          percentage={percentageValue}
                          count={item?.totals?.present ?? item?.totals?.totalSessions ?? null}
                          color={color}
                          showCount={false}
                          backgroundColor="rgba(236, 240, 241, 0.6)"
                        />
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptySubText}>Belum ada data performa bulanan.</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Timeline Aktivitas</Text>
              {timelineItems.length ? (
                <View style={styles.timelineList}>
                  {timelineItems.map((item) => (
                    <View key={item.id} style={styles.timelineItem}>
                      <View style={styles.timelineIndicator}>
                        <View style={[styles.timelineDot, { borderColor: item.statusColor }]}> 
                          <View style={[styles.timelineDotInner, { backgroundColor: item.statusColor }]} />
                        </View>
                        {!item.isLast ? <View style={styles.timelineLine} /> : null}
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.timelineActivity} numberOfLines={2}>
                            {item.activity}
                          </Text>
                          <View style={[styles.timelineStatusBadge, { backgroundColor: `${item.statusColor}20` }]}> 
                            <Text style={[styles.timelineStatusText, { color: item.statusColor }]}>{item.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.timelineDate}>{item.date}</Text>
                        {item.mentor ? (
                          <Text style={styles.timelineMeta}>Pendamping: {item.mentor}</Text>
                        ) : null}
                        {item.verification ? (
                          <Text style={styles.timelineMeta}>Status verifikasi: {item.verification}</Text>
                        ) : null}
                        {item.note ? <Text style={styles.timelineNote}>{item.note}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptySubText}>Belum ada histori aktivitas yang tercatat.</Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  headerSpacer: {
    width: 40,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingSkeleton: {
    marginTop: 16,
    width: '100%',
  },
  loadingLine: {
    height: 16,
    backgroundColor: '#eaeaea',
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingLineShort: {
    width: '60%',
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
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
  summaryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
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
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 12,
  },
  monthlyList: {},
  monthlyItem: {
    marginBottom: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#95a5a6',
  },
  timelineList: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIndicator: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#dfe6e9',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timelineActivity: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginRight: 8,
  },
  timelineStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timelineStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timelineDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  timelineMeta: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  timelineNote: {
    fontSize: 13,
    color: '#2d3436',
    marginTop: 6,
  },
});

export default ChildAttendanceDetailModal;
