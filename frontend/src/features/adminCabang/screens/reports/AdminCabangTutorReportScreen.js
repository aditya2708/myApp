import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import TutorAttendanceList from '../../components/reports/tutor/TutorAttendanceList';
import TutorAttendanceEmptyState from '../../components/reports/tutor/TutorAttendanceEmptyState';
import TutorAttendanceSummary from '../../components/reports/tutor/TutorAttendanceSummary';
import TutorAttendanceFilters, {
  mapTutorFilterOptions,
} from '../../components/reports/tutor/TutorAttendanceFilters';
import { useTutorAttendanceReport } from '../../hooks/reports/useTutorAttendanceReport';
import {
  normalizeTutorRecord,
  summarizeTutors,
} from '../../utils/tutorReportHelpers';

const createLastSevenDaysRange = () => {
  const today = new Date();
  const end = today.toISOString().split('T')[0];
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6);
  const start = startDate.toISOString().split('T')[0];

  return {
    start_date: start,
    end_date: end,
  };
};

const sanitizeDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return trimmed;
    }
    return parsed.toISOString().split('T')[0];
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }

  return null;
};

const sanitizeOptionValue = (value) => {
  if (value === undefined || value === null) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.toLowerCase() === 'all') return null;
    return trimmed;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    const candidate =
      value.value ??
      value.id ??
      value.code ??
      value.slug ??
      value.uuid ??
      value.key ??
      value.identifier ??
      null;

    if (candidate !== null && candidate !== undefined) {
      return sanitizeOptionValue(candidate);
    }
  }

  return null;
};

const getSourceValue = (source, key) => {
  if (!source || typeof source !== 'object') return undefined;

  if (key.includes('.')) {
    const [parent, child] = key.split('.');
    return source?.[parent]?.[child];
  }

  return source?.[key];
};

const normalizeTutorFilters = (sources = [], defaults = {}) => {
  const normalizedSources = Array.isArray(sources)
    ? sources.filter(Boolean)
    : [sources].filter(Boolean);

  const resolveDate = (keys, fallback) => {
    for (const source of normalizedSources) {
      for (const key of keys) {
        const value = getSourceValue(source, key);
        const normalized = sanitizeDateValue(value);
        if (normalized) {
          return normalized;
        }
      }
    }

    return sanitizeDateValue(fallback) ?? null;
  };

  const resolveOption = (keys) => {
    for (const source of normalizedSources) {
      for (const key of keys) {
        const value = getSourceValue(source, key);
        const normalized = sanitizeOptionValue(value);
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  };

  const defaultStart = defaults.start_date ?? defaults.startDate;
  const defaultEnd = defaults.end_date ?? defaults.endDate;

  return {
    start_date: resolveDate(
      ['start_date', 'startDate', 'date_range.start', 'dateRange.start', 'period.start'],
      defaultStart,
    ),
    end_date: resolveDate(
      ['end_date', 'endDate', 'date_range.end', 'dateRange.end', 'period.end'],
      defaultEnd,
    ),
    jenis_kegiatan: resolveOption([
      'jenis_kegiatan',
      'jenisKegiatan',
      'activity_type',
      'activityType',
      'type',
    ]),
    wilbin_id: resolveOption([
      'wilbin_id',
      'wilbinId',
      'wilayah_binaan',
      'wilayahBinaan',
      'wilbin',
      'wilayahBinaanId',
    ]),
    shelter_id: resolveOption(['shelter_id', 'shelterId', 'shelter']),
  };
};

const formatDateLabel = (value) => {
  const sanitized = sanitizeDateValue(value);
  if (!sanitized) return null;

  const date = new Date(sanitized);
  if (Number.isNaN(date.getTime())) {
    return sanitized;
  }

  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch (err) {
    return sanitized;
  }
};

const findOptionLabel = (value, options = []) => {
  if (!value) return null;
  const normalizedValue = String(value);
  const match = options.find((option) => String(option.value) === normalizedValue);
  return match?.label ?? null;
};

const createFilterSummaryText = (filters = {}, availableOptions = {}) => {
  const parts = [];

  const startLabel = formatDateLabel(filters.start_date);
  const endLabel = formatDateLabel(filters.end_date);

  if (startLabel && endLabel) {
    parts.push(`Periode ${startLabel} - ${endLabel}`);
  } else if (startLabel) {
    parts.push(`Mulai ${startLabel}`);
  } else if (endLabel) {
    parts.push(`Sampai ${endLabel}`);
  }

  const activityLabel = findOptionLabel(filters.jenis_kegiatan, availableOptions.activities);
  if (activityLabel) {
    parts.push(`Jenis kegiatan ${activityLabel}`);
  }

  const wilbinLabel = findOptionLabel(filters.wilbin_id, availableOptions.wilbins);
  if (wilbinLabel) {
    parts.push(`Wilayah binaan ${wilbinLabel}`);
  }

  const shelterLabel = findOptionLabel(filters.shelter_id, availableOptions.shelters);
  if (shelterLabel) {
    parts.push(`Shelter ${shelterLabel}`);
  }

  if (!parts.length) {
    return 'Menampilkan seluruh data kehadiran tutor cabang.';
  }

  return `Filter aktif: ${parts.join(' · ')}`;
};

const hasActiveTutorFilters = (filters = {}, defaults = {}) => {
  if (!filters) return false;

  if (filters.jenis_kegiatan || filters.wilbin_id || filters.shelter_id) {
    return true;
  }

  const defaultStart = defaults.start_date ?? defaults.startDate ?? null;
  const defaultEnd = defaults.end_date ?? defaults.endDate ?? null;

  if (filters.start_date && filters.start_date !== defaultStart) {
    return true;
  }

  if (filters.end_date && filters.end_date !== defaultEnd) {
    return true;
  }

  return false;
};

const AdminCabangTutorReportScreen = () => {
  const navigation = useNavigation();

  const defaultDateRange = useMemo(() => createLastSevenDaysRange(), []);

  const {
    tutors: rawTutors,
    summary,
    meta,
    params,
    loading,
    refreshing,
    error,
    refresh,
    refetch,
    updateFilters,
    resetFilters,
  } = useTutorAttendanceReport(defaultDateRange);

  const [isFilterVisible, setFilterVisible] = useState(false);

  const availableFilters = useMemo(
    () => meta?.available_filters ?? meta?.availableFilters ?? {},
    [meta],
  );

  const normalizedFilters = useMemo(
    () => normalizeTutorFilters([meta?.filters, params], defaultDateRange),
    [meta, params, defaultDateRange],
  );

  const filterOptions = useMemo(
    () => mapTutorFilterOptions(availableFilters),
    [availableFilters],
  );

  const filterSummaryText = useMemo(
    () => createFilterSummaryText(normalizedFilters, filterOptions),
    [normalizedFilters, filterOptions],
  );

  const filtersActive = useMemo(
    () => hasActiveTutorFilters(normalizedFilters, defaultDateRange),
    [normalizedFilters, defaultDateRange],
  );

  const handleOpenFilters = useCallback(() => setFilterVisible(true), []);
  const handleCloseFilters = useCallback(() => setFilterVisible(false), []);

  const handleApplyFilters = useCallback(
    (nextFilters = {}) => {
      updateFilters(nextFilters);
      setFilterVisible(false);
    },
    [updateFilters],
  );

  const handleClearFilters = useCallback(() => {
    resetFilters();
    setFilterVisible(false);
  }, [resetFilters]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={[
            styles.headerFilterButton,
            filtersActive && styles.headerFilterButtonActive,
          ]}
          onPress={handleOpenFilters}
        >
          <Ionicons
            name="filter"
            size={18}
            color={filtersActive ? '#ffffff' : '#2563eb'}
          />
          <Text
            style={[
              styles.headerFilterButtonText,
              filtersActive && styles.headerFilterButtonTextActive,
            ]}
          >
            Filter
          </Text>
          {filtersActive ? <View style={styles.headerFilterBadge} /> : null}
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleOpenFilters, filtersActive]);

  const normalizedTutors = useMemo(
    () => (
      Array.isArray(rawTutors)
        ? rawTutors
            .map(normalizeTutorRecord)
            .sort(
              (a, b) => (b?.present_count ?? 0) - (a?.present_count ?? 0),
            )
        : []
    ),
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

        <Text style={styles.filterStatusText}>{filterSummaryText}</Text>

        <TouchableOpacity
          style={[
            styles.inlineFilterButton,
            filtersActive && styles.inlineFilterButtonActive,
          ]}
          onPress={handleOpenFilters}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={filtersActive ? '#ffffff' : '#2563eb'}
          />
          <Text
            style={[
              styles.inlineFilterButtonText,
              filtersActive && styles.inlineFilterButtonTextActive,
            ]}
          >
            Kelola Filter
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [
    attendanceSummary,
    meta,
    filterSummaryText,
    filtersActive,
    handleOpenFilters,
  ]);

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
      <TutorAttendanceFilters
        visible={isFilterVisible}
        filters={normalizedFilters}
        availableFilters={availableFilters}
        defaultFilters={defaultDateRange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={handleCloseFilters}
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
  headerFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
    gap: 6,
  },
  headerFilterButtonActive: {
    backgroundColor: '#2563eb',
  },
  headerFilterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  headerFilterButtonTextActive: {
    color: '#ffffff',
  },
  headerFilterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  inlineFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fbff',
    gap: 8,
  },
  inlineFilterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  inlineFilterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  inlineFilterButtonTextActive: {
    color: '#ffffff',
  },
});

export default AdminCabangTutorReportScreen;
