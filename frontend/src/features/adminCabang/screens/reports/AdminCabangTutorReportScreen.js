import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import TutorAttendanceList from '../../components/reports/tutor/TutorAttendanceList';
import TutorAttendanceFilters from '../../components/reports/tutor/TutorAttendanceFilters';
import TutorAttendanceEmptyState from '../../components/reports/tutor/TutorAttendanceEmptyState';
import TutorAttendanceSummary from '../../components/reports/tutor/TutorAttendanceSummary';
import { useTutorAttendanceReport } from '../../hooks/reports/useTutorAttendanceReport';
import {
  DEFAULT_FILTERS,
  buildJenisOptions,
  buildShelterOptions,
  buildSummaryHighlights,
  composeApiParamsFromFilters,
  formatInteger,
  highlightGridStyles,
  mergeFilters,
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
    loadingMore,
    error,
    refresh,
    refetch,
    updateFilters,
    resetFilters,
    params,
    loadMore,
    hasNextPage,
  } = useTutorAttendanceReport();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const jenisOptions = useMemo(
    () => buildJenisOptions(meta, rawTutors),
    [meta, rawTutors],
  );

  const shelterOptions = useMemo(
    () => buildShelterOptions(meta, rawTutors),
    [meta, rawTutors],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerActions} onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={22} color="#1f2933" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const initialFilters = mergeFilters(meta?.filters, params);
    setFilters(initialFilters);
  }, [meta, params]);

  const normalizedTutors = useMemo(
    () => (Array.isArray(rawTutors) ? rawTutors.map(normalizeTutorRecord) : []),
    [rawTutors],
  );

  const attendanceSummary = useMemo(() => {
    const summarized = summarizeTutors(normalizedTutors);
    return {
      ...summarized,
      total_tutors: summary?.totalTutors ?? summary?.total_tutors ?? summarized.total_tutors,
      average_attendance_rate: summary?.attendanceRate ?? summary?.attendance_rate ?? summarized.average_attendance_rate,
      distribution: summarized.distribution,
    };
  }, [normalizedTutors, summary]);

  const summaryHighlights = useMemo(() => buildSummaryHighlights(summary), [summary]);

  const isInitialLoading = loading && !refreshing && normalizedTutors.length === 0 && !error;

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleApplyFilters = useCallback((nextFilters) => {
    const sanitized = mergeFilters(DEFAULT_FILTERS, nextFilters);
    setFilters(sanitized);
    setShowFilters(false);
    const paramsPayload = {
      ...composeApiParamsFromFilters(sanitized),
      page: 1,
    };
    updateFilters(paramsPayload);
  }, [updateFilters]);

  const handleClearFilters = useCallback(() => {
    const baseFilters = mergeFilters(DEFAULT_FILTERS, meta?.filters);
    setFilters(baseFilters);
    setShowFilters(false);
    resetFilters();
  }, [meta?.filters, resetFilters]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (!hasNextPage || loadingMore) {
      return;
    }

    loadMore();
  }, [hasNextPage, loadMore, loadingMore]);

  const renderListHeader = useCallback(() => (
    <View style={styles.listHeader}>
      {meta?.last_refreshed_at ? (
        <Text style={styles.lastUpdatedText}>
          Terakhir diperbarui: {meta.last_refreshed_at}
        </Text>
      ) : null}

      {summaryHighlights.length > 0 ? (
        <View style={highlightGridStyles.container}>
          {summaryHighlights.map((item) => (
            <View key={item.key} style={highlightGridStyles.card}>
              <Text style={styles.highlightLabel}>{item.label}</Text>
              <Text style={styles.highlightValue}>{formatInteger(item.value)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.summaryWrapper}>
        <TutorAttendanceSummary summary={attendanceSummary} />
      </View>
    </View>
  ), [attendanceSummary, meta?.last_refreshed_at, summaryHighlights]);

  const renderListFooter = useCallback(() => {
    if (!loadingMore) {
      return null;
    }

    return (
      <LoadingSpinner
        size="small"
        message={null}
        style={styles.listFooter}
      />
    );
  }, [loadingMore]);

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
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.25}
        loadingMore={loadingMore}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={(
          <TutorAttendanceEmptyState
            title="Belum ada data tutor"
            subtitle="Coba ubah rentang tanggal, jenis kegiatan, atau shelter untuk melihat laporan."
          />
        )}
      />

      {loading && normalizedTutors.length > 0 ? (
        <View style={styles.inlineLoader}>
          <LoadingSpinner message="Memperbarui data tutor cabang..." />
        </View>
      ) : null}

      <TutorAttendanceFilters
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        jenisOptions={jenisOptions}
        shelterOptions={shelterOptions}
      />
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
  headerActions: {
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
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
    gap: 12,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#64748b',
  },
  highlightLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryWrapper: {
    marginTop: 4,
  },
  listFooter: {
    paddingVertical: 16,
  },
});

export default AdminCabangTutorReportScreen;
