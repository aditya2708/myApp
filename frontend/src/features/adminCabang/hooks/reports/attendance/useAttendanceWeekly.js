import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';

const clampPercentage = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  if (numberValue <= 0) {
    return 0;
  }

  if (numberValue >= 100) {
    return 100;
  }

  return Math.round(numberValue * 10) / 10;
};

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return fallback;
  }

  return numberValue;
};

const calculatePercentage = (count, total) => {
  const normalizedTotal = toNumber(total, 0);
  const normalizedCount = toNumber(count, 0);

  if (normalizedTotal <= 0) {
    return null;
  }

  return clampPercentage((normalizedCount / normalizedTotal) * 100);
};

const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) {
    return null;
  }

  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (startDate && endDate) {
      return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
    }

    const singleDate = startDate || endDate;

    return formatter.format(new Date(singleDate));
  } catch (err) {
    console.warn('Failed to format weekly attendance date range:', err);
    return null;
  }
};

const extractWeeklyPayload = (responseData) => {
  if (!responseData) {
    return [];
  }

  const candidates = [
    responseData,
    responseData?.data,
    responseData?.data?.data,
    responseData?.result,
    responseData?.payload,
    responseData?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  const collections = [
    responseData?.weeks,
    responseData?.data?.weeks,
    responseData?.data?.data?.weeks,
  ];

  for (const collection of collections) {
    if (Array.isArray(collection)) {
      return collection;
    }
  }

  return [];
};

const normalizeWeeklyData = (responseData) => {
  const weeklyItems = extractWeeklyPayload(responseData);

  return weeklyItems.map((item, index) => {
    const id = item?.id ?? item?.week_id ?? item?.weekId ?? `week-${index + 1}`;
    const weekLabel =
      item?.weekLabel ?? item?.week_label ?? item?.label ?? item?.title ?? `Minggu ${index + 1}`;

    const startDate = item?.startDate ?? item?.start_date ?? item?.start ?? null;
    const endDate = item?.endDate ?? item?.end_date ?? item?.end ?? null;
    const dateRangeLabel =
      item?.dateRange ?? item?.date_range ?? item?.dates ?? formatDateRange(startDate, endDate);

    const presentCount = toNumber(
      item?.presentCount ?? item?.present_count ?? item?.present ?? item?.hadir,
      0
    );
    const lateCount = toNumber(
      item?.lateCount ?? item?.late_count ?? item?.late ?? item?.terlambat,
      0
    );
    const absentCount = toNumber(
      item?.absentCount ?? item?.absent_count ?? item?.absent ?? item?.alpha,
      0
    );

    const totalSessions = (() => {
      const explicitTotal =
        item?.totalSessions ??
        item?.total_sessions ??
        item?.total ??
        item?.totalChildren ??
        item?.total_children;

      if (explicitTotal !== undefined && explicitTotal !== null) {
        return toNumber(explicitTotal, presentCount + lateCount + absentCount);
      }

      return presentCount + lateCount + absentCount;
    })();

    const attendanceRate = clampPercentage(
      item?.attendanceRate ??
        item?.attendance_rate ??
        item?.attendancePercentage ??
        item?.attendance_percentage ??
        calculatePercentage(presentCount, totalSessions)
    );

    const summary = {
      present: {
        count: presentCount,
        percentage: calculatePercentage(presentCount, totalSessions),
      },
      late: {
        count: lateCount,
        percentage: calculatePercentage(lateCount, totalSessions),
      },
      absent: {
        count: absentCount,
        percentage: calculatePercentage(absentCount, totalSessions),
      },
    };

    const verificationData = item?.verification ?? {};

    const verifiedCount = toNumber(
      verificationData?.verified ??
        verificationData?.approved ??
        item?.verifiedCount ??
        item?.verified_count,
      0
    );
    const pendingCount = toNumber(
      verificationData?.pending ??
        verificationData?.waiting ??
        item?.pendingCount ??
        item?.pending_count ??
        item?.pendingVerification ??
        item?.pending_verification,
      0
    );
    const rejectedCount = toNumber(
      verificationData?.rejected ??
        verificationData?.declined ??
        item?.rejectedCount ??
        item?.rejected_count,
      0
    );

    const verificationTotal = (() => {
      const totalFromItem =
        verificationData?.total ??
        item?.verificationTotal ??
        item?.verification_total ??
        item?.totalVerifications ??
        item?.total_verifications;

      if (totalFromItem !== undefined && totalFromItem !== null) {
        return toNumber(totalFromItem, verifiedCount + pendingCount + rejectedCount);
      }

      return verifiedCount + pendingCount + rejectedCount;
    })();

    return {
      id,
      label: weekLabel,
      dates: {
        start: startDate,
        end: endDate,
        label: dateRangeLabel,
      },
      attendanceRate,
      totals: {
        sessions: totalSessions,
      },
      summary,
      verification: {
        total: verificationTotal,
        verified: verifiedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      },
    };
  });
};

export const useAttendanceWeekly = (params = {}) => {
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const isMountedRef = useRef(true);

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeeklyData = useCallback(
    async (overrideParams = {}) => {
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await adminCabangReportApi.getAttendanceWeekly({
          ...paramsRef.current,
          ...overrideParams,
        });

        const normalizedData = normalizeWeeklyData(response?.data);

        if (isMountedRef.current) {
          setData(normalizedData);
        }

        return normalizedData;
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Gagal memuat rekap kehadiran mingguan';

        if (isMountedRef.current) {
          setError(message);
          setData([]);
        }

        return null;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const serializedParams = useMemo(() => JSON.stringify(params ?? {}), [params]);

  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData, serializedParams]);

  const refetch = useCallback((overrideParams = {}) => fetchWeeklyData(overrideParams), [
    fetchWeeklyData,
  ]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export default useAttendanceWeekly;
