import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Shelter Surat API service
 * Contains methods for surat (messages) management API requests
 */
export const adminShelterSuratApi = {
  /**
   * Get surat list for specific child
   * @param {number|string} childId - Child ID
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} - API response with surat data
   */
  getSuratList: async (childId, params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.SURAT.LIST(childId), { params });
  },

  /**
   * Get surat details
   * @param {number|string} childId - Child ID
   * @param {number|string} suratId - Surat ID
   * @returns {Promise} - API response with surat details
   */
  getSuratDetail: async (childId, suratId) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.SURAT.DETAIL(childId, suratId));
  },

  /**
   * Create new surat
   * @param {number|string} childId - Child ID
   * @param {Object} suratData - Surat data (FormData object)
   * @returns {Promise} - API response
   */
  createSurat: async (childId, suratData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.SURAT.CREATE(childId), suratData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Update existing surat
   * @param {number|string} childId - Child ID
   * @param {number|string} suratId - Surat ID
   * @param {Object} suratData - Surat data to update (FormData object)
   * @returns {Promise} - API response
   */
  updateSurat: async (childId, suratId, suratData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.SURAT.UPDATE(childId, suratId), suratData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete surat
   * @param {number|string} childId - Child ID
   * @param {number|string} suratId - Surat ID
   * @returns {Promise} - API response
   */
  deleteSurat: async (childId, suratId) => {
    return await api.delete(ADMIN_SHELTER_ENDPOINTS.SURAT.DELETE(childId, suratId));
  },

  /**
   * Mark surat as read
   * @param {number|string} childId - Child ID
   * @param {number|string} suratId - Surat ID
   * @returns {Promise} - API response
   */
  markAsRead: async (childId, suratId) => {
    return await api.put(ADMIN_SHELTER_ENDPOINTS.SURAT.MARK_READ(childId, suratId));
  }
};