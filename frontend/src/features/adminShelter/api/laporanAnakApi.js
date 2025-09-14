import api from '../../../api/axiosConfig';

/**
 * Laporan Anak Binaan API service
 * Contains methods for anak binaan laporan API requests
 */
export const laporanAnakApi = {
  /**
   * Get laporan anak binaan with summary and children list
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with summary and children data
   */
  getLaporanAnakBinaan: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/anak-binaan', { params });
  },

  /**
   * Get child detail report
   * @param {number|string} childId - Child ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with child detail
   */
  getChildDetailReport: async (childId, params = {}) => {
    return await api.get(`/admin-shelter/laporan/anak-binaan/child/${childId}`, { params });
  },

  /**
   * Get jenis kegiatan options for filter
   * @returns {Promise} - API response with jenis kegiatan options
   */
  getJenisKegiatanOptions: async () => {
    return await api.get('/admin-shelter/laporan/jenis-kegiatan-options');
  },

  /**
   * Get available years for filter (kept for backward compatibility)
   * @returns {Promise} - API response with available years
   */
  getAvailableYears: async () => {
    return await api.get('/admin-shelter/laporan/available-years');
  },

  /**
   * Export laporan anak binaan as PDF
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with PDF blob
   */
  exportLaporanAnakPdf: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/anak-binaan/export', { 
      params: { ...params, format: 'pdf' },
      responseType: 'blob'
    });
  }
};