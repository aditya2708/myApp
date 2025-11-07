import api from '../../../api/axiosConfig';

export const activityReportApi = {
  // Create activity report
  createReport: async (formData) => {
    const response = await api.post('/admin-shelter/activity-reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get activity report by activity ID  
  getByActivity: async (id_aktivitas) => {
    const response = await api.get(`/admin-shelter/activity-reports/by-activity/${id_aktivitas}`);
    return response.data;
  },

  // List activity reports with optional filters
  listReports: async (params = {}) => {
    const response = await api.get('/admin-shelter/activity-reports', { params });
    return response.data;
  },

  // Delete activity report
  deleteReport: async (id) => {
    const response = await api.delete(`/admin-shelter/activity-reports/${id}`);
    return response.data;
  }
};
