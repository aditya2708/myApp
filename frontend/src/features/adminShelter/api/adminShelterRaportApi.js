import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Shelter Raport API service
 * Contains methods for raport management API requests
 */
export const adminShelterRaportApi = {
  /**
   * Get list of raports for a child
   * @param {number|string} childId - Child ID
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} - API response with raport data
   */
  getRaports: async (childId, params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.RAPORT.LIST(childId), { params });
  },

  /**
   * Get raport details
   * @param {number|string} childId - Child ID
   * @param {number|string} raportId - Raport ID
   * @returns {Promise} - API response with raport details
   */
  getRaportDetail: async (childId, raportId) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.RAPORT.DETAIL(childId, raportId));
  },

  /**
   * Create new raport
   * @param {number|string} childId - Child ID
   * @param {Object} raportData - Raport data (FormData object)
   * @returns {Promise} - API response
   */
  createRaport: async (childId, raportData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.RAPORT.CREATE(childId), raportData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Increase timeout to 30 seconds
    });
  },

  /**
   * Update existing raport
   * @param {number|string} childId - Child ID
   * @param {number|string} raportId - Raport ID
   * @param {Object} raportData - Raport data to update (FormData object)
   * @returns {Promise} - API response
   */
  updateRaport: async (childId, raportId, raportData) => {
    // Check if an endpoint with /update exists in the route
    if (ADMIN_SHELTER_ENDPOINTS.RAPORT.UPDATE) {
      return await api.post(ADMIN_SHELTER_ENDPOINTS.RAPORT.UPDATE(childId, raportId), raportData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // Increase timeout to 30 seconds
      });
    } else {
      // Fallback to regular detail endpoint if UPDATE isn't defined
      return await api.post(ADMIN_SHELTER_ENDPOINTS.RAPORT.DETAIL(childId, raportId), raportData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // Increase timeout to 30 seconds
      });
    }
  },

  /**
   * Delete raport
   * @param {number|string} childId - Child ID
   * @param {number|string} raportId - Raport ID
   * @returns {Promise} - API response
   */
  deleteRaport: async (childId, raportId) => {
    return await api.delete(ADMIN_SHELTER_ENDPOINTS.RAPORT.DETAIL(childId, raportId), {
      timeout: 30000, // Increase timeout to 30 seconds
    });
  }
};