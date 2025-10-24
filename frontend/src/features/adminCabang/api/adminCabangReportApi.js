import api from '../../../api/axiosConfig';
import { ADMIN_CABANG_ENDPOINTS } from '../../../constants/endpoints';

const firstDefined = (...values) => {
  return values.find((value) => value !== undefined && value !== null && value !== '');
};

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.').trim();
    if (!normalized) return null;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object') {
    const candidates = ['value', 'total', 'count', 'amount', 'number'];
    for (const key of candidates) {
      if (key in value) {
        const parsed = normalizeNumber(value[key]);
        if (parsed !== null) {
          return parsed;
        }
      }
    }
  }

  return null;
};

const normalizeInteger = (value) => {
  const parsed = normalizeNumber(value);
  if (parsed === null) return null;
  if (Number.isInteger(parsed)) return parsed;
  const rounded = Math.round(parsed);
  return Number.isFinite(rounded) ? rounded : null;
};

const normalizePercentage = (value) => {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    if (value > -1 && value < 1) {
      return value * 100;
    }
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return null;

    const percentMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      const parsed = Number(percentMatch[1]);
      return Number.isFinite(parsed) ? parsed : null;
    }

    const fractionMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
    if (fractionMatch) {
      const numerator = Number(fractionMatch[1]);
      const denominator = Number(fractionMatch[2]);
      if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
        return (numerator / denominator) * 100;
      }
    }

    const cleaned = normalized.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
    if (!cleaned) return null;

    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return null;

    if (parsed > -1 && parsed < 1) {
      return parsed * 100;
    }

    return parsed;
  }

  if (typeof value === 'object') {
    const candidates = [
      value.value,
      value.percentage,
      value.percent,
      value.rate,
      value.ratio,
      value.amount,
      value.display,
      value.label,
      value.text,
    ];

    for (const candidate of candidates) {
      const parsed = normalizePercentage(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return null;
};

const formatPercentageLabel = (value, fallback) => {
  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback.trim();
  }

  const normalized = normalizePercentage(value);
  if (normalized === null) return null;

  return `${normalized.toFixed(1)}%`;
};

const extractPagination = (source) => {
  if (!source) return null;

  if (Array.isArray(source)) {
    return extractPagination(source[0]);
  }

  if (typeof source === 'object') {
    if (source.pagination) {
      return extractPagination(source.pagination);
    }

    const page = firstDefined(source.page, source.currentPage, source.current_page);
    const perPage = firstDefined(
      source.per_page,
      source.perPage,
      source.pageSize,
      source.limit,
      source.size,
    );
    const total = firstDefined(
      source.total,
      source.total_items,
      source.totalItems,
      source.total_records,
      source.totalRecords,
      source.count,
    );
    const totalPages = firstDefined(
      source.total_pages,
      source.totalPages,
      source.last_page,
      source.pages,
    );
    const nextPage = firstDefined(source.nextPage, source.next_page);
    const prevPage = firstDefined(source.prevPage, source.prev_page, source.previous_page);

    if (
      page !== undefined ||
      perPage !== undefined ||
      total !== undefined ||
      totalPages !== undefined ||
      nextPage !== undefined ||
      prevPage !== undefined
    ) {
      return {
        page,
        perPage,
        total,
        totalPages,
        nextPage,
        prevPage,
      };
    }
  }

  return null;
};

// ✅ Final: versi normalizeChildAttendanceParams yang lengkap dan seragam
const normalizeChildAttendanceParams = (params = {}) => {
  const normalized = {};

  const assignIfDefined = (key, ...candidates) => {
    const value = firstDefined(...candidates);
    if (value !== undefined) {
      normalized[key] = value;
    }
  };

  assignIfDefined('page', params.page);
  assignIfDefined('per_page', params.per_page, params.perPage, params.pageSize);
  assignIfDefined('search', params.search, params.keyword, params.q, params.term);
  assignIfDefined('shelter_id', params.shelter_id, params.shelterId);
  assignIfDefined('group_id', params.group_id, params.groupId);
  assignIfDefined('start_date', params.start_date, params.startDate);
  assignIfDefined('end_date', params.end_date, params.endDate);
  normalized.sort_by = 'attendance_rate';

  const sortDirectionCandidate = firstDefined(
    params.sort_direction,
    params.sortDirection,
    params.order,
  );

  if (typeof sortDirectionCandidate === 'string') {
    const normalizedDirection = sortDirectionCandidate.toLowerCase();
    normalized.sort_direction = normalizedDirection === 'asc' ? 'asc' : 'desc';
  } else {
    normalized.sort_direction = 'desc';
  }

  return normalized;
};

// ✅ Gabungin logika versi paling robust dari dua branch
const adaptChildAttendanceResponse = (response) => {
  const rawPayload = response?.data ?? response ?? {};
  const dataPayload = rawPayload?.data ?? rawPayload ?? {};

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const nested = firstDefined(
        value.data,
        value.items,
        value.list,
        value.records,
        value.children,
        value.rows
      );
      if (nested !== undefined) {
        return ensureArray(nested).filter(Boolean);
      }
    }
    return ensureArray(value).filter(Boolean);
  };

  const getArrayField = (...candidates) => {
    const source = firstDefined(...candidates);
    return toArray(source);
  };

  const adaptedData = {
    ...dataPayload,
    children: getArrayField(
      dataPayload.children,
      dataPayload.child_list,
      dataPayload.childList,
      rawPayload.children,
      rawPayload.child_list,
      rawPayload.childList
    ),
    shelter_breakdown: getArrayField(
      dataPayload.shelter_breakdown,
      dataPayload.shelterBreakdown,
      rawPayload.shelter_breakdown,
      rawPayload.shelterBreakdown
    ),
    shelter_attendance_chart: getArrayField(
      dataPayload.shelter_attendance_chart,
      dataPayload.shelterAttendanceChart,
      rawPayload.shelter_attendance_chart,
      rawPayload.shelterAttendanceChart
    ),
    attendance_band_distribution: firstDefined(
      dataPayload.attendance_band_distribution,
      dataPayload.attendanceBandDistribution,
      rawPayload.attendance_band_distribution,
      rawPayload.attendanceBandDistribution,
      { high: 0, medium: 0, low: 0 }
    ),
  };

  const metadataSources = [
    dataPayload,
    rawPayload,
    dataPayload.meta,
    rawPayload.meta,
    dataPayload.children,
    rawPayload.children,
    dataPayload.children?.meta,
    rawPayload.children?.meta,
  ];

  const assignMetadata = (key) => {
    const value = firstDefined(...metadataSources.map((s) => s?.[key]));
    if (value !== undefined) {
      adaptedData[key] = value;
    }
  };

  ['last_refreshed_at', 'filters', 'available_filters', 'pagination'].forEach(assignMetadata);

  if (response?.data) {
    return { ...response, data: adaptedData };
  }

  return adaptedData;
};

const normalizeTutorReportParams = (params = {}) => {
  const normalized = {};

  const assignIfDefined = (key, ...candidates) => {
    const value = firstDefined(...candidates);
    if (value !== undefined && value !== null && value !== '') {
      normalized[key] = value;
    }
  };

  assignIfDefined('page', params.page, params.current_page, params.currentPage);
  assignIfDefined('per_page', params.per_page, params.perPage, params.pageSize, params.limit);
  assignIfDefined(
    'start_date',
    params.start_date,
    params.startDate,
    params.dateRange?.start,
    params.date_range?.start,
    params.period?.start,
  );
  assignIfDefined(
    'end_date',
    params.end_date,
    params.endDate,
    params.dateRange?.end,
    params.date_range?.end,
    params.period?.end,
  );
  assignIfDefined(
    'jenis_kegiatan',
    params.jenis_kegiatan,
    params.jenisKegiatan,
    params.activityType,
    params.activity_type,
    params.type,
  );
  assignIfDefined(
    'shelter_id',
    params.shelter_id,
    params.shelterId,
    params.shelter?.id,
    params.shelter,
  );

  return normalized;
};

const adaptTutorSummary = (rawSummary = {}, tutors = []) => {
  const summarySource = rawSummary || {};

  const totalTutors = normalizeInteger(
    firstDefined(
      summarySource.total_tutors,
      summarySource.totalTutors,
      summarySource.tutors,
      summarySource.total,
      summarySource.count,
      tutors.length,
    ),
  ) ?? tutors.length;

  const presentCount = normalizeInteger(
    firstDefined(
      summarySource.present,
      summarySource.presentCount,
      summarySource.hadir,
      summarySource.hadir_count,
      summarySource.total_hadir,
    ),
  ) ?? 0;

  const absentCount = normalizeInteger(
    firstDefined(
      summarySource.absent,
      summarySource.absentCount,
      summarySource.tidakHadir,
      summarySource.tidak_hadir,
      summarySource.total_tidak_hadir,
    ),
  ) ?? 0;

  const lateCount = normalizeInteger(
    firstDefined(
      summarySource.late,
      summarySource.lateCount,
      summarySource.terlambat,
      summarySource.terlambat_count,
      summarySource.total_terlambat,
    ),
  ) ?? 0;

  const totalActivities = normalizeInteger(
    firstDefined(
      summarySource.total_activities,
      summarySource.totalActivities,
      summarySource.total_aktivitas,
      summarySource.totalSessions,
      summarySource.total_sessions,
      summarySource.activities,
      presentCount + absentCount,
    ),
  );

  const attendanceRateValue = normalizePercentage(
    firstDefined(
      summarySource.attendanceRate,
      summarySource.attendance_rate,
      summarySource.average_attendance,
      summarySource.averageAttendance,
      summarySource.averageAttendanceRate,
      summarySource.avg_attendance_rate,
      summarySource.attendance,
    ),
  );

  const attendanceRateLabel = formatPercentageLabel(
    attendanceRateValue,
    firstDefined(
      summarySource.attendanceRateLabel,
      summarySource.attendance_rate_label,
      summarySource.attendanceLabel,
      summarySource.attendance_label,
      summarySource.attendanceRateText,
      summarySource.attendance_rate_text,
      summarySource.attendancePercentageLabel,
      summarySource.attendance_percentage_label,
    ),
  );

  const dateRange = {
    label: firstDefined(
      summarySource.dateRange?.label,
      summarySource.date_range?.label,
      summarySource.period?.label,
      summarySource.periodLabel,
      summarySource.rangeLabel,
      null,
    ),
    start: firstDefined(
      summarySource.dateRange?.start,
      summarySource.date_range?.start,
      summarySource.period?.start,
      summarySource.startDate,
      summarySource.start_date,
      null,
    ),
    end: firstDefined(
      summarySource.dateRange?.end,
      summarySource.date_range?.end,
      summarySource.period?.end,
      summarySource.endDate,
      summarySource.end_date,
      null,
    ),
  };

  return {
    totalTutors,
    totalActivities: totalActivities ?? presentCount + absentCount,
    presentCount,
    absentCount,
    lateCount,
    attendanceRate: attendanceRateValue,
    attendanceRateLabel,
    dateRange,
    raw: summarySource,
  };
};

const adaptTutorRecord = (record = {}, index = 0) => {
  const attendanceRateValue = normalizePercentage(
    firstDefined(
      record.attendanceRate,
      record.attendance_rate,
      record.attendance?.rate,
      record.attendance_percentage,
      record.attendancePercentage,
      record.rate,
      record.percentage,
    ),
  );

  const presentCount = normalizeInteger(
    firstDefined(
      record.present,
      record.presentCount,
      record.hadir,
      record.hadir_count,
      record.total_hadir,
    ),
  );

  const absentCount = normalizeInteger(
    firstDefined(
      record.absent,
      record.absentCount,
      record.tidakHadir,
      record.tidak_hadir,
      record.total_tidak_hadir,
    ),
  );

  const lateCount = normalizeInteger(
    firstDefined(
      record.late,
      record.lateCount,
      record.terlambat,
      record.terlambat_count,
      record.total_terlambat,
    ),
  );

  const totalActivities = normalizeInteger(
    firstDefined(
      record.totalActivities,
      record.total_activities,
      record.totalSessions,
      record.total_sessions,
      record.activities,
      record.activity_count,
      record.sessions,
      presentCount !== null && absentCount !== null ? presentCount + absentCount : null,
    ),
  );

  const code = firstDefined(
    record.code,
    record.tutorCode,
    record.tutor_code,
    record.identifier,
    record.nik,
    record.userCode,
    record.user_code,
  );

  const name = firstDefined(
    record.name,
    record.full_name,
    record.fullName,
    record.tutor,
    record.tutorName,
    record.tutor_name,
    record.user?.name,
    'Tutor',
  );

  const shelterName = firstDefined(
    record.shelterName,
    record.shelter_name,
    record.shelter?.name,
    record.shelter,
    record.location,
    record.location_name,
    record.branch,
    null,
  );

  const attendanceRateLabel = formatPercentageLabel(
    attendanceRateValue,
    firstDefined(
      record.attendanceRateLabel,
      record.attendance_rate_label,
      record.attendanceLabel,
      record.attendance_label,
      record.attendanceRateText,
      record.attendance_rate_text,
      record.attendancePercentageLabel,
      record.attendance_percentage_label,
    ),
  );

  return {
    id: firstDefined(
      record.id,
      record.tutorId,
      record.tutor_id,
      record.user_id,
      record.user?.id,
      code,
      `tutor-${index}`,
    ),
    code,
    name,
    shelterName,
    totalActivities: totalActivities ?? (presentCount ?? 0) + (absentCount ?? 0),
    presentCount: presentCount ?? 0,
    absentCount: absentCount ?? 0,
    lateCount: lateCount ?? 0,
    attendanceRate: attendanceRateValue,
    attendanceRateLabel,
    attendanceRateValue,
    raw: record,
  };
};

const adaptTutorReportResponse = (response) => {
  const rawPayload = response?.data ?? response ?? {};
  const payload = rawPayload?.data ?? rawPayload ?? {};

  const toArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null);
    if (typeof value === 'object') {
      const nestedCandidates = [
        value.data,
        value.items,
        value.list,
        value.records,
        value.rows,
        value.tutors,
        value.results,
      ];
      for (const candidate of nestedCandidates) {
        const result = toArray(candidate);
        if (result.length > 0) {
          return result;
        }
      }
    }
    return ensureArray(value).filter((item) => item !== undefined && item !== null);
  };

  const tutorCandidates = [
    payload.tutors,
    payload.data,
    payload.items,
    payload.list,
    payload.records,
    rawPayload.tutors,
    rawPayload.data,
    rawPayload.items,
    rawPayload.list,
  ];

  let tutorData = [];
  for (const candidate of tutorCandidates) {
    const arrayCandidate = toArray(candidate);
    if (arrayCandidate.length > 0) {
      tutorData = arrayCandidate;
      break;
    }
  }

  const tutors = tutorData.map((item, index) => adaptTutorRecord(item, index));

  const summarySource = firstDefined(
    payload.summary,
    rawPayload.summary,
    payload.totals,
    rawPayload.totals,
    payload.meta?.summary,
    rawPayload.meta?.summary,
    payload.overview,
    rawPayload.overview,
    {},
  ) || {};

  const summary = adaptTutorSummary(summarySource, tutors);

  const metadata = {};

  const filters = firstDefined(
    payload.filters,
    rawPayload.filters,
    payload.metadata?.filters,
    rawPayload.metadata?.filters,
    payload.meta?.filters,
    rawPayload.meta?.filters,
  );

  if (filters !== undefined) {
    metadata.filters = filters;
  }

  const availableFilters = firstDefined(
    payload.available_filters,
    payload.availableFilters,
    rawPayload.available_filters,
    rawPayload.availableFilters,
    payload.metadata?.available_filters,
    rawPayload.metadata?.available_filters,
    payload.meta?.available_filters,
    payload.meta?.availableFilters,
    rawPayload.meta?.available_filters,
    rawPayload.meta?.availableFilters,
  );

  if (availableFilters !== undefined) {
    metadata.available_filters = availableFilters;
  }

  const lastRefreshedAt = firstDefined(
    payload.last_refreshed_at,
    payload.lastRefreshedAt,
    rawPayload.last_refreshed_at,
    rawPayload.lastRefreshedAt,
    payload.meta?.last_refreshed_at,
    payload.meta?.lastRefreshedAt,
    rawPayload.meta?.last_refreshed_at,
    rawPayload.meta?.lastRefreshedAt,
  );

  if (lastRefreshedAt !== undefined) {
    metadata.last_refreshed_at = lastRefreshedAt;
  }

  const paginationCandidate = firstDefined(
    payload.pagination,
    rawPayload.pagination,
    payload.metadata?.pagination,
    rawPayload.metadata?.pagination,
    payload.meta?.pagination,
    rawPayload.meta?.pagination,
    payload.meta,
    rawPayload.meta,
  );

  const pagination = extractPagination(paginationCandidate);
  if (pagination) {
    metadata.pagination = pagination;
  }

  const adapted = {
    data: tutors,
    summary,
    metadata,
  };

  if (response?.data) {
    return { ...response, data: adapted };
  }

  return adapted;
};

const {
  REPORTS: {
    SUMMARY: SUMMARY_ENDPOINT,
    ATTENDANCE: ATTENDANCE_ENDPOINTS,
    CHILD_ATTENDANCE: CHILD_ATTENDANCE_ENDPOINTS,
    TUTORS: TUTOR_ATTENDANCE_ENDPOINT,
  },
} = ADMIN_CABANG_ENDPOINTS;

export const adminCabangReportApi = {
  async getSummary(params = {}) {
    return api.get(SUMMARY_ENDPOINT, { params });
  },

  async getAttendanceMonthlyShelter(params = {}) {
    return api.get(ATTENDANCE_ENDPOINTS.MONTHLY_SHELTER, { params });
  },

  async getAttendanceMonthlyBranch(params = {}) {
    return api.get(ATTENDANCE_ENDPOINTS.MONTHLY_BRANCH, { params });
  },

  async getChildAttendanceReport(params = {}) {
    const normalizedParams = normalizeChildAttendanceParams(params);
    return api.get(CHILD_ATTENDANCE_ENDPOINTS.LIST, { params: normalizedParams })
      .then(adaptChildAttendanceResponse);
  },

  async getChildAttendanceReportDetail(childId, params = {}) {
    if (!childId) throw new Error('Child ID is required to fetch child attendance report detail');
    const normalizedParams = normalizeChildAttendanceParams(params);
    return api.get(CHILD_ATTENDANCE_ENDPOINTS.DETAIL(childId), { params: normalizedParams })
      .then(adaptChildAttendanceResponse);
  },

  async getTutorAttendanceReport(params = {}) {
    const normalizedParams = normalizeTutorReportParams(params);
    return api
      .get(TUTOR_ATTENDANCE_ENDPOINT, { params: normalizedParams })
      .then(adaptTutorReportResponse);
  },
};
