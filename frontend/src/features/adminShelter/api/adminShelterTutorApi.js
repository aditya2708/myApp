import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Shelter Tutor API service
 * Contains methods for tutor management API requests
 */
export const adminShelterTutorApi = {
  /**
   * Get list of tutors
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} - API response with tutors data
   */
  getTutors: async (params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.TUTOR.LIST, { params });
  },

  /**
   * Get tutor details
   * @param {number|string} tutorId - Tutor ID
   * @returns {Promise} - API response with tutor details
   */
  getTutorDetail: async (tutorId) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.TUTOR.DETAIL(tutorId));
  },

  /**
   * Create new tutor
   * @param {Object} tutorData - Tutor data (FormData object)
   * @returns {Promise} - API response
   */
  createTutor: async (tutorData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.TUTOR.LIST, tutorData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Increase timeout to 30 seconds
    });
  },

  /**
   * Update existing tutor
   * @param {number|string} tutorId - Tutor ID
   * @param {Object} tutorData - Tutor data to update (FormData object)
   * @returns {Promise} - API response
   */
  updateTutor: async (tutorId, tutorData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.TUTOR.DETAIL(tutorId), tutorData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Increase timeout to 30 seconds
    });
  },

  /**
   * Delete tutor
   * @param {number|string} tutorId - Tutor ID
   * @returns {Promise} - API response
   */
  deleteTutor: async (tutorId) => {
    return await api.delete(ADMIN_SHELTER_ENDPOINTS.TUTOR.DETAIL(tutorId), {
      timeout: 30000, // Increase timeout to 30 seconds
    });
  },

  /**
 * Get active tutors for dropdown selection
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise} - API response with active tutors data
 */
getActiveTutors: async (params = {}) => {
  return await api.get(ADMIN_SHELTER_ENDPOINTS.TUTOR.AVAILABLE, { params });
}
};