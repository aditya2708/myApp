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

const toNumber = (value, fallback = null) => {
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

  if (!normalizedTotal || normalizedTotal <= 0) {
    return null;
  }

  return clampPercentage((normalizedCount / normalizedTotal) * 100);
};

const formatDateRange = (startDate, endDate, fallbackLabel = null) => {
  if (!startDate && !endDate) {
    return fallbackLabel;
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
  } catch (error) {
    console.warn('Failed to format shelter detail date range:', error);
    return fallbackLabel;
  }
};

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    return Object.values(value);
  }

  return [];
};

const normalizeActivity = (activity, index) => {
  const presentCount = toNumber(
    activity?.presentCount ?? activity?.present_count ?? activity?.present ?? activity?.hadir,
    0
  );
  const lateCount = toNumber(
    activity?.lateCount ?? activity?.late_count ?? activity?.late ?? activity?.terlambat,
    0
  );
  const absentCount = toNumber(
    activity?.absentCount ?? activity?.absent_count ?? activity?.absent ?? activity?.alpha,
    0
  );

  const totalSessions = (() => {
    const explicitTotal =
      activity?.totalSessions ??
      activity?.total_sessions ??
      activity?.total ??
      activity?.attendanceTotal ??
      activity?.attendance_total;

    if (explicitTotal !== undefined && explicitTotal !== null) {
      return toNumber(explicitTotal, presentCount + lateCount + absentCount);
    }

    return presentCount + lateCount + absentCount;
  })();

  return {
    id:
      activity?.id ??
      activity?.aktivitasId ??
      activity?.activityId ??
      activity?.activity_id ??
      `activity-${index + 1}`,
    name:
      activity?.name ??
      activity?.nama ??
      activity?.activityName ??
      activity?.activity_name ??
      `Aktivitas ${index + 1}`,
    schedule:
      activity?.schedule ??
      activity?.jadwal ??
      activity?.time ??
      activity?.waktu ??
      null,
    metrics: {
      total: totalSessions,
      present: { count: presentCount, percentage: calculatePercentage(presentCount, totalSessions) },
      late: { count: lateCount, percentage: calculatePercentage(lateCount, totalSessions) },
      absent: { count: absentCount, percentage: calculatePercentage(absentCount, totalSessions) },
      attendanceRate: clampPercentage(
        activity?.attendanceRate ??
          activity?.attendance_rate ??
          activity?.attendancePercentage ??
          activity?.attendance_percentage ??
          calculatePercentage(presentCount, totalSessions)
      ),
    },
    raw: activity,
  };
};

const normalizeKelompok = (item, index) => {
  const membersCount = toNumber(
    item?.membersCount ??
      item?.members_count ??
      item?.memberCount ??
      item?.member_count ??
      item?.jumlahAnggota ??
      item?.jumlah_anggota,
    null
  );

  const presentCount = toNumber(
    item?.presentCount ?? item?.present_count ?? item?.present ?? item?.hadir,
    0
  );
  const lateCount = toNumber(item?.lateCount ?? item?.late_count ?? item?.late ?? item?.terlambat, 0);
  const absentCount = toNumber(item?.absentCount ?? item?.absent_count ?? item?.absent ?? item?.alpha, 0);

  const totalSessions = (() => {
    const explicitTotal =
      item?.totalSessions ??
      item?.total_sessions ??
      item?.total ??
      item?.attendanceTotal ??
      item?.attendance_total;

    if (explicitTotal !== undefined && explicitTotal !== null) {
      return toNumber(explicitTotal, presentCount + lateCount + absentCount);
    }

    return presentCount + lateCount + absentCount;
  })();

  const activities = ensureArray(
    item?.activities ??
      item?.aktivitas ??
      item?.activity ??
      item?.activityList ??
      item?.activity_list ??
      item?.items
  ).map(normalizeActivity);

  return {
    id: item?.id ?? item?.kelompokId ?? item?.kelompok_id ?? item?.groupId ?? item?.group_id ?? `kelompok-${index + 1}`,
    name: item?.name ?? item?.nama ?? item?.kelompokName ?? item?.kelompok_name ?? `Kelompok ${index + 1}`,
    mentor:
      item?.mentor ??
      item?.pembimbing ??
      item?.fasilitator ??
      item?.coach ??
      item?.pengajar ??
      null,
    membersCount,
    summary: {
      present: { count: presentCount, percentage: calculatePercentage(presentCount, totalSessions) },
      late: { count: lateCount, percentage: calculatePercentage(lateCount, totalSessions) },
      absent: { count: absentCount, percentage: calculatePercentage(absentCount, totalSessions) },
      total: totalSessions,
      attendanceRate: clampPercentage(
        item?.attendanceRate ??
          item?.attendance_rate ??
          item?.attendancePercentage ??
          item?.attendance_percentage ??
          calculatePercentage(presentCount, totalSessions)
      ),
    },
    activities,
    raw: item,
  };
};

const normalizeWeek = (item, index) => {
  const startDate = item?.startDate ?? item?.start_date ?? item?.start ?? null;
  const endDate = item?.endDate ?? item?.end_date ?? item?.end ?? null;
  const fallbackLabel = item?.label ?? item?.weekLabel ?? item?.week_label ?? `Minggu ${index + 1}`;

  const kelompokItems = ensureArray(
    item?.kelompok ??
      item?.kelompoks ??
      item?.groups ??
      item?.groupList ??
      item?.group_list ??
      item?.items
  ).map(normalizeKelompok);

  return {
    id: item?.id ?? item?.weekId ?? item?.week_id ?? `week-${index + 1}`,
    label: fallbackLabel,
    dateRange: {
      start: startDate,
      end: endDate,
      label: item?.dateRange ?? item?.date_range ?? item?.dates ?? formatDateRange(startDate, endDate, fallbackLabel),
    },
    kelompok: kelompokItems,
    summary: item?.summary ?? null,
    raw: item,
  };
};

const normalizeShelterInfo = (payload = {}) => {
  const id =
    payload?.id ??
    payload?.shelterId ??
    payload?.shelter_id ??
    payload?.code ??
    payload?.kode ??
    null;

  const startDate = payload?.startDate ?? payload?.start_date ?? payload?.periodStart ?? payload?.period_start ?? null;
  const endDate = payload?.endDate ?? payload?.end_date ?? payload?.periodEnd ?? payload?.period_end ?? null;

  return {
    id,
    name:
      payload?.name ??
      payload?.shelterName ??
      payload?.shelter_name ??
      payload?.nama ??
      payload?.title ??
      null,
    code: payload?.code ?? payload?.kode ?? null,
    wilbin:
      payload?.wilbin ??
      payload?.wilayah ??
      payload?.wilayahBinaan ??
      payload?.wilayah_binaan ??
      payload?.region ??
      payload?.area ??
      null,
    address: payload?.address ?? payload?.alamat ?? null,
    leader:
      payload?.leader ??
      payload?.penanggungJawab ??
      payload?.penanggung_jawab ??
      payload?.koordinator ??
      payload?.pic ??
      null,
    totalChildren: toNumber(
      payload?.totalChildren ?? payload?.total_children ?? payload?.childrenCount ?? payload?.children_count,
      null
    ),
    period: {
      start: startDate,
      end: endDate,
      label:
        payload?.periodLabel ??
        payload?.period_label ??
        payload?.periode ??
        formatDateRange(startDate, endDate, payload?.period ?? payload?.periodeLabel ?? payload?.periode_label ?? null),
    },
    raw: payload,
  };
};

const normalizeShelterDetail = (responseData) => {
  const payload = responseData?.data ?? responseData ?? {};

  const shelterInfoCandidates = [
    payload?.shelter,
    payload?.shelterInfo,
    payload?.shelter_info,
    payload?.data?.shelter,
    payload?.data?.shelterInfo,
    payload?.data?.shelter_info,
    payload,
  ];

  let shelterInfo = null;

  for (const candidate of shelterInfoCandidates) {
    if (candidate && typeof candidate === 'object') {
      shelterInfo = normalizeShelterInfo(candidate);
      break;
    }
  }

  const weeksCandidates = [
    payload?.weeks,
    payload?.data?.weeks,
    payload?.data?.data?.weeks,
    payload?.detail,
    payload?.details,
    payload?.items,
    payload?.data?.items,
    payload?.data?.data?.items,
  ];

  let weeks = [];

  for (const candidate of weeksCandidates) {
    if (Array.isArray(candidate) || (candidate && typeof candidate === 'object')) {
      weeks = ensureArray(candidate).map(normalizeWeek);
      break;
    }
  }

  return {
    shelter: shelterInfo,
    weeks,
    raw: payload,
  };
};

const INITIAL_STATE = {
  shelter: null,
  weeks: [],
  raw: null,
};

export const useAttendanceWeeklyShelterDetail = ({ shelterId, startDate, endDate } = {}) => {
  const paramsRef = useRef({ startDate, endDate });
  paramsRef.current = { startDate, endDate };

  const shelterIdRef = useRef(shelterId);
  shelterIdRef.current = shelterId;

  const isMountedRef = useRef(true);

  const [data, setData] = useState(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sanitizeParams = useCallback((params = {}) => {
    if (!params) {
      return {};
    }

    return Object.entries(params).reduce((acc, [key, value]) => {
      if (key === 'shelterId') {
        return acc;
      }

      if (value === undefined || value === null || value === '') {
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {});
  }, []);

  const fetchShelterDetail = useCallback(
    async (override = {}) => {
      const nextShelterId = override?.shelterId ?? shelterIdRef.current;

      if (!nextShelterId) {
        if (isMountedRef.current) {
          setData(INITIAL_STATE);
          setIsLoading(false);
          setError(null);
        }

        return null;
      }

      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      const sanitizedParams = sanitizeParams({
        ...paramsRef.current,
        ...override,
      });

      try {
        const response = await adminCabangReportApi.getAttendanceWeeklyShelterDetail(
          nextShelterId,
          sanitizedParams
        );

        const normalized = normalizeShelterDetail(response?.data ?? response);

        if (isMountedRef.current) {
          setData(normalized);
        }

        return normalized;
      } catch (err) {
        const message =
          err?.response?.data?.message || err?.message || 'Gagal memuat detail kehadiran shelter';

        if (isMountedRef.current) {
          setError(message);
          setData(INITIAL_STATE);
        }

        return null;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [sanitizeParams]
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const serializedDependencies = useMemo(
    () => JSON.stringify({ shelterId, startDate, endDate }),
    [shelterId, startDate, endDate]
  );

  useEffect(() => {
    if (!shelterId) {
      return;
    }

    fetchShelterDetail();
  }, [fetchShelterDetail, serializedDependencies, shelterId]);

  const refetch = useCallback((override = {}) => fetchShelterDetail(override), [fetchShelterDetail]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export default useAttendanceWeeklyShelterDetail;
