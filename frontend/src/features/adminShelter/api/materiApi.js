// src/features/adminShelter/api/materiApi.js
import api from '../../../api/axiosConfig';

/**
 * Materi API service
 * Contains methods for materi management API requests
 */
export const materiApi = {
  /**
   * Get all materi from kurikulum
   * @returns {Promise} - API response with materi data
   */
  getAllMateri: async () => {
    return await api.get('/admin-shelter/kurikulum/all-materi');
  },

  /**
   * Get materi by level (deprecated - use getAllMateri instead)
   * @param {number|string} levelId - Level ID
   * @returns {Promise} - API response with materi data
   */
  getMateriByLevel: async (levelId) => {
    // Fallback to getAllMateri since by-level endpoint doesn't match database structure
    return await api.get('/admin-shelter/kurikulum/all-materi');
  }
};