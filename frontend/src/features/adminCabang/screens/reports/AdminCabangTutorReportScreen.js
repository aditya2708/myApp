import React, { useCallback, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import EmptyState from '../../../../common/components/EmptyState';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import { useTutorAttendanceReport } from '../../hooks/reports/useTutorAttendanceReport';

const parseNumericValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.').trim();
    if (!normalized) return null;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatCount = (value) => {
  const parsed = parseNumericValue(value);
  if (parsed === null) {
    return '-';
  }

  return parsed.toLocaleString('id-ID');
};

const formatPercentage = (value, label) => {
  if (typeof label === 'string' && label.trim()) {
    return label.trim();
  }

  const parsed = parseNumericValue(value);
  if (parsed === null) {
    return '-';
  }

  return `${parsed.toFixed(1)}%`;
};

const AdminCabangTutorReportScreen = () => {
  const {
    tutors,
    summary,
    metadata,
    loading,
    refreshing,
    error,
    refresh,
    refetch,
  } = useTutorAttendanceReport();

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const summaryItems = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        key: 'totalTutors',
        label: 'Total Tutor',
        value: formatCount(summary.totalTutors),
      },
      {
        key: 'attendanceRate',
        label: 'Rata-rata Kehadiran',
        value: formatPercentage(summary.attendanceRate, summary.attendanceRateLabel),
      },
      {
        key: 'totalActivities',
        label: 'Total Aktivitas',
        value: formatCount(summary.totalActivities),
      },
      {
        key: 'present',
        label: 'Hadir',
        value: formatCount(summary.presentCount),
      },
      {
        key: 'absent',
        label: 'Tidak Hadir',
        value: formatCount(summary.absentCount),
      },
      {
        key: 'late',
        label: 'Terlambat',
        value: formatCount(summary.lateCount),
      },
    ].filter((item) => item.value !== null && item.value !== undefined);
  }, [summary]);

  const hasData = tutors?.length > 0;
  const isInitialLoading = loading && !refreshing && !hasData;

  if (isInitialLoading) {
    return (
      <View style={styles.centeredContainer}>
        <LoadingSpinner message="Memuat laporan tutor..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={(
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      )}
    >
      <Text style={styles.pageTitle}>Laporan Tutor</Text>

      {metadata?.last_refreshed_at ? (
        <Text style={styles.lastUpdatedText}>
          Terakhir diperbarui: {metadata.last_refreshed_at}
        </Text>
      ) : null}

      {error ? (
        <ErrorMessage
          message={error?.message || 'Gagal memuat laporan tutor.'}
          onRetry={refetch}
          retryText="Coba Lagi"
        />
      ) : null}

      {loading && !refreshing ? (
        <LoadingSpinner message="Memperbarui data tutor..." style={styles.inlineLoader} />
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan</Text>
        {summary ? (
          <View style={styles.summaryCard}>
            {summary?.dateRange?.label ? (
              <Text style={styles.summaryDateLabel}>{summary.dateRange.label}</Text>
            ) : null}
            {(summary?.dateRange?.start || summary?.dateRange?.end) ? (
              <Text style={styles.summaryDateRange}>
                {[summary?.dateRange?.start, summary?.dateRange?.end]
                  .filter(Boolean)
                  .join(' – ')}
              </Text>
            ) : null}

            <View style={styles.summaryGrid}>
              {summaryItems.map((item) => (
                <View key={item.key} style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>{item.label}</Text>
                  <Text style={styles.summaryItemValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <EmptyState
            title="Ringkasan tidak tersedia"
            description="Kami belum menerima data ringkasan untuk periode ini."
            style={styles.emptyState}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detail Tutor</Text>

        {hasData ? (
          tutors.map((tutor, index) => (
            <View key={tutor.id || tutor.code || `tutor-${index}`} style={styles.tutorCard}>
              <View style={styles.tutorHeader}>
                <Text style={styles.tutorName}>{tutor.name || 'Tutor'}</Text>
                <Text style={styles.tutorAttendance}>
                  {formatPercentage(tutor.attendanceRate, tutor.attendanceRateLabel)}
                </Text>
              </View>

              {tutor.shelterName ? (
                <Text style={styles.tutorShelter}>{tutor.shelterName}</Text>
              ) : null}

              <View style={styles.tutorMetricsRow}>
                <View style={styles.tutorMetric}>
                  <Text style={styles.metricLabel}>Aktivitas</Text>
                  <Text style={styles.metricValue}>{formatCount(tutor.totalActivities)}</Text>
                </View>
                <View style={styles.tutorMetric}>
                  <Text style={styles.metricLabel}>Hadir</Text>
                  <Text style={styles.metricValue}>{formatCount(tutor.presentCount)}</Text>
                </View>
                <View style={styles.tutorMetric}>
                  <Text style={styles.metricLabel}>Tidak Hadir</Text>
                  <Text style={styles.metricValue}>{formatCount(tutor.absentCount)}</Text>
                </View>
                <View style={styles.tutorMetric}>
                  <Text style={styles.metricLabel}>Terlambat</Text>
                  <Text style={styles.metricValue}>{formatCount(tutor.lateCount)}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title="Belum ada data tutor"
            description="Silakan ubah rentang tanggal atau jenis kegiatan untuk melihat laporan tutor."
            style={styles.emptyState}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    padding: 24,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  summaryDateRange: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#f0f3f8',
    borderRadius: 10,
    padding: 12,
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  tutorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tutorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    flex: 1,
    marginRight: 12,
  },
  tutorAttendance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
  },
  tutorShelter: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  tutorMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  tutorMetric: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: '#f7f8fb',
    borderRadius: 8,
    padding: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
  },
  emptyState: {
    marginTop: 8,
  },
  inlineLoader: {
    marginBottom: 16,
  },
});

export default AdminCabangTutorReportScreen;
