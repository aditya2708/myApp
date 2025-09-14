import api from '../../../api/axiosConfig';

/**
 * Laporan API service
 * Contains methods for laporan (reports) related API requests
 */
export const laporanApi = {
  /**
   * Get laporan anak binaan with filters
   * @param {Object} params - Query parameters
   * @param {number} params.year - Year filter
   * @param {string} params.jenis_kegiatan - Activity type filter
   * @returns {Promise} - API response with laporan data
   */
  getLaporanAnakBinaan: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/anak-binaan', { params });
  },

  /**
   * Get child detail report
   * @param {number|string} childId - Child ID
   * @param {Object} params - Query parameters
   * @param {number} params.year - Year filter
   * @param {string} params.jenis_kegiatan - Activity type filter
   * @returns {Promise} - API response with child detail data
   */
  getChildDetailReport: async (childId, params = {}) => {
    return await api.get(`/admin-shelter/laporan/anak-binaan/child/${childId}`, { params });
  },

  /**
   * Get available jenis kegiatan options for filter
   * @returns {Promise} - API response with activity types
   */
  getJenisKegiatanOptions: async () => {
    return await api.get('/admin-shelter/laporan/jenis-kegiatan-options');
  },

  /**
   * Get available years for filter
   * @returns {Promise} - API response with available years
   */
  getAvailableYears: async () => {
    return await api.get('/admin-shelter/laporan/available-years');
  }
};