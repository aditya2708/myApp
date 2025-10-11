import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../../../common/components/EmptyState';
import AttendanceProgressBar from '../../../../components/reports/child/attendance/AttendanceProgressBar';
import { useChildAttendanceReportDetail } from '../../../../hooks/reports/child/useChildAttendanceReportDetail';
import ChildReportSummaryCard from '../../../components/childReport/ChildReportSummaryCard';
import {
  resolveBandMeta,
  resolveMonthlyItems,
  resolveTimelineItems,
  getStatusColor,
  formatDateLabel,
  normalizeVerificationSummary,
  normalizeStreaks,
  normalizeFilterEntries,
  normalizeMetaEntries,
} from './utils/childReportTransformers';

const AdminCabangChildReportDetailScreen = ({ navigation, route }) => {
  const params = route?.params ?? {};
  const fallbackChild = params.fallbackChild ?? params.child ?? null;
  const initialFilters =
    params.filters && typeof params.filters === 'object' ? params.filters : {};
  const resolvedChildId =
    params.childId ??
    params.child_id ??
    params.id ??
    fallbackChild?.id ??
    fallbackChild?.childId ??
    fallbackChild?.child_id ??
    null;

  const requestParams = {
    startDate:
      params.startDate ??
      params.start_date ??
      initialFilters.startDate ??
      initialFilters.start_date ??
      null,
    endDate:
      params.endDate ??
      params.end_date ??
      initialFilters.endDate ??
      initialFilters.end_date ??
      null,
  };

  const detailState =
    useChildAttendanceReportDetail({
      childId: resolvedChildId,
      params: requestParams,
      enabled: Boolean(resolvedChildId),
    }) || {};

  const {
    child,
    summary,
    verificationSummary,
    streaks,
    filters,
    period,
    meta,
    monthlyBreakdown,
    attendanceTimeline,
    timeline,
    isLoading = false,
    error,
    errorMessage,
    refresh,
    refetch,
  } = detailState;

  const safeChild = child || fallbackChild || null;
  const effectiveFilters =
    filters && Object.keys(filters).length ? filters : initialFilters;
  const effectivePeriod = period || params.period || params.initialPeriod || null;
  const effectiveMeta = meta || params.meta || {};
  const timelineData = attendanceTimeline || timeline || [];
  const loading = isLoading;
  const detailErrorMessage = errorMessage || error?.message || null;

  useLayoutEffect(() => {
    navigation?.setOptions?.({ headerShown: false });
  }, [navigation]);

  const handleGoBack = useCallback(() => {
    navigation?.goBack?.();
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    if (typeof refresh === 'function') {
      return refresh();
    }
    if (typeof refetch === 'function') {
      return refetch();
    }
    return Promise.resolve();
  }, [refetch, refresh]);

  const canRefresh = typeof refresh === 'function' || typeof refetch === 'function';

  const effectiveSummary = useMemo(() => {
    if (summary && typeof summary === 'object') return summary;
    if (safeChild?.summary && typeof safeChild.summary === 'object') return safeChild.summary;
    return null;
  }, [safeChild, summary]);

  const attendanceRateValue = useMemo(() => {
    const fromSummary = effectiveSummary?.attendanceRate?.value;
    if (Number.isFinite(Number(fromSummary))) return Number(fromSummary);

    const fromChild = safeChild?.attendanceRate?.value ?? safeChild?.attendanceRate;
    if (Number.isFinite(Number(fromChild))) return Number(fromChild);

    const fromChildSummary = safeChild?.summary?.attendanceRate?.value;
    if (Number.isFinite(Number(fromChildSummary))) return Number(fromChildSummary);

    const fromAttendance = safeChild?.attendance?.attendance_percentage;
    if (Number.isFinite(Number(fromAttendance))) return Number(fromAttendance);

    return null;
  }, [effectiveSummary, safeChild]);

  const bandMeta = useMemo(() => {
    const bandValue =
      safeChild?.attendanceBand ??
      safeChild?.band ??
      safeChild?.attendance?.attendance_band ??
      safeChild?.attendance?.band ??
      effectiveSummary?.band ??
      null;

    return resolveBandMeta(bandValue, attendanceRateValue);
  }, [attendanceRateValue, effectiveSummary, safeChild]);

  const attendanceRateLabel = useMemo(() => {
    const labelFromSummary = effectiveSummary?.attendanceRate?.label;
    if (labelFromSummary) return labelFromSummary;

    if (Number.isFinite(attendanceRateValue)) {
      return `${attendanceRateValue.toFixed(attendanceRateValue % 1 === 0 ? 0 : 1)}%`;
    }

    const labelFromChild =
      safeChild?.attendanceRate?.label ?? safeChild?.attendance_label ?? safeChild?.attendanceRate;

    if (typeof labelFromChild === 'string') return labelFromChild;

    return '0%';
  }, [attendanceRateValue, effectiveSummary, safeChild]);

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
      resolveTimelineItems(timelineData, safeChild).map((item, index, list) => {
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
    [safeChild, timelineData],
  );

  const totals = useMemo(() => {
    if (effectiveSummary?.totals) {
      return {
        present: effectiveSummary.totals.present ?? 0,
        late: effectiveSummary.totals.late ?? 0,
        absent: effectiveSummary.totals.absent ?? 0,
        totalSessions: effectiveSummary.totals.totalSessions ?? 0,
      };
    }

    const childTotals = safeChild?.totals || safeChild?.attendance?.totals;
    if (childTotals) {
      return {
        present: childTotals.present ?? childTotals.present_count ?? 0,
        late: childTotals.late ?? childTotals.late_count ?? 0,
        absent: childTotals.absent ?? childTotals.absent_count ?? 0,
        totalSessions:
          childTotals.totalSessions ??
          childTotals.total_sessions ??
          childTotals.sessions ??
          safeChild?.attendance?.totalSessions ??
          safeChild?.attendance?.total_sessions ??
          0,
      };
    }

    return {
      present: safeChild?.attendance?.present_count ?? 0,
      late: safeChild?.attendance?.late_count ?? 0,
      absent: safeChild?.attendance?.absent_count ?? 0,
      totalSessions:
        safeChild?.attendance?.totalSessions ??
        safeChild?.attendance?.total_sessions ??
        safeChild?.summary?.totalSessions ??
        0,
    };
  }, [effectiveSummary, safeChild]);

  const verificationItems = useMemo(
    () => normalizeVerificationSummary(verificationSummary, safeChild),
    [safeChild, verificationSummary],
  );

  const streakItems = useMemo(() => normalizeStreaks(streaks, safeChild), [safeChild, streaks]);

  const contextEntries = useMemo(
    () => normalizeFilterEntries(effectiveFilters, effectivePeriod, effectiveSummary, safeChild),
    [effectiveFilters, effectivePeriod, effectiveSummary, safeChild],
  );

  const metaEntries = useMemo(() => normalizeMetaEntries(effectiveMeta), [effectiveMeta]);

  const dateRangeLabel =
    effectiveSummary?.dateRange?.label ||
    safeChild?.summary?.dateRange?.label ||
    effectivePeriod?.label ||
    safeChild?.dateRange?.label ||
    null;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color="#2d3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Kehadiran Anak</Text>
        <View style={styles.headerSpacer}>
          {canRefresh ? (
            <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
              <Ionicons name="refresh" size={20} color="#2d3436" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {detailErrorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{detailErrorMessage}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0984e3" />
          <View style={styles.loadingSkeleton}>
            <View style={styles.loadingLine} />
            <View style={[styles.loadingLine, styles.loadingLineShort]} />
            <View style={[styles.loadingLine, styles.loadingLineShort]} />
          </View>
        </View>
      ) : !safeChild ? (
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
            <ChildReportSummaryCard
              child={safeChild}
              bandMeta={bandMeta}
              totals={totals}
              attendanceRateLabel={attendanceRateLabel}
              dateRangeLabel={dateRangeLabel}
              onRefresh={canRefresh ? handleRefresh : undefined}
            />

            {verificationItems.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ringkasan Verifikasi</Text>
                <View style={styles.verificationGrid}>
                  {verificationItems.map((item) => (
                    <View key={item.id} style={styles.verificationCard} testID={`verification-${item.id}`}>
                      <Text style={styles.verificationLabel}>{item.label}</Text>
                      <Text
                        style={[
                          styles.verificationValue,
                          item.accent ? { color: item.accent } : null,
                        ]}
                      >
                        {item.value ?? 0}
                      </Text>
                      {item.unit ? (
                        <Text style={styles.verificationSubtext}>{item.unit}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {streakItems.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Catatan Streak</Text>
                <View style={styles.streakList}>
                  {streakItems.map((item) => (
                    <View key={item.id} style={styles.streakCard} testID={`streak-${item.id}`}>
                      <Text style={styles.streakValue}>{item.value ?? 0}</Text>
                      {item.unit ? <Text style={styles.streakUnit}>{item.unit}</Text> : null}
                      <Text style={styles.streakLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {contextEntries.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Konteks Laporan</Text>
                <View style={styles.contextList}>
                  {contextEntries.map((entry, index) => (
                    <View
                      key={entry.id}
                      style={[
                        styles.contextItem,
                        index === contextEntries.length - 1 ? styles.contextItemLast : null,
                      ]}
                    >
                      <Text style={styles.contextLabel}>{entry.label}</Text>
                      <Text style={styles.contextValue}>{entry.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {metaEntries.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informasi Tambahan</Text>
                <View style={styles.contextList}>
                  {metaEntries.map((entry, index) => (
                    <View
                      key={entry.id}
                      style={[
                        styles.contextItem,
                        index === metaEntries.length - 1 ? styles.contextItemLast : null,
                      ]}
                    >
                      <Text style={styles.contextLabel}>{entry.label}</Text>
                      <Text style={styles.contextValue}>{entry.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Monthly Breakdown */}
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

            {/* Timeline */}
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
                            <Text style={[styles.timelineStatusText, { color: item.statusColor }]}>
                              {item.status}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.timelineDate}>{item.date}</Text>
                        {item.mentor ? <Text style={styles.timelineMeta}>Pendamping: {item.mentor}</Text> : null}
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
    </View>
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
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    textAlign: 'center',
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
  verificationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  verificationCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  verificationLabel: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 6,
  },
  verificationValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
  },
  verificationSubtext: {
    marginTop: 4,
    fontSize: 11,
    color: '#95a5a6',
  },
  streakList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  streakCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0984e3',
  },
  streakUnit: {
    fontSize: 12,
    color: '#74b9ff',
    marginTop: 2,
  },
  streakLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#636e72',
  },
  contextList: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 12,
    overflow: 'hidden',
  },
  contextItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  contextItemLast: {
    borderBottomWidth: 0,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#95a5a6',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contextValue: {
    fontSize: 13,
    color: '#2d3436',
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
});

export default AdminCabangChildReportDetailScreen;
