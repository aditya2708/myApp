import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';

const DEFAULT_ERROR_MESSAGE = 'Gagal memuat detail kehadiran anak cabang.';

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

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
};

export const useChildAttendanceReportDetail = (childId, params = {}) => {
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(null);
  const [child, setChild] = useState(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [verificationSummary, setVerificationSummary] = useState(null);
  const [streaks, setStreaks] = useState(null);
  const filtersRef = useRef({ ...(params || {}) });
  const [filters, setFilters] = useState(filtersRef.current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const assignPayload = useCallback((payload = {}) => {
    const summaryPayload = payload?.summary ?? {};

    setSummary({
      total_sessions: parseNumber(summaryPayload.total_sessions ?? summaryPayload.totalSessions, 0),
      present_count: parseNumber(summaryPayload.present_count ?? summaryPayload.presentCount, 0),
      late_count: parseNumber(summaryPayload.late_count ?? summaryPayload.lateCount, 0),
      absent_count: parseNumber(summaryPayload.absent_count ?? summaryPayload.absentCount, 0),
      attendance_percentage: parsePercentage(
        summaryPayload.attendance_percentage ?? summaryPayload.attendancePercentage,
      ),
      attendance_band:
        summaryPayload.attendance_band ?? summaryPayload.attendanceBand ?? summaryPayload.band ?? null,
      last_present_on: summaryPayload.last_present_on ?? summaryPayload.lastPresentOn ?? null,
      consecutive_absent: parseNumber(
        summaryPayload.consecutive_absent ?? summaryPayload.consecutiveAbsent,
        0,
      ),
    });

    setPeriod(payload?.period ?? null);
    setChild(payload?.child ?? null);

    setMonthlyBreakdown(
      ensureArray(payload?.monthly_breakdown).map((item) => ({
        ...item,
        activities_count: parseNumber(item.activities_count ?? item.activitiesCount, 0),
        attended_count: parseNumber(item.attended_count ?? item.attendedCount ?? item.hadir, 0),
        late_count: parseNumber(item.late_count ?? item.lateCount ?? item.terlambat, 0),
        absent_count: parseNumber(item.absent_count ?? item.absentCount ?? item.alpha, 0),
        attendance_percentage: parsePercentage(
          item.attendance_percentage ?? item.attendancePercentage ?? item.percentage,
        ),
      })),
    );

    setTimeline(
      ensureArray(payload?.attendance_timeline).map((item) => ({
        ...item,
        shelter_id: item.shelter_id ?? item.shelterId ?? null,
        group_id: item.group_id ?? item.groupId ?? null,
      })),
    );

    const verification = payload?.verification_summary ?? payload?.verificationSummary ?? {};
    setVerificationSummary({
      pending: parseNumber(verification.pending, 0),
      verified: parseNumber(verification.verified, 0),
      rejected: parseNumber(verification.rejected, 0),
      manual: parseNumber(verification.manual, 0),
    });

    setStreaks(payload?.streaks ?? null);
  }, []);

  const fetchDetail = useCallback(
    async (override = {}) => {
      if (!childId) {
        return;
      }

      const nextParams = { ...filtersRef.current, ...override };

      setLoading(true);
      setError(null);

      try {
        const response = await adminCabangReportApi.getChildAttendanceReportDetail(childId, nextParams);
        const payload = response?.data?.data ?? response?.data ?? response ?? {};

        assignPayload(payload);
        filtersRef.current = nextParams;
        setFilters(nextParams);
        setLastFetchedAt(response?.data?.last_refreshed_at ?? response?.last_refreshed_at ?? null);
      } catch (err) {
        console.error(err);
        setError(err?.message || DEFAULT_ERROR_MESSAGE);
      } finally {
        setLoading(false);
      }
    },
    [assignPayload, childId],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    filtersRef.current = { ...filtersRef.current, ...(params || {}) };
    setFilters(filtersRef.current);
  }, [params]);

  const refresh = useCallback(() => fetchDetail(), [fetchDetail]);

  const metadata = useMemo(
    () => ({
      lastFetchedAt,
      filters,
    }),
    [filters, lastFetchedAt],
  );

  return {
    summary,
    period,
    child,
    monthlyBreakdown,
    timeline,
    verificationSummary,
    streaks,
    filters,
    metadata,
    loading,
    error,
    refresh,
    setFilters,
  };
};

export default useChildAttendanceReportDetail;
