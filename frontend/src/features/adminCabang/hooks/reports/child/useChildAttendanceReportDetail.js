import { useEffect, useMemo, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';

const firstDefined = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
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

const adaptTotals = (rawTotals = {}) => ({
  present: firstDefined(
    rawTotals.present,
    rawTotals.presentCount,
    rawTotals.present_count,
    0,
  ),
  late: firstDefined(rawTotals.late, rawTotals.lateCount, rawTotals.late_count, 0),
  absent: firstDefined(
    rawTotals.absent,
    rawTotals.absentCount,
    rawTotals.absent_count,
    0,
  ),
  totalSessions: firstDefined(
    rawTotals.totalSessions,
    rawTotals.sessionCount,
    rawTotals.sessions,
    rawTotals.total_sessions,
    0,
  ),
  totalChildren: firstDefined(
    rawTotals.totalChildren,
    rawTotals.childrenCount,
    rawTotals.total,
    rawTotals.total_children,
    0,
  ),
});

const adaptSummary = (rawSummary = {}) => {
  const totalsSource = rawSummary.totals || rawSummary;

  return {
    attendanceRate: {
      value: firstDefined(
        rawSummary.attendanceRate,
        rawSummary.attendance_rate,
        rawSummary.rate,
        totalsSource.attendanceRate,
        totalsSource.attendance_rate,
        0,
      ),
      label: firstDefined(
        rawSummary.attendanceRateLabel,
        rawSummary.attendance_rate_label,
        rawSummary.rateLabel,
        null,
      ),
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

  const totalsSource = base.totals || base;

  return {
    ...base,
    id: base.id ?? null,
    name: base.name ?? '',
    attendanceRate: firstDefined(
      base.attendanceRate,
      base.attendance_rate,
      base.rate,
      null,
    ),
    totals: adaptTotals(totalsSource),
  };
};

const adaptShelterBreakdown = (rawShelters = []) => {
  return extractArray(rawShelters).map((shelter) => ({
    id: shelter.id ?? null,
    name: shelter.name ?? '',
    attendanceRate: firstDefined(
      shelter.attendanceRate,
      shelter.attendance_rate,
      shelter.rate,
      0,
    ),
    totalChildren: firstDefined(
      shelter.totalChildren,
      shelter.childrenCount,
      shelter.total,
      0,
    ),
    totals: {
      present: firstDefined(
        shelter.presentCount,
        shelter.present,
        shelter.totals?.present,
        shelter.totals?.presentCount,
        shelter.totals?.present_count,
        0,
      ),
      late: firstDefined(
        shelter.lateCount,
        shelter.late,
        shelter.totals?.late,
        shelter.totals?.lateCount,
        shelter.totals?.late_count,
        0,
      ),
      absent: firstDefined(
        shelter.absentCount,
        shelter.absent,
        shelter.totals?.absent,
        shelter.totals?.absentCount,
        shelter.totals?.absent_count,
        0,
      ),
    },
  }));
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
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const paramsKey = JSON.stringify(inputParams ?? {});
  const params = useMemo(() => (inputParams ? { ...inputParams } : {}), [paramsKey]);

  useEffect(() => {
    let isActive = true;

    if (!enabled) {
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    if (!childId) {
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      setErrorMessage(null);

      try {
        const response = await adminCabangReportApi.getChildAttendanceReportDetail(childId, params);
        if (!isActive) return;

        const rawPayload = response?.data ?? response ?? {};
        const payload = rawPayload?.data ?? rawPayload ?? {};

        const childPayload = firstDefined(payload.child, rawPayload.child, payload.data?.child) ?? {};
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

        const hasChildPayload =
          childPayload &&
          typeof childPayload === 'object' &&
          Object.keys(childPayload).length > 0;

        setChild(hasChildPayload ? adaptChild(childPayload) : null);
        setSummary(adaptSummary(summaryPayload));
        setShelterBreakdown(adaptShelterBreakdown(shelterPayload));
        setBandDistribution(adaptBandDistribution(bandPayload));
      } catch (err) {
        if (!isActive) return;
        setError(err);
        setErrorMessage(err?.message || '');
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isActive = false;
    };
  }, [childId, enabled, paramsKey]);

  return {
    isLoading,
    child,
    summary,
    shelterBreakdown,
    bandDistribution,
    error,
    errorMessage,
  };
};

export default useChildAttendanceReportDetail;

