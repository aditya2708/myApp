import api from '../../../api/axiosConfig';

/**
 * Raport Laporan API service
 * Contains methods for raport (report card) related API requests
 */
export const raportLaporanApi = {
  /**
   * Get laporan raport with date range filters (updated approach)
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date filter (YYYY-MM-DD)
   * @param {string} params.end_date - End date filter (YYYY-MM-DD)
   * @param {string} params.mata_pelajaran - Subject filter
   * @param {string} params.search - Search by child name
   * @param {number} params.page - Page number for pagination
   * @param {number} params.per_page - Items per page
   * @returns {Promise} - API response with laporan data
   */
  getLaporanRaport: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/raport', { params });
  },

  /**
   * Get child detail raport report with date range
   * @param {number|string} childId - Child ID
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date filter (YYYY-MM-DD)
   * @param {string} params.end_date - End date filter (YYYY-MM-DD)
   * @param {string} params.mata_pelajaran - Subject filter
   * @returns {Promise} - API response with child detail data
   */
  getChildDetailReport: async (childId, params = {}) => {
    return await api.get(`/admin-shelter/laporan/raport/child/${childId}`, { params });
  },

  /**
   * Get available semester options for filter (legacy support)
   * @returns {Promise} - API response with semester options
   */
  getSemesterOptions: async () => {
    return await api.get('/admin-shelter/laporan/raport/semester-options');
  },

  /**
   * Get available mata pelajaran options for filter
   * @returns {Promise} - API response with subject options
   */
  getMataPelajaranOptions: async () => {
    return await api.get('/admin-shelter/laporan/raport/mata-pelajaran-options');
  },

  /**
   * Get available years for filter
   * @returns {Promise} - API response with available years
   */
  getAvailableYears: async () => {
    return await api.get('/admin-shelter/laporan/raport/available-years');
  }
};