import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';

import {
  addWeeks,
  differenceInCalendarWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import AttendanceFilterBar from '../../../components/reports/attendance/AttendanceFilterBar';
import AttendanceSummarySection from '../../../components/reports/attendance/AttendanceSummarySection';
import WeeklyBreakdownList from '../../../components/reports/attendance/WeeklyBreakdownList';
import ShelterAttendanceTable from '../../../components/reports/attendance/ShelterAttendanceTable';
import AttendanceTrendChart from '../../../components/reports/attendance/AttendanceTrendChart';
import ShelterAttendanceDetailModal from '../../../components/reports/attendance/ShelterAttendanceDetailModal';

import useAttendanceSummary from '../../../hooks/reports/attendance/useAttendanceSummary';
import useAttendanceWeekly from '../../../hooks/reports/attendance/useAttendanceWeekly';
import useAttendanceWeeklyShelters from '../../../hooks/reports/attendance/useAttendanceWeeklyShelters';
import useAttendanceTrend from '../../../hooks/reports/attendance/useAttendanceTrend';

const WEEK_START_DAY = 1;

const formatDateForApi = (date) => {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('Failed to format date for filters:', error);
    return null;
  }
};

const safeNumber = (value) => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
};

const computeWeekOfMonth = (date) => {
  try {
    const monthStart = startOfMonth(date);
    const difference = differenceInCalendarWeeks(date, monthStart, { weekStartsOn: WEEK_START_DAY });

    return Math.max(1, difference + 1);
  } catch (error) {
    console.warn('Failed to compute week of month:', error);
    return 1;
  }
};

const getWeekCountForMonth = (year, month) => {
  if (!year || !month) {
    return 6;
  }

  try {
    const baseDate = new Date(year, month - 1, 1);
    const start = startOfMonth(baseDate);
    const end = endOfMonth(baseDate);
    const difference = differenceInCalendarWeeks(end, start, { weekStartsOn: WEEK_START_DAY });

    return Math.max(1, difference + 1);
  } catch (error) {
    console.warn('Failed to compute week count for month:', error);
    return 6;
  }
};

const computeDateRangeFromFilters = ({ year, month, week }) => {
  if (!year || !month) {
    return { startDate: null, endDate: null };
  }

  try {
    const baseDate = new Date(year, month - 1, 1);
    const monthStart = startOfMonth(baseDate);
    const monthEnd = endOfMonth(baseDate);

    if (week === 'all' || week === null || week === undefined) {
      return {
        startDate: formatDateForApi(monthStart),
        endDate: formatDateForApi(monthEnd),
      };
    }

    const weekIndex = Math.max(0, Number(week) - 1);
    const tentativeStart = addWeeks(startOfWeek(monthStart, { weekStartsOn: WEEK_START_DAY }), weekIndex);
    const weekStart = tentativeStart < monthStart ? monthStart : tentativeStart;
    const tentativeEnd = endOfWeek(weekStart, { weekStartsOn: WEEK_START_DAY });
    const weekEnd = tentativeEnd > monthEnd ? monthEnd : tentativeEnd;

    if (weekStart > monthEnd) {
      return {
        startDate: formatDateForApi(monthEnd),
        endDate: formatDateForApi(monthEnd),
      };
    }

    return {
      startDate: formatDateForApi(weekStart),
      endDate: formatDateForApi(weekEnd),
    };
  } catch (error) {
    console.warn('Failed to compute date range from filters:', error);
    return { startDate: null, endDate: null };
  }
};

const withDateRange = (filters) => {
  const fallbackNow = new Date();
  const base = filters ? { ...filters } : {};

  const monthNumber = safeNumber(base.month) ?? fallbackNow.getMonth() + 1;
  const yearNumber = safeNumber(base.year) ?? fallbackNow.getFullYear();
  const rawWeek =
    base.week === 'all' || base.week === null || typeof base.week === 'undefined'
      ? 'all'
      : safeNumber(base.week);

  const normalizedWeek =
    rawWeek === 'all' || rawWeek === null
      ? 'all'
      : Math.min(Math.max(1, rawWeek), getWeekCountForMonth(yearNumber, monthNumber));

  const range = computeDateRangeFromFilters({ year: yearNumber, month: monthNumber, week: normalizedWeek });

  return {
    ...base,
    month: monthNumber,
    year: yearNumber,
    week: normalizedWeek,
    startDate: range.startDate,
    endDate: range.endDate,
  };
};

const createDefaultFilters = () => {
  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();
  const weekCount = getWeekCountForMonth(defaultYear, defaultMonth);
  const computedWeek = Math.min(weekCount, computeWeekOfMonth(now));

  return {
    month: defaultMonth,
    year: defaultYear,
    week: computedWeek,
    wilbinId: null,
    shelterId: null,
    verificationStatus: 'all',
  };
};

const convertFiltersToApiParams = (filters) => {
  if (!filters) {
    return {};
  }

  const params = {};

  if (filters.startDate) {
    params.start_date = filters.startDate;
  }

  if (filters.endDate) {
    params.end_date = filters.endDate;
  }

  if (filters.month) {
    params.month = filters.month;
  }

  if (filters.year) {
    params.year = filters.year;
  }

  if (filters.week && filters.week !== 'all') {
    params.week = filters.week;
  }

  if (filters.wilbinId) {
    params.wilbin_id = filters.wilbinId;
  }

  if (filters.shelterId) {
    params.shelter_id = filters.shelterId;
  }

  if (filters.verificationStatus && filters.verificationStatus !== 'all') {
    params.verification_status = filters.verificationStatus;
  }

  return params;
};

const extractWilbinValue = (wilbin) => {
  if (!wilbin) {
    return null;
  }

  if (typeof wilbin === 'object') {
    return (
      wilbin.id ??
      wilbin.value ??
      wilbin.key ??
      wilbin.code ??
      wilbin.slug ??
      wilbin.identifier ??
      null
    );
  }

  return wilbin;
};

const extractWilbinLabel = (wilbin) => {
  if (!wilbin) {
    return '';
  }

  if (typeof wilbin === 'object') {
    return wilbin.name ?? wilbin.label ?? wilbin.title ?? wilbin.text ?? `${extractWilbinValue(wilbin) ?? ''}`;
  }

  return String(wilbin);
};

const AdminCabangAttendanceReportScreen = () => {
  const defaultFilters = useMemo(() => createDefaultFilters(), []);
  const [filterDraft, setFilterDraft] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(() => withDateRange(defaultFilters));

  const filterParams = useMemo(() => convertFiltersToApiParams(appliedFilters), [appliedFilters]);

  const { data: summaryData } = useAttendanceSummary();
  const {
    data: weeklyData,
    isLoading: isWeeklyLoading,
    error: weeklyError,
    refetch: refetchWeekly,
  } = useAttendanceWeekly(filterParams);
  const {
    data: shelterData,
    isLoading: isShelterLoading,
    error: shelterError,
    refetch: refetchShelters,
  } = useAttendanceWeeklyShelters(filterParams);
  const { data: trendData } = useAttendanceTrend();

  const [selectedShelter, setSelectedShelter] = useState(null);
  const [isDetailVisible, setDetailVisible] = useState(false);

  const availableWeekOptions = useMemo(() => {
    const weekCount = getWeekCountForMonth(filterDraft?.year, filterDraft?.month);

    return Array.from({ length: weekCount }, (_, index) => index + 1);
  }, [filterDraft?.year, filterDraft?.month]);

  const allShelterOptions = useMemo(() => {
    if (!Array.isArray(shelterData)) {
      return [];
    }

    return shelterData.map((item, index) => ({
      value: item?.id ?? item?.shelterId ?? item?.shelter_id ?? item?.code ?? `shelter-${index + 1}`,
      label: item?.name ?? item?.shelterName ?? item?.shelter_name ?? `Shelter ${index + 1}`,
      wilbinValue: extractWilbinValue(item?.wilbin),
      wilbinLabel: extractWilbinLabel(item?.wilbin),
    }));
  }, [shelterData]);

  const wilbinOptions = useMemo(() => {
    const map = new Map();

    allShelterOptions.forEach((option) => {
      if (option.wilbinValue === null || typeof option.wilbinValue === 'undefined') {
        return;
      }

      if (!map.has(option.wilbinValue)) {
        map.set(option.wilbinValue, option.wilbinLabel || `${option.wilbinValue}`);
      }
    });

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [allShelterOptions]);

  const shelterOptions = useMemo(() => {
    if (!Array.isArray(allShelterOptions) || allShelterOptions.length === 0) {
      return [];
    }

    if (!filterDraft?.wilbinId) {
      return allShelterOptions.map((option) => ({ value: option.value, label: option.label }));
    }

    return allShelterOptions
      .filter((option) => option.wilbinValue === filterDraft.wilbinId)
      .map((option) => ({ value: option.value, label: option.label }));
  }, [allShelterOptions, filterDraft?.wilbinId]);

  const activeFilters = useMemo(() => {
    const weeks = Array.isArray(weeklyData) ? weeklyData : [];

    const isValidDate = (value) => {
      if (!value) {
        return false;
      }

      const parsed = new Date(value);

      return !Number.isNaN(parsed.getTime());
    };

    const startDates = weeks.map((item) => item?.dates?.start).filter((value) => isValidDate(value));
    const endDates = weeks.map((item) => item?.dates?.end).filter((value) => isValidDate(value));

    const earliestStart =
      startDates.length > 0
        ? startDates.reduce((earliest, current) =>
            new Date(current) < new Date(earliest) ? current : earliest
          )
        : undefined;

    const latestEnd =
      endDates.length > 0
        ? endDates.reduce((latest, current) =>
            new Date(current) > new Date(latest) ? current : latest
          )
        : undefined;

    const combined = {
      ...(appliedFilters ?? {}),
      label: summaryData?.periodLabel ?? null,
    };

    if (!combined.startDate && earliestStart) {
      combined.startDate = earliestStart;
    }

    if (!combined.endDate && latestEnd) {
      combined.endDate = latestEnd;
    }

    return combined;
  }, [appliedFilters, weeklyData, summaryData?.periodLabel]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(withDateRange(filterDraft));
  }, [filterDraft]);

  const handleResetFilters = useCallback(() => {
    const defaults = createDefaultFilters();
    setFilterDraft(defaults);
    setAppliedFilters(withDateRange(defaults));
  }, []);

  const handleShelterRowPress = useCallback((shelter) => {
    if (!shelter) {
      return;
    }

    setSelectedShelter({
      id: shelter.id,
      name: shelter.name,
      wilbin: shelter.wilbin,
    });
    setDetailVisible(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailVisible(false);
    setSelectedShelter(null);
  }, []);

  const summaryMetrics = useMemo(() => {
    if (!summaryData) {
      return [];
    }

    return [
      {
        label: 'Total Kehadiran',
        value: summaryData.presentCount.toLocaleString('id-ID'),
      },
      {
        label: 'Rata-rata Kehadiran',
        value: `${summaryData.attendanceRate}%`,
      },
      {
        label: 'Anak Binaan Aktif',
        value: summaryData.activeChildren.toLocaleString('id-ID'),
      },
      {
        label: 'Total Absen',
        value: summaryData.absentCount.toLocaleString('id-ID'),
      },
    ];
  }, [summaryData]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AttendanceFilterBar
        filters={filterDraft}
        onFiltersChange={setFilterDraft}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        weekOptions={availableWeekOptions}
        wilbinOptions={wilbinOptions}
        shelterOptions={shelterOptions}
        isLoading={isWeeklyLoading || isShelterLoading}
      />

      <View style={styles.section}>
        <AttendanceSummarySection
          title="Ringkasan Kehadiran"
          description={summaryData ? `Periode laporan ${summaryData.periodLabel}` : undefined}
        >
          <View style={styles.summaryGrid}>
            {summaryMetrics.map((metric) => (
              <View key={metric.label} style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{metric.value}</Text>
                <Text style={styles.summaryLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>
        </AttendanceSummarySection>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rekap Mingguan Cabang</Text>
        <WeeklyBreakdownList
          data={weeklyData}
          isLoading={isWeeklyLoading}
          error={weeklyError}
          onRetry={refetchWeekly}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rekap Mingguan per Shelter</Text>
        <ShelterAttendanceTable
          data={shelterData}
          isLoading={isShelterLoading}
          error={shelterError}
          onRetry={refetchShelters}
          onRowPress={handleShelterRowPress}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tren Kehadiran</Text>
        <AttendanceTrendChart data={trendData} />
      </View>

      <ShelterAttendanceDetailModal
        visible={isDetailVisible}
        onClose={handleCloseDetail}
        shelterId={selectedShelter?.id}
        shelterName={selectedShelter?.name}
        shelterWilbin={selectedShelter?.wilbin}
        filters={activeFilters}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2d3436',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  summaryCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0984e3',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
  },
});

export default AdminCabangAttendanceReportScreen;
