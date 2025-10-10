import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../../api/adminCabangReportApi';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ERROR_MESSAGE = 'Gagal memuat data laporan kehadiran anak.';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  if (typeof value === 'object') {
    const nested = firstDefined(
      value.data,
      value.items,
      value.list,
      value.rows,
      value.records,
      value.children,
    );

    if (nested !== undefined) {
      return ensureArray(nested);
    }
  }

  return [value].filter(Boolean);
};

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return fallback;
  }

  return numeric;
};

const clampPercentage = (value) => {
  if (value === null || value === undefined) {
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

const normalizeDateInput = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split('T')[0];
};

const extractDateRange = (payload = {}) => ({
  start:
    payload?.startDate ??
    payload?.start_date ??
    payload?.start ??
    payload?.dateStart ??
    payload?.date_start ??
    payload?.dates?.start ??
    null,
  end:
    payload?.endDate ??
    payload?.end_date ??
    payload?.end ??
    payload?.dateEnd ??
    payload?.date_end ??
    payload?.dates?.end ??
    null,
  label:
    payload?.dateLabel ??
    payload?.date_label ??
    payload?.dateRange ??
    payload?.date_range ??
    payload?.dates?.label ??
    payload?.label ??
    payload?.name ??
    payload?.title ??
    null,
});

const createPercentageMetric = (value, formatter, fallback = 0) => {
  const clamped = clampPercentage(value);
  const safeValue = clamped === null ? fallback : clamped;

  return {
    value: safeValue,
    label: `${formatter.format(safeValue)}%`,
  };
};

const buildTotals = (present, late, absent, total) => {
  const safePresent = toNumber(present, 0);
  const safeLate = toNumber(late, 0);
  const safeAbsent = toNumber(absent, 0);
  const fallbackTotal = safePresent + safeLate + safeAbsent;

  return {
    present: safePresent,
    late: safeLate,
    absent: safeAbsent,
    totalSessions: toNumber(total, fallbackTotal),
  };
};

const normalizeVerification = (payload = {}) => ({
  verified:
    toNumber(
      firstDefined(
        payload?.verified,
        payload?.verifiedCount,
        payload?.verified_count,
        payload?.approval_verified,
        payload?.approval?.verified,
      ),
      0,
    ) || 0,
  pending:
    toNumber(
      firstDefined(
        payload?.pending,
        payload?.pendingCount,
        payload?.pending_count,
        payload?.approval_pending,
        payload?.approval?.pending,
      ),
      0,
    ) || 0,
  rejected:
    toNumber(
      firstDefined(
        payload?.rejected,
        payload?.rejectedCount,
        payload?.rejected_count,
        payload?.approval_rejected,
        payload?.approval?.rejected,
      ),
      0,
    ) || 0,
});

const normalizeSummary = (payload = {}, formatter) => {
  const summaryPayload = payload?.summary ?? payload ?? {};

  const totals = buildTotals(
    summaryPayload?.presentCount ?? summaryPayload?.present_count ?? summaryPayload?.present,
    summaryPayload?.lateCount ?? summaryPayload?.late_count ?? summaryPayload?.late,
    summaryPayload?.absentCount ?? summaryPayload?.absent_count ?? summaryPayload?.absent,
    summaryPayload?.totalSessions ??
      summaryPayload?.total_sessions ??
      summaryPayload?.total ??
      summaryPayload?.totalActivities ??
      summaryPayload?.total_activities ??
      summaryPayload?.activities,
  );

  const totalChildren = toNumber(
    firstDefined(
      summaryPayload?.totalChildren,
      summaryPayload?.total_children,
      summaryPayload?.childrenCount,
      summaryPayload?.childCount,
    ),
    0,
  );

  return {
    dateRange: extractDateRange(summaryPayload),
    attendanceRate: createPercentageMetric(
      firstDefined(
        summaryPayload?.attendanceRate,
        summaryPayload?.attendance_rate,
        summaryPayload?.attendancePercentage,
        summaryPayload?.attendance_percentage,
        summaryPayload?.rate,
      ),
      formatter,
      0,
    ),
    totalChildren,
    activeChildren: toNumber(
      firstDefined(
        summaryPayload?.activeChildren,
        summaryPayload?.active_children,
        summaryPayload?.activeCount,
        summaryPayload?.active_count,
      ),
      totalChildren,
    ),
    totalSessions: totals.totalSessions,
    breakdown: {
      present: totals.present,
      late: totals.late,
      absent: totals.absent,
    },
    verification: normalizeVerification(
      summaryPayload?.verification ??
        summaryPayload?.approval ??
        summaryPayload?.approvalStats ??
        summaryPayload?.approval_stats ??
        summaryPayload,
    ),
  };
};

const normalizeChildItem = (payload = {}, formatter) => {
  const summaryPayload = payload?.summary ?? payload ?? {};
  const totals = buildTotals(
    payload?.presentCount ?? payload?.present_count ?? summaryPayload?.presentCount ?? summaryPayload?.present,
    payload?.lateCount ?? payload?.late_count ?? summaryPayload?.lateCount ?? summaryPayload?.late,
    payload?.absentCount ?? payload?.absent_count ?? summaryPayload?.absentCount ?? summaryPayload?.absent,
    payload?.totalSessions ??
      payload?.total_sessions ??
      summaryPayload?.totalSessions ??
      summaryPayload?.total_sessions ??
      summaryPayload?.total,
  );

  const shelterPayload = payload?.shelter ?? {};
  const groupPayload = payload?.group ?? {};

  return {
    id: firstDefined(payload?.id, payload?.child_id, payload?.childId, payload?.attendance_id, null),
    name: firstDefined(payload?.name, payload?.child_name, payload?.childName, ''),
    identifier: firstDefined(
      payload?.identifier,
      payload?.child_identifier,
      payload?.childIdentifier,
      payload?.code,
      payload?.child_code,
      null,
    ),
    shelter: {
      id: firstDefined(payload?.shelter_id, payload?.shelterId, shelterPayload?.id, null),
      name: firstDefined(payload?.shelter_name, payload?.shelterName, shelterPayload?.name, null),
    },
    group: {
      id: firstDefined(payload?.group_id, payload?.groupId, groupPayload?.id, null),
      name: firstDefined(payload?.group_name, payload?.groupName, groupPayload?.name, null),
    },
    attendanceRate: createPercentageMetric(
      firstDefined(
        payload?.attendanceRate,
        payload?.attendance_rate,
        payload?.attendancePercentage,
        summaryPayload?.attendanceRate,
        summaryPayload?.attendance_rate,
      ),
      formatter,
      0,
    ),
    totals,
    verification: normalizeVerification(
      payload?.verification ??
        payload?.approval ??
        payload?.approvalStats ??
        payload?.approval_stats ??
        summaryPayload?.verification,
    ),
    lastAttendanceDate: firstDefined(
      payload?.last_attendance_date,
      payload?.lastAttendanceDate,
      payload?.lastAttendance?.date,
      null,
    ),
    lastAttendanceStatus: firstDefined(
      payload?.last_attendance_status,
      payload?.lastAttendanceStatus,
      payload?.lastAttendance?.status,
      null,
    ),
  };
};

const normalizeShelterBreakdown = (items, formatter) =>
  ensureArray(items).map((item) => ({
    id: firstDefined(item?.id, item?.shelter_id, item?.shelterId, null),
    name: firstDefined(item?.name, item?.label, item?.title, item?.shelter_name, ''),
    attendanceRate: createPercentageMetric(
      firstDefined(item?.attendanceRate, item?.attendance_rate, item?.percentage, item?.rate),
      formatter,
      0,
    ),
    totalChildren: toNumber(
      firstDefined(item?.totalChildren, item?.total_children, item?.childrenCount, item?.count),
      0,
    ),
    breakdown: {
      present: toNumber(firstDefined(item?.presentCount, item?.present_count, item?.present), 0),
      late: toNumber(firstDefined(item?.lateCount, item?.late_count, item?.late), 0),
      absent: toNumber(firstDefined(item?.absentCount, item?.absent_count, item?.absent), 0),
    },
  }));

const normalizeBandDistribution = (items, formatter) =>
  ensureArray(items).map((item) => ({
    id: firstDefined(item?.id, item?.band, item?.value, item?.code, null),
    band: firstDefined(item?.band, item?.code, item?.value, null),
    label: firstDefined(item?.label, item?.band_label, item?.name, item?.title, null),
    percentage: createPercentageMetric(
      firstDefined(item?.percentage, item?.rate, item?.attendanceRate, item?.attendance_rate),
      formatter,
      0,
    ),
    count: toNumber(firstDefined(item?.count, item?.total, item?.total_children, item?.childrenCount), 0),
  }));

const normalizeShelterChart = (items, formatter) =>
  ensureArray(items).map((item) => ({
    id: firstDefined(item?.id, item?.shelter_id, item?.shelterId, item?.value, null),
    label: firstDefined(item?.label, item?.name, item?.title, item?.shelter_name, null),
    percentage: createPercentageMetric(
      firstDefined(item?.percentage, item?.attendanceRate, item?.attendance_rate, item?.rate),
      formatter,
      0,
    ),
    totalChildren: toNumber(
      firstDefined(item?.totalChildren, item?.total_children, item?.childrenCount, item?.count),
      0,
    ),
  }));

const normalizeAvailableFilters = (payload = {}, formatter) => ({
  bands: normalizeBandDistribution(
    firstDefined(
      payload?.attendanceBands,
      payload?.attendance_bands,
      payload?.bands,
      payload?.bandOptions,
      payload?.band_options,
      [],
    ),
    formatter,
  ),
  shelters: ensureArray(
    firstDefined(payload?.shelters, payload?.shelterOptions, payload?.shelter_options, []),
  ).map((item) => ({
    id: firstDefined(item?.id, item?.value, item?.shelter_id, null),
    name: firstDefined(item?.name, item?.label, item?.title, null),
    band: firstDefined(item?.band, item?.attendance_band, item?.band_id, null),
  })),
  groups: ensureArray(firstDefined(payload?.groups, payload?.groupOptions, payload?.group_options, [])).map(
    (item) => ({
      id: firstDefined(item?.id, item?.value, item?.group_id, null),
      name: firstDefined(item?.name, item?.label, item?.title, null),
      shelterId: firstDefined(item?.shelter_id, item?.shelterId, item?.parent_id, null),
    }),
  ),
});

const normalizeActiveFilters = (payload = {}) => ({
  search: firstDefined(payload?.search, payload?.keyword, payload?.q, ''),
  band: firstDefined(payload?.attendance_band, payload?.attendanceBand, payload?.band, null),
  shelterId: firstDefined(payload?.shelter_id, payload?.shelterId, null),
  groupId: firstDefined(payload?.group_id, payload?.groupId, null),
  startDate: firstDefined(payload?.start_date, payload?.startDate, null),
  endDate: firstDefined(payload?.end_date, payload?.endDate, null),
});

const normalizePagination = (payload = {}) => {
  const candidates = [
    payload?.pagination,
    payload?.meta,
    payload?.children?.pagination,
    payload?.children?.meta,
  ].filter(Boolean);

  const source = candidates.find((item) => typeof item === 'object') ?? {};

  return {
    page: toNumber(
      firstDefined(source?.current_page, source?.page, source?.pageNumber, payload?.page),
      DEFAULT_PAGE,
    ),
    perPage: toNumber(
      firstDefined(source?.per_page, source?.perPage, source?.page_size, source?.limit, payload?.per_page),
      DEFAULT_PAGE_SIZE,
    ),
    total: toNumber(
      firstDefined(source?.total, source?.total_items, source?.totalItems, source?.count),
      0,
    ),
    totalPages: toNumber(
      firstDefined(source?.total_pages, source?.totalPages, source?.pages, source?.pageCount),
      1,
    ),
  };
};

/**
 * Fetch and manage the child attendance report list, including filters and pagination state.
 * @param {Object} [options]
 * @param {boolean} [options.autoFetch=true] - Automatically fetch on mount and dependency changes.
 * @param {boolean} [options.enabled=true] - When false the hook will not trigger network calls automatically.
 * @param {number} [options.pageSize=10] - Default page size for pagination.
 * @param {number} [options.page=1] - Initial page number.
 * @param {string} [options.search=''] - Initial applied search keyword.
 * @param {Object} [options.filters] - Initial filter values.
 * @returns {Object}
 */
export const useChildAttendanceReportList = (options = {}) => {
  const {
    autoFetch = true,
    enabled = true,
    pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
    page: initialPage = DEFAULT_PAGE,
    search: initialSearch = '',
    filters: initialFilters = {},
  } = options;

  const percentageFormatter = useMemo(
    () =>
      new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
    [],
  );

  const [page, setPage] = useState(toNumber(initialPage, DEFAULT_PAGE));
  const [pageSize, setPageSize] = useState(toNumber(initialPageSize, DEFAULT_PAGE_SIZE));
  const [search, setSearch] = useState(initialSearch);
  const [band, setBand] = useState(initialFilters.band ?? null);
  const [shelterId, setShelterId] = useState(initialFilters.shelterId ?? null);
  const [groupId, setGroupId] = useState(initialFilters.groupId ?? null);
  const [dateRange, setDateRange] = useState({
    start: initialFilters.startDate ?? null,
    end: initialFilters.endDate ?? null,
  });

  const [rawPayload, setRawPayload] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(autoFetch && enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastQueryRef = useRef(null);
  const hasFetchedRef = useRef(false);

  const buildQuery = useCallback(() => {
    const query = {
      page,
      per_page: pageSize,
    };

    if (search) {
      query.search = search;
    }

    if (band) {
      query.attendance_band = band;
    }

    if (shelterId) {
      query.shelter_id = shelterId;
    }

    if (groupId) {
      query.group_id = groupId;
    }

    const startDate = normalizeDateInput(dateRange.start);
    const endDate = normalizeDateInput(dateRange.end);

    if (startDate) {
      query.start_date = startDate;
    }

    if (endDate) {
      query.end_date = endDate;
    }

    return query;
  }, [band, dateRange.end, dateRange.start, groupId, page, pageSize, search, shelterId]);

  const fetchList = useCallback(
    async ({ query, overrides } = {}, { initial = false, silent = false } = {}) => {
      if (!enabled) {
        return null;
      }

      const baseQuery = query ?? { ...buildQuery(), ...(overrides || {}) };
      lastQueryRef.current = baseQuery;

      if (!silent) {
        if (initial || !hasFetchedRef.current) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
      }

      try {
        const response = await adminCabangReportApi.getChildAttendanceReport(baseQuery);
        const payload = response?.data ?? response ?? null;
        setRawPayload(payload);
        setError(null);
        hasFetchedRef.current = true;
        return payload;
      } catch (err) {
        setError(err);
        if (!hasFetchedRef.current) {
          setRawPayload(null);
        }
        return null;
      } finally {
        if (!silent) {
          if (initial || !hasFetchedRef.current) {
            setIsLoading(false);
          } else {
            setIsRefreshing(false);
          }
        }
      }
    },
    [buildQuery, enabled],
  );

  useEffect(() => {
    if (!autoFetch || !enabled) {
      return;
    }

    fetchList({}, { initial: !hasFetchedRef.current });
  }, [autoFetch, enabled, fetchList]);

  const appliedFilters = useMemo(() => {
    if (!rawPayload) {
      return {
        search,
        band,
        shelterId,
        groupId,
        startDate: normalizeDateInput(dateRange.start),
        endDate: normalizeDateInput(dateRange.end),
      };
    }

    return {
      ...normalizeActiveFilters(
        rawPayload?.filters ??
          rawPayload?.filter ??
          rawPayload?.applied_filters ??
          rawPayload?.appliedFilters,
      ),
    };
  }, [band, dateRange.end, dateRange.start, groupId, rawPayload, search, shelterId]);

  const summary = useMemo(() => normalizeSummary(rawPayload?.summary ?? rawPayload ?? {}, percentageFormatter), [
    percentageFormatter,
    rawPayload,
  ]);

  const children = useMemo(
    () => ensureArray(rawPayload?.children).map((item) => normalizeChildItem(item, percentageFormatter)),
    [percentageFormatter, rawPayload],
  );

  const shelterBreakdown = useMemo(
    () => normalizeShelterBreakdown(
      rawPayload?.shelter_breakdown ?? rawPayload?.shelterBreakdown ?? [],
      percentageFormatter,
    ),
    [percentageFormatter, rawPayload],
  );

  const shelterChart = useMemo(
    () =>
      normalizeShelterChart(
        rawPayload?.shelter_attendance_chart ??
          rawPayload?.shelterAttendanceChart ??
          rawPayload?.attendance_chart,
        percentageFormatter,
      ),
    [percentageFormatter, rawPayload],
  );

  const bandDistribution = useMemo(
    () =>
      normalizeBandDistribution(
        rawPayload?.attendance_band_distribution ??
          rawPayload?.attendanceBandDistribution ??
          rawPayload?.band_distribution,
        percentageFormatter,
      ),
    [percentageFormatter, rawPayload],
  );

  const availableFilters = useMemo(
    () =>
      normalizeAvailableFilters(
        rawPayload?.available_filters ??
          rawPayload?.availableFilters ??
          rawPayload?.filters?.available ??
          rawPayload?.filters,
        percentageFormatter,
      ),
    [percentageFormatter, rawPayload],
  );

  const pagination = useMemo(() => normalizePagination(rawPayload ?? {}), [rawPayload]);

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }

    if (typeof error === 'string') {
      return error;
    }

    return error?.message || DEFAULT_ERROR_MESSAGE;
  }, [error]);

  const updateSearch = useCallback((value) => {
    setPage(DEFAULT_PAGE);
    setSearch(value || '');
  }, []);

  const updateBand = useCallback((value) => {
    setPage(DEFAULT_PAGE);
    setBand(value || null);
  }, []);

  const updateShelter = useCallback((value) => {
    setPage(DEFAULT_PAGE);
    const normalized = value || null;
    setShelterId((previous) => {
      if (previous !== normalized) {
        setGroupId(null);
      }

      return normalized;
    });
  }, []);

  const updateGroup = useCallback((value) => {
    setPage(DEFAULT_PAGE);
    setGroupId(value || null);
  }, []);

  const updateDateRange = useCallback((range = {}) => {
    setPage(DEFAULT_PAGE);
    setDateRange({
      start: range.start ?? range?.from ?? null,
      end: range.end ?? range?.to ?? null,
    });
  }, []);

  const changePage = useCallback((nextPage) => {
    const numeric = toNumber(nextPage, DEFAULT_PAGE);
    setPage(numeric <= 0 ? DEFAULT_PAGE : numeric);
  }, []);

  const changePageSize = useCallback((size) => {
    const numeric = toNumber(size, DEFAULT_PAGE_SIZE);
    const safeSize = numeric > 0 ? numeric : DEFAULT_PAGE_SIZE;
    setPageSize(safeSize);
    setPage(DEFAULT_PAGE);
  }, []);

  const resetFilters = useCallback(() => {
    setBand(null);
    setShelterId(null);
    setGroupId(null);
    setDateRange({ start: null, end: null });
    setSearch('');
    setPage(DEFAULT_PAGE);
  }, []);

  const refresh = useCallback(() => {
    const query = lastQueryRef.current ?? buildQuery();
    return fetchList({ query }, { initial: false });
  }, [buildQuery, fetchList]);

  return {
    summary,
    children,
    shelterBreakdown,
    shelterChart,
    bandDistribution,
    availableFilters,
    pagination,
    filters: appliedFilters,
    params: {
      page,
      pageSize,
      search,
      band,
      shelterId,
      groupId,
      dateRange,
    },
    isLoading,
    isRefreshing,
    error,
    errorMessage,
    setSearch: updateSearch,
    setBand: updateBand,
    setShelter: updateShelter,
    setGroup: updateGroup,
    setDateRange: updateDateRange,
    setPage: changePage,
    setPageSize: changePageSize,
    resetFilters,
    refresh,
    refetch: refresh,
    fetch: fetchList,
  };
};

export default useChildAttendanceReportList;
