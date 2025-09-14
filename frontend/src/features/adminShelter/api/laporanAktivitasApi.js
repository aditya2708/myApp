import api from '../../../api/axiosConfig';

/**
 * Laporan Aktivitas API service
 * Contains methods for laporan aktivitas related API requests
 */
export const laporanAktivitasApi = {
  /**
   * Get laporan aktivitas with filters
   * @param {Object} params - Query parameters
   * @param {number} params.year - Year filter
   * @param {string} params.jenis_kegiatan - Activity type filter
   * @param {number} params.month - Month filter
   * @returns {Promise} - API response with laporan data
   */
  getLaporanAktivitas: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/laporan-aktivitas', { params });
  },

  /**
   * Get activity detail report
   * @param {number|string} activityId - Activity ID
   * @returns {Promise} - API response with activity detail data
   */
  getActivityDetailReport: async (activityId) => {
    return await api.get(`/admin-shelter/laporan/aktivitas/detail/${activityId}`);
  },

  /**
   * Get available jenis kegiatan options for filter
   * @returns {Promise} - API response with activity types
   */
  getJenisKegiatanOptions: async () => {
    return await api.get('/admin-shelter/laporan/aktivitas/jenis-kegiatan-options');
  },

  /**
   * Get available years for filter
   * @returns {Promise} - API response with available years
   */
  getAvailableYears: async () => {
    return await api.get('/admin-shelter/laporan/aktivitas/available-years');
  }
};