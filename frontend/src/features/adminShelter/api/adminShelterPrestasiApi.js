import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Shelter Prestasi API service
 * Contains methods for prestasi (achievements) management API requests
 */
export const adminShelterPrestasiApi = {
  /**
   * Get list of achievements for a child
   * @param {number|string} childId - Child ID
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} - API response with achievements data
   */
  getPrestasi: async (childId, params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.PRESTASI.LIST(childId), { params });
  },

  /**
   * Get achievement details
   * @param {number|string} childId - Child ID
   * @param {number|string} prestasiId - Achievement ID
   * @returns {Promise} - API response with achievement details
   */
  getPrestasiDetail: async (childId, prestasiId) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.PRESTASI.DETAIL(childId, prestasiId));
  },

  /**
   * Create new achievement
   * @param {number|string} childId - Child ID
   * @param {Object} prestasiData - Achievement data (FormData object)
   * @returns {Promise} - API response
   */
  createPrestasi: async (childId, prestasiData) => {
    if (prestasiData instanceof FormData && !prestasiData.has('is_read')) {
    prestasiData.append('is_read', "0");
  }
    return await api.post(ADMIN_SHELTER_ENDPOINTS.PRESTASI.LIST(childId), prestasiData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Increase timeout to 30 seconds
    });
  },

  /**
   * Update existing achievement
   * @param {number|string} childId - Child ID
   * @param {number|string} prestasiId - Achievement ID
   * @param {Object} prestasiData - Achievement data to update (FormData object)
   * @returns {Promise} - API response
   */
  updatePrestasi: async (childId, prestasiId, prestasiData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.PRESTASI.DETAIL(childId, prestasiId), prestasiData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Increase timeout to 30 seconds
    });
  },

  /**
   * Delete achievement
   * @param {number|string} childId - Child ID
   * @param {number|string} prestasiId - Achievement ID
   * @returns {Promise} - API response
   */
  deletePrestasi: async (childId, prestasiId) => {
    return await api.delete(ADMIN_SHELTER_ENDPOINTS.PRESTASI.DETAIL(childId, prestasiId));
  }
};