import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import ChildReportSummary from '../../components/reports/ChildReportSummary';
import ChildAttendanceTrendChart from '../../components/reports/ChildAttendanceTrendChart';
import ChildAttendanceDistributionCard from '../../components/reports/ChildAttendanceDistributionCard';
import ChildReportListItem from '../../components/reports/ChildReportListItem';
import ChildReportFilterModal from '../../components/reports/ChildReportFilterModal';
import {
  clearError,
  resetFilters,
  selectReportAnakChildren,
  selectReportAnakError,
  selectReportAnakFilterOptions,
  selectReportAnakFilters,
  selectReportAnakHasMore,
  selectReportAnakLoadingStates,
  selectReportAnakPagination,
  selectReportAnakSummary,
  setDateRange,
  setFilters,
  setJenisKegiatan,
  setSearch,
  setShelter,
  setWilayahBinaan,
} from '../../redux/reportAnakSlice';
import {
  fetchMoreReportAnak,
  fetchReportAnakList,
  fetchShelterOptionsByWilayah,
  initializeReportAnak,
} from '../../redux/reportAnakThunks';
import { formatDateToIndonesian } from '../../../../common/utils/dateFormatter';

const levelLabels = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
};

const LEVEL_DISTRIBUTION_PATHS = [
  'attendance_distribution.levels',
  'attendance_distribution.by_level',
  'attendance_distribution.level',
  'attendanceDistribution.levels',
  'attendanceDistribution.byLevel',
  'attendance_levels',
  'attendanceLevels',
  'distribution.levels',
  'distribution.attendance_levels',
  'level_distribution',
  'levels_distribution',
];

const WILAYAH_DISTRIBUTION_PATHS = [
  'attendance_distribution.wilayah',
  'attendance_distribution.by_wilayah',
  'attendance_distribution.regions',
  'attendance_distribution.by_region',
  'attendanceDistribution.wilayah',
  'attendanceDistribution.regions',
  'distribution.wilayah',
  'distribution.regions',
  'wilayah_distribution',
  'region_distribution',
  'wilayah',
  'regions',
];

const SHELTER_DISTRIBUTION_PATHS = [
  'attendance_distribution.shelters',
  'attendance_distribution.by_shelter',
  'attendanceDistribution.shelters',
  'distribution.shelters',
  'shelter_distribution',
  'shelters',
];

const getNestedValue = (object, path) => {
  if (!object || !path) {
    return undefined;
  }

  return path.split('.').reduce((accumulator, segment) => {
    if (accumulator === null || accumulator === undefined) {
      return undefined;
    }

    return accumulator[segment];
  }, object);
};

const parseNumeric = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/%/g, '').replace(/[^0-9,.-]/g, '').replace(',', '.');
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = parseNumeric(item);
      if (parsed !== null) {
        return parsed;
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    const candidate =
      value.value ??
      value.count ??
      value.total ??
      value.jumlah ??
      value.quantity ??
      value.children ??
      value.total_children ??
      value.totalChildren ??
      value.amount ??
      value.percentage ??
      value.percent ??
      null;

    return candidate !== null ? parseNumeric(candidate) : null;
  }

  return null;
};

const parsePercentageValue = (value) => {
  const numeric = parseNumeric(value);

  if (numeric === null) {
    return null;
  }

  if (numeric <= 1 && numeric >= 0) {
    return Math.max(0, Math.min(100, numeric * 100));
  }

  return Math.max(0, Math.min(100, numeric));
};

const mapLevelKey = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.toString().toLowerCase();

  if (normalized.includes('tinggi') || normalized.includes('high') || normalized.includes('baik')) {
    return 'high';
  }

  if (normalized.includes('sedang') || normalized.includes('medium') || normalized.includes('cukup')) {
    return 'medium';
  }

  if (normalized.includes('rendah') || normalized.includes('low') || normalized.includes('kurang')) {
    return 'low';
  }

  return null;
};

const humanizeLabel = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'object') {
    const nested =
      value.name ??
      value.nama ??
      value.label ??
      value.title ??
      value.display ??
      value.description ??
      value.value ??
      null;

    return nested ? humanizeLabel(nested) : null;
  }

  const stringValue = value.toString().trim();
  if (!stringValue) {
    return null;
  }

  return stringValue
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[a-z]|\s[a-z]/g, (match) => match.toUpperCase());
};

const determineAttendanceLevel = (percentage) => {
  if (percentage === null || percentage === undefined) {
    return null;
  }

  if (percentage > 80) {
    return 'high';
  }

  if (percentage >= 50) {
    return 'medium';
  }

  return 'low';
};

const resolveChildAttendancePercentage = (child) => {
  if (!child) {
    return null;
  }

  const percentageCandidate = parsePercentageValue(
    child.attendance_percentage ??
      child.overall_percentage ??
      child.percentage ??
      child.attendancePercent ??
      child.attendance_rate ??
      child.attendanceRate ??
      child.attendance?.percentage ??
      child.attendance?.percent ??
      child.attendance?.rate ??
      child.kehadiran ??
      child.present_percentage,
  );

  if (percentageCandidate !== null) {
    return percentageCandidate;
  }

  const totalAttended = parseNumeric(
    child.total_attended ??
      child.attended_count ??
      child.totalAktivitasHadir ??
      child.attendance?.attended ??
      child.jumlah_hadir ??
      child.totalHadir ??
      child.hadir,
  );

  const totalOpportunities = parseNumeric(
    child.total_attendance_opportunities ??
      child.attendance_opportunities_total ??
      child.totalAttendanceOpportunities ??
      child.total_attendance_opportunity ??
      child.totalAttendanceOpportunity ??
      child.total_activities ??
      child.activities_count ??
      child.totalAktivitas ??
      child.totalKesempatanHadir,
  );

  if (totalAttended !== null && totalOpportunities !== null && totalOpportunities > 0) {
    return Math.max(0, Math.min(100, (totalAttended / totalOpportunities) * 100));
  }

  return null;
};

const pickDisplayLabel = (...candidates) => {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) {
      continue;
    }

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    } else if (typeof candidate === 'object') {
      const nested =
        candidate.name ??
        candidate.nama ??
        candidate.label ??
        candidate.title ??
        candidate.display ??
        candidate.description ??
        candidate.wilayah ??
        candidate.wilbin ??
        candidate.shelter ??
        candidate.text ??
        candidate.value ??
        null;

      if (typeof nested === 'string') {
        const trimmed = nested.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }
  }

  return null;
};

const normalizeDistributionEntriesFromSummary = (summary, paths, type) => {
  if (!summary) {
    return [];
  }

  for (const path of paths) {
    const raw = getNestedValue(summary, path);
    if (!raw) {
      continue;
    }

    const dataset = [];

    const appendEntry = (rawKey, rawValue, index) => {
      if (rawValue === null || rawValue === undefined) {
        return;
      }

      let value = parseNumeric(rawValue);
      if (value === null) {
        value =
          parseNumeric(rawValue?.value) ??
          parseNumeric(rawValue?.count) ??
          parseNumeric(rawValue?.jumlah) ??
          parseNumeric(rawValue?.total) ??
          parseNumeric(rawValue?.children) ??
          parseNumeric(rawValue?.total_children);
      }

      if (value === null) {
        return;
      }

      const levelKeyCandidate =
        type === 'level'
          ? mapLevelKey(rawValue?.key) ||
            mapLevelKey(rawValue?.level) ||
            mapLevelKey(rawValue?.label) ||
            mapLevelKey(rawKey) ||
            mapLevelKey(rawValue?.name)
          : null;

      const normalizedKey =
        type === 'level' && levelKeyCandidate
          ? levelKeyCandidate
          : rawValue?.key ?? rawValue?.id ?? rawValue?.slug ?? rawValue?.code ?? rawKey ?? `item-${index}`;

      const labelCandidate =
        type === 'level' && levelKeyCandidate
          ? levelLabels[levelKeyCandidate]
          : humanizeLabel(
              rawValue?.label ??
                rawValue?.name ??
                rawValue?.title ??
                rawValue?.display ??
                rawValue?.wilayah ??
                rawValue?.shelter ??
                rawValue?.category ??
                rawValue?.kategori ??
                rawKey,
            ) ?? humanizeLabel(normalizedKey);

      let percentage = parsePercentageValue(
        rawValue?.percentage ??
          rawValue?.percent ??
          rawValue?.ratio ??
          rawValue?.proporsi ??
          rawValue?.persentase ??
          rawValue?.share ??
          rawValue?.proportion,
      );

      dataset.push({
        key: String(normalizedKey),
        label: labelCandidate || (type === 'level' && levelKeyCandidate ? levelLabels[levelKeyCandidate] : 'Item'),
        value,
        percentage,
        normalizedKey: String(normalizedKey),
        color: rawValue?.color,
      });
    };

    if (Array.isArray(raw)) {
      raw.forEach((item, index) => {
        const key = item?.key ?? item?.id ?? item?.slug ?? item?.code ?? index;
        appendEntry(key, item, index);
      });
    } else if (typeof raw === 'object') {
      Object.entries(raw).forEach(([key, value], index) => {
        appendEntry(key, value, index);
      });
    }

    const total = dataset.reduce((sum, item) => sum + (item.value || 0), 0);
    if (total > 0) {
      dataset.forEach((item) => {
        if (item.percentage === null || item.percentage === undefined) {
          item.percentage = (item.value / total) * 100;
        }
      });
    }

    if (dataset.length > 0) {
      dataset.sort((a, b) => (b.value || 0) - (a.value || 0));
      return dataset;
    }
  }

  return [];
};

const computeDistributionFromChildren = (childrenList = []) => {
  if (!Array.isArray(childrenList) || childrenList.length === 0) {
    return {
      level: [],
      wilayah: [],
      shelter: [],
    };
  }

  const levelCounts = { high: 0, medium: 0, low: 0 };
  let totalWithLevel = 0;

  const wilayahMap = new Map();
  const shelterMap = new Map();

  childrenList.forEach((child) => {
    if (!child) {
      return;
    }

    const percentage = resolveChildAttendancePercentage(child);
    if (percentage !== null) {
      const levelKey = determineAttendanceLevel(percentage);
      if (levelKey) {
        levelCounts[levelKey] += 1;
        totalWithLevel += 1;
      }
    }

    const wilayahLabel = pickDisplayLabel(
      child.wilayah_name,
      child.wilbin_name,
      child.nama_wilayah,
      child.wilayah?.name,
      child.wilayah?.nama,
      child.wilayah?.label,
      child.wilbin,
      child.region_name,
    );
    if (wilayahLabel) {
      const key = wilayahLabel.toLowerCase();
      const current = wilayahMap.get(key);
      if (current) {
        current.value += 1;
      } else {
        wilayahMap.set(key, {
          key,
          normalizedKey: key,
          label: wilayahLabel,
          value: 1,
        });
      }
    }

    const shelterLabel = pickDisplayLabel(
      child.shelter_name,
      child.shelter?.name,
      child.shelter?.nama,
      child.nama_shelter,
      child.shelter,
      child.home_name,
    );
    if (shelterLabel) {
      const key = shelterLabel.toLowerCase();
      const current = shelterMap.get(key);
      if (current) {
        current.value += 1;
      } else {
        shelterMap.set(key, {
          key,
          normalizedKey: key,
          label: shelterLabel,
          value: 1,
        });
      }
    }
  });

  const levelDataset =
    totalWithLevel > 0
      ? ['high', 'medium', 'low']
          .map((levelKey) => ({
            key: levelKey,
            normalizedKey: levelKey,
            label: levelLabels[levelKey],
            value: levelCounts[levelKey],
            percentage: (levelCounts[levelKey] / totalWithLevel) * 100,
          }))
          .filter((item) => item.value > 0)
      : [];

  const wilayahDataset = Array.from(wilayahMap.values()).sort((a, b) => b.value - a.value);
  const wilayahTotal = wilayahDataset.reduce((sum, item) => sum + item.value, 0);
  wilayahDataset.forEach((item) => {
    item.percentage = wilayahTotal > 0 ? (item.value / wilayahTotal) * 100 : null;
  });

  const shelterDataset = Array.from(shelterMap.values()).sort((a, b) => b.value - a.value);
  const shelterTotal = shelterDataset.reduce((sum, item) => sum + item.value, 0);
  shelterDataset.forEach((item) => {
    item.percentage = shelterTotal > 0 ? (item.value / shelterTotal) * 100 : null;
  });

  return {
    level: levelDataset,
    wilayah: wilayahDataset,
    shelter: shelterDataset,
  };
};

const extractMonthlyAttendanceData = (summary) => {
  if (!summary) {
    return null;
  }

  const candidatePaths = [
    'monthly_attendance',
    'monthlyAttendance',
    'attendance_monthly',
    'attendanceMonthly',
    'monthly_data',
    'monthlyData',
    'monthlyAttendanceData',
    'attendance.monthly',
    'attendance.monthly_attendance',
    'attendance_trend.monthly',
    'attendanceTrend.monthly',
    'trend.monthly',
  ];

  for (const path of candidatePaths) {
    const value = getNestedValue(summary, path);

    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        return value;
      }
      continue;
    }

    if (typeof value === 'object') {
      if (Array.isArray(value.data) && value.data.length > 0) {
        return value.data;
      }

      if (Array.isArray(value.items) && value.items.length > 0) {
        return value.items;
      }

      if (Object.keys(value).length > 0) {
        return value;
      }
    }
  }

  return null;
};

const AdminCabangChildReportScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const children = useSelector(selectReportAnakChildren);
  const summary = useSelector(selectReportAnakSummary);
  const filters = useSelector(selectReportAnakFilters);
  const filterOptions = useSelector(selectReportAnakFilterOptions);
  const { loading, loadingMore, initializing } = useSelector(selectReportAnakLoadingStates);
  const hasMore = useSelector(selectReportAnakHasMore);
  const error = useSelector(selectReportAnakError);
  const pagination = useSelector(selectReportAnakPagination);

  const monthlyAttendanceData = useMemo(() => extractMonthlyAttendanceData(summary), [summary]);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    const monthlyAttendanceSummary = Array.isArray(monthlyAttendanceData)
      ? {
          type: 'array',
          length: monthlyAttendanceData.length,
          sample: monthlyAttendanceData[0] ?? null,
        }
      : monthlyAttendanceData && typeof monthlyAttendanceData === 'object'
      ? {
          type: 'object',
          keys: Object.keys(monthlyAttendanceData),
        }
      : { type: typeof monthlyAttendanceData, value: monthlyAttendanceData ?? null };

    console.log('[AdminCabangChildReportScreen] Monthly attendance debug', {
      hasSummary: Boolean(summary),
      summaryKeys: summary ? Object.keys(summary).slice(0, 10) : [],
      monthlyAttendance: monthlyAttendanceSummary,
    });
  }, [summary, monthlyAttendanceData]);

  const summaryLevelDistribution = useMemo(
    () => normalizeDistributionEntriesFromSummary(summary, LEVEL_DISTRIBUTION_PATHS, 'level'),
    [summary],
  );

  const summaryWilayahDistribution = useMemo(
    () => normalizeDistributionEntriesFromSummary(summary, WILAYAH_DISTRIBUTION_PATHS, 'wilayah'),
    [summary],
  );

  const summaryShelterDistribution = useMemo(
    () => normalizeDistributionEntriesFromSummary(summary, SHELTER_DISTRIBUTION_PATHS, 'shelter'),
    [summary],
  );

  const fallbackDistribution = useMemo(() => computeDistributionFromChildren(children), [children]);

  const attendanceDistribution = useMemo(
    () => ({
      level:
        summaryLevelDistribution.length > 0 ? summaryLevelDistribution : fallbackDistribution.level,
      wilayah:
        summaryWilayahDistribution.length > 0
          ? summaryWilayahDistribution
          : fallbackDistribution.wilayah,
      shelter:
        summaryShelterDistribution.length > 0
          ? summaryShelterDistribution
          : fallbackDistribution.shelter,
    }),
    [
      summaryLevelDistribution,
      summaryWilayahDistribution,
      summaryShelterDistribution,
      fallbackDistribution,
    ],
  );

  const [searchText, setSearchText] = useState(filters.search || '');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    dispatch(clearError());
    dispatch(initializeReportAnak());
  }, [dispatch]);

  useEffect(() => {
    setSearchText(filters.search || '');
  }, [filters.search]);

  const shelterOptions = useMemo(() => {
    if (!filters.wilayahBinaan) {
      return [];
    }

    return filterOptions.sheltersByWilayah?.[filters.wilayahBinaan] || [];
  }, [filterOptions.sheltersByWilayah, filters.wilayahBinaan]);

  const clearSearchDebounce = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, []);

  const triggerSearch = useCallback(
    (value) => {
      const trimmed = value.trim();
      dispatch(setSearch(trimmed));
      dispatch(fetchReportAnakList({ filters: { ...filters, search: trimmed }, page: 1 }));
    },
    [dispatch, filters],
  );

  const handleSearch = useCallback(() => {
    clearSearchDebounce();
    triggerSearch(searchText);
  }, [clearSearchDebounce, triggerSearch, searchText]);

  useEffect(() => {
    const trimmed = searchText.trim();

    if ((filters.search || '') === trimmed) {
      return () => {
        clearSearchDebounce();
      };
    }

    clearSearchDebounce();

    searchDebounceRef.current = setTimeout(() => {
      triggerSearch(searchText);
      searchDebounceRef.current = null;
    }, 450);

    return () => {
      clearSearchDebounce();
    };
  }, [searchText, filters.search, triggerSearch, clearSearchDebounce]);

  const handleClearSearch = () => {
    clearSearchDebounce();
    setSearchText('');
    dispatch(setSearch(''));
    dispatch(fetchReportAnakList({ filters: { ...filters, search: '' }, page: 1 }));
  };

  const handleApplyFilters = (updatedFilters) => {
    const nextFilters = { ...filters, ...updatedFilters };
    dispatch(setFilters(nextFilters));
    dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
    setSearchText('');
    dispatch(fetchReportAnakList({ filters: { search: '' }, page: 1 }));
    setFilterModalVisible(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchReportAnakList({ filters, page: 1 }));
    setRefreshing(false);
  };

  const handleRemoveDateRange = useCallback(() => {
    const nextFilters = { ...filters, start_date: null, end_date: null };
    dispatch(setDateRange({ start_date: null, end_date: null }));
    dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
  }, [dispatch, filters]);

  const handleRemoveJenis = useCallback(() => {
    const nextFilters = { ...filters, jenisKegiatan: null };
    dispatch(setJenisKegiatan(null));
    dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
  }, [dispatch, filters]);

  const handleRemoveWilayah = useCallback(() => {
    const nextFilters = { ...filters, wilayahBinaan: null, shelter: null };
    dispatch(setWilayahBinaan(null));
    dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
  }, [dispatch, filters]);

  const handleRemoveShelter = useCallback(() => {
    const nextFilters = { ...filters, shelter: null };
    dispatch(setShelter(null));
    dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
  }, [dispatch, filters]);

  const handleRemoveSearch = useCallback(() => {
    setSearchText('');
    const nextFilters = { ...filters, search: '' };
    dispatch(setSearch(''));
    dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
  }, [dispatch, filters]);

  const getOptionLabel = useCallback((options, value) => {
    if (!value || !Array.isArray(options)) {
      return null;
    }

    const stringValue = String(value);
    const match = options.find((option) => {
      const optionValue = option?.value ?? option?.id ?? option?.slug ?? option?.key ?? option;
      return String(optionValue) === stringValue;
    });

    if (!match) {
      return null;
    }

    return match?.label ?? match?.name ?? match?.nama ?? match;
  }, []);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (filters.start_date || filters.end_date) {
      const formattedStart = filters.start_date ? formatDateToIndonesian(filters.start_date) : null;
      const formattedEnd = filters.end_date ? formatDateToIndonesian(filters.end_date) : null;

      let label = 'Rentang Tanggal';
      if (formattedStart && formattedEnd) {
        label = `Rentang: ${formattedStart} - ${formattedEnd}`;
      } else if (formattedStart) {
        label = `Mulai: ${formattedStart}`;
      } else if (formattedEnd) {
        label = `Selesai: ${formattedEnd}`;
      }

      chips.push({ key: 'date_range', label, onRemove: handleRemoveDateRange });
    }

    const jenisLabel = getOptionLabel(filterOptions.jenisKegiatan, filters.jenisKegiatan);
    if (jenisLabel) {
      chips.push({ key: 'jenis', label: `Jenis: ${jenisLabel}`, onRemove: handleRemoveJenis });
    }

    const wilayahLabel = getOptionLabel(filterOptions.wilayahBinaan, filters.wilayahBinaan);
    if (wilayahLabel) {
      chips.push({ key: 'wilayah', label: `Wilayah: ${wilayahLabel}`, onRemove: handleRemoveWilayah });
    }

    const sheltersByWilayah = filterOptions.sheltersByWilayah?.[filters.wilayahBinaan] || [];
    const shelterLabel = getOptionLabel(sheltersByWilayah, filters.shelter);
    if (shelterLabel) {
      chips.push({ key: 'shelter', label: `Shelter: ${shelterLabel}`, onRemove: handleRemoveShelter });
    }

    if (filters.search) {
      chips.push({ key: 'search', label: `Cari: "${filters.search}"`, onRemove: handleRemoveSearch });
    }

    return chips;
  }, [
    filters,
    filterOptions,
    getOptionLabel,
    handleRemoveDateRange,
    handleRemoveJenis,
    handleRemoveShelter,
    handleRemoveSearch,
    handleRemoveWilayah,
  ]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;

    const nextPage = (pagination?.current_page || 1) + 1;
    dispatch(fetchMoreReportAnak({ filters, page: nextPage }));
  };

  const handleChildPress = (child) => {
    const childId = child.id_anak || child.id || child.child_id;
    if (!childId) return;

    navigation.navigate('AdminCabangChildDetail', {
      childId,
      childName: child.full_name || child.name || child.nama,
    });
  };

  const handleWilayahFetch = (wilayahId) => {
    if (!wilayahId) {
      return;
    }

    const existingOptions =
      filterOptions.sheltersByWilayah?.[wilayahId] ||
      filterOptions.sheltersByWilayah?.[String(wilayahId)];

    if (Array.isArray(existingOptions) && !filterOptions.sheltersError) {
      // Data for this wilayah has already been loaded from the initial payload.
      return;
    }

    dispatch(fetchShelterOptionsByWilayah(wilayahId));
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Laporan Anak Binaan</Text>
          <Text style={styles.subtitle}>Pantau perkembangan anak binaan di seluruh shelter cabang.</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TouchableOpacity
          onPress={handleSearch}
          style={styles.searchIconButton}
          accessibilityRole="button"
          accessibilityLabel="Cari"
        >
          <Ionicons name="search" size={18} color="#7f8c8d" />
        </TouchableOpacity>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Cari anak binaan"
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close-circle" size={18} color="#bdc3c7" />
          </TouchableOpacity>
        )}
      </View>

      {activeFilterChips.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          {activeFilterChips.map((chip) => (
            <View key={chip.key} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{chip.label}</Text>
              <TouchableOpacity
                onPress={chip.onRemove}
                style={styles.filterChipRemove}
                accessibilityRole="button"
                accessibilityLabel={`Hapus filter ${chip.label}`}
              >
                <Ionicons name="close" size={14} color="#7f8c8d" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <ChildReportSummary summary={summary} />

      <ChildAttendanceTrendChart monthlyData={monthlyAttendanceData} />

      <ChildAttendanceDistributionCard
        levelData={attendanceDistribution.level}
        wilayahData={attendanceDistribution.wilayah}
        shelterData={attendanceDistribution.shelter}
      />

      {error && (
        <View style={styles.errorWrapper}>
          <ErrorMessage message={error} />
        </View>
      )}
    </View>
  );

  const showReloadingOverlay = loading && !initializing && !loadingMore;

  return (
    <View style={styles.container}>
      {initializing && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}

      {showReloadingOverlay && (
        <View style={styles.reloadingOverlay}>
          <LoadingSpinner />
        </View>
      )}

      <FlatList
        data={children}
        keyExtractor={(item, index) => `${item.id_anak || item.id || item.child_id || index}`}
        renderItem={({ item }) => (
          <ChildReportListItem child={item} onPress={handleChildPress} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !loading && !initializing ? (
            <EmptyState
              title="Belum ada data laporan"
              description="Silakan ubah filter atau segarkan halaman untuk melihat data terbaru."
            />
          ) : null
        }
        ListFooterComponent={loadingMore ? <LoadingSpinner size="small" /> : null}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2980b9"
          />
        )}
      />

      <ChildReportFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        jenisOptions={filterOptions.jenisKegiatan}
        wilayahOptions={filterOptions.wilayahBinaan}
        shelterOptions={shelterOptions}
        shelterLoading={filterOptions.sheltersLoading}
        shelterError={filterOptions.sheltersError}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onWilayahFetch={handleWilayahFetch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  listHeader: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
    maxWidth: 260,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    marginBottom: 16,
  },
  searchIconButton: {
    marginRight: 8,
    padding: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  filterChipRemove: {
    marginLeft: 6,
    padding: 2,
  },
  errorWrapper: {
    marginTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  reloadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

export default AdminCabangChildReportScreen;
