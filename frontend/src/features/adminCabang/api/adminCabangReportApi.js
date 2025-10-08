import api from '../../../api/axiosConfig';
import { ADMIN_CABANG_ENDPOINTS } from '../../../constants/endpoints';

const {
  REPORTS: {
    SUMMARY: SUMMARY_ENDPOINT,
    ATTENDANCE_SUMMARY: ATTENDANCE_SUMMARY_ENDPOINT,
    ATTENDANCE: ATTENDANCE_ENDPOINTS,
    WEEKLY_ATTENDANCE: WEEKLY_ATTENDANCE_ENDPOINTS,
    ANAK: {
      LIST: LIST_ENDPOINT,
      DETAIL: DETAIL_ENDPOINT,
      FILTER_OPTIONS: ANAK_FILTER_OPTIONS_ENDPOINT,
      FILTERS
    }
  }
} = ADMIN_CABANG_ENDPOINTS;

export const adminCabangReportApi = {
  async getSummary(params = {}) {
    return api.get(SUMMARY_ENDPOINT, { params });
  },

  async getLaporanAnakBinaan(params = {}) {
    return api.get(LIST_ENDPOINT, { params });
  },

  async getLaporanAnakFilterOptions(params = {}) {
    return api.get(ANAK_FILTER_OPTIONS_ENDPOINT, { params });
  },

  async getChildDetailReport(childId, params = {}) {
    return api.get(DETAIL_ENDPOINT(childId), { params });
  },

  async getShelterOptionsByWilayah(wilbinId) {
    return api.get(FILTERS.SHELTER_BY_WILAYAH(wilbinId));
  },

  async getAttendanceSummary(cabangId, params = {}) {
    if (!cabangId) {
      throw new Error('Cabang ID is required to fetch attendance summary');
    }

    return api.get(ATTENDANCE_SUMMARY_ENDPOINT(cabangId), { params });
  },

  async getWeeklyAttendanceDashboard(params = {}) {
    return api.get(WEEKLY_ATTENDANCE_ENDPOINTS.DASHBOARD, { params });
  },

  async getWeeklyAttendanceShelter(shelterId, params = {}) {
    if (!shelterId) {
      throw new Error('Shelter ID is required to fetch weekly attendance shelter detail');
    }

    return api.get(WEEKLY_ATTENDANCE_ENDPOINTS.SHELTER_DETAIL(shelterId), { params });
  },

  async getWeeklyAttendanceGroupStudents(groupId, params = {}) {
    if (!groupId) {
      throw new Error('Group ID is required to fetch weekly attendance group students');
    }

    return api.get(WEEKLY_ATTENDANCE_ENDPOINTS.GROUP_STUDENTS(groupId), { params });
  },

  async getAttendanceMonthlyShelter(params = {}) {
    return api.get(ATTENDANCE_ENDPOINTS.MONTHLY_SHELTER, { params });
  },

  async getAttendanceMonthlyBranch(params = {}) {
    return api.get(ATTENDANCE_ENDPOINTS.MONTHLY_BRANCH, { params });
  },
};
