import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ERROR_MESSAGE = 'Gagal memuat laporan kehadiran anak cabang.';

const parseNumber = (value, fallback = 0) => {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return fallback;
  }

  return numeric;
};

const parsePercentage = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric <= 0) {
    return 0;
  }

  if (numeric >= 100) {
    return 100;
  }

  return Math.round(numeric * 10) / 10;
};

const toDateLabel = (dateString) => {
  if (!dateString) {
    return null;
  }

  const parsed = new Date(dateString);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split('T')[0];
};

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
};

const buildChildItem = (child) => {
  if (!child || typeof child !== 'object') {
    return null;
  }

  const attendance = child.attendance || {};

  return {
    ...child,
    attendance: {
      present_count: parseNumber(attendance.present_count ?? attendance.presentCount ?? attendance.hadir, 0),
      late_count: parseNumber(attendance.late_count ?? attendance.lateCount ?? attendance.terlambat, 0),
      absent_count: parseNumber(attendance.absent_count ?? attendance.absentCount ?? attendance.alpha, 0),
      total_sessions: parseNumber(
        attendance.total_sessions ?? attendance.totalSessions ?? attendance.total ?? attendance.activities,
        0,
      ),
      attendance_percentage: parsePercentage(
        attendance.attendance_percentage ?? attendance.percentage ?? attendance.rate,
      ),
      attendance_band: attendance.attendance_band ?? attendance.band ?? attendance.status ?? null,
    },
    monthly_breakdown: ensureArray(child.monthly_breakdown).map((month) => ({
      ...month,
      attendance_percentage: parsePercentage(
        month.attendance_percentage ?? month.percentage ?? month.rate,
      ),
      activities_count: parseNumber(month.activities_count ?? month.activitiesCount, 0),
      attended_count: parseNumber(month.attended_count ?? month.attendedCount ?? month.hadir, 0),
      late_count: parseNumber(month.late_count ?? month.lateCount ?? month.terlambat, 0),
      absent_count: parseNumber(month.absent_count ?? month.absentCount ?? month.alpha, 0),
    })),
  };
};

export const useChildAttendanceReportList = (initialParams = {}) => {
  const defaultFiltersRef = useRef({
    page: 1,
    per_page: initialParams.per_page || initialParams.perPage || DEFAULT_PAGE_SIZE,
    start_date: initialParams.start_date || initialParams.startDate || null,
    end_date: initialParams.end_date || initialParams.endDate || null,
    search: initialParams.search || initialParams.keyword || '',
    attendance_band:
      initialParams.attendance_band || initialParams.attendanceBand || initialParams.band || null,
    shelter_id: initialParams.shelter_id || initialParams.shelterId || null,
    group_id: initialParams.group_id || initialParams.groupId || null,
  });

  const filtersRef = useRef({ ...defaultFiltersRef.current });

  const [filters, setFilters] = useState({ ...filtersRef.current });
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(null);
  const [children, setChildren] = useState([]);
  const [shelterBreakdown, setShelterBreakdown] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [distribution, setDistribution] = useState({ high: 0, medium: 0, low: 0 });
  const [availableFilters, setAvailableFilters] = useState({});
  const [pagination, setPagination] = useState({});
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const assignFromPayload = useCallback((payload, { append } = {}) => {
    const summaryPayload = payload?.summary ?? {};

    setSummary({
      total_children: parseNumber(summaryPayload.total_children ?? summaryPayload.totalChildren, 0),
      total_shelters: parseNumber(summaryPayload.total_shelters ?? summaryPayload.totalShelters, 0),
      total_groups: parseNumber(summaryPayload.total_groups ?? summaryPayload.totalGroups, 0),
      total_sessions: parseNumber(summaryPayload.total_sessions ?? summaryPayload.totalSessions, 0),
      present_count: parseNumber(summaryPayload.present_count ?? summaryPayload.presentCount, 0),
      late_count: parseNumber(summaryPayload.late_count ?? summaryPayload.lateCount, 0),
      absent_count: parseNumber(summaryPayload.absent_count ?? summaryPayload.absentCount, 0),
      attendance_percentage: parsePercentage(
        summaryPayload.attendance_percentage ?? summaryPayload.attendancePercentage,
      ),
      low_band_children: parseNumber(
        summaryPayload.low_band_children ?? summaryPayload.lowBandChildren,
        0,
      ),
    });

    setPeriod(payload?.period ?? null);

    const mappedChildren = ensureArray(payload?.children)
      .map(buildChildItem)
      .filter(Boolean);

    setChildren((prev) => (append ? [...prev, ...mappedChildren] : mappedChildren));

    setShelterBreakdown(
      ensureArray(payload?.shelter_breakdown).map((item) => ({
        ...item,
        attendance_percentage: parsePercentage(
          item.attendance_percentage ?? item.attendancePercentage,
        ),
        present_count: parseNumber(item.present_count ?? item.presentCount, 0),
        late_count: parseNumber(item.late_count ?? item.lateCount, 0),
        absent_count: parseNumber(item.absent_count ?? item.absentCount, 0),
        total_children: parseNumber(item.total_children ?? item.totalChildren, 0),
        low_band_children: parseNumber(item.low_band_children ?? item.lowBandChildren, 0),
      })),
    );

    setChartData(
      ensureArray(payload?.shelter_attendance_chart).map((item) => ({
        ...item,
        attendance_percentage: parsePercentage(
          item.attendance_percentage ?? item.attendancePercentage,
        ),
      })),
    );

    const distributionPayload = payload?.attendance_band_distribution ?? {};
    setDistribution({
      high: parseNumber(distributionPayload.high, 0),
      medium: parseNumber(distributionPayload.medium, 0),
      low: parseNumber(distributionPayload.low, 0),
    });

    setAvailableFilters(payload?.available_filters ?? {});
    setPagination(payload?.pagination ?? {});
  }, []);

  const fetchData = useCallback(
    async (override = {}, { append = false, state = 'default' } = {}) => {
      const nextParams = {
        ...filtersRef.current,
        ...override,
      };

      if (!append && override.page === undefined) {
        nextParams.page = 1;
      }

      if (state === 'refresh') {
        setRefreshing(true);
      } else if (append) {
        setLoadingMore(true);
      } else if (state !== 'silent') {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await adminCabangReportApi.getChildAttendanceReport(nextParams);
        const payload = response?.data?.data ?? response?.data ?? response ?? {};

        assignFromPayload(payload, { append });
        setLastRefreshedAt(
          response?.data?.last_refreshed_at ?? response?.last_refreshed_at ?? null,
        );

        filtersRef.current = { ...nextParams, page: payload?.pagination?.current_page ?? nextParams.page ?? 1 };
        setFilters(filtersRef.current);
      } catch (err) {
        console.error(err);
        setError(err?.message || DEFAULT_ERROR_MESSAGE);
      } finally {
        if (state === 'refresh') {
          setRefreshing(false);
        } else if (append) {
          setLoadingMore(false);
        } else if (state !== 'silent') {
          setLoading(false);
        }
      }
    },
    [assignFromPayload],
  );

  const refresh = useCallback(() => {
    return fetchData({ page: 1 }, { state: 'refresh' });
  }, [fetchData]);

  const reload = useCallback(() => {
    return fetchData({ page: filtersRef.current.page || 1 }, { state: 'silent' });
  }, [fetchData]);

  const loadMore = useCallback(() => {
    const currentPage = parseNumber(pagination?.current_page ?? pagination?.currentPage ?? filtersRef.current.page, 1);
    const lastPage = parseNumber(pagination?.last_page ?? pagination?.lastPage ?? currentPage, currentPage);

    if (loadingMore || currentPage >= lastPage) {
      return Promise.resolve();
    }

    return fetchData({ page: currentPage + 1 }, { append: true });
  }, [fetchData, loadingMore, pagination]);

  const applyFilters = useCallback(
    (nextFilters = {}) => {
      filtersRef.current = { ...filtersRef.current, ...nextFilters, page: 1 };
      setFilters(filtersRef.current);

      return fetchData({ ...nextFilters, page: 1 }, { state: 'refresh' });
    },
    [fetchData],
  );

  const resetFilters = useCallback(() => {
    filtersRef.current = { ...defaultFiltersRef.current };
    setFilters(filtersRef.current);
    return fetchData(defaultFiltersRef.current, { state: 'refresh' });
  }, [fetchData]);

  const updateSearch = useCallback(
    (searchValue) => {
      filtersRef.current = { ...filtersRef.current, search: searchValue };
      setFilters(filtersRef.current);

      return fetchData({ search: searchValue, page: 1 });
    },
    [fetchData],
  );

  const updateDateRange = useCallback(
    ({ startDate, endDate }) => {
      const startLabel = toDateLabel(startDate);
      const endLabel = toDateLabel(endDate);

      filtersRef.current = {
        ...filtersRef.current,
        start_date: startLabel,
        end_date: endLabel,
        page: 1,
      };
      setFilters(filtersRef.current);

      return fetchData(
        {
          start_date: startLabel,
          end_date: endLabel,
          page: 1,
        },
        { state: 'refresh' },
      );
    },
    [fetchData],
  );

  useEffect(() => {
    fetchData({}, { state: 'silent' });
  }, [fetchData]);

  const computed = useMemo(
    () => ({
      high: distribution.high,
      medium: distribution.medium,
      low: distribution.low,
      total: distribution.high + distribution.medium + distribution.low,
    }),
    [distribution],
  );

  return {
    summary,
    period,
    children,
    shelterBreakdown,
    chartData,
    distribution,
    distributionSummary: computed,
    availableFilters,
    pagination,
    filters,
    lastRefreshedAt,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    reload,
    loadMore,
    applyFilters,
    resetFilters,
    updateSearch,
    updateDateRange,
  };
};

export default useChildAttendanceReportList;
