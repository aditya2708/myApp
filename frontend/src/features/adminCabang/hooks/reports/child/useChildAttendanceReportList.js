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
  const totalsSource = rawSummary.totals || {};

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

  return {
    attendanceRate: {
      value: attendanceRateValue,
      label: rawSummary.attendanceRateLabel || rawSummary.attendance_rate_label || null,
    },
    attendance_percentage: attendanceRateValue,
    presentCount,
    lateCount,
    absentCount,
    totals: {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      totalSessions: firstDefined(
        rawSummary.totalSessions,
        rawSummary.sessionCount,
        totalsSource.totalSessions,
        totalsSource.sessionCount,
        totalsSource.sessions,
        0,
      ),
      totalChildren: firstDefined(
        rawSummary.totalChildren,
        rawSummary.childrenCount,
        totalsSource.totalChildren,
        totalsSource.childrenCount,
        totalsSource.total,
        0,
      ),
    },
  };
};

const adaptPagination = (rawPagination = {}, fallbackParams = {}) => {
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
    total: firstDefined(rawPagination.total, rawPagination.total_items, rawPagination.totalItems, 0),
    totalPages: firstDefined(
      rawPagination.total_pages,
      rawPagination.totalPages,
      rawPagination.pages,
      1,
    ),
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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const queryParams = useMemo(() => normalizeParams(params), [params]);

  const fetchReport = useCallback(
    async ({ refreshing = false, showLoading = false } = {}) => {
      if (!isMountedRef.current) return;

      if (refreshing) {
        setIsRefreshing(true);
      }
      if (showLoading) {
        setIsLoading(true);
      }

      setError(null);
      setErrorMessage(null);

      try {
        const response = await adminCabangReportApi.getChildAttendanceReport(queryParams);
        if (!isMountedRef.current) return;

        const payload = response?.data ?? response ?? {};

        setSummary(adaptSummary(payload.summary || {}));
        setChildren(Array.isArray(payload.children) ? payload.children : []);
        setPagination(adaptPagination(payload.pagination || {}, queryParams));
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
      } finally {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [params, queryParams],
  );

  useEffect(() => {
    fetchReport({ showLoading: true });
  }, [fetchReport]);

  const setPage = useCallback((page) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const setBand = useCallback((band) => {
    setParams((prev) => ({ ...prev, page: 1, band }));
  }, []);

  const setSearch = useCallback((search) => {
    setParams((prev) => ({ ...prev, page: 1, search }));
  }, []);

  const setShelterId = useCallback((shelterId) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      shelterId,
      shelter_id: shelterId,
    }));
  }, []);

  const setGroupId = useCallback((groupId) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      groupId,
      group_id: groupId,
    }));
  }, []);

  const setStartDate = useCallback((startDate) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      startDate,
      start_date: startDate,
    }));
  }, []);

  const setEndDate = useCallback((endDate) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      endDate,
      end_date: endDate,
    }));
  }, []);

  const refresh = useCallback(() => {
    fetchReport({ refreshing: true });
  }, [fetchReport]);

  const refetch = useCallback(() => {
    fetchReport({ showLoading: true });
  }, [fetchReport]);

  return {
    isLoading,
    isRefreshing,
    summary,
    children,
    pagination,
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
  };
};

export default useChildAttendanceReportList;
