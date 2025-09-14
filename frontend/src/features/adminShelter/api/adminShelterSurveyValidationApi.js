import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Shelter Survey Validation API service
 * Contains methods for validating family surveys
 */
export const adminShelterSurveyValidationApi = {
  /**
   * Get list of surveys that need validation
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with surveys data
   */
  getValidationSurveys: async (params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.SURVEY_VALIDATION.LIST, { params });
  },

  /**
   * Submit validation for a survey
   * @param {number|string} id_survey - Survey ID
   * @param {Object} validationData - Validation data (result and notes)
   * @returns {Promise} - API response
   */
  validateSurvey: async (id_survey, validationData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.SURVEY_VALIDATION.VALIDATE(id_survey), validationData);
  },

  /**
   * Get validation summary stats for dashboard
   * @returns {Promise} - API response with validation summary
   */
  getValidationSummary: async () => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.SURVEY_VALIDATION.SUMMARY);
  }
};