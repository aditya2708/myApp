import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';

const clampPercentage = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (numericValue <= 0) {
    return 0;
  }

  if (numericValue >= 100) {
    return 100;
  }

  return Math.round(numericValue * 10) / 10;
};

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return fallback;
  }

  return numericValue;
};

const calculatePercentage = (count, total) => {
  const normalizedTotal = toNumber(total, 0);
  const normalizedCount = toNumber(count, 0);

  if (normalizedTotal <= 0) {
    return null;
  }

  return clampPercentage((normalizedCount / normalizedTotal) * 100);
};

const extractShelterItems = (responseData) => {
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
    responseData?.data?.items,
    responseData?.data?.data?.items,
    responseData?.shelters,
    responseData?.data?.shelters,
    responseData?.data?.data?.shelters,
    responseData?.weeklyShelters,
    responseData?.weekly_shelters,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const normalizeShelterAttendance = (responseData) => {
  const shelters = extractShelterItems(responseData);

  return shelters.map((item, index) => {
    const id =
      item?.id ?? item?.shelterId ?? item?.shelter_id ?? item?.code ?? `shelter-${index + 1}`;
    const name = item?.name ?? item?.shelterName ?? item?.shelter_name ?? `Shelter ${index + 1}`;
    const wilbin =
      item?.wilbin ??
      item?.wilayah ??
      item?.wilayahBinaan ??
      item?.wilayah_binaan ??
      item?.region ??
      item?.area ??
      null;

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
        item?.total_children ??
        item?.attendanceTotal ??
        item?.attendance_total;

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

    const verificationData = item?.verification ?? item?.verifications ?? {};

    const verifiedCount = toNumber(
      verificationData?.verified ??
        verificationData?.approved ??
        item?.verifiedCount ??
        item?.verified_count ??
        item?.verified,
      0
    );

    const pendingCount = toNumber(
      verificationData?.pending ??
        verificationData?.waiting ??
        verificationData?.inReview ??
        item?.pendingCount ??
        item?.pending_count ??
        item?.pending,
      0
    );

    const rejectedCount = toNumber(
      verificationData?.rejected ??
        verificationData?.declined ??
        verificationData?.notVerified ??
        item?.rejectedCount ??
        item?.rejected_count ??
        item?.rejected,
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
      name,
      wilbin,
      attendanceRate,
      totalSessions,
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
      verification: {
        total: verificationTotal,
        verified: verifiedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      },
      raw: item,
    };
  });
};

export const useAttendanceWeeklyShelters = (params = {}) => {
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const isMountedRef = useRef(true);

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchShelterAttendance = useCallback(
    async (overrideParams = {}) => {
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await adminCabangReportApi.getAttendanceWeeklyShelters({
          ...paramsRef.current,
          ...overrideParams,
        });

        const normalizedData = normalizeShelterAttendance(response?.data ?? response);

        if (isMountedRef.current) {
          setData(normalizedData);
        }

        return normalizedData;
      } catch (err) {
        const message =
          err?.response?.data?.message || err?.message || 'Gagal memuat rekap kehadiran shelter';

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
    fetchShelterAttendance();
  }, [fetchShelterAttendance, serializedParams]);

  const refetch = useCallback((overrideParams = {}) => fetchShelterAttendance(overrideParams), [
    fetchShelterAttendance,
  ]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export default useAttendanceWeeklyShelters;
