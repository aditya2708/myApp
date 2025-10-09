import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';

const DEFAULT_PAGE_SIZE = 20;

const STATUS_MAP = {
  H: { status: 'H', label: 'Hadir', icon: 'checkmark-circle', color: '#2ecc71' },
  A: { status: 'A', label: 'Tidak Hadir', icon: 'close-circle', color: '#e74c3c' },
  T: { status: 'T', label: 'Terlambat', icon: 'time', color: '#f1c40f' },
  S: { status: 'S', label: 'Sakit', icon: 'medkit', color: '#00cec9' },
  I: { status: 'I', label: 'Izin', icon: 'document-text', color: '#0984e3' },
};

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  if (typeof value === 'object') {
    return Object.values(value);
  }

  return [];
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

const formatTimeLabel = (timestamp) => {
  if (!timestamp) {
    return null;
  }

  try {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.warn('Failed to format time label:', error);
    return null;
  }
};

const formatDateTimeLabel = (timestamp) => {
  if (!timestamp) {
    return null;
  }

  try {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.warn('Failed to format date time label:', error);
    return null;
  }
};

const normalizeStatus = (value, label) => {
  if (value && typeof value === 'object') {
    const code = value?.code ?? value?.status ?? value?.value ?? null;
    const fallback = code ? STATUS_MAP[code.toString().trim().toUpperCase()] : null;
    return {
      status: code ?? fallback?.status ?? null,
      label: value?.label ?? label ?? fallback?.label ?? code ?? 'Tidak diketahui',
      icon: value?.icon ?? fallback?.icon ?? 'help-circle',
      color: value?.color ?? fallback?.color ?? '#b2bec3',
    };
  }

  if (!value) {
    return {
      status: null,
      label: label || 'Tidak diketahui',
      icon: 'help-circle',
      color: '#b2bec3',
    };
  }

  const code = value.toString().trim().toUpperCase();

  if (STATUS_MAP[code]) {
    return STATUS_MAP[code];
  }

  return {
    status: code,
    label: label || code,
    icon: 'ellipse-outline',
    color: '#636e72',
  };
};

const normalizeStudent = (item, index = 0, page = 1) => {
  const statusValue =
    item?.status ??
    item?.statusCode ??
    item?.status_code ??
    item?.attendanceStatus ??
    item?.attendance_status ??
    item?.kehadiran ??
    item?.kode_status;

  const statusLabel =
    (typeof item?.status === 'object' ? item?.status?.label : null) ??
    item?.statusLabel ??
    item?.status_label ??
    item?.attendanceStatusLabel ??
    item?.attendance_status_label ??
    item?.keterangan ??
    null;

  const statusMeta = normalizeStatus(statusValue, statusLabel);

  const arrivalTimestamp =
    item?.arrival_time ??
    item?.arrivalTime ??
    item?.timestamp ??
    item?.time ??
    item?.attendanceTime ??
    item?.attendance_time ??
    item?.checkedInAt ??
    item?.checked_in_at ??
    item?.waktu ??
    null;

  const arrivalLabel =
    item?.arrival_time_label ??
    item?.arrivalTimeLabel ??
    null;

  const fallbackId = `student-${page}-${index + 1}`;

  return {
    id:
      item?.id ??
      item?.attendanceId ??
      item?.attendance_id ??
      item?.studentAttendanceId ??
      item?.studentAttendance_id ??
      item?.studentId ??
      item?.student_id ??
      fallbackId,
    studentId:
      item?.studentId ??
      item?.student_id ??
      item?.anakId ??
      item?.anak_id ??
      item?.childId ??
      item?.child_id ??
      null,
    name:
      item?.name ??
      item?.studentName ??
      item?.student_name ??
      item?.nama ??
      item?.childName ??
      item?.child_name ??
      'Tanpa Nama',
    identifier:
      item?.identifier ??
      item?.studentCode ??
      item?.student_code ??
      item?.kode ??
      item?.kode_anak ??
      item?.kode_siswa ??
      null,
    status: statusMeta.status,
    statusLabel: statusMeta.label,
    statusIcon: statusMeta.icon,
    statusColor: statusMeta.color,
    timeLabel:
      arrivalLabel ??
      formatTimeLabel(arrivalTimestamp) ??
      formatTimeLabel(item?.status?.timestamp ?? item?.status?.time),
    timestampLabel:
      formatDateTimeLabel(arrivalTimestamp) ??
      item?.arrival_time_label ??
      formatDateTimeLabel(item?.status?.timestamp ?? item?.status?.time),
    note:
      item?.notes ??
      item?.note ??
      item?.catatan ??
      item?.remark ??
      item?.status?.notes ??
      null,
    activityDate: item?.activity_date ?? item?.activityDate ?? null,
  };
};

const normalizeSummary = (payload = {}) => {
  const present = toNumber(
    payload?.present ??
      payload?.presentCount ??
      payload?.present_count ??
      payload?.hadir ??
      payload?.summary?.present,
    0,
  );
  const absent = toNumber(
    payload?.absent ??
      payload?.absentCount ??
      payload?.absent_count ??
      payload?.alpha ??
      payload?.summary?.absent,
    0,
  );
  const late = toNumber(
    payload?.late ??
      payload?.lateCount ??
      payload?.late_count ??
      payload?.terlambat ??
      payload?.summary?.late,
    0,
  );

  const total = toNumber(
    payload?.total ??
      payload?.totalStudents ??
      payload?.total_students ??
      payload?.count ??
      payload?.summary?.total ??
      present + absent + late,
    present + absent + late,
  );

  return {
    attendanceRate:
      clampPercentage(
        payload?.attendanceRate ??
          payload?.attendance_rate ??
          payload?.percentage ??
          calculatePercentage(present, total),
      ) ?? null,
    present: {
      count: present,
      percentage: calculatePercentage(present, total),
    },
    late: {
      count: late,
      percentage: calculatePercentage(late, total),
    },
    absent: {
      count: absent,
      percentage: calculatePercentage(absent, total),
    },
    totals: {
      present,
      absent,
      late,
      total,
    },
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

const useWeeklyAttendanceGroupStudents = ({
  groupId,
  shelterId,
  weekId = null,
  startDate = null,
  endDate = null,
  search = '',
  status = null,
  pageSize = DEFAULT_PAGE_SIZE,
  autoFetch = true,
} = {}) => {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: pageSize,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(null);

  const pageRef = useRef(1);

  const normalizedSearch = useMemo(() => search?.toString().trim(), [search]);
  const normalizedStatus = useMemo(() => (status ? status.toString().trim().toUpperCase() : null), [status]);

  const buildParams = useCallback(
    ({ page = 1 } = {}) => {
      const params = {
        page,
        per_page: pageSize,
        perPage: pageSize,
      };

      if (normalizedSearch) {
        params.search = normalizedSearch;
        params.keyword = normalizedSearch;
        params.q = normalizedSearch;
      }

      if (normalizedStatus) {
        params.status = normalizedStatus;
        params.attendanceStatus = normalizedStatus;
        params.attendance_status = normalizedStatus;
      }

      if (shelterId) {
        params.shelter_id = shelterId;
        params.shelterId = shelterId;
      }

      if (weekId) {
        params.week_id = weekId;
        params.weekId = weekId;
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
    [endDate, normalizedSearch, normalizedStatus, pageSize, shelterId, startDate, weekId],
  );

  const fetchData = useCallback(
    async ({ append = false, page = 1 } = {}) => {
      if (!autoFetch || !groupId) {
        if (!groupId) {
          setError('Group ID wajib diisi.');
        }

        return null;
      }

      const params = buildParams({ page });

      try {
        if (append) {
          setIsFetchingMore(true);
        } else {
          setIsLoading(true);
        }

        setError(null);

        const response = await adminCabangReportApi.getWeeklyAttendanceGroupStudents(groupId, params);
        const payload = response?.data ?? response ?? {};
        const dataRoot = payload?.data ?? payload ?? {};

        const listPayload =
          dataRoot?.students ??
          dataRoot?.items ??
          dataRoot?.records ??
          dataRoot?.list ??
          [];

        const normalizedStudents = ensureArray(listPayload).map((item, index) =>
          normalizeStudent(item, index, page),
        );

        setStudents((prev) => (append ? [...prev, ...normalizedStudents] : normalizedStudents));

        const summaryPayload =
          dataRoot?.summary ?? dataRoot?.overview ?? dataRoot?.aggregates ?? payload?.summary ?? {};
        setSummary(normalizeSummary(summaryPayload));

        const paginationPayload = dataRoot?.pagination ?? dataRoot?.meta ?? payload?.pagination ?? payload?.meta ?? {};
        const normalizedPagination = normalizePagination(
          paginationPayload,
          pageSize,
          normalizedStudents.length,
        );
        setPagination({ ...normalizedPagination, page });
        pageRef.current = page;

        return normalizedStudents;
      } catch (err) {
        const message = err?.message || 'Gagal memuat daftar kehadiran siswa.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [autoFetch, buildParams, groupId, pageSize],
  );

  useEffect(() => {
    fetchData({ append: false, page: 1 }).catch(() => {});
  }, [fetchData, normalizedSearch, normalizedStatus, weekId, startDate, endDate]);

  const refresh = useCallback(async () => {
    return fetchData({ append: false, page: 1 });
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (!pagination?.hasNextPage || isLoading || isFetchingMore) {
      return;
    }

    const nextPage = (pagination?.page || pageRef.current || 1) + 1;
    fetchData({ append: true, page: nextPage }).catch(() => {});
  }, [fetchData, isFetchingMore, isLoading, pagination]);

  return {
    students,
    summary,
    pagination,
    isLoading,
    isFetchingMore,
    error,
    refresh,
    loadMore,
    hasNextPage: pagination?.hasNextPage ?? false,
    page: pagination?.page ?? 1,
    status: normalizedStatus,
    search: normalizedSearch,
  };
};

export default useWeeklyAttendanceGroupStudents;

