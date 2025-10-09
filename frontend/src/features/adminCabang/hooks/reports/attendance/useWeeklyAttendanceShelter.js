import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';

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
      payload?.totals?.activities ??
      payload?.totalChildren ??
      payload?.total_children ??
      payload?.totalActivities ??
      payload?.total_activities ??
      payload?.activities ??
      payload?.activityCount ??
      payload?.activity_count ??
      payload?.totals?.sessions;

    if (explicitTotal !== undefined && explicitTotal !== null) {
      return toNumber(explicitTotal, presentCount + lateCount + absentCount);
    }

    return presentCount + lateCount + absentCount;
  })();

  const verificationPayload =
    payload?.verification ?? payload?.verifications ?? payload?.approval ?? payload?.approvalStats ?? {};

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
    summary: {
      present: { count: presentCount, percentage: calculatePercentage(presentCount, totalSessions) },
      late: { count: lateCount, percentage: calculatePercentage(lateCount, totalSessions) },
      absent: { count: absentCount, percentage: calculatePercentage(absentCount, totalSessions) },
    },
    verification: {
      verified: toNumber(
        verificationPayload?.verified ??
          verificationPayload?.verifiedCount ??
          verificationPayload?.verified_count ??
          verificationPayload?.approval_verified,
        0,
      ),
      pending: toNumber(
        verificationPayload?.pending ??
          verificationPayload?.pendingCount ??
          verificationPayload?.pending_count ??
          verificationPayload?.approval_pending,
        0,
      ),
      rejected: toNumber(
        verificationPayload?.rejected ??
          verificationPayload?.rejectedCount ??
          verificationPayload?.rejected_count ??
          verificationPayload?.approval_rejected,
        0,
      ),
    },
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

const normalizeGroup = (item, index = 0) => {
  if (!item) {
    return null;
  }

  const summaryPayload = item?.summary ?? item?.metrics ?? item;
  const summary = normalizeSummary(summaryPayload);

  return {
    id: item?.id ?? item?.groupId ?? item?.group_id ?? item?.kelompokId ?? `group-${index + 1}`,
    name: item?.name ?? item?.groupName ?? item?.group_name ?? 'Kelompok',
    mentor: item?.mentor ?? item?.tutor ?? item?.pengajar ?? item?.coach ?? null,
    membersCount: toNumber(
      item?.membersCount ??
        item?.member_count ??
        item?.members ??
        item?.totalMembers ??
        item?.total_members ??
        null,
      null,
    ),
    attendanceRate:
      clampPercentage(
        item?.attendanceRate ??
          item?.attendance_rate ??
          item?.percentage ??
          summary.attendanceRate,
      ) ?? null,
    summary: summary.summary,
    verification: summary.verification,
  };
};

const normalizeWeek = (item, index = 0) => {
  if (!item) {
    return null;
  }

  const summaryPayload = item?.summary ?? item?.metrics ?? item;
  const baseSummary = normalizeSummary(summaryPayload);
  const dateRange = extractDateRange(item);
  const groups = ensureArray(item?.groups ?? item?.kelompok ?? item?.group_list)
    .map((group, groupIndex) => normalizeGroup(group, groupIndex))
    .filter(Boolean);

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
    dateRange: {
      start: dateRange.start ?? baseSummary.dates?.start ?? null,
      end: dateRange.end ?? baseSummary.dates?.end ?? null,
      label: dateRange.label ?? baseSummary.dates?.label ?? labelCandidate,
    },
    groups,
  };
};

const normalizeShelterInfo = (payload = {}, fallbackId = null) => {
  if (!payload || typeof payload !== 'object') {
    return {
      id: fallbackId,
      name: 'Shelter',
      wilbin: null,
      code: null,
      mentor: null,
      period: extractDateRange({}),
    };
  }

  const dateRange = extractDateRange(payload);

  return {
    id:
      payload?.id ??
      payload?.shelterId ??
      payload?.shelter_id ??
      payload?.kode_shelter ??
      payload?.code ??
      fallbackId,
    name: payload?.name ?? payload?.shelterName ?? payload?.shelter_name ?? 'Shelter',
    wilbin: payload?.wilbin ?? payload?.wilayah ?? payload?.wilayahBinaan ?? payload?.wilayah_binaan ?? null,
    code: payload?.code ?? payload?.kode ?? payload?.shelterCode ?? payload?.shelter_code ?? null,
    mentor: payload?.mentor ?? payload?.penanggungJawab ?? payload?.penanggung_jawab ?? payload?.pj ?? null,
    period: {
      start: dateRange.start,
      end: dateRange.end,
      label: dateRange.label,
    },
    summary: normalizeSummary(payload?.summary ?? payload?.metrics ?? {}),
  };
};

const useWeeklyAttendanceShelter = ({
  shelterId,
  startDate = null,
  endDate = null,
  weekId: initialWeekId = null,
  autoFetch = true,
} = {}) => {
  const [state, setState] = useState({
    shelter: null,
    weeks: [],
    summary: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWeekId, setSelectedWeekId] = useState(initialWeekId);

  const selectedWeekRef = useRef(initialWeekId);

  useEffect(() => {
    selectedWeekRef.current = selectedWeekId;
  }, [selectedWeekId]);

  const buildParams = useCallback(
    ({ week } = {}) => {
      const params = {};
      const resolvedWeek = week !== undefined ? week : selectedWeekRef.current;

      if (resolvedWeek) {
        params.week_id = resolvedWeek;
        params.weekId = resolvedWeek;
      }

      if (startDate) {
        params.start_date = startDate;
        params.startDate = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
        params.endDate = endDate;
      }

      return params;
    },
    [endDate, startDate],
  );

  const fetchData = useCallback(
    async ({ weekId } = {}) => {
      if (!autoFetch || !shelterId) {
        if (!shelterId) {
          setError('Shelter ID wajib diisi.');
        }

        return null;
      }

      const params = buildParams({ week: weekId });

      try {
        setIsLoading(true);
        setError(null);

        const response = await adminCabangReportApi.getWeeklyAttendanceShelter(shelterId, params);
        const payload = response?.data ?? response ?? {};

        const weeksPayload = ensureArray(
          payload?.weeks ?? payload?.data?.weeks ?? payload?.periods ?? [],
        );

        let weeks = weeksPayload.map((item, index) => normalizeWeek(item, index)).filter(Boolean);

        const shelterInfo = normalizeShelterInfo(payload?.shelter ?? payload?.data?.shelter ?? {}, shelterId);

        let summaryForState = shelterInfo.summary;

        if (!weeks.length) {
          const dataRoot = payload?.data ?? payload ?? {};

          const fallbackGroups = ensureArray(
            dataRoot?.groups ??
              dataRoot?.group_list ??
              dataRoot?.kelompok ??
              payload?.groups ??
              payload?.group_list ??
              payload?.kelompok ??
              [],
          ).filter(Boolean);

          if (fallbackGroups.length) {
            const summaryPayload =
              dataRoot?.summary ??
              dataRoot?.metrics ??
              payload?.summary ??
              payload?.metrics ??
              shelterInfo.summary ??
              {};

            const periodPayload =
              dataRoot?.period ??
              dataRoot?.periode ??
              dataRoot?.currentPeriod ??
              dataRoot?.current_period ??
              dataRoot?.periodInfo ??
              dataRoot?.period_info ??
              dataRoot?.dateRange ??
              dataRoot?.date_range ??
              payload?.period ??
              payload?.periode ??
              payload?.currentPeriod ??
              payload?.current_period ??
              payload?.dateRange ??
              payload?.date_range ??
              {};

            const fallbackWeekPayload = {
              ...periodPayload,
              summary: summaryPayload,
              groups: fallbackGroups,
            };

            const fallbackWeek = normalizeWeek(fallbackWeekPayload, 0);

            if (fallbackWeek) {
              weeks = [fallbackWeek];
              summaryForState = fallbackWeek;
            }
          }
        }

        setState({
          shelter: shelterInfo,
          weeks,
          summary: summaryForState,
        });

        if (weekId !== undefined) {
          selectedWeekRef.current = weekId;
          setSelectedWeekId(weekId || null);
        } else if (!selectedWeekRef.current && weeks.length) {
          const defaultWeekId = weeks[0]?.id ?? null;
          selectedWeekRef.current = defaultWeekId;
          setSelectedWeekId(defaultWeekId);
        }

        return { shelter: shelterInfo, weeks };
      } catch (err) {
        const message = err?.message || 'Gagal memuat detail kehadiran shelter.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [autoFetch, buildParams, shelterId],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    return fetchData({ weekId: selectedWeekRef.current });
  }, [fetchData]);

  const selectWeek = useCallback(
    (weekId) => {
      if (weekId === selectedWeekRef.current) {
        return;
      }

      selectedWeekRef.current = weekId || null;
      setSelectedWeekId(weekId || null);
      fetchData({ weekId: weekId || null }).catch(() => {});
    },
    [fetchData],
  );

  const weeks = useMemo(() => state.weeks, [state.weeks]);

  const selectedWeek = useMemo(() => {
    if (!weeks || !weeks.length) {
      return null;
    }

    if (selectedWeekId) {
      return weeks.find((week) => week.id === selectedWeekId) || weeks[0];
    }

    return weeks[0];
  }, [selectedWeekId, weeks]);

  const groups = useMemo(() => selectedWeek?.groups ?? [], [selectedWeek?.groups]);

  const periodLabel = useMemo(() => selectedWeek?.dateRange?.label ?? state.shelter?.period?.label ?? null, [
    selectedWeek?.dateRange?.label,
    state.shelter?.period?.label,
  ]);

  return {
    shelter: state.shelter,
    weeks,
    summary: state.summary,
    selectedWeek,
    selectedWeekId,
    groups,
    periodLabel,
    isLoading,
    error,
    refresh,
    selectWeek,
  };
};

export default useWeeklyAttendanceShelter;

