import api from '../../../api/axiosConfig';
import { ADMIN_CABANG_ENDPOINTS } from '../../../constants/endpoints';
import {
  adaptChildAttendanceResponse,
  adaptTutorReportResponse,
  normalizeChildAttendanceParams,
  normalizeTutorReportParams,
} from './reports';

const {
  REPORTS: {
    SUMMARY: SUMMARY_ENDPOINT,
    ATTENDANCE: ATTENDANCE_ENDPOINTS,
    CHILD_ATTENDANCE: CHILD_ATTENDANCE_ENDPOINTS,
    TUTORS: TUTOR_ATTENDANCE_ENDPOINT,
    FILTERS: REPORT_FILTER_ENDPOINTS,
  },
} = ADMIN_CABANG_ENDPOINTS;

const getSummary = (params = {}) => api.get(SUMMARY_ENDPOINT, { params });

const getAttendanceMonthlyShelter = (params = {}) =>
  api.get(ATTENDANCE_ENDPOINTS.MONTHLY_SHELTER, { params });

const getAttendanceMonthlyBranch = (params = {}) =>
  api.get(ATTENDANCE_ENDPOINTS.MONTHLY_BRANCH, { params });

const getChildAttendanceReport = async (params = {}) => {
  const normalizedParams = normalizeChildAttendanceParams(params);
  return api
    .get(CHILD_ATTENDANCE_ENDPOINTS.LIST, { params: normalizedParams })
    .then(adaptChildAttendanceResponse);
};

const getChildAttendanceReportDetail = async (childId, params = {}) => {
  if (!childId) {
    throw new Error('Child ID is required to fetch child attendance report detail');
  }
  const normalizedParams = normalizeChildAttendanceParams(params);
  return api
    .get(CHILD_ATTENDANCE_ENDPOINTS.DETAIL(childId), { params: normalizedParams })
    .then(adaptChildAttendanceResponse);
};

const getTutorAttendanceReport = async (params = {}) => {
  const normalizedParams = normalizeTutorReportParams(params);
  return api
    .get(TUTOR_ATTENDANCE_ENDPOINT, { params: normalizedParams })
    .then(adaptTutorReportResponse);
};

const getTutorWilayahFilters = (params = {}) =>
  api.get(REPORT_FILTER_ENDPOINTS.WILAYAH, { params });

const getTutorShelterFilters = (wilbinId, params = {}) => {
  if (wilbinId === undefined || wilbinId === null || wilbinId === '') {
    throw new Error('Wilbin ID is required to fetch shelter filters');
  }

  const requestParams = {
    ...params,
    wilbin_id: wilbinId,
  };

  return api.get(REPORT_FILTER_ENDPOINTS.SHELTERS, { params: requestParams });
};

export const adminCabangReportApi = {
  getSummary,
  getAttendanceMonthlyShelter,
  getAttendanceMonthlyBranch,
  getChildAttendanceReport,
  getChildAttendanceReportDetail,
  getTutorAttendanceReport,
  getTutorWilayahFilters,
  getTutorShelterFilters,
};

export {
  adaptTutorReportResponse,
  adaptChildAttendanceResponse,
  normalizeTutorReportParams,
  normalizeChildAttendanceParams,
};
