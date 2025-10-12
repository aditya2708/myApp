import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';
import { formatPercentageLabel } from '../../../screens/reports/child/utils/childReportTransformers';

const firstDefined = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

const coalesceNumber = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

const extractArray = (source) => {
  if (Array.isArray(source)) return source.filter(Boolean);
  if (!source || typeof source !== 'object') return ensureArray(source).filter(Boolean);

  const nested = firstDefined(
    source.data,
    source.items,
    source.list,
    source.records,
    source.children,
    source.rows,
  );

  if (nested !== undefined) {
    return extractArray(nested).filter(Boolean);
  }

  return ensureArray(source).filter(Boolean);
};

const adaptTotals = (rawTotals = {}) => {
  const presentValue = coalesceNumber(
    rawTotals.present,
    rawTotals.presentCount,
    rawTotals.present_count,
  ) ?? 0;
  const lateValue = coalesceNumber(
    rawTotals.late,
    rawTotals.lateCount,
    rawTotals.late_count,
    rawTotals.terlambat,
  ) ?? 0;
  const absentValue = coalesceNumber(
    rawTotals.tidakHadir,
    rawTotals.tidak_hadir,
    rawTotals.tidakHadirCount,
    rawTotals.absent,
    rawTotals.absentCount,
    rawTotals.absent_count,
  ) ?? 0;
  const hadirValue =
    coalesceNumber(
      rawTotals.hadir,
      rawTotals.hadirCount,
      rawTotals.hadir_count,
      rawTotals.totalHadir,
      rawTotals.total_hadir,
    ) ?? presentValue + lateValue;
  const totalActivitiesValue =
    coalesceNumber(
      rawTotals.totalAktivitas,
      rawTotals.total_aktivitas,
      rawTotals.totalActivities,
      rawTotals.total_activities,
      rawTotals.totalSessions,
      rawTotals.total_sessions,
      rawTotals.sessions,
    ) ?? hadirValue + absentValue;
  const totalSessionsValue =
    coalesceNumber(
      rawTotals.totalSessions,
      rawTotals.sessionCount,
      rawTotals.sessions,
      rawTotals.total_sessions,
    ) ?? totalActivitiesValue;
  const totalChildrenValue =
    coalesceNumber(
      rawTotals.totalChildren,
      rawTotals.childrenCount,
      rawTotals.total,
      rawTotals.total_children,
    ) ?? 0;
  const attendanceRateValue = coalesceNumber(
    rawTotals.attendanceRate,
    rawTotals.attendance_rate,
    rawTotals.attendancePercentage,
    rawTotals.attendance_percentage,
    rawTotals.rate,
  );

  const totals = {
    ...rawTotals,
    present: presentValue,
    presentCount: presentValue,
    present_count: presentValue,
    late: lateValue,
    lateCount: lateValue,
    late_count: lateValue,
    absent: absentValue,
    absentCount: absentValue,
    absent_count: absentValue,
    tidakHadir: absentValue,
    tidak_hadir: absentValue,
    hadir: hadirValue,
    hadirCount: hadirValue,
    hadir_count: hadirValue,
    totalActivities: totalActivitiesValue,
    total_activities: totalActivitiesValue,
    totalAktivitas: totalActivitiesValue,
    totalSessions: totalSessionsValue,
    sessionCount: totalSessionsValue,
    sessions: totalSessionsValue,
    total_sessions: totalSessionsValue,
    totalChildren: totalChildrenValue,
    childrenCount: totalChildrenValue,
    total_children: totalChildrenValue,
  };

  if (attendanceRateValue !== null) {
    totals.attendanceRate = attendanceRateValue;
    totals.attendance_rate = attendanceRateValue;
    totals.attendance_percentage = attendanceRateValue;
  }

  return totals;
};

const adaptSummary = (rawSummary = {}) => {
  const totalsSource = rawSummary.totals || rawSummary;
  const totals = adaptTotals(totalsSource);
  const attendanceRateValue =
    coalesceNumber(
      rawSummary.attendanceRate,
      rawSummary.attendance_rate,
      rawSummary.attendancePercentage,
      rawSummary.attendance_percentage,
      rawSummary.rate,
      totals.attendanceRate,
      totals.attendance_rate,
      totals.attendance_percentage,
    ) ?? 0;
  const attendanceRateLabel = firstDefined(
    rawSummary.attendanceRateLabel,
    rawSummary.attendance_rate_label,
    rawSummary.rateLabel,
    totals.attendanceRateLabel,
    totals.attendance_rate_label,
    totals.attendance_percentage_label,
    formatPercentageLabel(attendanceRateValue),
  );

  return {
    attendanceRate: {
      value: attendanceRateValue,
      label: attendanceRateLabel,
    },
    totals,
    dateRange: {
      label: firstDefined(
        rawSummary.dateRange?.label,
        rawSummary.date_range?.label,
        rawSummary.dateRangeLabel,
        null,
      ),
      value: firstDefined(
        rawSummary.dateRange?.value,
        rawSummary.date_range?.value,
        null,
      ),
    },
  };
};

const adaptChild = (rawChild = {}) => {
  const isObject = rawChild && typeof rawChild === 'object';
  const base = {
    ...(isObject ? rawChild : {}),
  };

  const totalsSource = firstDefined(base.totals, base.attendance?.totals, base.attendance, base);
  const totals = adaptTotals(totalsSource || {});
  const attendanceRateValue =
    coalesceNumber(
      base.attendanceRate?.value,
      base.attendanceRate,
      base.attendance_rate,
      base.rate,
      base.attendance?.attendance_percentage,
      base.summary?.attendanceRate?.value,
      base.summary?.attendanceRate,
    ) ?? null;
  const attendanceRateLabel = firstDefined(
    base.attendanceRate?.label,
    base.attendance_label,
    base.attendance?.attendance_label,
    base.summary?.attendanceRate?.label,
    attendanceRateValue !== null
      ? `${attendanceRateValue.toFixed(attendanceRateValue % 1 === 0 ? 0 : 1)}%`
      : null,
  );

  return {
    ...base,
    id: base.id ?? null,
    name: base.name ?? '',
    attendanceRate:
      attendanceRateValue === null && !attendanceRateLabel
        ? firstDefined(base.attendanceRate, base.attendance_rate, base.rate, null)
        : {
            value: attendanceRateValue,
            label: attendanceRateLabel,
          },
    totals,
  };
};

const adaptShelterBreakdown = (rawShelters = []) => {
  return extractArray(rawShelters).map((shelter) => {
    const totalsSource = firstDefined(shelter.totals, shelter);
    const totals = adaptTotals(totalsSource || {});
    const attendanceRateValue =
      coalesceNumber(
        shelter.attendanceRate,
        shelter.attendance_rate,
        shelter.rate,
        totals.attendanceRate,
        totals.attendance_rate,
        totals.attendance_percentage,
      ) ?? 0;

    return {
      id: shelter.id ?? null,
      name: shelter.name ?? '',
      attendanceRate: attendanceRateValue,
      totalChildren:
        firstDefined(
          shelter.totalChildren,
          shelter.childrenCount,
          shelter.total,
          totals.totalChildren,
          totals.childrenCount,
          totals.total_children,
        ) ?? 0,
      totals,
    };
  });
};

const adaptBandDistribution = (rawDistribution) => {
  const distribution = extractArray(rawDistribution);

  if (distribution.length) return distribution;

  if (rawDistribution && typeof rawDistribution === 'object') {
    return Object.entries(rawDistribution).map(([band, value]) => ({
      id: band,
      band,
      percentage: value?.percentage ?? value ?? 0,
      count: value?.count ?? 0,
    }));
  }

  return [];
};

export const useChildAttendanceReportDetail = ({
  childId,
  params: inputParams = {},
  enabled = true,
} = {}) => {
  const [isLoading, setIsLoading] = useState(() => Boolean(childId) && enabled);
  const [child, setChild] = useState(() => null);
  const [summary, setSummary] = useState(() => adaptSummary({}));
  const [shelterBreakdown, setShelterBreakdown] = useState([]);
  const [bandDistribution, setBandDistribution] = useState([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState(() => []);
  const [attendanceTimeline, setAttendanceTimeline] = useState(() => []);
  const [verificationSummary, setVerificationSummary] = useState(() => null);
  const [streaks, setStreaks] = useState(() => []);
  const [filters, setFilters] = useState(() => ({}));
  const [period, setPeriod] = useState(() => null);
  const [meta, setMeta] = useState(() => null);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const paramsKey = JSON.stringify(inputParams ?? {});
  const params = useMemo(() => (inputParams ? { ...inputParams } : {}), [paramsKey]);

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchDetail = useCallback(
    async ({ skipLoadingState = false } = {}) => {
      if (!enabled || !childId) {
        if (!skipLoadingState && isMountedRef.current) {
          setIsLoading(false);
        }
        return null;
      }

      if (!skipLoadingState && isMountedRef.current) {
        setIsLoading(true);
      }

      if (isMountedRef.current) {
        setError(null);
        setErrorMessage(null);
      }

      try {
        const response = await adminCabangReportApi.getChildAttendanceReportDetail(childId, params);
        if (!isMountedRef.current) return null;

        const rawPayload = response?.data ?? response ?? {};
        const payload = rawPayload?.data ?? rawPayload ?? {};

        const childPayload =
          firstDefined(payload.child, rawPayload.child, payload.data?.child) ?? {};
        const summaryPayload = firstDefined(payload.summary, rawPayload.summary) ?? {};
        const shelterPayload = firstDefined(
          payload.shelter_breakdown,
          payload.shelterBreakdown,
          rawPayload.shelter_breakdown,
          rawPayload.shelterBreakdown,
          [],
        );
        const bandPayload = firstDefined(
          payload.attendance_band_distribution,
          payload.attendanceBandDistribution,
          rawPayload.attendance_band_distribution,
          rawPayload.attendanceBandDistribution,
          [],
        );
        const monthlyPayload = firstDefined(
          payload.monthly_breakdown,
          payload.monthlyBreakdown,
          rawPayload.monthly_breakdown,
          rawPayload.monthlyBreakdown,
          childPayload?.monthly_breakdown,
          childPayload?.monthlyBreakdown,
          [],
        );
        const timelinePayload = firstDefined(
          payload.attendance_timeline,
          payload.attendanceTimeline,
          rawPayload.attendance_timeline,
          rawPayload.attendanceTimeline,
          childPayload?.attendance_timeline,
          childPayload?.attendanceTimeline,
          childPayload?.timeline,
          [],
        );
        const verificationPayload = firstDefined(
          payload.verification_summary,
          payload.verificationSummary,
          rawPayload.verification_summary,
          rawPayload.verificationSummary,
          null,
        );
        const streaksPayload = firstDefined(
          payload.streaks,
          rawPayload.streaks,
          childPayload?.streaks,
          [],
        );
        const filtersPayload = firstDefined(payload.filters, rawPayload.filters, {});
        const periodPayload = firstDefined(
          payload.period,
          rawPayload.period,
          summaryPayload?.period,
          null,
        );
        const metaPayload = firstDefined(payload.meta, rawPayload.meta, null);

        const hasChildPayload =
          childPayload &&
          typeof childPayload === 'object' &&
          Object.keys(childPayload).length > 0;

        setChild(hasChildPayload ? adaptChild(childPayload) : null);
        setSummary(adaptSummary(summaryPayload));
        setShelterBreakdown(adaptShelterBreakdown(shelterPayload));
        setBandDistribution(adaptBandDistribution(bandPayload));
        setMonthlyBreakdown(extractArray(monthlyPayload));
        setAttendanceTimeline(extractArray(timelinePayload));
        setVerificationSummary(
          verificationPayload && typeof verificationPayload === 'object'
            ? { ...verificationPayload }
            : verificationPayload ?? null,
        );
        setStreaks(extractArray(streaksPayload));
        setFilters(
          filtersPayload && typeof filtersPayload === 'object' ? { ...filtersPayload } : {},
        );
        setPeriod(
          periodPayload && typeof periodPayload === 'object'
            ? { ...periodPayload }
            : periodPayload ?? null,
        );
        setMeta(
          metaPayload && typeof metaPayload === 'object' ? { ...metaPayload } : metaPayload ?? null,
        );

        return payload;
      } catch (err) {
        if (!isMountedRef.current) return null;
        setError(err);
        setErrorMessage(err?.message || '');
        return null;
      } finally {
        if (!isMountedRef.current) return null;
        if (!skipLoadingState) {
          setIsLoading(false);
        }
      }
    },
    [childId, enabled, params],
  );

  useEffect(() => {
    if (!enabled || !childId) {
      setIsLoading(false);
      return;
    }

    fetchDetail();
  }, [childId, enabled, fetchDetail]);

  return {
    isLoading,
    child,
    summary,
    shelterBreakdown,
    bandDistribution,
    monthlyBreakdown,
    attendanceTimeline,
    timeline: attendanceTimeline,
    verificationSummary,
    streaks,
    filters,
    period,
    meta,
    error,
    errorMessage,
    refresh: fetchDetail,
    refetch: fetchDetail,
  };
};

export default useChildAttendanceReportDetail;

