import api from '../../../api/axiosConfig';

export const tutorHonorApi = {
  getTutorHonor: async (tutorId, params = {}) => {
    return await api.get(`/admin-shelter/tutor-honor/tutor/${tutorId}`, { params });
  },

  getHonorHistory: async (tutorId, params = {}) => {
    return await api.get(`/admin-shelter/tutor-honor/tutor/${tutorId}/history`, { params });
  },

  getHonorStatistics: async (tutorId, params = {}) => {
    return await api.get(`/admin-shelter/tutor-honor/tutor/${tutorId}/statistics`, { params });
  },

  getMonthlyDetail: async (tutorId, month, year) => {
    return await api.get(`/admin-shelter/tutor-honor/tutor/${tutorId}/month/${month}/year/${year}`);
  },

  calculateHonor: async (tutorId, data) => {
    return await api.post(`/admin-shelter/tutor-honor/calculate/${tutorId}`, data);
  },

  approveHonor: async (honorId) => {
    return await api.post(`/admin-shelter/tutor-honor/approve/${honorId}`);
  },

  markAsPaid: async (honorId) => {
    return await api.post(`/admin-shelter/tutor-honor/mark-paid/${honorId}`);
  },

  getHonorStats: async (params = {}) => {
    return await api.get('/admin-shelter/tutor-honor/stats', { params });
  },

  getCurrentSettings: async () => {
    return await api.get('/admin-shelter/tutor-honor/current-settings');
  },

  calculatePreview: async (data) => {
    const payload = {
      cpb_count: data.cpb_count || 0,
      pb_count: data.pb_count || 0,
      npb_count: data.npb_count || 0,
      session_count: data.session_count || 0,
      tutor_id: data.tutor_id || null,
      month: data.month || null,
      year: data.year || null
    };

    return await api.post('/admin-shelter/tutor-honor/calculate-preview', payload);
  },

  getTutorPreview: async (tutorId, params = {}) => {
    return await api.get(`/admin-shelter/tutor-honor/tutor/${tutorId}/preview`, { params });
  },

  getYearRange: async (tutorId) => {
    return await api.get(`/admin-shelter/tutor-honor/tutor/${tutorId}/year-range`);
  },

  // Dynamic preview calculation with payment system context
  calculateDynamicPreview: async (paymentSystem, data) => {
    const payload = { ...data };

    // Ensure all required fields are present based on payment system
    switch (paymentSystem) {
      case 'flat_monthly':
        // No additional parameters needed
        break;
      
      case 'per_session':
        payload.session_count = data.session_count || 1;
        break;
      
      case 'per_student_category':
        payload.cpb_count = data.cpb_count || 0;
        payload.pb_count = data.pb_count || 0;
        payload.npb_count = data.npb_count || 0;
        break;
      
      case 'session_per_student_category':
        payload.session_count = data.session_count || 1;
        payload.cpb_count = data.cpb_count || 0;
        payload.pb_count = data.pb_count || 0;
        payload.npb_count = data.npb_count || 0;
        break;
    }

    return await api.post('/admin-shelter/tutor-honor/calculate-preview', payload);
  },

  // Get honor breakdown summary for a specific period
  getHonorBreakdown: async (tutorId, month, year) => {
    return await api.get(`/admin-shelter/tutor-honor/tutor/${tutorId}/month/${month}/year/${year}/breakdown`);
  },

  // Validate honor calculation before processing
  validateHonorCalculation: async (tutorId, month, year) => {
    return await api.post('/admin-shelter/tutor-honor/validate-calculation', {
      tutor_id: tutorId,
      month,
      year
    });
  },

  // Get payment system specific input requirements
  getPaymentSystemRequirements: async (paymentSystem) => {
    return await api.get('/admin-shelter/tutor-honor/payment-system-requirements', {
      params: { payment_system: paymentSystem }
    });
  },

  // Export honor data
  exportHonorData: async (tutorId, params = {}) => {
    return await api.get(`/admin-shelter/tutor-honor/tutor/${tutorId}/export`, { 
      params,
      responseType: 'blob'
    });
  }
};