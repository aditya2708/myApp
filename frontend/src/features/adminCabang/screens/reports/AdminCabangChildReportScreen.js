import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BarChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import ChildReportSummary from '../../components/reports/ChildReportSummary';
import ChildReportListItem from '../../components/reports/ChildReportListItem';
import ChildReportFilterModal from '../../components/reports/ChildReportFilterModal';
import ChildAttendanceLineChart from '../../components/reports/ChildAttendanceLineChart';
import PickerInput from '../../../../common/components/PickerInput';
import {
  clearError,
  resetFilters,
  selectReportAnakChildren,
  selectReportAnakError,
  selectReportAnakFilterOptions,
  selectReportAnakFilters,
  selectReportAnakHasFetched,
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

const MONTH_SHORT_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHELTER_NAMES = ['Shelter Menteng', 'Shelter Tebet', 'Shelter Cempaka Putih'];
const DEFAULT_ACTIVITY_OPTIONS = [
  { label: 'Bimbel', value: 'Bimbel' },
  { label: 'Kegiatan Sosial', value: 'Kegiatan Sosial' },
  { label: 'Pelatihan Keterampilan', value: 'Pelatihan Keterampilan' },
];
const RAW_ATTENDANCE_BY_YEAR = {
  '2021': [75, 78, 80, 82, 84, 83, 85, 86, 88, 87, 89, 90],
  '2022': [80, 82, 81, 83, 85, 84, 86, 87, 88, 90, 91, 92],
  '2023': [82, 84, 86, 88, 87, 89, 90, 92, 93, 95, 94, 96],
  '2024': [85, 86, 88, 89, 90, 92, 93, 94, 95, 96, 97, 98],
};

const buildMonthlyAttendanceMap = () => {
  const attendanceMap = {};

  Object.entries(RAW_ATTENDANCE_BY_YEAR).forEach(([year, monthlyValues]) => {
    monthlyValues.forEach((value, index) => {
      const month = String(index + 1).padStart(2, '0');
      const periodKey = `${year}-${month}`;

      attendanceMap[periodKey] = SHELTER_NAMES.map((shelterName, shelterIndex) => {
        const adjustment = shelterIndex === 0 ? 0 : shelterIndex === 1 ? -3 : 4;
        const adjustedValue = Math.min(100, Math.max(0, value + adjustment));

        return { shelter: shelterName, value: adjustedValue };
      });
    });
  });

  return attendanceMap;
};

const formatPeriodLabel = (periodKey) => {
  if (!periodKey || typeof periodKey !== 'string') {
    return '';
  }

  const [year, month] = periodKey.split('-');
  const monthIndex = Number(month) - 1;

  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex >= MONTH_SHORT_LABELS.length) {
    return year || periodKey;
  }

  return `${MONTH_SHORT_LABELS[monthIndex]} ${year}`;
};

const MONTHLY_ATTENDANCE_BY_PERIOD = buildMonthlyAttendanceMap();
const SORTED_PERIOD_KEYS = Object.keys(MONTHLY_ATTENDANCE_BY_PERIOD).sort(
  (a, b) => new Date(`${b}-01`).getTime() - new Date(`${a}-01`).getTime(),
);
const PERIOD_OPTIONS = SORTED_PERIOD_KEYS.map((periodKey) => ({
  label: formatPeriodLabel(periodKey),
  value: periodKey,
}));

const clampPercentage = (value) => Math.min(100, Math.max(0, value));
const calculateActivityAdjustment = (activity) => {
  if (!activity) {
    return 0;
  }

  const charSum = String(activity)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return (charSum % 7) - 3;
};

const AdminCabangChildReportScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const children = useSelector(selectReportAnakChildren);
  const summary = useSelector(selectReportAnakSummary);
  const pagination = useSelector(selectReportAnakPagination);
  const hasMore = useSelector(selectReportAnakHasMore);
  const filters = useSelector(selectReportAnakFilters);
  const filterOptions = useSelector(selectReportAnakFilterOptions);
  const { loading, loadingMore, initializing } = useSelector(selectReportAnakLoadingStates);
  const error = useSelector(selectReportAnakError);
  const hasFetched = useSelector(selectReportAnakHasFetched);

  const [searchText, setSearchText] = useState(filters.search || '');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (MONTHLY_ATTENDANCE_BY_PERIOD[currentKey]) {
      return currentKey;
    }

    return SORTED_PERIOD_KEYS[0] || null;
  });
  const [selectedActivity, setSelectedActivity] = useState('Bimbel');
  const [selectedShelter, setSelectedShelter] = useState('all');
  const [chartType, setChartType] = useState('bar');
  const searchDebounceRef = useRef(null);

  const selectedPeriodLabel = useMemo(
    () => (selectedPeriod ? formatPeriodLabel(selectedPeriod) : ''),
    [selectedPeriod],
  );

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

  const activityPickerItems = useMemo(() => {
    const items = Array.isArray(filterOptions.jenisKegiatan)
      ? filterOptions.jenisKegiatan
      : [];
    const normalizedItems = items
      .map((option) => {
        const value = option?.value ?? option?.id ?? option?.slug ?? option;
        const label = option?.label ?? option?.name ?? option;

        if (!value || !label) {
          return null;
        }

        return {
          label: String(label),
          value: String(value),
        };
      })
      .filter(Boolean);

    if (normalizedItems.length === 0) {
      return [...DEFAULT_ACTIVITY_OPTIONS];
    }

    const hasBimbel = normalizedItems.some((item) => item.value === 'Bimbel');
    if (!hasBimbel) {
      normalizedItems.unshift({ label: 'Bimbel', value: 'Bimbel' });
    }

    return normalizedItems;
  }, [filterOptions.jenisKegiatan]);

  const shelterPickerItems = useMemo(() => {
    const sheltersByWilayah = filterOptions.sheltersByWilayah || {};
    const collectedOptions = Object.values(sheltersByWilayah).reduce((acc, shelterList) => {
      if (Array.isArray(shelterList)) {
        shelterList.forEach((option) => {
          const value = option?.value ?? option?.id ?? option?.slug ?? option?.nama ?? option;
          const label = option?.label ?? option?.name ?? option?.nama ?? option;
          if (!value || !label) {
            return;
          }
          const key = String(value);
          if (!acc.has(key)) {
            acc.set(key, { label: String(label), value: key });
          }
        });
      }
      return acc;
    }, new Map());

    if (collectedOptions.size === 0) {
      SHELTER_NAMES.forEach((name) => {
        if (!collectedOptions.has(name)) {
          collectedOptions.set(name, { label: name, value: name });
        }
      });
    }

    return [
      { label: 'Semua Shelter', value: 'all' },
      ...Array.from(collectedOptions.values()),
    ];
  }, [filterOptions.sheltersByWilayah]);

  useEffect(() => {
    if (!activityPickerItems.some((item) => item.value === selectedActivity)) {
      const fallbackValue = activityPickerItems[0]?.value ?? 'Bimbel';
      setSelectedActivity(fallbackValue);
    }
  }, [activityPickerItems, selectedActivity]);

  useEffect(() => {
    if (!shelterPickerItems.some((item) => item.value === selectedShelter)) {
      setSelectedShelter('all');
    }
  }, [shelterPickerItems, selectedShelter]);

  const filteredAttendanceData = useMemo(() => {
    if (!selectedPeriod) {
      return [];
    }

    const periodData = MONTHLY_ATTENDANCE_BY_PERIOD[selectedPeriod] || [];
    const normalizedShelter = selectedShelter && selectedShelter !== 'all' ? selectedShelter : null;
    const shelterFilteredData = normalizedShelter
      ? periodData.filter((item) => String(item?.shelter) === String(normalizedShelter))
      : periodData;

    const adjustment = calculateActivityAdjustment(selectedActivity);

    return shelterFilteredData.map((item) => ({
      ...item,
      value: clampPercentage((Number(item?.value) || 0) + adjustment),
    }));
  }, [selectedActivity, selectedPeriod, selectedShelter]);

  const barChartMetrics = useMemo(() => {
    if (!filteredAttendanceData.length) {
      return {
        values: [],
        width: 240,
        contentInset: { top: 16, bottom: 16 },
      };
    }

    const values = filteredAttendanceData.map((item) => Number(item?.value) || 0);
    const width = Math.max(values.length * 60, 240);

    return {
      values,
      width,
      contentInset: { top: 16, bottom: 16 },
    };
  }, [filteredAttendanceData]);

  const clearSearchDebounce = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, []);

  const triggerSearch = useCallback(
    (value, { force = false } = {}) => {
      const trimmed = value.trim();
      const nextFilters = { ...filters, search: trimmed };

      dispatch(setSearch(trimmed));

      if (!hasFetched && !force) {
        return;
      }

      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    },
    [dispatch, filters, hasFetched],
  );

  const handleSearch = useCallback(() => {
    clearSearchDebounce();
    triggerSearch(searchText);
  }, [clearSearchDebounce, triggerSearch, searchText]);

  useEffect(() => {
    if (!hasFetched) {
      return () => {
        clearSearchDebounce();
      };
    }

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
  }, [searchText, filters.search, triggerSearch, clearSearchDebounce, hasFetched]);

  const handleClearSearch = () => {
    clearSearchDebounce();
    setSearchText('');
    triggerSearch('');
  };

  const handleApplyFilters = (updatedFilters) => {
    clearSearchDebounce();

    const trimmedSearch = searchText.trim();
    const nextFilters = {
      ...filters,
      ...updatedFilters,
      search: trimmedSearch,
    };

    dispatch(setFilters(nextFilters));
    dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    setFilterModalVisible(false);
    setFiltersApplied(true);
  };

  const handleClearFilters = () => {
    clearSearchDebounce();
    dispatch(resetFilters());
    setSearchText('');
    setFilterModalVisible(false);
    setFiltersApplied(false);
  };

  const handleApplyFilterToggle = useCallback(() => {
    setFiltersApplied((prev) => {
      const nextState = !prev;

      if (nextState && !hasFetched) {
        dispatch(fetchReportAnakList({ filters, page: 1 }));
      }

      return nextState;
    });
  }, [dispatch, filters, hasFetched]);

  const handleRefresh = async () => {
    if (!hasFetched) {
      return;
    }

    setRefreshing(true);
    await dispatch(fetchReportAnakList({ filters, page: 1 }));
    setRefreshing(false);
  };

  const handleRemoveDateRange = useCallback(() => {
    const nextFilters = { ...filters, start_date: null, end_date: null };

    dispatch(setDateRange({ start_date: null, end_date: null }));

    if (hasFetched) {
      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    }
  }, [dispatch, filters, hasFetched]);

  const handleRemoveJenis = useCallback(() => {
    const nextFilters = { ...filters, jenisKegiatan: null };

    dispatch(setJenisKegiatan(null));

    if (hasFetched) {
      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    }
  }, [dispatch, filters, hasFetched]);

  const handleRemoveWilayah = useCallback(() => {
    const nextFilters = { ...filters, wilayahBinaan: null, shelter: null };

    dispatch(setWilayahBinaan(null));

    if (hasFetched) {
      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    }
  }, [dispatch, filters, hasFetched]);

  const handleRemoveShelter = useCallback(() => {
    const nextFilters = { ...filters, shelter: null };

    dispatch(setShelter(null));

    if (hasFetched) {
      dispatch(fetchReportAnakList({ filters: nextFilters, page: 1 }));
    }
  }, [dispatch, filters, hasFetched]);

  const handleRemoveSearch = useCallback(() => {
    clearSearchDebounce();
    setSearchText('');
    triggerSearch('');
  }, [clearSearchDebounce, triggerSearch]);

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
    if (!hasFetched || !hasMore || loadingMore) return;

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
      filterOptions.sheltersByWilayah?.[wilayahId] || filterOptions.sheltersByWilayah?.[String(wilayahId)];

    if (Array.isArray(existingOptions) && !filterOptions.sheltersError) {
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
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
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

      <TouchableOpacity
        onPress={handleApplyFilterToggle}
        style={[styles.applyFilterButton, filtersApplied && styles.applyFilterButtonActive]}
        accessibilityRole="button"
        accessibilityLabel="Terapkan filter laporan"
      >
        <Text style={[styles.applyFilterButtonText, filtersApplied && styles.applyFilterButtonTextActive]}>
          {filtersApplied ? 'Filter Diterapkan' : 'Terapkan Filter'}
        </Text>
      </TouchableOpacity>

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

      {hasFetched && summary && <ChildReportSummary summary={summary} />}

      {filtersApplied && (
        <View style={styles.chartContainer}>
          <PickerInput
            label="Periode"
            value={selectedPeriod || ''}
            onValueChange={(value) => setSelectedPeriod(value || null)}
            items={PERIOD_OPTIONS}
            placeholder="Pilih Bulan & Tahun"
            style={styles.periodPicker}
          />
          <PickerInput
            label="Jenis Aktivitas"
            value={selectedActivity}
            onValueChange={(value) => setSelectedActivity(value || 'Bimbel')}
            items={activityPickerItems}
            placeholder="Pilih Jenis Aktivitas"
            style={styles.periodPicker}
          />
          <PickerInput
            label="Shelter"
            value={selectedShelter}
            onValueChange={(value) => setSelectedShelter(value || 'all')}
            items={shelterPickerItems}
            placeholder="Pilih Shelter"
            style={styles.periodPicker}
          />
          <View style={styles.chartToggleGroup}>
            {[
              { key: 'bar', label: 'Bar' },
              { key: 'line', label: 'Line' },
            ].map((item) => {
              const isActive = chartType === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.chartToggleButton, isActive && styles.chartToggleButtonActive]}
                  onPress={() => setChartType(item.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tampilkan grafik ${item.label}`}
                >
                  <Text
                    style={[styles.chartToggleButtonText, isActive && styles.chartToggleButtonTextActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedPeriod && filteredAttendanceData.length ? (
            chartType === 'line' ? (
              <ChildAttendanceLineChart
                year={selectedPeriodLabel}
                data={filteredAttendanceData}
                onOpenFullScreen={() =>
                  navigation.navigate('ChartFullScreen', {
                    year: selectedPeriodLabel,
                    data: filteredAttendanceData,
                  })
                }
              />
            ) : (
              <View style={styles.barChartCard}>
                <Text style={styles.chartCardTitle}>
                  Distribusi Kehadiran
                  {selectedPeriodLabel ? ` ${selectedPeriodLabel}` : ''}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.barChartScrollContent}
                >
                  <View style={styles.barChartWrapper}>
                    <View style={[styles.barChartRow, { width: barChartMetrics.width + 44 }]}>
                      <YAxis
                        style={[styles.barChartYAxis, { height: 220 }]}
                        data={barChartMetrics.values}
                        contentInset={barChartMetrics.contentInset}
                        svg={{ fill: '#2563eb', fontSize: 12 }}
                        numberOfTicks={5}
                        formatLabel={(value) => `${value}%`}
                      />
                      <BarChart
                        style={[styles.barChart, { width: barChartMetrics.width }]}
                        data={barChartMetrics.values}
                        svg={{ fill: '#4a90e2' }}
                        spacingInner={0.4}
                        spacingOuter={0.2}
                        contentInset={barChartMetrics.contentInset}
                      >
                        <Grid />
                      </BarChart>
                    </View>
                    <XAxis
                      style={[styles.barChartXAxis, { marginLeft: 44, width: barChartMetrics.width }]}
                      data={barChartMetrics.values}
                      formatLabel={(value, index) => filteredAttendanceData[index]?.shelter ?? ''}
                      contentInset={{ left: 20, right: 20 }}
                      svg={{ fill: '#7f8c8d', fontSize: 12 }}
                    />
                  </View>
                </ScrollView>
              </View>
            )
          ) : (
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderTitle}>
                Pilih periode untuk melihat tren kehadiran anak binaan.
              </Text>
              {selectedPeriod && !filteredAttendanceData.length && (
                <Text style={styles.chartPlaceholderSubtitle}>
                  Data kehadiran belum tersedia untuk periode yang dipilih.
                </Text>
              )}
            </View>
          )}
        </View>
      )}

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
        renderItem={({ item }) => <ChildReportListItem child={item} onPress={handleChildPress} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !loading && !initializing ? (
            filtersApplied ? (
              hasFetched ? (
                <EmptyState
                  title="Belum ada data laporan"
                  description="Silakan ubah filter atau segarkan halaman untuk melihat data terbaru."
                />
              ) : null
            ) : (
              <EmptyState title="Terapkan filter untuk menampilkan laporan" />
            )
          ) : null
        }
        ListFooterComponent={loadingMore ? <LoadingSpinner size="small" /> : null}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2980b9" />
        }
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
  applyFilterButton: {
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
  },
  applyFilterButtonActive: {
    backgroundColor: '#4a90e2',
  },
  applyFilterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  applyFilterButtonTextActive: {
    color: '#ffffff',
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
  chartContainer: {
    marginTop: 8,
  },
  periodPicker: {
    marginBottom: 16,
  },
  chartToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#ecf0f1',
    borderRadius: 12,
    marginBottom: 16,
    padding: 4,
  },
  chartToggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  chartToggleButtonActive: {
    backgroundColor: '#4a90e2',
  },
  chartToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
  },
  chartToggleButtonTextActive: {
    color: '#ffffff',
  },
  barChartCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  chartCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  barChartScrollContent: {
    paddingBottom: 8,
  },
  barChartWrapper: {
    flexGrow: 1,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  barChartYAxis: {
    marginRight: 12,
  },
  barChart: {
    height: 220,
  },
  barChartXAxis: {
    height: 28,
  },
  chartPlaceholder: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  chartPlaceholderTitle: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '600',
    textAlign: 'center',
  },
  chartPlaceholderSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
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
