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
  assign(
    'attendance_band',
    params.attendance_band,
    params.attendanceBand,
    params.band,
    params.band_id,
  );
  assign('shelter_id', params.shelter_id, params.shelterId);
  assign('group_id', params.group_id, params.groupId);
  assign('start_date', params.start_date, params.startDate);
  assign('end_date', params.end_date, params.endDate);

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

  const presentCount = firstDefined(
    rawSummary.presentCount,
    rawSummary.present,
    totalsSource.present,
    totalsSource.presentCount,
    totalsSource.present_count,
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

  const absentCount = firstDefined(
    rawSummary.absentCount,
    rawSummary.absent,
    totalsSource.absent,
    totalsSource.absentCount,
    totalsSource.absent_count,
    0,
  );

  const totalSessions = firstDefined(
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

  return {
    attendanceRate: {
      value: attendanceRateValue,
      label: rawSummary.attendanceRateLabel || rawSummary.attendance_rate_label || null,
    },
    attendance_percentage: attendanceRateValue,
    presentCount,
    lateCount,
    absentCount,
    totalSessions,
    totalChildren,
    activeChildren,
    inactiveChildren,
    dateRange,
    generatedAt,
    reportDate,
    periodLabel,
    totals: {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      totalSessions,
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

  const band = firstDefined(
    rawFilters.band,
    rawFilters.attendanceBand,
    rawFilters.attendance_band,
    currentParams.band,
    currentParams.attendanceBand,
    currentParams.attendance_band,
    null,
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

  return {
    search: search ?? '',
    band: band ?? null,
    shelterId: shelterId ?? null,
    groupId: groupId ?? null,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
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
  const [filters, setFilters] = useState({
    search: '',
    band: null,
    shelterId: null,
    groupId: null,
    startDate: null,
    endDate: null,
  });
  const [availableFilters, setAvailableFilters] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chart, setChart] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [rawMetadata, setRawMetadata] = useState({});
  const [params, setParams] = useState(() => ({
    page: 1,
    perPage: 10,
    search: '',
    band: null,
    shelterId: null,
    groupId: null,
    startDate: null,
    endDate: null,
    ...initialParams,
  }));
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

  const setBand = useCallback((band) => {
    resetAppendState();
    setParams((prev) => ({ ...prev, page: 1, band }));
  }, [resetAppendState]);

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
    error,
    errorMessage,
    setBand,
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
