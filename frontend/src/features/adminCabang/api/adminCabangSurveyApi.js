import api from '../../../api/axiosConfig';
import { ADMIN_CABANG_ENDPOINTS } from '../../../constants/endpoints';

export const adminCabangSurveyApi = {
  getAllPendingSurveys: async (params = {}) => {
    return await api.get(ADMIN_CABANG_ENDPOINTS.SURVEY_APPROVAL.LIST, { 
      params: { ...params, status: 'pending' } 
    });
  },

  getAllSurveys: async (params = {}) => {
    return await api.get(ADMIN_CABANG_ENDPOINTS.SURVEY_APPROVAL.LIST, { params });
  },

  getStats: async () => {
    return await api.get(ADMIN_CABANG_ENDPOINTS.SURVEY_APPROVAL.STATS);
  },

  getSurveyDetail: async (surveyId) => {
    return await api.get(ADMIN_CABANG_ENDPOINTS.SURVEY_APPROVAL.DETAIL(surveyId));
  },

  approveSurvey: async (surveyId, data = {}) => {
    return await api.post(ADMIN_CABANG_ENDPOINTS.SURVEY_APPROVAL.APPROVE(surveyId), data);
  },

  rejectSurvey: async (surveyId, data) => {
    return await api.post(ADMIN_CABANG_ENDPOINTS.SURVEY_APPROVAL.REJECT(surveyId), data);
  }
};