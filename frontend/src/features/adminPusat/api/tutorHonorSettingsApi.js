import api from '../../../api/axiosConfig';

export const tutorHonorSettingsApi = {
  // Get all settings with pagination
  getSettings: async (params = {}) => {
    return await api.get('/admin-pusat/tutor-honor-settings', { params });
  },

  // Get active setting
  getActiveSetting: async () => {
    return await api.get('/admin-pusat/tutor-honor-settings/active');
  },

  // Get specific setting
  getSetting: async (id) => {
    return await api.get(`/admin-pusat/tutor-honor-settings/${id}`);
  },

  // Create new setting
  createSetting: async (data) => {
    return await api.post('/admin-pusat/tutor-honor-settings', data);
  },

  // Update setting
  updateSetting: async (id, data) => {
    return await api.put(`/admin-pusat/tutor-honor-settings/${id}`, data);
  },

  // Set setting as active
  setActive: async (id) => {
    return await api.post(`/admin-pusat/tutor-honor-settings/${id}/set-active`);
  },

  // Delete setting
  deleteSetting: async (id) => {
    return await api.delete(`/admin-pusat/tutor-honor-settings/${id}`);
  },

  // Calculate preview
  calculatePreview: async (data) => {
    return await api.post('/admin-pusat/tutor-honor-settings/calculate-preview', data);
  },

  // Get statistics
  getStatistics: async () => {
    return await api.get('/admin-pusat/tutor-honor-settings-statistics');
  }
};