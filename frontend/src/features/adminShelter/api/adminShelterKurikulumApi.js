import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Shelter Kurikulum API service
 * Contains methods for kurikulum dashboard and related API requests
 */
export const adminShelterKurikulumApi = {
  /**
   * Get comprehensive kurikulum dashboard data
   * @returns {Promise} - API response with dashboard data including:
   *   - semesterAktif: Active semester info with progress
   *   - todayStats: Statistics for today (kelompok, activities, students, tutors)
   *   - recentActivity: Recent activities (today or last 7 days)
   *   - shelter_info: Shelter and kacab information
   */
  getDashboard: async () => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.KURIKULUM.DASHBOARD);
  },

  /**
   * Get active semester information only
   * @returns {Promise} - API response with semester info including:
   *   - nama: Semester name
   *   - periode: Semester period
   *   - progress: Progress percentage based on dates
   *   - tanggal_mulai/selesai: Start and end dates
   *   - status: Current status
   */
  getSemesterInfo: async () => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.KURIKULUM.SEMESTER_INFO);
  },

  /**
   * Get today's activities only
   * @returns {Promise} - API response with today's activities including:
   *   - time: Activity time
   *   - activity: Activity name
   *   - tutor: Tutor name
   *   - kelompok: Group name
   *   - status: Activity status
   */
  getTodayActivities: async () => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.KURIKULUM.TODAY_ACTIVITIES);
  },

  /**
   * Refresh dashboard data (alias for getDashboard)
   * @returns {Promise} - API response with fresh dashboard data
   */
  refreshDashboard: async () => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.KURIKULUM.DASHBOARD);
  }
};