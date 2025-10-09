import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ERROR_MESSAGE = 'Gagal memuat data kehadiran mingguan cabang.';

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
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

const calculatePercentage = (count, total) => {
  const safeTotal = toNumber(total, 0);
  const safeCount = toNumber(count, 0);

  if (safeTotal <= 0) {
    return null;
  }

  return clampPercentage((safeCount / safeTotal) * 100);
};

const extractDateRange = (payload = {}) => {
  const start =
    payload?.startDate ??
    payload?.start_date ??
    payload?.start ??
    payload?.dateStart ??
    payload?.date_start ??
    payload?.dates?.start ??
    null;
  const end =
    payload?.endDate ??
    payload?.end_date ??
    payload?.end ??
    payload?.dateEnd ??
    payload?.date_end ??
    payload?.dates?.end ??
    null;
  const label =
    payload?.dateRange ??
    payload?.date_range ??
    payload?.dateLabel ??
    payload?.date_label ??
    payload?.dates?.label ??
    payload?.label ??
    payload?.name ??
    payload?.title ??
    null;

  return { start: start || null, end: end || null, label: label || null };
};

const normalizeVerification = (payload = {}) => ({
  verified:
    toNumber(
      payload?.verified ??
        payload?.verifiedCount ??
        payload?.verified_count ??
        payload?.approval_verified ??
        payload?.approval?.verified,
      0,
    ) || 0,
  pending:
    toNumber(
      payload?.pending ??
        payload?.pendingCount ??
        payload?.pending_count ??
        payload?.waiting ??
        payload?.approval_pending ??
        payload?.approval?.pending,
      0,
    ) || 0,
  rejected:
    toNumber(
      payload?.rejected ??
        payload?.rejectedCount ??
        payload?.rejected_count ??
        payload?.declined ??
        payload?.approval_rejected ??
        payload?.approval?.rejected,
      0,
    ) || 0,
});

const buildBreakdown = ({ present, late, absent }, totalSessions) => ({
  present: {
    count: present,
    percentage: calculatePercentage(present, totalSessions),
  },
  late: {
    count: late,
    percentage: calculatePercentage(late, totalSessions),
  },
  absent: {
    count: absent,
    percentage: calculatePercentage(absent, totalSessions),
  },
});

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

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split('T')[0];
};

const normalizeSummary = (payload = {}) => {
  const presentCount = toNumber(
    payload?.presentCount ?? payload?.present_count ?? payload?.present ?? payload?.hadir,
    0,
  );
  const lateCount = toNumber(payload?.lateCount ?? payload?.late_count ?? payload?.late ?? payload?.terlambat, 0);
  const absentCount = toNumber(
    payload?.absentCount ?? payload?.absent_count ?? payload?.absent ?? payload?.alpha,
    0,
  );

  const totalSessions = (() => {
    const explicitTotal =
      payload?.totalSessions ??
      payload?.total_sessions ??
      payload?.total ??
      payload?.totals?.sessions ??
      payload?.totals?.activities ??
      payload?.totalActivities ??
      payload?.total_activities ??
      payload?.activities ??
      payload?.activityCount ??
      payload?.activity_count ??
      payload?.totalChildren ??
      payload?.total_children;

    if (explicitTotal !== undefined && explicitTotal !== null) {
      return toNumber(explicitTotal, presentCount + lateCount + absentCount);
    }

    return presentCount + lateCount + absentCount;
  })();

  const verificationPayload =
    payload?.verification ??
    payload?.verifications ??
    payload?.approval ??
    payload?.approvalStats ??
    {};

  const totalActivities = (() => {
    const activitiesCandidate =
      payload?.totals?.activities ??
      payload?.totalActivities ??
      payload?.total_activities ??
      payload?.activities ??
      payload?.activityCount ??
      payload?.activity_count ??
      payload?.totalAktivitas ??
      payload?.total_aktivitas;

    if (activitiesCandidate !== undefined && activitiesCandidate !== null) {
      return toNumber(activitiesCandidate, totalSessions);
    }

    const legacySessions =
      payload?.totals?.sessions ??
      payload?.sessions ??
      payload?.totalSessions ??
      payload?.total_sessions;

    if (legacySessions !== undefined && legacySessions !== null) {
      return toNumber(legacySessions, totalSessions);
    }

    return totalSessions;
  })();

  return {
    attendanceRate:
      clampPercentage(
        payload?.attendanceRate ??
          payload?.attendance_rate ??
          payload?.attendancePercentage ??
          payload?.attendance_percentage ??
          payload?.percentage ??
          calculatePercentage(presentCount, totalSessions),
      ) ?? 0,
    summary: buildBreakdown({ present: presentCount, late: lateCount, absent: absentCount }, totalSessions),
    verification: normalizeVerification(verificationPayload),
    totals: {
      activities: totalActivities,
      sessions: toNumber(
        payload?.totals?.sessions ??
          payload?.sessions ??
          payload?.totalSessions ??
          payload?.total_sessions ??
          totalActivities,
        totalActivities,
      ),
    },
    dates: extractDateRange(payload),
  };
};

const normalizeWeek = (item, index = 0) => {
  if (!item) {
    return null;
  }

  const summaryPayload = item?.summary ?? item?.metrics ?? item;
  const baseSummary = normalizeSummary(summaryPayload);
  const dateRange = extractDateRange(item);

  const idCandidate =
    item?.id ??
    item?.weekId ??
    item?.week_id ??
    item?.periodId ??
    item?.period_id ??
    baseSummary?.dates?.id ??
    `week-${index + 1}`;

  const labelCandidate =
    item?.label ??
    item?.name ??
    item?.title ??
    item?.weekLabel ??
    item?.week_label ??
    baseSummary?.dates?.label ??
    `Minggu ${index + 1}`;

  return {
    ...baseSummary,
    id: idCandidate,
    label: labelCandidate,
    dates: {
      start: dateRange.start ?? baseSummary.dates?.start ?? null,
      end: dateRange.end ?? baseSummary.dates?.end ?? null,
      label: dateRange.label ?? baseSummary.dates?.label ?? labelCandidate,
    },
  };
};

const normalizeShelter = (item, index = 0) => {
  if (!item) {
    return null;
  }

  const summaryPayload = item?.summary ?? item?.metrics ?? item;
  const summary = normalizeSummary(summaryPayload);

  return {
    id:
      item?.id ??
      item?.shelterId ??
      item?.shelter_id ??
      item?.kode_shelter ??
      item?.code ??
      `shelter-${index + 1}`,
    name: item?.name ?? item?.shelterName ?? item?.shelter_name ?? 'Shelter',
    wilbin: item?.wilbin ?? item?.wilayah ?? item?.wilayahBinaan ?? item?.wilayah_binaan ?? null,
    attendanceRate:
      clampPercentage(
        item?.attendanceRate ??
          item?.attendance_rate ??
          item?.percentage ??
          summary?.attendanceRate,
      ) ?? null,
    summary: summary.summary,
    verification: summary.verification,
    totalActivities: summary.totals?.activities ?? summary.totals?.sessions ?? null,
    totalSessions: summary.totals?.sessions ?? summary.totals?.activities ?? null,
    band: item?.band ?? item?.bandLabel ?? item?.band_label ?? null,
  };
};

const normalizePagination = (payload = {}, pageSize = DEFAULT_PAGE_SIZE, listLength = 0) => {
  const perPage = toNumber(
    payload?.per_page ?? payload?.perPage ?? payload?.limit ?? payload?.pageSize ?? pageSize,
    pageSize,
  );
  const currentPage = toNumber(payload?.current_page ?? payload?.currentPage ?? payload?.page ?? 1, 1);
  const totalItems = toNumber(payload?.total ?? payload?.total_items ?? payload?.totalItems ?? listLength, listLength);
  const totalPages = (() => {
    const candidate =
      payload?.total_pages ??
      payload?.totalPages ??
      payload?.last_page ??
      (perPage > 0 ? Math.ceil(totalItems / perPage) : 1);
    return toNumber(candidate, 1) || 1;
  })();

  return {
    page: currentPage,
    perPage,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
  };
};

const normalizeBands = (payload = []) => {
  return ensureArray(payload).map((item, index) => ({
    id: item?.id ?? item?.value ?? item?.code ?? `band-${index + 1}`,
    label: item?.label ?? item?.name ?? item?.title ?? String(item?.value ?? item?.label ?? 'Band'),
    description: item?.description ?? item?.subtitle ?? null,
    color: item?.color ?? item?.hex ?? null,
    backgroundColor: item?.backgroundColor ?? item?.background ?? null,
    min: item?.min ?? item?.minValue ?? item?.min_value ?? null,
    max: item?.max ?? item?.maxValue ?? item?.max_value ?? null,
  }));
};

const normalizePeriod = (payload = {}) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const dateRange = extractDateRange(payload);

  return {
    id: payload?.id ?? payload?.periodId ?? payload?.period_id ?? payload?.weekId ?? payload?.week_id ?? null,
    label: payload?.label ?? payload?.name ?? payload?.title ?? dateRange.label ?? null,
    dateRange,
  };
};

const normalizeDashboard = (payload = {}, pageSize = DEFAULT_PAGE_SIZE) => {
  const weeksPayload =
    payload?.weeks ??
    payload?.weekList ??
    payload?.periods ??
    payload?.items?.weeks ??
    payload?.data?.weeks ??
    payload?.data;

  const sheltersPayload =
    payload?.shelters ??
    payload?.shelterCards ??
    payload?.shelter_list ??
    payload?.data?.shelters ??
    payload?.items?.shelters ??
    payload?.results ??
    payload;

  const weeks = ensureArray(weeksPayload).map((item, index) => normalizeWeek(item, index)).filter(Boolean);

  const shelters = ensureArray(
    sheltersPayload?.items ??
      sheltersPayload?.data ??
      sheltersPayload?.list ??
      sheltersPayload?.records ??
      sheltersPayload,
  )
    .map((item, index) => normalizeShelter(item, index))
    .filter(Boolean);

  const paginationPayload =
    sheltersPayload?.pagination ??
    sheltersPayload?.meta ??
    payload?.pagination ??
    payload?.meta ??
    {};

  return {
    period: normalizePeriod(payload?.period ?? payload?.currentPeriod ?? payload?.current_period ?? {}),
    summary: normalizeSummary(payload?.summary ?? payload?.overview ?? payload?.aggregates ?? {}),
    weeks,
    shelters,
    pagination: normalizePagination(paginationPayload, pageSize, shelters.length),
    bands: normalizeBands(payload?.bands ?? payload?.bandOptions ?? payload?.band_options ?? []),
  };
};

const useWeeklyAttendanceDashboard = ({
  search = '',
  bands = [],
  pageSize = DEFAULT_PAGE_SIZE,
  autoFetch = true,
  initialWeekId = null,
  startDate = null,
  endDate = null,
  autoSelectFirstWeek = true,
} = {}) => {
  const [state, setState] = useState({
    period: null,
    summary: null,
    weeks: [],
    shelters: [],
    pagination: { page: 1, perPage: pageSize, totalItems: 0, totalPages: 1, hasNextPage: false },
    bands: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWeekId, setSelectedWeekId] = useState(initialWeekId);

  const selectedWeekRef = useRef(initialWeekId);

  useEffect(() => {
    selectedWeekRef.current = selectedWeekId;
  }, [selectedWeekId]);

  const normalizedSearch = useMemo(() => search?.toString().trim(), [search]);
  const normalizedBands = useMemo(() => (Array.isArray(bands) ? bands.filter(Boolean) : []), [bands]);
  const normalizedStartDate = useMemo(() => normalizeDateInput(startDate), [startDate]);
  const normalizedEndDate = useMemo(() => normalizeDateInput(endDate), [endDate]);

  const weeksRef = useRef(state.weeks);
  const rangeKeyRef = useRef(`${normalizedStartDate || ''}|${normalizedEndDate || ''}`);

  const buildParams = useCallback(
    ({ page = 1, week } = {}) => {
      const params = {
        page,
        per_page: pageSize,
        perPage: pageSize,
      };

      const resolvedWeek = week !== undefined ? week : selectedWeekRef.current;

      if (resolvedWeek) {
        params.week_id = resolvedWeek;
        params.weekId = resolvedWeek;
      }

      if (normalizedSearch) {
        params.search = normalizedSearch;
        params.keyword = normalizedSearch;
        params.q = normalizedSearch;
      }

      if (normalizedBands.length) {
        params.band = normalizedBands;
        params.bands = normalizedBands;
        params.band_ids = normalizedBands;
      }

      if (normalizedStartDate) {
        params.start_date = normalizedStartDate;
        params.startDate = normalizedStartDate;
        params.date_start = normalizedStartDate;
      }

      if (normalizedEndDate) {
        params.end_date = normalizedEndDate;
        params.endDate = normalizedEndDate;
        params.date_end = normalizedEndDate;
      }

      return params;
    },
    [normalizedBands, normalizedEndDate, normalizedSearch, normalizedStartDate, pageSize],
  );

  const fetchData = useCallback(
    async ({ append = false, page = 1, weekId } = {}) => {
      if (!autoFetch) {
        return null;
      }

      const params = buildParams({ page, week: weekId });

      try {
        if (append) {
          setIsFetchingMore(true);
        } else {
          setIsLoading(true);
        }

        setError(null);

        const response = await adminCabangReportApi.getWeeklyAttendanceDashboard(params);
        const payload = response?.data ?? response ?? {};
        const normalized = normalizeDashboard(payload, pageSize);

        setState((prev) => {
          const nextShelters = (() => {
            if (!append) {
              return normalized.shelters;
            }

            if (!normalized.shelters.length) {
              return prev.shelters;
            }

            return [...(prev.shelters || []), ...normalized.shelters];
          })();

          return {
            period: normalized.period ?? prev.period,
            summary: normalized.summary ?? prev.summary,
            weeks: normalized.weeks.length ? normalized.weeks : prev.weeks,
            shelters: nextShelters,
            pagination: { ...normalized.pagination, page },
            bands: normalized.bands.length ? normalized.bands : prev.bands,
          };
        });

        if (weekId !== undefined) {
          selectedWeekRef.current = weekId;
          setSelectedWeekId(weekId || null);
        } else if (!selectedWeekRef.current && normalized.weeks.length && autoSelectFirstWeek) {
          const defaultWeekId = normalized.weeks[0]?.id ?? null;
          selectedWeekRef.current = defaultWeekId;
          setSelectedWeekId(defaultWeekId);
        }

        return normalized;
      } catch (err) {
        console.error('Failed to fetch weekly attendance dashboard', {
          params,
          status: err?.response?.status,
          data: err?.response?.data,
          error: err,
        });

        const message = err?.message;
        setError(message || DEFAULT_ERROR_MESSAGE);
        throw err;
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [autoFetch, autoSelectFirstWeek, buildParams, pageSize],
  );

  useEffect(() => {
    weeksRef.current = state.weeks;
  }, [state.weeks]);

  useEffect(() => {
    if (!autoFetch) {
      return undefined;
    }

    let isMounted = true;

    fetchData({ append: false, page: 1 }).catch(() => {
      if (!isMounted) {
        return;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [autoFetch, fetchData, normalizedBands, normalizedSearch]);

  useEffect(() => {
    const nextRangeKey = `${normalizedStartDate || ''}|${normalizedEndDate || ''}`;

    if (!autoFetch) {
      rangeKeyRef.current = nextRangeKey;
      return undefined;
    }

    if (rangeKeyRef.current === nextRangeKey) {
      return undefined;
    }

    rangeKeyRef.current = nextRangeKey;

    if (selectedWeekRef.current) {
      return undefined;
    }

    let isMounted = true;

    fetchData({ append: false, page: 1, weekId: null }).catch(() => {
      if (!isMounted) {
        return;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [autoFetch, fetchData, normalizedEndDate, normalizedStartDate]);

  const refresh = useCallback(async () => {
    return fetchData({ append: false, page: 1, weekId: selectedWeekRef.current });
  }, [fetchData]);

  const loadMore = useCallback(
    ({ nextPage } = {}) => {
      const currentPagination = state.pagination || {};
      const targetPage = nextPage ?? (currentPagination.page || 1) + 1;

      if (!currentPagination.hasNextPage || isLoading || isFetchingMore) {
        return;
      }

      fetchData({ append: true, page: targetPage, weekId: selectedWeekRef.current }).catch(() => {});
    },
    [fetchData, isFetchingMore, isLoading, state.pagination],
  );

  const selectWeek = useCallback(
    (weekId) => {
      const nextWeekId = weekId || null;
      const matchedWeek = nextWeekId
        ? (weeksRef.current || []).find((week) => week.id === nextWeekId) || null
        : null;

      if (nextWeekId === selectedWeekRef.current) {
        return matchedWeek;
      }

      selectedWeekRef.current = nextWeekId;
      setSelectedWeekId(nextWeekId);

      if (nextWeekId) {
        fetchData({ append: false, page: 1, weekId: nextWeekId }).catch(() => {});
      }

      return matchedWeek;
    },
    [fetchData],
  );

  const weeks = useMemo(() => state.weeks, [state.weeks]);
  const shelters = useMemo(() => state.shelters, [state.shelters]);
  const pagination = useMemo(() => state.pagination, [state.pagination]);
  const bandsMeta = useMemo(() => state.bands, [state.bands]);
  const summary = useMemo(() => state.summary, [state.summary]);
  const period = useMemo(() => state.period, [state.period]);

  const selectedWeek = useMemo(() => {
    if (!weeks || !weeks.length) {
      return null;
    }

    if (selectedWeekId) {
      return weeks.find((week) => week.id === selectedWeekId) || weeks[0];
    }

    if (normalizedStartDate || normalizedEndDate) {
      return null;
    }

    if (!autoSelectFirstWeek) {
      return null;
    }

    return weeks[0];
  }, [autoSelectFirstWeek, normalizedEndDate, normalizedStartDate, selectedWeekId, weeks]);

  const hasNextPage = pagination?.hasNextPage ?? false;

  return {
    period,
    summary,
    weeks,
    shelters,
    pagination,
    bands: bandsMeta,
    selectedWeek,
    selectedWeekId,
    selectWeek,
    isLoading,
    isFetchingMore,
    error,
    refresh,
    loadMore,
    hasNextPage,
  };
};

export default useWeeklyAttendanceDashboard;

