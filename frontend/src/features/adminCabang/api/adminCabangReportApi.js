import api from '../../../api/axiosConfig';
import { ADMIN_CABANG_ENDPOINTS } from '../../../constants/endpoints';

const firstDefined = (...values) => {
  return values.find((value) => value !== undefined && value !== null && value !== '');
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

const normalizeWeeklyAttendanceParams = (params = {}) => {
  const normalized = {};

  const assignIfDefined = (key, ...candidates) => {
    const value = firstDefined(...candidates);

    if (value !== undefined) {
      normalized[key] = value;
    }
  };

  assignIfDefined('page', params.page);
  assignIfDefined('per_page', params.per_page, params.perPage, params.pageSize);
  assignIfDefined('search', params.search, params.keyword, params.q);
  assignIfDefined(
    'attendance_band',
    params.attendance_band,
    params.attendanceBand,
    params.band,
    params.band_id,
  );
  assignIfDefined(
    'attendance_bands',
    params.attendance_bands,
    params.attendanceBands,
    params.band_ids,
    params.bands,
  );
  assignIfDefined('attendance_status', params.attendance_status, params.attendanceStatus, params.status);
  assignIfDefined('start_date', params.start_date, params.startDate);
  assignIfDefined('end_date', params.end_date, params.endDate);
  assignIfDefined('week_id', params.week_id, params.weekId);
  assignIfDefined('shelter_id', params.shelter_id, params.shelterId);
  assignIfDefined('group_id', params.group_id, params.groupId);
  assignIfDefined('include_summary', params.include_summary, params.includeSummary);
  assignIfDefined('sort_by', params.sort_by, params.sortBy);
  assignIfDefined('sort_direction', params.sort_direction, params.sortDirection, params.order);
  assignIfDefined('schedule_date', params.schedule_date, params.scheduleDate);

  return normalized;
};

const adaptAttendanceActivitiesResponse = (response) => {
  const rawPayload = response?.data ?? response ?? {};
  const dataPayload = rawPayload?.data ?? rawPayload ?? {};

  const activitiesSource =
    dataPayload?.activities ??
    dataPayload?.activity_list ??
    dataPayload?.activityList ??
    rawPayload?.activities ??
    rawPayload?.activity_list ??
    rawPayload?.activityList ??
    null;

  if (!activitiesSource) {
    return response;
  }

  const activities = ensureArray(
    activitiesSource?.data ??
      activitiesSource?.items ??
      activitiesSource?.list ??
      activitiesSource?.records ??
      activitiesSource,
  ).filter(Boolean);

  const pagination =
    activitiesSource?.pagination ??
    activitiesSource?.meta ??
    activitiesSource?.paging ??
    activitiesSource?.pageInfo ??
    activitiesSource?.page_info ??
    dataPayload?.pagination ??
    rawPayload?.pagination ??
    dataPayload?.meta ??
    rawPayload?.meta ??
    null;

  const adaptedData = {
    ...dataPayload,
    activities,
    activitiesPagination: pagination ?? dataPayload?.activitiesPagination ?? rawPayload?.activitiesPagination,
  };

  if (adaptedData.pagination === undefined && pagination !== undefined) {
    adaptedData.pagination = pagination;
  }

  if (response?.data) {
    return {
      ...response,
      data: adaptedData,
    };
  }

  return adaptedData;
};

const {
  REPORTS: { SUMMARY: SUMMARY_ENDPOINT, ATTENDANCE: ATTENDANCE_ENDPOINTS, WEEKLY_ATTENDANCE: WEEKLY_ATTENDANCE_ENDPOINTS },
} = ADMIN_CABANG_ENDPOINTS;

export const adminCabangReportApi = {
  async getSummary(params = {}) {
    return api.get(SUMMARY_ENDPOINT, { params });
  },

  async getWeeklyAttendanceDashboard(params = {}) {
    const normalizedParams = normalizeWeeklyAttendanceParams(params);
    return api.get(WEEKLY_ATTENDANCE_ENDPOINTS.DASHBOARD, { params: normalizedParams });
  },

  async getWeeklyAttendanceShelter(shelterId, params = {}) {
    if (!shelterId) {
      throw new Error('Shelter ID is required to fetch weekly attendance shelter detail');
    }

    const normalizedParams = normalizeWeeklyAttendanceParams({ shelterId, ...params });

    return api
      .get(WEEKLY_ATTENDANCE_ENDPOINTS.SHELTER_DETAIL(shelterId), {
        params: normalizedParams,
      })
      .then(adaptAttendanceActivitiesResponse);
  },

  async getWeeklyAttendanceGroupStudents(groupId, params = {}) {
    if (!groupId) {
      throw new Error('Group ID is required to fetch weekly attendance group students');
    }

    const normalizedParams = normalizeWeeklyAttendanceParams({ groupId, ...params });

    return api
      .get(WEEKLY_ATTENDANCE_ENDPOINTS.GROUP_STUDENTS(groupId), {
        params: normalizedParams,
      })
      .then(adaptAttendanceActivitiesResponse);
  },

  async getAttendanceMonthlyShelter(params = {}) {
    return api.get(ATTENDANCE_ENDPOINTS.MONTHLY_SHELTER, { params });
  },

  async getAttendanceMonthlyBranch(params = {}) {
    return api.get(ATTENDANCE_ENDPOINTS.MONTHLY_BRANCH, { params });
  },
};

