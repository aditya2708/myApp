import api from '../../../api/axiosConfig';

export const achievementReportApi = {
  list: async (params = {}) => {
    const response = await api.get('/admin-shelter/achievement-reports', { params });
    return response.data;
  }
};

