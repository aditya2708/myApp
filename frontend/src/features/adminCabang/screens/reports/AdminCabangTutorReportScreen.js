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
import TutorAttendanceList from '../../../adminShelter/components/TutorAttendanceList';
import TutorAttendanceFilters from '../../../adminShelter/components/TutorAttendanceFilters';
import TutorAttendanceEmptyState from '../../../adminShelter/components/TutorAttendanceEmptyState';
import TutorAttendanceSummary from '../../../adminShelter/components/TutorAttendanceSummary';
import { useTutorAttendanceReport } from '../../hooks/reports/useTutorAttendanceReport';

const DEFAULT_FILTERS = {
  date_from: null,
  date_to: null,
  jenis_kegiatan: 'all',
  shelter_id: 'all',
};

const CATEGORY_LABELS = {
  high: 'Baik',
  medium: 'Sedang',
  low: 'Rendah',
  no_data: 'Tidak Ada Data',
};

const deriveCategoryFromRate = (rate) => {
  if (typeof rate !== 'number' || Number.isNaN(rate)) {
    return 'no_data';
  }

  if (rate >= 80) {
    return 'high';
  }

  if (rate >= 60) {
    return 'medium';
  }

  if (rate >= 0) {
    return 'low';
  }

  return 'no_data';
};

const deriveCategoryLabel = (category) => CATEGORY_LABELS[category] || CATEGORY_LABELS.no_data;

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toIntegerOrZero = (value) => {
  const numeric = toNumberOrNull(value);
  return numeric === null ? 0 : Math.round(numeric);
};

const formatInteger = (value) => {
  const numeric = toNumberOrNull(value);
  if (numeric === null) {
    return '-';
  }

  return Math.round(numeric).toLocaleString('id-ID');
};

const ensureArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const normalizeOptionCollection = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'object') {
    const nestedKeys = ['options', 'data', 'items', 'list', 'records', 'values', 'results'];
    for (const key of nestedKeys) {
      if (value[key] !== undefined) {
        const result = normalizeOptionCollection(value[key]);
        if (result.length > 0) {
          return result;
        }
      }
    }

    return Object.entries(value).map(([key, label]) => ({ key, label }));
  }

  return [value];
};

const toOption = (item) => {
  if (item === null || item === undefined) {
    return null;
  }

  if (Array.isArray(item)) {
    const [key, label] = item;
    if (key === undefined || key === null || key === '') {
      return null;
    }
    return {
      key,
      label: label ?? String(key),
    };
  }

  if (typeof item === 'string' || typeof item === 'number') {
    return { key: item, label: String(item) };
  }

  if (typeof item === 'object') {
    const key = item.key ?? item.value ?? item.id ?? item.code ?? item.slug ?? item.uuid ?? item.identifier ?? item.shelter_id ?? item.shelterId ?? item.kd_shelter ?? item.kdShelter;
    const label = item.label ?? item.name ?? item.title ?? item.text ?? item.nama ?? item.shelterName ?? item.shelter_name ?? item.description ?? (typeof item.value === 'string' || typeof item.value === 'number' ? String(item.value) : undefined);

    if (key === undefined || key === null || key === '') {
      return null;
    }

    return {
      key,
      label: label ?? String(key),
    };
  }

  return null;
};

const dedupeOptions = (options = []) => {
  const seen = new Map();
  options.forEach((option) => {
    const normalized = toOption(option);
    if (!normalized) {
      return;
    }

    const key = String(normalized.key);
    if (!seen.has(key)) {
      seen.set(key, normalized);
    }
  });

  return Array.from(seen.values());
};

const ensureAllOption = (options = [], label = 'Semua') => {
  const normalized = dedupeOptions(options);
  const hasAll = normalized.some((option) => String(option.key).toLowerCase() === 'all');
  if (hasAll) {
    return normalized;
  }

  return [{ key: 'all', label }, ...normalized];
};

const extractOptionCandidates = (metadata, keys) => {
  if (!metadata) {
    return [];
  }

  const sources = ensureArray(metadata.available_filters)
    .concat(ensureArray(metadata.availableFilters))
    .concat(ensureArray(metadata.filters))
    .concat(metadata);

  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    if (Array.isArray(source)) {
      const flattened = source.flatMap((item) => {
        if (!item || typeof item !== 'object') {
          return item;
        }

        const descriptorKeys = [item.field, item.name, item.key, item.type, item.id];
        const matchesDescriptor = descriptorKeys.some((descriptor) => (
          descriptor && keys.includes(descriptor)
        ));

        if (matchesDescriptor) {
          const nested = normalizeOptionCollection(item.options ?? item.values ?? item.items ?? item.data);
          if (nested.length > 0) {
            return nested;
          }
        }

        return item;
      });

      const normalizedArray = normalizeOptionCollection(flattened);
      if (normalizedArray.length > 0) {
        return normalizedArray;
      }

      continue;
    }

    for (const key of keys) {
      if (source[key] !== undefined) {
        const result = normalizeOptionCollection(source[key]);
        if (result.length > 0) {
          return result;
        }
      }

      const camelKey = Array.isArray(key)
        ? key
        : [
          key,
          key.replace(/_[a-z]/g, (match) => match[1].toUpperCase()),
        ];

      for (const candidateKey of camelKey) {
        if (source[candidateKey] !== undefined) {
          const result = normalizeOptionCollection(source[candidateKey]);
          if (result.length > 0) {
            return result;
          }
        }
      }
    }
  }

  return [];
};

const normalizeActivityTypes = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const buildJenisOptions = (metadata, tutors = []) => {
  const metadataOptions = dedupeOptions(
    extractOptionCandidates(metadata, ['jenis_kegiatan', 'jenisKegiatan', 'activity_types', 'activityTypes'])
  );

  if (metadataOptions.length > 0) {
    return ensureAllOption(metadataOptions, 'Semua Jenis');
  }

  const types = new Set();
  tutors.forEach((tutor) => {
    const sources = [
      tutor.activity_types,
      tutor.activityTypes,
      tutor.raw?.activity_types,
      tutor.raw?.jenis_kegiatan,
      tutor.raw?.jenisKegiatan,
      tutor.raw?.activityTypes,
    ];

    sources.forEach((source) => {
      normalizeActivityTypes(source).forEach((item) => types.add(item));
    });
  });

  const derived = Array.from(types).map((item) => ({ key: item, label: item }));
  return ensureAllOption(derived, 'Semua Jenis');
};

const buildShelterOptions = (metadata, tutors = []) => {
  const metadataOptions = dedupeOptions(
    extractOptionCandidates(metadata, ['shelter', 'shelters', 'shelter_id', 'shelterId', 'locations', 'location', 'branches'])
  );

  if (metadataOptions.length > 0) {
    return ensureAllOption(metadataOptions, 'Semua Shelter');
  }

  const shelterMap = new Map();
  tutors.forEach((tutor) => {
    const raw = tutor.raw || {};
    const possibleId = raw.shelter_id ?? raw.shelterId ?? raw.id_shelter ?? tutor.shelter_id ?? tutor.shelterId ?? raw.shelter?.id;
    const label = tutor.shelterName
      ?? raw.shelter_name
      ?? raw.shelterName
      ?? raw.shelter?.name
      ?? raw.location
      ?? raw.branch
      ?? null;

    if (possibleId !== undefined && possibleId !== null && possibleId !== '') {
      const key = String(possibleId);
      if (!shelterMap.has(key)) {
        shelterMap.set(key, { key: possibleId, label: label ?? `Shelter ${key}` });
      }
      return;
    }

    if (label) {
      const key = String(label);
      if (!shelterMap.has(key)) {
        shelterMap.set(key, { key: label, label });
      }
    }
  });

  const derived = Array.from(shelterMap.values());
  return ensureAllOption(derived, 'Semua Shelter');
};

const sanitizeFilters = (filters = {}) => ({
  date_from: filters.date_from ?? filters.start_date ?? filters.startDate ?? null,
  date_to: filters.date_to ?? filters.end_date ?? filters.endDate ?? null,
  jenis_kegiatan: filters.jenis_kegiatan ?? filters.jenisKegiatan ?? filters.activity_type ?? filters.activityType ?? 'all',
  shelter_id: filters.shelter_id ?? filters.shelterId ?? filters.shelter ?? 'all',
});

const mergeFilters = (base, overrides) => {
  const sanitizedBase = sanitizeFilters(base);
  const sanitizedOverrides = sanitizeFilters(overrides);

  return {
    date_from: sanitizedOverrides.date_from ?? sanitizedBase.date_from ?? DEFAULT_FILTERS.date_from,
    date_to: sanitizedOverrides.date_to ?? sanitizedBase.date_to ?? DEFAULT_FILTERS.date_to,
    jenis_kegiatan: sanitizedOverrides.jenis_kegiatan ?? sanitizedBase.jenis_kegiatan ?? DEFAULT_FILTERS.jenis_kegiatan,
    shelter_id: sanitizedOverrides.shelter_id ?? sanitizedBase.shelter_id ?? DEFAULT_FILTERS.shelter_id,
  };
};

const composeApiParamsFromFilters = (filters = {}) => {
  return {
    start_date: filters.date_from || null,
    end_date: filters.date_to || null,
    jenis_kegiatan: filters.jenis_kegiatan && filters.jenis_kegiatan !== 'all'
      ? filters.jenis_kegiatan
      : null,
    shelter_id: filters.shelter_id && filters.shelter_id !== 'all'
      ? filters.shelter_id
      : null,
  };
};

const normalizeTutorRecord = (tutor = {}, index = 0) => {
  const attendanceRate = toNumberOrNull(
    tutor.attendanceRate
      ?? tutor.attendance_rate
      ?? tutor.attendanceRateValue
      ?? tutor.raw?.attendance_rate
      ?? tutor.raw?.attendanceRate
  );

  const present = toIntegerOrZero(
    tutor.presentCount
      ?? tutor.present_count
      ?? tutor.raw?.present_count
      ?? tutor.raw?.present
  );

  const late = toIntegerOrZero(
    tutor.lateCount
      ?? tutor.late_count
      ?? tutor.raw?.late_count
      ?? tutor.raw?.late
  );

  const absent = toIntegerOrZero(
    tutor.absentCount
      ?? tutor.absent_count
      ?? tutor.raw?.absent_count
      ?? tutor.raw?.absent
  );

  const totalActivities = toNumberOrNull(
    tutor.totalActivities
      ?? tutor.total_activities
      ?? tutor.raw?.total_activities
      ?? tutor.raw?.totalActivities
  ) ?? present + late + absent;

  const id = tutor.id
    ?? tutor.id_tutor
    ?? tutor.user_id
    ?? tutor.code
    ?? tutor.tutorId
    ?? tutor.raw?.id
    ?? tutor.raw?.tutor_id
    ?? tutor.raw?.user_id
    ?? `tutor-${index}`;

  const name = tutor.name
    ?? tutor.nama
    ?? tutor.raw?.name
    ?? tutor.raw?.nama
    ?? 'Tutor';

  const shelterName = tutor.shelterName
    ?? tutor.shelter_name
    ?? tutor.raw?.shelter_name
    ?? tutor.raw?.shelterName
    ?? tutor.raw?.shelter?.name
    ?? tutor.raw?.location
    ?? tutor.raw?.branch
    ?? null;

  const category = tutor.category
    ?? tutor.raw?.category
    ?? deriveCategoryFromRate(attendanceRate);

  const categoryLabel = tutor.category_label
    ?? tutor.categoryLabel
    ?? tutor.raw?.category_label
    ?? deriveCategoryLabel(category);

  return {
    ...tutor,
    id_tutor: id,
    nama: name,
    maple: shelterName,
    attendance_rate: attendanceRate,
    category,
    category_label: categoryLabel,
    total_activities: totalActivities,
    present_count: present,
    late_count: late,
    absent_count: absent,
  };
};

const summarizeTutors = (tutors = []) => {
  if (!Array.isArray(tutors) || tutors.length === 0) {
    return {
      total_tutors: 0,
      average_attendance_rate: 0,
      distribution: {
        high: { count: 0, percentage: 0 },
        medium: { count: 0, percentage: 0 },
        low: { count: 0, percentage: 0 },
        no_data: { count: 0, percentage: 0 },
      },
    };
  }

  const totalTutors = tutors.length;
  const totalRate = tutors.reduce((acc, tutor) => (
    typeof tutor.attendance_rate === 'number' ? acc + tutor.attendance_rate : acc
  ), 0);

  const averageRate = totalTutors > 0
    ? Number((totalRate / totalTutors).toFixed(2))
    : 0;

  const distributionCounts = tutors.reduce((acc, tutor) => {
    const category = tutor.category || deriveCategoryFromRate(tutor.attendance_rate);
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += 1;
    return acc;
  }, { high: 0, medium: 0, low: 0, no_data: 0 });

  const distribution = Object.entries(distributionCounts).reduce((acc, [key, count]) => {
    const percentage = totalTutors > 0 ? Math.round((count / totalTutors) * 100) : 0;
    acc[key] = { count, percentage };
    return acc;
  }, {});

  return {
    total_tutors: totalTutors,
    average_attendance_rate: averageRate,
    distribution: {
      high: distribution.high || { count: 0, percentage: 0 },
      medium: distribution.medium || { count: 0, percentage: 0 },
      low: distribution.low || { count: 0, percentage: 0 },
      no_data: distribution.no_data || { count: 0, percentage: 0 },
    },
  };
};

const buildSummaryHighlights = (summary) => {
  if (!summary) {
    return [];
  }

  return [
    { key: 'activities', label: 'Total Aktivitas', value: summary.totalActivities ?? summary.total_activities },
    { key: 'present', label: 'Hadir', value: summary.presentCount ?? summary.present_count },
    { key: 'late', label: 'Terlambat', value: summary.lateCount ?? summary.late_count },
    { key: 'absent', label: 'Tidak Hadir', value: summary.absentCount ?? summary.absent_count },
  ].filter((item) => item.value !== undefined && item.value !== null);
};

const AdminCabangTutorReportScreen = () => {
  const navigation = useNavigation();

  const {
    tutors: rawTutors,
    summary,
    metadata,
    loading,
    refreshing,
    error,
    refresh,
    refetch,
    updateFilters,
    resetFilters,
    params,
  } = useTutorAttendanceReport();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const jenisOptions = useMemo(
    () => buildJenisOptions(metadata, rawTutors),
    [metadata, rawTutors],
  );

  const shelterOptions = useMemo(
    () => buildShelterOptions(metadata, rawTutors),
    [metadata, rawTutors],
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
    const initialFilters = mergeFilters(metadata?.filters, params);
    setFilters(initialFilters);
  }, [metadata, params]);

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
    const paramsPayload = composeApiParamsFromFilters(sanitized);
    updateFilters(paramsPayload);
  }, [updateFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters(mergeFilters(DEFAULT_FILTERS, metadata?.filters));
    setShowFilters(false);
    resetFilters();
  }, [metadata?.filters, resetFilters]);

  const renderListHeader = useCallback(() => (
    <View style={styles.listHeader}>
      {metadata?.last_refreshed_at ? (
        <Text style={styles.lastUpdatedText}>
          Terakhir diperbarui: {metadata.last_refreshed_at}
        </Text>
      ) : null}

      {summaryHighlights.length > 0 ? (
        <View style={styles.highlightsContainer}>
          {summaryHighlights.map((item) => (
            <View key={item.key} style={styles.highlightCard}>
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
  ), [attendanceSummary, metadata?.last_refreshed_at, summaryHighlights]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

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
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  highlightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 120,
    flexGrow: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
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
});

export default AdminCabangTutorReportScreen;
