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

  const { data: summaryData } = useAttendanceSummary();
  const {
    weeks: weeklyData,
    shelters,
    summary: weeklySummary,
    selectedWeek,
    selectWeek,
    isLoading: isDashboardLoading,
    isFetchingMore: isFetchingMoreShelters,
    error: dashboardError,
    refresh,
    loadMore,
    hasNextPage,
  } = useWeeklyAttendanceDashboard({
    search: searchQuery,
    bands: selectedBands,
  });
  const { data: trendData, isLoading: isTrendLoading } = useAttendanceTrend();

  useEffect(() => {
    if (Array.isArray(weeklyData) && weeklyData.length > 0 && !selectedWeek?.id) {
      const firstWeek = weeklyData[0];
      if (firstWeek?.id) {
        selectWeek(firstWeek.id);
      }
    }
  }, [selectWeek, selectedWeek?.id, weeklyData]);

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

  const periodOptions = useMemo(() => {
    if (!Array.isArray(weeklyData)) {
      return [];
    }

    const yearsMap = new Map();

    const formatRange = (start, end) => {
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

      const date = start || end;

      if (!date) {
        return '';
      }

      return `${date.getDate()} ${MONTH_NAMES_ID[date.getMonth()] || ''} ${date.getFullYear()}`;
    };

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
      const rangeLabel = formatRange(start, end);

      monthGroup.weeks.push({
        id: week.id,
        name: weekName,
        rangeLabel,
      });
    });

    return Array.from(yearsMap.values())
      .sort((a, b) => Number(b.year) - Number(a.year))
      .map((yearGroup) => ({
        year: yearGroup.year,
        months: Array.from(yearGroup.months.values()).sort((a, b) => b.monthIndex - a.monthIndex),
      }));
  }, [parseDateValue, weeklyData]);

  useEffect(() => {
    const week = selectedWeek?.id
      ? selectedWeek
      : Array.isArray(weeklyData) && weeklyData.length > 0
      ? weeklyData[0]
      : null;

    if (!week) {
      return;
    }

    const start = parseDateValue(week?.dates?.start);
    const end = parseDateValue(week?.dates?.end);
    const primaryDate = start || end;

    if (!primaryDate) {
      return;
    }

    const yearKey = primaryDate.getFullYear().toString();
    const monthKey = `${yearKey}-${String(primaryDate.getMonth() + 1).padStart(2, '0')}`;

    setSelectedYear((prev) => (prev === yearKey ? prev : yearKey));
    setSelectedMonth((prev) => (prev === monthKey ? prev : monthKey));
  }, [parseDateValue, selectedWeek, weeklyData]);

  const handleShelterPress = useCallback(
    (shelter) => {
      if (!shelter) {
        return;
      }

      navigation.navigate('AdminCabangAttendanceShelterDetail', {
        shelterId: shelter.id,
        shelterName: shelter.name,
        startDate: selectedWeek?.dates?.start || null,
        endDate: selectedWeek?.dates?.end || null,
        periodLabel: selectedWeek?.dates?.label || selectedWeek?.label || null,
      });
    },
    [
      navigation,
      selectedWeek?.dates?.end,
      selectedWeek?.dates?.label,
      selectedWeek?.dates?.start,
      selectedWeek?.label,
    ]
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

  const listHeader = useMemo(() => {
    const weekBand = getAttendanceBand(selectedWeek?.attendanceRate);

    return (
      <View style={styles.headerContent}>
        <WeeklySummaryCard
          summary={selectedWeek ?? weeklySummary}
          weeks={weeklyData}
          selectedWeekId={selectedWeek?.id}
          onSelectWeek={selectWeek}
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
    dashboardError,
    isDashboardLoading,
    isTrendLoading,
    refresh,
    selectWeek,
    selectedWeek,
    summaryData,
    trendData,
    weeklyData,
    weeklySummary,
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
        closeFilterSheet();
        return;
      }

      const firstMonth = yearGroup.months?.[0];
      const firstWeek = firstMonth?.weeks?.[0];

      setSelectedYear(yearKey);
      setSelectedMonth(firstMonth?.id || null);

      if (firstWeek?.id) {
        selectWeek(firstWeek.id);
      }

      closeFilterSheet();
    },
    [closeFilterSheet, periodOptions, selectWeek]
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
        return;
      }

      const firstWeek = targetMonth.weeks?.[0];

      setSelectedYear(targetYear?.year || null);
      setSelectedMonth(targetMonth.id);

      if (firstWeek?.id) {
        selectWeek(firstWeek.id);
      }

      closeFilterSheet();
    },
    [closeFilterSheet, periodOptions, selectWeek]
  );

  const handleWeekChange = useCallback(
    (weekId) => {
      if (!weekId) {
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

      if (!targetMonth) {
        return;
      }

      setSelectedYear(targetYear?.year || null);
      setSelectedMonth(targetMonth.id);
      selectWeek(weekId);
      closeFilterSheet();
    },
    [closeFilterSheet, periodOptions, selectWeek]
  );

  const handleResetFilters = useCallback(() => {
    setSelectedBands([]);
    setSearchQuery('');
    const defaultWeek = Array.isArray(weeklyData) ? weeklyData[0] : null;

    if (defaultWeek?.id) {
      const start = parseDateValue(defaultWeek?.dates?.start);
      const end = parseDateValue(defaultWeek?.dates?.end);
      const primaryDate = start || end;

      if (primaryDate) {
        const yearKey = primaryDate.getFullYear().toString();
        const monthKey = `${yearKey}-${String(primaryDate.getMonth() + 1).padStart(2, '0')}`;

        setSelectedYear(yearKey);
        setSelectedMonth(monthKey);
      }

      selectWeek(defaultWeek.id);
    }

    closeFilterSheet();
  }, [closeFilterSheet, parseDateValue, selectWeek, weeklyData]);

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
        selectedWeekId={selectedWeek?.id || null}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onWeekChange={handleWeekChange}
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
