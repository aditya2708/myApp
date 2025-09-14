import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Shelter Anak API service
 * Contains methods for anak (children) management API requests
 */
export const adminShelterAnakApi = {
  /**
   * Get list of children
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} - API response with children data
   */
  getAllAnak: async (params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.ANAK.LIST, { params });
  },

  /**
   * Get child details
   * @param {number|string} id - Child ID
   * @returns {Promise} - API response with child details
   */
  getAnakDetail: async (id) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.ANAK.DETAIL(id));
  },

  /**
   * Create new child
   * @param {Object} anakData - Child data (FormData object)
   * @returns {Promise} - API response
   */
  createAnak: async (anakData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.ANAK.LIST, anakData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Update existing child
   * @param {number|string} id - Child ID
   * @param {Object} anakData - Child data to update (FormData object)
   * @returns {Promise} - API response
   */
  updateAnak: async (id, anakData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.ANAK.DETAIL(id), anakData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete child
   * @param {number|string} id - Child ID
   * @returns {Promise} - API response
   */
  deleteAnak: async (id) => {
    return await api.delete(ADMIN_SHELTER_ENDPOINTS.ANAK.DETAIL(id));
  },

  /**
   * Toggle child status (between aktif and non-aktif)
   * @param {number|string} id - Child ID
   * @returns {Promise} - API response
   */
  toggleAnakStatus: async (id) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.ANAK.TOGGLE_STATUS(id));
  }
};