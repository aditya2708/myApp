import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Shelter Survey API service
 * Contains methods for family survey management
 */
export const adminShelterSurveyApi = {
  /**
   * Get list of families without surveys or all survey data
   * @param {Object} params - Query parameters
   * @param {boolean} params.show_all - Get all surveys instead of just families without surveys
   * @returns {Promise} - API response with families or surveys data
   */
  getSurveys: async (params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.SURVEY.LIST, { params });
  },

  /**
   * Get survey details for a specific family
   * @param {number|string} id_keluarga - Family ID
   * @returns {Promise} - API response with survey details
   */
  getSurveyDetail: async (id_keluarga) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.SURVEY.DETAIL(id_keluarga));
  },

  /**
   * Create or update survey for a family
   * @param {number|string} id_keluarga - Family ID
   * @param {Object} surveyData - Survey data
   * @returns {Promise} - API response
   */
  saveSurvey: async (id_keluarga, surveyData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.SURVEY.DETAIL(id_keluarga), surveyData);
  },

  /**
   * Delete survey for a family
   * @param {number|string} id_keluarga - Family ID
   * @returns {Promise} - API response
   */
  deleteSurvey: async (id_keluarga) => {
    return await api.delete(ADMIN_SHELTER_ENDPOINTS.SURVEY.DETAIL(id_keluarga));
  }
};