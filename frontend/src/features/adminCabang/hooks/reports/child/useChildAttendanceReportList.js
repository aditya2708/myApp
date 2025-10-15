import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';

const firstDefined = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

const normalizeSortDirectionValue = (value) => {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'asc' || normalized === 'desc') {
    return normalized;
  }

  return null;
};

const normalizeParams = (params = {}) => {
  const normalized = {};

  const assign = (key, ...candidates) => {
    const value = firstDefined(...candidates);
    if (value !== undefined) {
      normalized[key] = value;
    }
  };

  assign('page', params.page, params.current_page, params.currentPage);
  assign('per_page', params.per_page, params.perPage, params.pageSize);
  assign('search', params.search, params.keyword, params.q, params.term, '');
  assign('shelter_id', params.shelter_id, params.shelterId);
  assign('group_id', params.group_id, params.groupId);
  assign('start_date', params.start_date, params.startDate);
  assign('end_date', params.end_date, params.endDate);
  assign('sort_by', params.sort_by, params.sortBy, 'attendance_rate');

  const sortDirection = normalizeSortDirectionValue(
    firstDefined(params.sort_direction, params.sortDirection, params.order),
  );
  if (sortDirection) {
    normalized.sort_direction = sortDirection;
  }

  return normalized;
};

const adaptSummary = (rawSummary = {}) => {
  const totalsSource = rawSummary.totals || rawSummary || {};

  const attendanceRateValue = firstDefined(
    rawSummary.attendanceRate,
    rawSummary.attendance_rate,
    rawSummary.rate,
    totalsSource.attendanceRate,
    totalsSource.attendance_rate,
    0,
  );

  const presentLegacyValue = firstDefined(
    rawSummary.presentCount,
    rawSummary.present,
    rawSummary.present_count,
    totalsSource.presentCount,
    totalsSource.present,
    totalsSource.present_count,
    0,
  );

  const hadirValue = firstDefined(
    rawSummary.hadir,
    rawSummary.hadir_count,
    rawSummary.hadirCount,
    rawSummary.totalHadir,
    rawSummary.total_hadir,
    totalsSource.hadir,
    totalsSource.hadir_count,
    totalsSource.hadirCount,
    totalsSource.totalHadir,
    totalsSource.total_hadir,
    presentLegacyValue,
    0,
  );

  const lateCount = firstDefined(
    rawSummary.lateCount,
    rawSummary.late,
    totalsSource.late,
    totalsSource.lateCount,
    totalsSource.late_count,
    0,
  );

  const absentLegacyValue = firstDefined(
    rawSummary.absentCount,
    rawSummary.absent,
    rawSummary.absent_count,
    totalsSource.absentCount,
    totalsSource.absent,
    totalsSource.absent_count,
    0,
  );

  const tidakHadirValue = firstDefined(
    rawSummary.tidakHadir,
    rawSummary.tidak_hadir,
    rawSummary.tidakHadirCount,
    rawSummary.tidak_hadir_count,
    totalsSource.tidakHadir,
    totalsSource.tidak_hadir,
    totalsSource.tidakHadirCount,
    totalsSource.tidak_hadir_count,
    absentLegacyValue,
    0,
  );

  const totalSessionsLegacy = firstDefined(
    rawSummary.totalSessions,
    rawSummary.sessionCount,
    rawSummary.total_sessions,
    rawSummary.sessions,
    totalsSource.totalSessions,
    totalsSource.sessionCount,
    totalsSource.total_sessions,
    totalsSource.sessions,
    0,
  );

  const totalAktivitasValue = firstDefined(
    rawSummary.totalAktivitas,
    rawSummary.total_aktivitas,
    rawSummary.totalActivities,
    rawSummary.total_activities,
    totalsSource.totalAktivitas,
    totalsSource.total_aktivitas,
    totalsSource.totalActivities,
    totalsSource.total_activities,
    totalSessionsLegacy,
    Number(hadirValue || 0) + Number(tidakHadirValue || 0),
    0,
  );

  const totalChildren = firstDefined(
    rawSummary.totalChildren,
    rawSummary.childrenCount,
    rawSummary.total_children,
    totalsSource.totalChildren,
    totalsSource.childrenCount,
    totalsSource.total_children,
    totalsSource.total,
    0,
  );

  const activeChildren = firstDefined(
    rawSummary.activeChildren,
    rawSummary.active_children,
    rawSummary.activeCount,
    totalsSource.activeChildren,
    totalsSource.active_children,
    totalsSource.activeCount,
    0,
  );

  const inactiveChildren = firstDefined(
    rawSummary.inactiveChildren,
    rawSummary.inactive_children,
    rawSummary.inactiveCount,
    totalsSource.inactiveChildren,
    totalsSource.inactive_children,
    totalsSource.inactiveCount,
    0,
  );

  const dateRange = {
    label: firstDefined(
      rawSummary.dateRange?.label,
      rawSummary.date_range?.label,
      rawSummary.period?.label,
      rawSummary.periodLabel,
      rawSummary.dateRangeLabel,
      null,
    ),
    start: firstDefined(
      rawSummary.dateRange?.start,
      rawSummary.date_range?.start,
      rawSummary.period?.start,
      rawSummary.startDate,
      rawSummary.start_date,
      null,
    ),
    end: firstDefined(
      rawSummary.dateRange?.end,
      rawSummary.date_range?.end,
      rawSummary.period?.end,
      rawSummary.endDate,
      rawSummary.end_date,
      null,
    ),
    value: firstDefined(
      rawSummary.dateRange?.value,
      rawSummary.date_range?.value,
      null,
    ),
  };

  const reportDate = firstDefined(
    rawSummary.reportDate,
    rawSummary.report_date,
    rawSummary.generatedAt,
    rawSummary.generated_at,
    null,
  );

  const generatedAt = firstDefined(
    rawSummary.generatedAt,
    rawSummary.generated_at,
    rawSummary.reportGeneratedAt,
    rawSummary.report_generated_at,
    rawSummary.reportDateLabel,
    rawSummary.report_date_label,
    null,
  );

  const periodLabel = firstDefined(
    rawSummary.periodLabel,
    rawSummary.period?.label,
    dateRange.label,
    null,
  );

  const presentCount = hadirValue;
  const absentCount = tidakHadirValue;
  const totalSessions = totalAktivitasValue;

  return {
    attendanceRate: {
      value: attendanceRateValue,
      label: rawSummary.attendanceRateLabel || rawSummary.attendance_rate_label || null,
    },
    attendance_percentage: attendanceRateValue,
    hadir: hadirValue,
    hadirCount: hadirValue,
    hadir_count: hadirValue,
    present: presentCount,
    presentCount,
    present_count: presentCount,
    lateCount,
    late_count: lateCount,
    tidakHadir: tidakHadirValue,
    tidak_hadir: tidakHadirValue,
    tidakHadirCount: tidakHadirValue,
    tidak_hadir_count: tidakHadirValue,
    absentCount,
    absent_count: absentCount,
    totalAktivitas: totalAktivitasValue,
    total_aktivitas: totalAktivitasValue,
    totalActivities: totalAktivitasValue,
    total_activities: totalAktivitasValue,
    totalSessions,
    sessions: totalSessions,
    totalChildren,
    activeChildren,
    inactiveChildren,
    dateRange,
    generatedAt,
    reportDate,
    periodLabel,
    totals: {
      hadir: hadirValue,
      hadirCount: hadirValue,
      hadir_count: hadirValue,
      present: presentCount,
      presentCount,
      present_count: presentCount,
      late: lateCount,
      lateCount,
      late_count: lateCount,
      tidakHadir: tidakHadirValue,
      tidak_hadir: tidakHadirValue,
      tidakHadirCount: tidakHadirValue,
      tidak_hadir_count: tidakHadirValue,
      absent: absentCount,
      absentCount,
      absent_count: absentCount,
      totalAktivitas: totalAktivitasValue,
      total_aktivitas: totalAktivitasValue,
      totalActivities: totalAktivitasValue,
      total_activities: totalAktivitasValue,
      totalSessions,
      sessions: totalSessions,
      totalChildren,
      activeChildren,
      inactiveChildren,
    },
  };
};

const adaptPagination = (rawPagination = {}, fallbackParams = {}) => {
  const totalPages = firstDefined(
    rawPagination.total_pages,
    rawPagination.totalPages,
    rawPagination.pages,
    rawPagination.last_page,
    fallbackParams.total_pages,
    fallbackParams.totalPages,
    fallbackParams.pages,
    fallbackParams.last_page,
    1,
  );

  return {
    page: firstDefined(
      rawPagination.current_page,
      rawPagination.currentPage,
      rawPagination.page,
      fallbackParams.page,
      1,
    ),
    perPage: firstDefined(
      rawPagination.per_page,
      rawPagination.perPage,
      rawPagination.page_size,
      fallbackParams.per_page,
      fallbackParams.perPage,
      10,
    ),
    total: firstDefined(
      rawPagination.total,
      rawPagination.total_items,
      rawPagination.totalItems,
      fallbackParams.total,
      fallbackParams.total_items,
      fallbackParams.totalItems,
      0,
    ),
    totalPages,
    lastPage: totalPages,
  };
};

const adaptFilters = (rawFilters = {}, currentParams = {}) => {
  const search = firstDefined(
    rawFilters.search,
    rawFilters.keyword,
    rawFilters.q,
    currentParams.search,
    '',
  );

  const shelterId = firstDefined(
    rawFilters.shelter_id,
    rawFilters.shelterId,
    currentParams.shelter_id,
    currentParams.shelterId,
    null,
  );

  const groupId = firstDefined(
    rawFilters.group_id,
    rawFilters.groupId,
    currentParams.group_id,
    currentParams.groupId,
    null,
  );

  const startDate = firstDefined(
    rawFilters.start_date,
    rawFilters.startDate,
    currentParams.start_date,
    currentParams.startDate,
    null,
  );

  const endDate = firstDefined(
    rawFilters.end_date,
    rawFilters.endDate,
    currentParams.end_date,
    currentParams.endDate,
    null,
  );

  const paramSortPreference = normalizeSortDirectionValue(
    firstDefined(
      currentParams.sortDirection,
      currentParams.sort_direction,
      currentParams.order,
    ),
  );

  const sortCandidate = firstDefined(
    rawFilters.sortDirection,
    rawFilters.sort_direction,
    paramSortPreference,
  );

  let normalizedSortDirection = normalizeSortDirectionValue(sortCandidate);
  if (normalizedSortDirection === 'desc' && !paramSortPreference) {
    normalizedSortDirection = null;
  }

  return {
    search: search ?? '',
    shelterId: shelterId ?? null,
    groupId: groupId ?? null,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
    sortDirection: normalizedSortDirection,
  };
};

const adaptPayloadExtras = (payload = {}) => {
  const {
    summary,
    children,
    pagination,
    filters,
    metadata: metadataPayload,
    ...rest
  } = payload || {};

  const availableFilters = firstDefined(rest.available_filters, rest.availableFilters, null);
  const shelters = rest.shelters || rest.shelter_list || rest.shelterOptions || [];
  const groups = rest.groups || rest.group_list || rest.groupOptions || [];
  const chart = rest.chart ?? null;
  const chartData = firstDefined(rest.chart_data, rest.chartData, chart, null);

  return {
    availableFilters,
    shelters: Array.isArray(shelters) ? shelters : [],
    groups: Array.isArray(groups) ? groups : [],
    chart,
    chartData,
    metadata: metadataPayload || {},
    rawMetadata: rest,
  };
};

export const useChildAttendanceReportList = (initialParams = {}) => {
  const isMountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState(() => adaptSummary({}));
  const [children, setChildren] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const initialSortDirection = normalizeSortDirectionValue(
    firstDefined(
      initialParams.sortDirection,
      initialParams.sort_direction,
      initialParams.order,
    ),
  );

  const [filters, setFilters] = useState(() => ({
    search: '',
    shelterId: null,
    groupId: null,
    startDate: null,
    endDate: null,
    sortDirection: initialSortDirection,
  }));
  const [availableFilters, setAvailableFilters] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chart, setChart] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [rawMetadata, setRawMetadata] = useState({});

  const [params, setParams] = useState(() => {
    const baseParams = {
      page: 1,
      perPage: 10,
      search: '',
      shelterId: null,
      groupId: null,
      startDate: null,
      endDate: null,
      ...initialParams,
      sortBy: 'attendance_rate',
      sort_by: 'attendance_rate',
    };

    if (initialSortDirection) {
      baseParams.sortDirection = initialSortDirection;
      baseParams.sort_direction = initialSortDirection;
    } else {
      delete baseParams.sortDirection;
      delete baseParams.sort_direction;
    }

    return baseParams;
  });
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const appendModeRef = useRef(false);
  const lastSuccessfulPageRef = useRef(1);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const queryParams = useMemo(() => normalizeParams(params), [params]);

  const resetAppendState = useCallback(() => {
    appendModeRef.current = false;
    setIsFetchingMore(false);
  }, []);

  const fetchReport = useCallback(
    async ({ refreshing = false, showLoading = false } = {}) => {
      if (!isMountedRef.current) return;

      const currentPageFromQuery = queryParams.page ?? params.page ?? 1;
      const isAppendMode = appendModeRef.current && currentPageFromQuery > 1;

      if (refreshing) {
        setIsRefreshing(true);
      }
      if (showLoading && !isAppendMode) {
        setIsLoading(true);
      }

      if (isAppendMode) {
        setIsFetchingMore(true);
      }

      setError(null);
      setErrorMessage(null);

      try {
        const response = await adminCabangReportApi.getChildAttendanceReport(queryParams);
        if (!isMountedRef.current) return;

        const payload = response?.data ?? response ?? {};

        setSummary(adaptSummary(payload.summary || {}));
        const nextChildren = Array.isArray(payload.children) ? payload.children : [];
        setChildren((prevChildren) => {
          if (isAppendMode) {
            return [...prevChildren, ...nextChildren];
          }

          return nextChildren;
        });

        const nextPagination = adaptPagination(payload.pagination || {}, queryParams);
        setPagination(nextPagination);
        lastSuccessfulPageRef.current = nextPagination.page ?? nextPagination.current_page ?? 1;
        setFilters(adaptFilters(payload.filters || {}, { ...params, ...queryParams }));
        const extras = adaptPayloadExtras(payload);
        setAvailableFilters(extras.availableFilters);
        setShelters(extras.shelters);
        setGroups(extras.groups);
        setChart(extras.chart);
        setChartData(extras.chartData);
        setMetadata(extras.metadata);
        setRawMetadata(extras.rawMetadata);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err);
        setErrorMessage(err?.message || '');
        const lastSuccessfulPage = lastSuccessfulPageRef.current ?? 1;
        setParams((prev) => {
          const currentPage = prev.page ?? lastSuccessfulPage;
          if (currentPage === lastSuccessfulPage) {
            return prev;
          }
          return { ...prev, page: lastSuccessfulPage };
        });
        resetAppendState();
      } finally {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
        if (appendModeRef.current) {
          resetAppendState();
        }
      }
    },
    [params, queryParams, resetAppendState],
  );

  useEffect(() => {
    fetchReport({ showLoading: true });
  }, [fetchReport]);

  const setPage = useCallback(
    (page) => {
      const nextPage = typeof page === 'number' ? page : Number(page);
      if (!nextPage || nextPage <= 1) {
        resetAppendState();
      }
      setParams((prev) => {
        if (prev.page === nextPage) return prev;
        return { ...prev, page: nextPage || 1 };
      });
    },
    [resetAppendState],
  );

  const setSortDirection = useCallback(
    (direction) => {
      resetAppendState();
      const normalized = normalizeSortDirectionValue(direction);

      setFilters((prevFilters) => ({
        ...prevFilters,
        sortDirection: normalized,
      }));

      setParams((prev) => {
        const base = {
          ...prev,
          page: 1,
          sortBy: 'attendance_rate',
          sort_by: 'attendance_rate',
        };

        if (normalized) {
          return {
            ...base,
            sortDirection: normalized,
            sort_direction: normalized,
          };
        }

        const { sort_direction: _ignoredSortDirection, ...rest } = base;

        return {
          ...rest,
          sortDirection: null,
        };
      });
    },
    [resetAppendState],
  );

  const setSearch = useCallback((search) => {
    resetAppendState();
    setParams((prev) => ({ ...prev, page: 1, search }));
  }, [resetAppendState]);

  const setShelterId = useCallback((shelterId) => {
    resetAppendState();
    setParams((prev) => ({
      ...prev,
      page: 1,
      shelterId,
      shelter_id: shelterId,
    }));
  }, [resetAppendState]);

  const setGroupId = useCallback((groupId) => {
    resetAppendState();
    setParams((prev) => ({
      ...prev,
      page: 1,
      groupId,
      group_id: groupId,
    }));
  }, [resetAppendState]);

  const setStartDate = useCallback((startDate) => {
    resetAppendState();
    setParams((prev) => ({
      ...prev,
      page: 1,
      startDate,
      start_date: startDate,
    }));
  }, [resetAppendState]);

  const setEndDate = useCallback((endDate) => {
    resetAppendState();
    setParams((prev) => ({
      ...prev,
      page: 1,
      endDate,
      end_date: endDate,
    }));
  }, [resetAppendState]);

  const refresh = useCallback(() => {
    resetAppendState();
    fetchReport({ refreshing: true });
  }, [fetchReport, resetAppendState]);

  const refetch = useCallback(() => {
    resetAppendState();
    fetchReport({ showLoading: true });
  }, [fetchReport, resetAppendState]);

  const hasNextPage = useMemo(() => {
    if (!pagination) return false;
    const totalPages = pagination.totalPages ?? pagination.lastPage ?? 1;
    const currentPage =
      pagination.page ??
      pagination.current_page ??
      params.page ??
      queryParams.page ??
      1;

    if (!totalPages) return false;
    return currentPage < totalPages;
  }, [pagination, params, queryParams]);

  const loadMore = useCallback(() => {
    if (isFetchingMore || isLoading || !hasNextPage) {
      return;
    }

    appendModeRef.current = true;
    setIsFetchingMore(true);
    setParams((prev) => ({
      ...prev,
      page: (prev.page ?? queryParams.page ?? 1) + 1,
    }));
  }, [hasNextPage, isFetchingMore, isLoading, queryParams.page]);

  const fetchNextPage = useCallback(() => {
    loadMore();
  }, [loadMore]);

  return {
    isLoading,
    isRefreshing,
    isFetchingMore,
    summary,
    children,
    pagination,
    hasNextPage,
    filters,
    availableFilters,
    shelters,
    groups,
    chart,
    chartData,
    metadata,
    rawMetadata,
    params,
    sortDirection: params.sortDirection ?? params.sort_direction ?? 'desc',
    error,
    errorMessage,
    setSortDirection,
    setSearch,
    setPage,
    setShelterId,
    setGroupId,
    setStartDate,
    setEndDate,
    refresh,
    refetch,
    loadMore,
    fetchNextPage,
  };
};

export default useChildAttendanceReportList;
