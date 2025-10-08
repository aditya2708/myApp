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

  if (value && typeof value === 'object') {
    return Object.values(value);
  }

  return [];
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
  const normalizedTotal = toNumber(total, 0);
  const normalizedCount = toNumber(count, 0);

  if (!normalizedTotal || normalizedTotal <= 0) {
    return null;
  }

  return clampPercentage((normalizedCount / normalizedTotal) * 100);
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

const normalizeStatus = (value, fallbackLabel = null) => {
  if (!value) {
    return {
      status: null,
      label: fallbackLabel || 'Tidak diketahui',
      icon: 'help-circle',
      color: '#b2bec3',
    };
  }

  const statusKey = value.toString().trim().toUpperCase();

  if (STATUS_MAP[statusKey]) {
    return STATUS_MAP[statusKey];
  }

  return {
    status: statusKey,
    label: fallbackLabel || statusKey,
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
    item?.kode_status ??
    null;

  const statusLabel =
    item?.statusLabel ??
    item?.status_label ??
    item?.attendanceStatusLabel ??
    item?.attendance_status_label ??
    item?.keterangan ??
    null;

  const statusMeta = normalizeStatus(statusValue, statusLabel);

  const timestamp =
    item?.timestamp ??
    item?.time ??
    item?.attendanceTime ??
    item?.attendance_time ??
    item?.checkedInAt ??
    item?.checked_in_at ??
    item?.waktu ??
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
      item?.studentCode ??
      item?.student_code ??
      item?.code ??
      item?.kode ??
      item?.nis ??
      item?.nisn ??
      null,
    status: statusMeta.status,
    statusLabel: statusMeta.label,
    statusIcon: statusMeta.icon,
    statusColor: statusMeta.color,
    timestamp,
    timeLabel:
      item?.timeLabel ?? item?.time_label ?? item?.waktuLabel ?? item?.waktu_label ?? formatTimeLabel(timestamp),
    timestampLabel:
      item?.timestampLabel ??
      item?.timestamp_label ??
      item?.waktuLengkap ??
      item?.waktu_lengkap ??
      formatDateTimeLabel(timestamp),
    note: item?.notes ?? item?.note ?? item?.catatan ?? null,
    raw: item,
  };
};

const normalizeSummary = (summaryPayload = {}) => {
  if (!summaryPayload || typeof summaryPayload !== 'object') {
    return null;
  }

  const presentCount =
    summaryPayload?.presentCount ??
    summaryPayload?.present_count ??
    summaryPayload?.present ??
    summaryPayload?.hadir ??
    summaryPayload?.jumlahHadir ??
    summaryPayload?.jumlah_hadir ??
    null;

  const lateCount =
    summaryPayload?.lateCount ??
    summaryPayload?.late_count ??
    summaryPayload?.late ??
    summaryPayload?.terlambat ??
    summaryPayload?.jumlahTerlambat ??
    summaryPayload?.jumlah_terlambat ??
    null;

  const absentCount =
    summaryPayload?.absentCount ??
    summaryPayload?.absent_count ??
    summaryPayload?.absent ??
    summaryPayload?.alpha ??
    summaryPayload?.jumlahAlpha ??
    summaryPayload?.jumlah_alpha ??
    null;

  const totalSessions =
    summaryPayload?.total ??
    summaryPayload?.totalSessions ??
    summaryPayload?.total_sessions ??
    summaryPayload?.totalAttendance ??
    summaryPayload?.total_attendance ??
    summaryPayload?.totalChildren ??
    summaryPayload?.total_children ??
    toNumber(presentCount, 0) + toNumber(lateCount, 0) + toNumber(absentCount, 0);

  const attendanceRate = clampPercentage(
    summaryPayload?.attendanceRate ??
      summaryPayload?.attendance_rate ??
      summaryPayload?.attendancePercentage ??
      summaryPayload?.attendance_percentage ??
      calculatePercentage(presentCount, totalSessions)
  );

  const buildMetric = (count, percentage) => ({
    count: toNumber(count, 0),
    percentage:
      percentage ??
      calculatePercentage(
        count,
        totalSessions ?? summaryPayload?.totalChildren ?? summaryPayload?.total_children ?? null
      ),
  });

  return {
    present: buildMetric(
      presentCount,
      summaryPayload?.presentPercentage ??
        summaryPayload?.present_percentage ??
        summaryPayload?.presentRate ??
        summaryPayload?.present_rate ??
        null
    ),
    late: buildMetric(
      lateCount,
      summaryPayload?.latePercentage ??
        summaryPayload?.late_percentage ??
        summaryPayload?.lateRate ??
        summaryPayload?.late_rate ??
        null
    ),
    absent: buildMetric(
      absentCount,
      summaryPayload?.absentPercentage ??
        summaryPayload?.absent_percentage ??
        summaryPayload?.absentRate ??
        summaryPayload?.absent_rate ??
        null
    ),
    total: toNumber(totalSessions, null),
    attendanceRate,
    raw: summaryPayload,
  };
};

const extractStudentsPayload = (responseData) => {
  const payload = responseData?.data ?? responseData ?? {};

  const candidates = [
    payload?.students,
    payload?.studentList,
    payload?.student_list,
    payload?.items,
    payload?.data?.students,
    payload?.data?.items,
    payload?.data?.data,
    payload?.data?.list,
    payload?.result,
    payload?.results,
    payload?.list,
    payload?.data,
    payload,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (candidate && typeof candidate === 'object' && Array.isArray(candidate.data)) {
      return candidate.data;
    }
  }

  return [];
};

const extractSummaryPayload = (responseData) => {
  const payload = responseData?.data ?? responseData ?? {};

  const candidates = [
    payload?.summary,
    payload?.groupSummary,
    payload?.group_summary,
    payload?.data?.summary,
    payload?.data?.groupSummary,
    payload?.data?.group_summary,
    payload?.meta?.summary,
    payload?.meta?.groupSummary,
    payload?.meta?.group_summary,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      return candidate;
    }
  }

  return null;
};

const extractPaginationPayload = (responseData) => {
  const payload = responseData?.data ?? responseData ?? {};

  const candidates = [
    payload?.pagination,
    payload?.meta,
    payload?.data?.pagination,
    payload?.data?.meta,
    payload?.data?.data?.pagination,
    payload?.data?.data?.meta,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      return candidate;
    }
  }

  return null;
};

const normalizePagination = (paginationPayload = {}, pageSize = DEFAULT_PAGE_SIZE) => {
  if (!paginationPayload || typeof paginationPayload !== 'object') {
    return {
      page: 1,
      perPage: pageSize,
      total: null,
      totalPages: null,
      hasNextPage: false,
    };
  }

  const page = toNumber(
    paginationPayload?.page ??
      paginationPayload?.currentPage ??
      paginationPayload?.current_page ??
      paginationPayload?.pageNumber ??
      paginationPayload?.page_number ??
      1,
    1
  );

  const perPage = toNumber(
    paginationPayload?.perPage ??
      paginationPayload?.per_page ??
      paginationPayload?.limit ??
      paginationPayload?.pageSize ??
      paginationPayload?.page_size ??
      pageSize,
    pageSize
  );

  const totalItems = toNumber(
    paginationPayload?.total ??
      paginationPayload?.totalItems ??
      paginationPayload?.total_items ??
      paginationPayload?.totalCount ??
      paginationPayload?.total_count ??
      paginationPayload?.count ??
      null,
    null
  );

  const totalPages = toNumber(
    paginationPayload?.totalPages ??
      paginationPayload?.total_pages ??
      paginationPayload?.lastPage ??
      paginationPayload?.last_page ??
      (totalItems && perPage ? Math.ceil(totalItems / perPage) : null),
    null
  );

  const hasNextFromPayload =
    paginationPayload?.hasNextPage ??
    paginationPayload?.has_next_page ??
    paginationPayload?.hasMore ??
    paginationPayload?.has_more ??
    null;

  const nextPage = paginationPayload?.nextPage ?? paginationPayload?.next_page ?? null;

  const hasNextPage = (() => {
    if (hasNextFromPayload !== null && hasNextFromPayload !== undefined) {
      return Boolean(hasNextFromPayload);
    }

    if (nextPage !== null && nextPage !== undefined) {
      return Boolean(nextPage);
    }

    if (totalPages) {
      return page < totalPages;
    }

    if (totalItems && perPage) {
      return page * perPage < totalItems;
    }

    return false;
  })();

  return {
    page,
    perPage,
    total: totalItems,
    totalPages,
    hasNextPage,
  };
};

const useAttendanceGroupStudents = ({
  groupId,
  shelterId = null,
  startDate = null,
  endDate = null,
  search = '',
  status = null,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) => {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(() => ({
    page: 1,
    perPage: pageSize,
    total: null,
    totalPages: null,
    hasNextPage: false,
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const normalizedStatus = useMemo(() => {
    if (!status) {
      return null;
    }

    return status.toString().trim().toUpperCase();
  }, [status]);

  const normalizedSearch = useMemo(() => (search ? search.toString().trim() : ''), [search]);

  const buildParams = useCallback(
    (pageParam = 1) => {
      const params = {
        page: pageParam,
        pageNumber: pageParam,
        page_number: pageParam,
        perPage: pageSize,
        per_page: pageSize,
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
        params.shelterId = shelterId;
        params.shelter_id = shelterId;
      }

      if (startDate) {
        params.startDate = startDate;
        params.start_date = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
        params.end_date = endDate;
      }

      return params;
    },
    [endDate, normalizedSearch, normalizedStatus, pageSize, shelterId, startDate]
  );

  const fetchStudents = useCallback(
    async (pageParam = 1, { append = false } = {}) => {
      if (!groupId) {
        setStudents([]);
        setSummary(null);
        setPagination((prev) => ({ ...prev, page: 1, hasNextPage: false }));
        setError('Kelompok tidak ditemukan.');
        return;
      }

      const params = buildParams(pageParam);
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      try {
        if (append) {
          setIsFetchingMore(true);
        } else {
          setIsLoading(true);
        }

        setError(null);

        const response = await adminCabangReportApi.getAttendanceWeeklyGroupStudents(groupId, params);

        if (requestIdRef.current !== requestId) {
          return;
        }

        const listPayload = extractStudentsPayload(response);
        const summaryPayload = extractSummaryPayload(response);
        const paginationPayload = extractPaginationPayload(response);

        const normalizedStudents = ensureArray(listPayload).map((item, index) =>
          normalizeStudent(item, index, pageParam)
        );

        setStudents((prev) => (append ? [...prev, ...normalizedStudents] : normalizedStudents));

        const normalizedSummary = normalizeSummary(summaryPayload);
        if (normalizedSummary) {
          setSummary(normalizedSummary);
        } else if (!append && !summaryPayload) {
          setSummary(null);
        }

        setPagination(normalizePagination(paginationPayload, pageSize));
      } catch (err) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        console.warn('Failed to fetch attendance group students:', err);
        setError(err?.message ?? 'Gagal memuat data kehadiran kelompok.');

        if (!append) {
          setStudents([]);
          setSummary(null);
          setPagination((prev) => ({ ...prev, page: 1, hasNextPage: false }));
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
          setIsFetchingMore(false);
        }
      }
    },
    [buildParams, groupId, pageSize]
  );

  useEffect(() => {
    setPagination((prev) => ({ ...prev, perPage: pageSize }));
  }, [pageSize]);

  useEffect(() => {
    fetchStudents(1, { append: false });
  }, [fetchStudents]);

  const refresh = useCallback(() => fetchStudents(1, { append: false }), [fetchStudents]);

  const loadMore = useCallback(() => {
    if (isLoading || isFetchingMore || !pagination?.hasNextPage) {
      return;
    }

    const nextPage = (pagination?.page ?? 1) + 1;
    fetchStudents(nextPage, { append: true });
  }, [fetchStudents, isFetchingMore, isLoading, pagination?.hasNextPage, pagination?.page]);

  const isInitialLoading = isLoading && students.length === 0;

  return {
    students,
    data: students,
    summary,
    pagination,
    isLoading,
    isInitialLoading,
    isFetchingMore,
    error,
    refresh,
    loadMore,
    hasNextPage: Boolean(pagination?.hasNextPage),
    filters: {
      search: normalizedSearch,
      status: normalizedStatus,
    },
  };
};

export default useAttendanceGroupStudents;
