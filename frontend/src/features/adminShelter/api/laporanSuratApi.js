import api from '../../../api/axiosConfig';

/**
 * Laporan Surat API service
 * Contains methods for surat laporan API requests
 */
export const laporanSuratApi = {
  /**
   * Get laporan surat with statistics
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with statistics and shelter data
   */
  getLaporanSurat: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/surat', { params });
  },

  /**
   * Get detailed surat list for specific shelter
   * @param {number|string} shelterId - Shelter ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with surat list
   */
  getShelterDetail: async (shelterId, params = {}) => {
    return await api.get(`/admin-shelter/laporan/surat/shelter/${shelterId}`, { params });
  },

  /**
   * Get filter options for dropdown
   * @returns {Promise} - API response with filter options
   */
  getFilterOptions: async () => {
    return await api.get('/admin-shelter/laporan/surat/filter-options');
  },

  /**
   * Get available years for filter
   * @returns {Promise} - API response with available years
   */
  getAvailableYears: async () => {
    return await api.get('/admin-shelter/laporan/surat/available-years');
  }
};