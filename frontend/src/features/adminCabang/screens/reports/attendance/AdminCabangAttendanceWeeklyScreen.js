import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import AttendanceTrendChart from '../../../components/reports/attendance/AttendanceTrendChart';
import ShelterAttendanceCard from '../../../components/reports/attendance/ShelterAttendanceCard';
import WeeklyAttendanceFilterSheet from '../../../components/reports/attendance/WeeklyAttendanceFilterSheet';
import WeeklySummaryCard from '../../../components/reports/attendance/WeeklySummaryCard';

import useAttendanceSummary from '../../../hooks/reports/attendance/useAttendanceSummary';
import useAttendanceTrend from '../../../hooks/reports/attendance/useAttendanceTrend';
import useWeeklyAttendanceDashboard from '../../../hooks/reports/attendance/useWeeklyAttendanceDashboard';

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const ATTENDANCE_BANDS = [
  {
    id: 'excellent',
    label: 'Sangat Baik',
    description: '≥ 90% kehadiran',
    min: 90,
    max: Infinity,
    color: '#2ecc71',
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
  },
  {
    id: 'good',
    label: 'Baik',
    description: '75% - 89%',
    min: 75,
    max: 89.99,
    color: '#3498db',
    backgroundColor: 'rgba(52, 152, 219, 0.12)',
  },
  {
    id: 'fair',
    label: 'Perlu Perhatian',
    description: '50% - 74%',
    min: 50,
    max: 74.99,
    color: '#f39c12',
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
  },
  {
    id: 'critical',
    label: 'Kritis',
    description: '< 50%',
    min: 0,
    max: 49.99,
    color: '#e74c3c',
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
  },
];

const getAttendanceBand = (rate) => {
  const numericRate = Number(rate);

  if (!Number.isFinite(numericRate)) {
    return null;
  }

  return (
    ATTENDANCE_BANDS.find((band) => numericRate >= band.min && numericRate <= band.max) ||
    ATTENDANCE_BANDS[ATTENDANCE_BANDS.length - 1]
  );
};

const AdminCabangAttendanceWeeklyScreen = () => {
  const navigation = useNavigation();

  const [isFilterVisible, setFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBands, setSelectedBands] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isCustomRange, setIsCustomRange] = useState(false);

  const updateDateRange = useCallback((nextStart, nextEnd) => {
    setStartDate((prev) => (prev === nextStart ? prev : nextStart));
    setEndDate((prev) => (prev === nextEnd ? prev : nextEnd));
  }, []);

  const { data: summaryData } = useAttendanceSummary();
  const {
    weeks: weeklyData,
    shelters,
    summary: weeklySummary,
    selectedWeek,
    selectedWeekId,
    selectWeek,
    isLoading: isDashboardLoading,
    isFetchingMore: isFetchingMoreShelters,
    error: dashboardError,
    refresh,
    loadMore,
    hasNextPage,
    period,
  } = useWeeklyAttendanceDashboard({
    search: searchQuery,
    bands: selectedBands,
    startDate,
    endDate,
  });
  const { data: trendData, isLoading: isTrendLoading } = useAttendanceTrend();

  const handleSelectWeek = useCallback(
    (weekId) => {
      setIsCustomRange(false);
      return selectWeek(weekId);
    },
    [selectWeek],
  );

  useEffect(() => {
    if (isCustomRange) {
      return;
    }

    if (Array.isArray(weeklyData) && weeklyData.length > 0 && !selectedWeek?.id) {
      const firstWeek = weeklyData[0];
      if (firstWeek?.id) {
        handleSelectWeek(firstWeek.id);
      }
    }
  }, [handleSelectWeek, isCustomRange, selectedWeek?.id, weeklyData]);

  const openFilterSheet = useCallback(() => setFilterVisible(true), []);
  const closeFilterSheet = useCallback(() => setFilterVisible(false), []);

  const parseDateValue = useCallback((value) => {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }, []);

  const formatRangeLabel = useCallback(
    (startValue, endValue) => {
      const start = parseDateValue(startValue);
      const end = parseDateValue(endValue);

      if (start && end) {
        const sameMonth =
          start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

        if (sameMonth) {
          return `${start.getDate()} - ${end.getDate()} ${
            MONTH_NAMES_ID[start.getMonth()] || ''
          } ${start.getFullYear()}`;
        }

        const startLabel = `${start.getDate()} ${MONTH_NAMES_ID[start.getMonth()] || ''} ${
          start.getFullYear()
        }`;
        const endLabel = `${end.getDate()} ${MONTH_NAMES_ID[end.getMonth()] || ''} ${
          end.getFullYear()
        }`;

        return `${startLabel} - ${endLabel}`;
      }

      const singleDate = start || end;

      if (!singleDate) {
        return '';
      }

      return `${singleDate.getDate()} ${MONTH_NAMES_ID[singleDate.getMonth()] || ''} ${
        singleDate.getFullYear()
      }`;
    },
    [parseDateValue],
  );

  const periodOptions = useMemo(() => {
    if (!Array.isArray(weeklyData)) {
      return [];
    }

    const yearsMap = new Map();

    weeklyData.forEach((week) => {
      const start = parseDateValue(week?.dates?.start);
      const end = parseDateValue(week?.dates?.end);
      const primaryDate = start || end;

      if (!primaryDate) {
        return;
      }

      const yearKey = primaryDate.getFullYear().toString();
      const monthIndex = primaryDate.getMonth();
      const monthKey = `${yearKey}-${String(monthIndex + 1).padStart(2, '0')}`;

      if (!yearsMap.has(yearKey)) {
        yearsMap.set(yearKey, { year: yearKey, months: new Map() });
      }

      const yearGroup = yearsMap.get(yearKey);

      if (!yearGroup.months.has(monthKey)) {
        yearGroup.months.set(monthKey, {
          id: monthKey,
          monthIndex,
          label: MONTH_NAMES_ID[monthIndex] || '',
          weeks: [],
        });
      }

      const monthGroup = yearGroup.months.get(monthKey);
      if (!week?.id) {
        return;
      }

      const weekName =
        week?.name || week?.label || week?.title || week?.dates?.label || 'Minggu';
      const rangeLabel = formatRangeLabel(week?.dates?.start, week?.dates?.end);

      monthGroup.weeks.push({
        id: week.id,
        name: weekName,
        rangeLabel,
        dates: {
          start: week?.dates?.start ?? null,
          end: week?.dates?.end ?? null,
        },
      });
    });

    return Array.from(yearsMap.values())
      .sort((a, b) => Number(b.year) - Number(a.year))
      .map((yearGroup) => ({
        year: yearGroup.year,
        months: Array.from(yearGroup.months.values()).sort((a, b) => b.monthIndex - a.monthIndex),
      }));
  }, [formatRangeLabel, parseDateValue, weeklyData]);

  const monthYearValue = useMemo(() => {
    if (selectedMonth) {
      const [yearPart, monthPart] = selectedMonth.split('-');
      const yearNumber = Number(yearPart);
      const monthNumber = Number(monthPart);

      if (!Number.isNaN(yearNumber) && !Number.isNaN(monthNumber)) {
        return new Date(yearNumber, monthNumber - 1, 1);
      }
    }

    const rangeStart = parseDateValue(startDate);
    if (rangeStart) {
      return new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    }

    const rangeEnd = parseDateValue(endDate);
    if (rangeEnd) {
      return new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
    }

    return null;
  }, [endDate, parseDateValue, selectedMonth, startDate]);

  const monthYearLabel = useMemo(() => {
    if (selectedMonth) {
      const [yearPart, monthPart] = selectedMonth.split('-');
      const monthIndex = Number(monthPart) - 1;
      const monthName = MONTH_NAMES_ID[monthIndex] || '';

      if (monthName) {
        return `${monthName} ${yearPart}`;
      }

      if (yearPart) {
        return `${monthPart}/${yearPart}`;
      }
    }

    const baseDate = parseDateValue(startDate) || parseDateValue(endDate);

    if (!baseDate) {
      return 'Semua periode';
    }

    const monthName = MONTH_NAMES_ID[baseDate.getMonth()] || '';

    if (!monthName) {
      return `${baseDate.getMonth() + 1}/${baseDate.getFullYear()}`;
    }

    return `${monthName} ${baseDate.getFullYear()}`;
  }, [endDate, parseDateValue, selectedMonth, startDate]);

  useEffect(() => {
    if (!selectedWeek?.id) {
      if (!startDate && !endDate) {
        setSelectedYear((prev) => (prev === null ? prev : null));
        setSelectedMonth((prev) => (prev === null ? prev : null));
        return;
      }

      const rangeStart = parseDateValue(startDate);
      const rangeEnd = parseDateValue(endDate);
      const primaryDate = rangeStart || rangeEnd;

      if (!primaryDate) {
        return;
      }

      const yearKey = primaryDate.getFullYear().toString();
      const monthKey = `${yearKey}-${String(primaryDate.getMonth() + 1).padStart(2, '0')}`;

      setSelectedYear((prev) => (prev === yearKey ? prev : yearKey));
      setSelectedMonth((prev) => (prev === monthKey ? prev : monthKey));
      return;
    }

    const start = parseDateValue(selectedWeek?.dates?.start);
    const end = parseDateValue(selectedWeek?.dates?.end);
    const primaryDate = start || end;

    if (!primaryDate) {
      return;
    }

    const yearKey = primaryDate.getFullYear().toString();
    const monthKey = `${yearKey}-${String(primaryDate.getMonth() + 1).padStart(2, '0')}`;

    setSelectedYear((prev) => (prev === yearKey ? prev : yearKey));
    setSelectedMonth((prev) => (prev === monthKey ? prev : monthKey));
  }, [endDate, parseDateValue, selectedWeek, startDate]);

  useEffect(() => {
    if (!selectedWeek?.id) {
      return;
    }

    const nextStart = selectedWeek?.dates?.start ?? null;
    const nextEnd = selectedWeek?.dates?.end ?? null;

    updateDateRange(nextStart, nextEnd);
  }, [selectedWeek?.dates?.end, selectedWeek?.dates?.start, selectedWeek?.id, updateDateRange]);

  useEffect(() => {
    if (selectedWeek?.id || startDate || endDate) {
      return;
    }

    const periodRange = period?.dateRange ?? {};
    const periodStart = periodRange.start ?? null;
    const periodEnd = periodRange.end ?? null;

    if (!periodStart && !periodEnd) {
      return;
    }

    updateDateRange(periodStart ?? null, periodEnd ?? null);
  }, [endDate, period, selectedWeek?.id, startDate, updateDateRange]);

  const handleShelterPress = useCallback(
    (shelter) => {
      if (!shelter) {
        return;
      }

      const periodLabel =
        selectedWeek?.dates?.label ||
        selectedWeek?.label ||
        formatRangeLabel(startDate, endDate) ||
        null;

      navigation.navigate('AdminCabangAttendanceShelterDetail', {
        shelterId: shelter.id,
        shelterName: shelter.name,
        startDate: startDate || null,
        endDate: endDate || null,
        periodLabel,
      });
    },
    [endDate, formatRangeLabel, navigation, selectedWeek?.dates?.label, selectedWeek?.label, startDate]
  );

  const filteredShelters = useMemo(() => {
    const list = Array.isArray(shelters) ? shelters : [];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return list.filter((item) => {
      const band = getAttendanceBand(item.attendanceRate);
      const matchesBand =
        !selectedBands.length || (band && selectedBands.some((id) => id === band.id));

      if (!matchesBand) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const wilbinValue = (() => {
        if (!item.wilbin) {
          return '';
        }

        if (typeof item.wilbin === 'string') {
          return item.wilbin;
        }

        return item.wilbin.name || item.wilbin.label || item.wilbin.title || '';
      })()
        .toString()
        .toLowerCase();

      return (
        item.name?.toLowerCase().includes(normalizedQuery) ||
        wilbinValue.includes(normalizedQuery)
      );
    });
  }, [searchQuery, selectedBands, shelters]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refresh();
    } catch (error) {
      // noop: errors handled by hooks
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const renderShelterItem = useCallback(
    ({ item }) => (
      <ShelterAttendanceCard
        shelter={item}
        band={getAttendanceBand(item.attendanceRate)}
        onPress={handleShelterPress}
      />
    ),
    [handleShelterPress]
  );

  const renderEmptyState = useCallback(() => {
    if (isDashboardLoading && !filteredShelters.length) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color="#0984e3" />
          <Text style={styles.emptyText}>Memuat data shelter...</Text>
        </View>
      );
    }

    if (dashboardError) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#e74c3c" />
          <Text style={styles.emptyTitle}>Gagal memuat data shelter</Text>
          <Text style={styles.emptyText}>{dashboardError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Ionicons name="refresh" size={16} color="#ffffff" />
            <Text style={styles.retryLabel}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="home-outline" size={28} color="#b2bec3" />
        <Text style={styles.emptyTitle}>Belum ada data shelter</Text>
        <Text style={styles.emptyText}>Gunakan filter untuk menyesuaikan pencarian Anda.</Text>
      </View>
    );
  }, [dashboardError, filteredShelters.length, isDashboardLoading, refresh]);

  const displaySummary = useMemo(() => {
    const baseSummary = selectedWeek ?? weeklySummary;

    if (!baseSummary) {
      return null;
    }

    if (selectedWeek?.id || (!startDate && !endDate)) {
      return baseSummary;
    }

    const manualLabel = formatRangeLabel(startDate, endDate);
    const currentDates = baseSummary?.dates ?? {};

    return {
      ...baseSummary,
      dates: {
        ...currentDates,
        start: currentDates.start ?? startDate ?? null,
        end: currentDates.end ?? endDate ?? null,
        label: manualLabel || currentDates.label || baseSummary?.label || '',
      },
    };
  }, [endDate, formatRangeLabel, selectedWeek, startDate, weeklySummary]);

  const listHeader = useMemo(() => {
    const weekBand = getAttendanceBand(displaySummary?.attendanceRate);

    return (
      <View style={styles.headerContent}>
        <WeeklySummaryCard
          summary={displaySummary}
          weeks={weeklyData}
          selectedWeekId={selectedWeekId}
          onSelectWeek={handleSelectWeek}
          band={weekBand}
          isLoading={isDashboardLoading}
          error={dashboardError}
          onRetry={refresh}
          overview={summaryData}
        />
        <View style={styles.chartSection}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Tren Kehadiran</Text>
          </View>
          {isTrendLoading ? (
            <View style={styles.chartPlaceholder}>
              <ActivityIndicator color="#0984e3" />
            </View>
          ) : (
            <AttendanceTrendChart data={trendData} />
          )}
        </View>
      </View>
    );
  }, [
    displaySummary,
    dashboardError,
    isDashboardLoading,
    isTrendLoading,
    refresh,
    handleSelectWeek,
    selectedWeekId,
    summaryData,
    trendData,
    weeklyData,
  ]);

  const handleBandChange = useCallback((nextBands) => {
    setSelectedBands(nextBands);
  }, []);

  const handleYearChange = useCallback(
    (yearKey) => {
      if (!yearKey) {
        return;
      }

      const yearGroup = periodOptions.find((group) => group.year === yearKey);

      if (!yearGroup) {
        setSelectedYear(yearKey);
        setSelectedMonth(null);
        handleSelectWeek(null);
        updateDateRange(null, null);
        closeFilterSheet();
        return;
      }

      const firstMonth = yearGroup.months?.[0];
      const firstWeek = firstMonth?.weeks?.[0];

      setSelectedYear(yearKey);
      setSelectedMonth(firstMonth?.id || null);

      if (firstWeek?.id) {
        const matchedWeek = handleSelectWeek(firstWeek.id);
        const range = matchedWeek?.dates ?? {
          start: firstWeek?.dates?.start ?? null,
          end: firstWeek?.dates?.end ?? null,
        };
        updateDateRange(range?.start ?? null, range?.end ?? null);
      } else {
        handleSelectWeek(null);
        updateDateRange(firstWeek?.dates?.start ?? null, firstWeek?.dates?.end ?? null);
      }

      closeFilterSheet();
    },
    [closeFilterSheet, handleSelectWeek, periodOptions, updateDateRange]
  );

  const handleMonthChange = useCallback(
    (monthKey) => {
      if (!monthKey) {
        return;
      }

      let targetYear = null;
      let targetMonth = null;

      periodOptions.forEach((yearGroup) => {
        if (targetMonth) {
          return;
        }

        const foundMonth = yearGroup.months?.find((month) => month.id === monthKey);

        if (foundMonth) {
          targetYear = yearGroup;
          targetMonth = foundMonth;
        }
      });

      if (!targetMonth) {
        setSelectedMonth(null);
        handleSelectWeek(null);
        updateDateRange(null, null);
        closeFilterSheet();
        return;
      }

      const firstWeek = targetMonth.weeks?.[0];

      setSelectedYear(targetYear?.year || null);
      setSelectedMonth(targetMonth.id);

      if (firstWeek?.id) {
        const matchedWeek = handleSelectWeek(firstWeek.id);
        const range = matchedWeek?.dates ?? {
          start: firstWeek?.dates?.start ?? null,
          end: firstWeek?.dates?.end ?? null,
        };
        updateDateRange(range?.start ?? null, range?.end ?? null);
      } else {
        handleSelectWeek(null);
        updateDateRange(firstWeek?.dates?.start ?? null, firstWeek?.dates?.end ?? null);
      }

      closeFilterSheet();
    },
    [closeFilterSheet, handleSelectWeek, periodOptions, updateDateRange]
  );

  const handleWeekChange = useCallback(
    (weekId, weekRange) => {
      if (!weekId) {
        handleSelectWeek(null);
        setSelectedYear(null);
        setSelectedMonth(null);
        updateDateRange(weekRange?.start ?? null, weekRange?.end ?? null);
        closeFilterSheet();
        return;
      }

      let targetYear = null;
      let targetMonth = null;

      periodOptions.some((yearGroup) => {
        const monthMatch = yearGroup.months?.find((month) =>
          month.weeks?.some((week) => week.id === weekId)
        );

        if (monthMatch) {
          targetYear = yearGroup;
          targetMonth = monthMatch;
          return true;
        }

        return false;
      });

      setSelectedYear(targetYear?.year || null);
      setSelectedMonth(targetMonth?.id || null);

      const matchedWeek = handleSelectWeek(weekId);
      const range = weekRange ?? matchedWeek?.dates ?? null;
      updateDateRange(range?.start ?? null, range?.end ?? null);
      closeFilterSheet();
    },
    [closeFilterSheet, handleSelectWeek, periodOptions, updateDateRange]
  );

  const handleMonthYearPick = useCallback(
    (date) => {
      if (!date) {
        setSelectedYear((prev) => (prev === null ? prev : null));
        setSelectedMonth((prev) => (prev === null ? prev : null));
        setIsCustomRange(false);
        handleSelectWeek(null);

        const periodRange = period?.dateRange ?? {};
        const defaultStart = periodRange.start ?? null;
        const defaultEnd = periodRange.end ?? null;

        if (startDate !== defaultStart || endDate !== defaultEnd) {
          updateDateRange(defaultStart, defaultEnd);
        }

        return;
      }

      const normalizedDate = date instanceof Date ? date : new Date(date);

      if (Number.isNaN(normalizedDate.getTime())) {
        return;
      }

      const year = normalizedDate.getFullYear();
      const monthIndex = normalizedDate.getMonth();
      const yearKey = year.toString();
      const monthKey = `${yearKey}-${String(monthIndex + 1).padStart(2, '0')}`;

      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0);

      const toISODate = (value) => {
        const isoYear = value.getFullYear();
        const isoMonth = String(value.getMonth() + 1).padStart(2, '0');
        const isoDay = String(value.getDate()).padStart(2, '0');

        return `${isoYear}-${isoMonth}-${isoDay}`;
      };

      const nextStart = toISODate(monthStart);
      const nextEnd = toISODate(monthEnd);

      setSelectedYear((prev) => (prev === yearKey ? prev : yearKey));
      setSelectedMonth((prev) => (prev === monthKey ? prev : monthKey));

      let matchedWeek = null;

      periodOptions.some((yearGroup) => {
        if (yearGroup.year !== yearKey) {
          return false;
        }

        const monthGroup = yearGroup.months?.find((month) => month.id === monthKey);

        if (!monthGroup) {
          return false;
        }

        matchedWeek = Array.isArray(monthGroup.weeks)
          ? monthGroup.weeks.find((week) => {
              const weekStart = week?.dates?.start ?? null;
              const weekEnd = week?.dates?.end ?? null;

              if (!weekStart || !weekEnd) {
                return false;
              }

              return weekStart === nextStart && weekEnd === nextEnd;
            }) ?? null
          : null;

        return true;
      });

      const hasMatchedWeek = Boolean(matchedWeek?.id);

      setIsCustomRange(!hasMatchedWeek);

      if (hasMatchedWeek) {
        const selected = handleSelectWeek(matchedWeek.id);
        const range = selected?.dates ?? matchedWeek.dates ?? {
          start: nextStart,
          end: nextEnd,
        };
        updateDateRange(range?.start ?? nextStart, range?.end ?? nextEnd);
        return;
      }

      selectWeek(null);

      if (startDate !== nextStart || endDate !== nextEnd) {
        updateDateRange(nextStart, nextEnd);
      }
    },
    [endDate, handleSelectWeek, period, periodOptions, selectWeek, startDate, updateDateRange]
  );

  const handleResetFilters = useCallback(() => {
    setSelectedBands([]);
    setSearchQuery('');
    handleMonthYearPick(null);
    closeFilterSheet();
  }, [closeFilterSheet, handleMonthYearPick]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton} onPress={openFilterSheet}>
          <Ionicons name="filter-outline" size={22} color="#2d3436" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, openFilterSheet]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredShelters}
        keyExtractor={(item) => item.id?.toString() || item.name}
        renderItem={renderShelterItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasNextPage) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          isFetchingMoreShelters ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color="#0984e3" />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#0984e3"]} />
        }
      />

      <WeeklyAttendanceFilterSheet
        visible={isFilterVisible}
        onClose={closeFilterSheet}
        bands={ATTENDANCE_BANDS}
        selectedBands={selectedBands}
        onBandsChange={handleBandChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onReset={handleResetFilters}
        periodOptions={periodOptions}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedWeekId={selectedWeekId}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onWeekChange={handleWeekChange}
        onMonthYearPick={handleMonthYearPick}
        monthYearLabel={monthYearLabel}
        monthYearValue={monthYearValue}
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
    padding: 16,
    paddingBottom: 32,
  },
  headerContent: {
    marginBottom: 16,
  },
  chartSection: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  chartPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0984e3',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  footerLoading: {
    paddingVertical: 16,
  },
  headerButton: {
    marginRight: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 132, 227, 0.12)',
  },
});

export default AdminCabangAttendanceWeeklyScreen;
