import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import TutorAttendanceList from '../../components/reports/tutor/TutorAttendanceList';
import TutorAttendanceEmptyState from '../../components/reports/tutor/TutorAttendanceEmptyState';
import TutorAttendanceSummary from '../../components/reports/tutor/TutorAttendanceSummary';
import { useTutorAttendanceReport } from '../../hooks/reports/useTutorAttendanceReport';
import {
  normalizeTutorRecord,
  summarizeTutors,
} from '../../utils/tutorReportHelpers';

const AdminCabangTutorReportScreen = () => {
  const navigation = useNavigation();

  const {
    tutors: rawTutors,
    summary,
    meta,
    loading,
    refreshing,
    error,
    refresh,
    refetch,
  } = useTutorAttendanceReport();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: undefined,
    });
  }, [navigation]);

  const normalizedTutors = useMemo(
    () => (Array.isArray(rawTutors) ? rawTutors.map(normalizeTutorRecord) : []),
    [rawTutors],
  );

  const attendanceSummary = useMemo(
    () => summarizeTutors(normalizedTutors, summary),
    [normalizedTutors, summary],
  );

  const isInitialLoading = loading && !refreshing && normalizedTutors.length === 0 && !error;

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderListHeader = useCallback(() => {
    const lastRefreshedAt = meta?.last_refreshed_at
      ?? meta?.timestamps?.last_refreshed_at
      ?? meta?.lastUpdatedAt
      ?? meta?.updated_at
      ?? meta?.updatedAt
      ?? null;

    const periodLabel = meta?.period?.label
      ?? meta?.period_label
      ?? meta?.filters?.period_label
      ?? meta?.filters?.periodLabel
      ?? meta?.filters?.periode_label
      ?? meta?.filters?.periodeLabel
      ?? meta?.filters?.periode
      ?? meta?.filters?.date_range?.label
      ?? meta?.filters?.dateRange?.label
      ?? meta?.date_range?.label
      ?? meta?.range_label
      ?? null;

    return (
      <View style={styles.listHeader}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Laporan Kehadiran Tutor</Text>
          <Text style={styles.pageSubtitle}>
            Pantau performa kehadiran tutor cabang Anda.
          </Text>
          {lastRefreshedAt ? (
            <Text style={styles.pageMetaText}>Terakhir diperbarui: {lastRefreshedAt}</Text>
          ) : null}
          {periodLabel ? (
            <Text style={styles.pageMetaText}>Periode: {periodLabel}</Text>
          ) : null}
        </View>

        <TutorAttendanceSummary summary={attendanceSummary} />

        <Text style={styles.filterStatusText}>
          Menampilkan seluruh data kehadiran tutor cabang.
        </Text>
      </View>
    );
  }, [attendanceSummary, meta]);

  if (isInitialLoading) {
    return (
      <View style={styles.centeredContainer}>
        <LoadingSpinner message="Memuat laporan tutor cabang..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <ErrorMessage
            message={error?.message || 'Gagal memuat laporan tutor cabang.'}
            onRetry={handleRetry}
          />
        </View>
      ) : null}

      <TutorAttendanceList
        tutors={normalizedTutors}
        summary={attendanceSummary}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderHeader={renderListHeader}
        ListEmptyComponent={(
          <TutorAttendanceEmptyState
            title="Belum ada data tutor"
            subtitle="Data kehadiran tutor belum tersedia untuk periode ini."
          />
        )}
      />

      {loading && normalizedTutors.length > 0 ? (
        <View style={styles.inlineLoader}>
          <LoadingSpinner message="Memperbarui data tutor cabang..." />
        </View>
      ) : null}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
    padding: 16,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inlineLoader: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  listHeader: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageHeader: {
    gap: 6,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  pageMetaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  filterStatusText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});

export default AdminCabangTutorReportScreen;
