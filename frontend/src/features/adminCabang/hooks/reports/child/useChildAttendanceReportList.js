import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../../api/adminCabangReportApi';

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

  return {
    attendanceRate: {
      value: attendanceRateValue,
      label: rawSummary.attendanceRateLabel || rawSummary.attendance_rate_label || null,
    },
    totals: {
      present: firstDefined(
        rawSummary.presentCount,
        rawSummary.present,
        totalsSource.present,
        totalsSource.presentCount,
        totalsSource.present_count,
        0,
      ),
      late: firstDefined(
        rawSummary.lateCount,
        rawSummary.late,
        totalsSource.late,
        totalsSource.lateCount,
        totalsSource.late_count,
        0,
      ),
      absent: firstDefined(
        rawSummary.absentCount,
        rawSummary.absent,
        totalsSource.absent,
        totalsSource.absentCount,
        totalsSource.absent_count,
        0,
      ),
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

  return {
    search: search ?? '',
    band: band ?? null,
  };
};

export const useChildAttendanceReportList = (initialParams = {}) => {
  const isMountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState(() => adaptSummary({}));
  const [children, setChildren] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', band: null });
  const [params, setParams] = useState(() => ({ page: 1, perPage: 10, search: '', band: null, ...initialParams }));
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
    params,
    error,
    errorMessage,
    setBand,
    setSearch,
    setPage,
    refresh,
    refetch,
  };
};

export default useChildAttendanceReportList;
