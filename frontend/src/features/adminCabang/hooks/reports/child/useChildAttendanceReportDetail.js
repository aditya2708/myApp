import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../../api/adminCabangReportApi';

const DEFAULT_ERROR_MESSAGE = 'Gagal memuat detail laporan kehadiran anak.';

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

const normalizeChild = (payload = {}, formatter) => {
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

const normalizeMonthlyBreakdown = (items, formatter) =>
  ensureArray(items).map((item) => ({
    id: firstDefined(item?.id, item?.month, item?.period, item?.value, null),
    label: firstDefined(item?.label, item?.month_label, item?.monthName, item?.name, item?.title, null),
    attendanceRate: createPercentageMetric(
      firstDefined(item?.attendanceRate, item?.attendance_rate, item?.percentage, item?.rate),
      formatter,
      0,
    ),
    totals: buildTotals(
      item?.presentCount ?? item?.present_count ?? item?.present,
      item?.lateCount ?? item?.late_count ?? item?.late,
      item?.absentCount ?? item?.absent_count ?? item?.absent,
      item?.totalSessions ?? item?.total_sessions ?? item?.total,
    ),
  }));

const normalizeTimeline = (items) =>
  ensureArray(items).map((item) => ({
    id: firstDefined(item?.id, item?.timeline_id, item?.attendance_id, item?.value, null),
    date: firstDefined(item?.date, item?.attendanceDate, item?.attendance_date, item?.tanggal, null),
    status: firstDefined(item?.status, item?.attendance_status, item?.status_code, null),
    statusLabel: firstDefined(item?.status_label, item?.label, item?.statusLabel, item?.status_name, null),
    statusColor: firstDefined(item?.status_color, item?.statusColor, item?.color, null),
    note: firstDefined(item?.note, item?.notes, item?.keterangan, null),
    mentor: firstDefined(item?.mentor, item?.mentor_name, item?.mentorName, null),
    activity: firstDefined(
      item?.activity,
      item?.activity_name,
      item?.activityName,
      item?.schedule_name,
      item?.scheduleName,
      null,
    ),
    verificationStatus: firstDefined(
      item?.verification_status,
      item?.verificationStatus,
      item?.approval_status,
      null,
    ),
    verificationLabel: firstDefined(
      item?.verification_label,
      item?.verificationLabel,
      item?.approval_label,
      null,
    ),
  }));

const normalizeStreaks = (items, formatter) =>
  ensureArray(items).map((item) => ({
    id: firstDefined(item?.id, item?.type, item?.label, item?.name, null),
    type: firstDefined(item?.type, item?.streak_type, item?.category, null),
    label: firstDefined(item?.label, item?.title, item?.name, null),
    value: toNumber(firstDefined(item?.value, item?.days, item?.length, item?.count), 0),
    percentage: createPercentageMetric(
      firstDefined(item?.percentage, item?.rate, item?.attendanceRate, item?.attendance_rate),
      formatter,
      0,
    ),
    dateRange: {
      start:
        item?.start ??
        item?.startDate ??
        item?.start_date ??
        item?.dateStart ??
        item?.dates?.start ??
        null,
      end:
        item?.end ??
        item?.endDate ??
        item?.end_date ??
        item?.dateEnd ??
        item?.dates?.end ??
        null,
    },
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

/**
 * Fetch detailed child attendance report for a selected child.
 * @param {string|number|null} childId - Selected child identifier.
 * @param {Object} [options]
 * @param {boolean} [options.autoFetch=true] - Automatically fetch on mount/changes.
 * @param {boolean} [options.enabled=true] - When false, the hook will not request data automatically.
 * @param {Object} [options.params] - Initial filter params (band, shelterId, groupId, startDate, endDate, etc.).
 * @returns {Object}
 */
export const useChildAttendanceReportDetail = (childId, options = {}) => {
  const { autoFetch = true, enabled = true, params: initialParams = {} } = options;

  const percentageFormatter = useMemo(
    () =>
      new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
    [],
  );

  const initialBand = firstDefined(
    initialParams.band,
    initialParams.attendance_band,
    initialParams.attendanceBand,
    null,
  );
  const initialShelter = firstDefined(initialParams.shelterId, initialParams.shelter_id, null);
  const initialGroup = firstDefined(initialParams.groupId, initialParams.group_id, null);
  const initialStart = normalizeDateInput(firstDefined(initialParams.startDate, initialParams.start_date));
  const initialEnd = normalizeDateInput(firstDefined(initialParams.endDate, initialParams.end_date));

  const [band, setBand] = useState(initialBand ?? null);
  const [shelterId, setShelterId] = useState(initialShelter ?? null);
  const [groupId, setGroupId] = useState(initialGroup ?? null);
  const [dateRange, setDateRange] = useState({ start: initialStart ?? null, end: initialEnd ?? null });
  const [additionalParams, setAdditionalParams] = useState(() => {
    const {
      band: _band,
      attendance_band: _attendanceBand,
      attendanceBand: _bandCamel,
      shelterId: _shelterId,
      shelter_id: _shelter_id,
      groupId: _groupId,
      group_id: _group_id,
      startDate: _startDate,
      start_date: _start_date,
      endDate: _endDate,
      end_date: _end_date,
      ...rest
    } = initialParams || {};

    return { ...rest };
  });

  const [rawPayload, setRawPayload] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(autoFetch && enabled && Boolean(childId));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastQueryRef = useRef(null);
  const hasFetchedRef = useRef(false);

  const buildQuery = useCallback(() => {
    const query = { ...additionalParams };

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
  }, [additionalParams, band, dateRange.end, dateRange.start, groupId, shelterId]);

  const fetchDetail = useCallback(
    async ({ query, overrides } = {}, { initial = false, silent = false } = {}) => {
      if (!enabled || !childId) {
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
        const response = await adminCabangReportApi.getChildAttendanceReportDetail(childId, baseQuery);
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
    [buildQuery, childId, enabled],
  );

  useEffect(() => {
    if (!autoFetch || !enabled || !childId) {
      return;
    }

    fetchDetail({}, { initial: !hasFetchedRef.current });
  }, [autoFetch, childId, enabled, fetchDetail]);

  const summary = useMemo(() => normalizeSummary(rawPayload?.summary ?? rawPayload ?? {}, percentageFormatter), [
    percentageFormatter,
    rawPayload,
  ]);

  const child = useMemo(() => {
    if (!rawPayload) {
      return null;
    }

    const childSource =
      rawPayload?.child ??
      rawPayload?.children ??
      rawPayload?.profile ??
      rawPayload?.data ??
      rawPayload;

    if (Array.isArray(childSource)) {
      const firstChild = childSource[0];
      return firstChild ? normalizeChild(firstChild, percentageFormatter) : null;
    }

    return normalizeChild(childSource, percentageFormatter);
  }, [percentageFormatter, rawPayload]);

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

  const monthlyBreakdown = useMemo(
    () =>
      normalizeMonthlyBreakdown(
        rawPayload?.monthly_breakdown ??
          rawPayload?.monthlyBreakdown ??
          rawPayload?.monthly ??
          rawPayload?.months,
        percentageFormatter,
      ),
    [percentageFormatter, rawPayload],
  );

  const timeline = useMemo(
    () =>
      normalizeTimeline(
        rawPayload?.timeline ??
          rawPayload?.attendance_timeline ??
          rawPayload?.history ??
          rawPayload?.records,
      ),
    [rawPayload],
  );

  const streaks = useMemo(
    () => normalizeStreaks(rawPayload?.streaks ?? rawPayload?.streak ?? [], percentageFormatter),
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

  const breakdown = useMemo(
    () => ({
      shelter: shelterBreakdown,
      chart: shelterChart,
      distribution: bandDistribution,
      monthly: monthlyBreakdown,
      streaks,
    }),
    [bandDistribution, monthlyBreakdown, shelterBreakdown, shelterChart, streaks],
  );

  const verificationStats = useMemo(() => summary.verification, [summary]);

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }

    if (typeof error === 'string') {
      return error;
    }

    return error?.message || DEFAULT_ERROR_MESSAGE;
  }, [error]);

  const updateAdditionalParams = useCallback((params) => {
    setAdditionalParams((prev) => ({ ...prev, ...(params || {}) }));
  }, []);

  const clearAdditionalParams = useCallback(() => {
    setAdditionalParams({});
  }, []);

  const updateDateRange = useCallback((range = {}) => {
    setDateRange({
      start: range.start ?? range?.from ?? null,
      end: range.end ?? range?.to ?? null,
    });
  }, []);

  const updateBand = useCallback((value) => {
    setBand(value || null);
  }, []);

  const updateShelter = useCallback((value) => {
    setShelterId(value || null);
  }, []);

  const updateGroup = useCallback((value) => {
    setGroupId(value || null);
  }, []);

  const refresh = useCallback(() => {
    const query = lastQueryRef.current ?? buildQuery();
    return fetchDetail({ query }, { initial: false });
  }, [buildQuery, fetchDetail]);

  return {
    child,
    summary,
    breakdown,
    shelterBreakdown,
    bandDistribution,
    monthlyBreakdown,
    streaks,
    timeline,
    verificationStats,
    availableFilters,
    isLoading,
    isRefreshing,
    error,
    errorMessage,
    params: {
      band,
      shelterId,
      groupId,
      dateRange,
      additional: additionalParams,
    },
    setBand: updateBand,
    setShelter: updateShelter,
    setGroup: updateGroup,
    setDateRange: updateDateRange,
    setParams: updateAdditionalParams,
    clearParams: clearAdditionalParams,
    refresh,
    refetch: refresh,
    fetch: fetchDetail,
  };
};

export default useChildAttendanceReportDetail;
