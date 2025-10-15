import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../../../../common/components/EmptyState';
import { useChildAttendanceReportDetail } from '../../../hooks/reports/child/useChildAttendanceReportDetail';
import ChildReportSummaryCard from '../../../components/childReport/ChildReportSummaryCard';
import { formatPercentageLabel, resolveBandMeta } from './utils/childReportTransformers';

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
    period,
    isLoading = false,
    error,
    errorMessage,
  } = detailState;

  const safeChild = child || fallbackChild || null;
  const effectivePeriod = period || params.period || params.initialPeriod || null;
  const loading = isLoading;
  const detailErrorMessage = errorMessage || error?.message || null;

  useLayoutEffect(() => {
    navigation?.setOptions?.({ headerShown: false });
  }, [navigation]);

  const handleGoBack = useCallback(() => {
    navigation?.goBack?.();
  }, [navigation]);

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

    const formattedFromValue = formatPercentageLabel(attendanceRateValue);
    if (formattedFromValue) return formattedFromValue;

    const labelFromChild =
      safeChild?.attendanceRate?.label ?? safeChild?.attendance_label ?? safeChild?.attendanceRate;

    const formattedFromChildValue = formatPercentageLabel(labelFromChild);
    if (formattedFromChildValue) return formattedFromChildValue;

    if (typeof labelFromChild === 'string') {
      const trimmed = labelFromChild.trim();
      if (trimmed) {
        return trimmed.endsWith('%') ? trimmed : `${trimmed}%`;
      }
    }

    return '0%';
  }, [attendanceRateValue, effectiveSummary, safeChild]);

  const totals = useMemo(() => {
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
      const hadirValue = coalesceNumber(
        source.hadir,
        source.hadirCount,
        source.totalHadir,
        source.total_hadir,
      );
      const presentValue = coalesceNumber(
        source.present,
        source.presentCount,
        source.present_count,
      );
      const lateValue = coalesceNumber(
        source.late,
        source.lateCount,
        source.late_count,
        source.terlambat,
      );
      const tidakHadirValue = coalesceNumber(
        source.tidakHadir,
        source.tidak_hadir,
        source.tidak_hadir_count,
        source.tidakHadirCount,
        source.absent,
        source.absentCount,
        source.absent_count,
      );
      const totalAktivitasValue = coalesceNumber(
        source.totalAktivitas,
        source.total_aktivitas,
        source.totalActivities,
        source.total_activities,
        source.totalSessions,
        source.total_sessions,
        source.sessions,
      );

      const hadirCombined =
        hadirValue ?? (presentValue ?? 0) + (lateValue ?? 0);
      const tidakHadir = tidakHadirValue ?? 0;
      const totalAktivitas =
        totalAktivitasValue ?? hadirCombined + tidakHadir;

      return {
        hadir: hadirCombined,
        tidakHadir,
        totalAktivitas,
      };
    };

    if (effectiveSummary?.totals) {
      return extractTotals(effectiveSummary.totals);
    }

    const childTotals = safeChild?.totals || safeChild?.attendance?.totals;
    if (childTotals) {
      return extractTotals(childTotals);
    }

    return extractTotals({
      hadir: safeChild?.attendance?.hadir,
      hadirCount: safeChild?.attendance?.hadir_count,
      present: safeChild?.attendance?.present_count,
      late: safeChild?.attendance?.late_count,
      tidakHadir: safeChild?.attendance?.absent_count,
      totalAktivitas: safeChild?.attendance?.total_activities,
      totalSessions: safeChild?.attendance?.totalSessions,
      total_sessions: safeChild?.attendance?.total_sessions,
      sessions: safeChild?.summary?.totalSessions,
    });
  }, [effectiveSummary, safeChild]);

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
        <View style={styles.headerSpacer} />
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
            />

          </ScrollView>
        )}
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
});

export default AdminCabangChildReportDetailScreen;
