import axios from 'axios';
import { API_BASE_URL } from '../../../constants/config';
import { ADMIN_PUSAT_ENDPOINTS } from '../../../constants/endpoints';

const endpoints = ADMIN_PUSAT_ENDPOINTS;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for distribution operations
});

// Request interceptor untuk authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const distributionApi = {
  // Get list of cabang for distribution
  getCabangList: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.DISTRIBUTION.CABANG_LIST, {
      params: {
        search: params.search || '',
        region: params.region || '',
        status: params.status || 'active',
        adoption_rate: params.adoption_rate || '',
        page: params.page || 1,
        per_page: params.per_page || 20,
        sort_by: params.sort_by || 'nama_cabang',
        sort_order: params.sort_order || 'asc'
      }
    });
    return response;
  },

  // Distribute single template to selected cabang
  distributeTemplate: async (templateId, distributionData) => {
    const formData = new FormData();
    
    // Add cabang IDs
    if (distributionData.cabang_ids && distributionData.cabang_ids.length > 0) {
      distributionData.cabang_ids.forEach(id => {
        formData.append('cabang_ids[]', id);
      });
    }
    
    // Add distribution settings
    formData.append('auto_notify', distributionData.auto_notify ? '1' : '0');
    formData.append('require_feedback', distributionData.require_feedback ? '1' : '0');
    formData.append('priority', distributionData.priority || 'normal');
    formData.append('notes', distributionData.notes || '');
    
    if (distributionData.expiry_days) {
      formData.append('expiry_days', distributionData.expiry_days);
    }
    
    const response = await api.post(
      endpoints.TEMPLATE.DISTRIBUTION.DISTRIBUTE_SINGLE(templateId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // You can emit progress updates here if needed
          console.log(`Distribution progress: ${progress}%`);
        }
      }
    );
    return response;
  },

  // Bulk distribute multiple templates
  bulkDistributeTemplates: async (templateIds, distributionData) => {
    const formData = new FormData();
    
    // Add template IDs
    templateIds.forEach(id => {
      formData.append('template_ids[]', id);
    });
    
    // Add cabang IDs
    if (distributionData.cabang_ids && distributionData.cabang_ids.length > 0) {
      distributionData.cabang_ids.forEach(id => {
        formData.append('cabang_ids[]', id);
      });
    }
    
    // Add distribution settings
    formData.append('auto_notify', distributionData.auto_notify ? '1' : '0');
    formData.append('require_feedback', distributionData.require_feedback ? '1' : '0');
    formData.append('priority', distributionData.priority || 'normal');
    formData.append('notes', distributionData.notes || '');
    
    if (distributionData.expiry_days) {
      formData.append('expiry_days', distributionData.expiry_days);
    }
    
    const response = await api.post(
      endpoints.TEMPLATE.DISTRIBUTION.BULK_DISTRIBUTE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 1 minute for bulk operations
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Bulk distribution progress: ${progress}%`);
        }
      }
    );
    return response;
  },

  // Get distribution history
  getDistributionHistory: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.DISTRIBUTION.HISTORY, {
      params: {
        search: params.search || '',
        template: params.template || '',
        cabang: params.cabang || '',
        status: params.status || 'all',
        date_range: params.date_range || '',
        start_date: params.start_date || '',
        end_date: params.end_date || '',
        page: params.page || 1,
        per_page: params.per_page || 20,
        sort_by: params.sort_by || 'created_at',
        sort_order: params.sort_order || 'desc'
      }
    });
    return response;
  },

  // Get distribution status for a specific template
  getTemplateDistributionStatus: async (templateId) => {
    const response = await api.get(
      endpoints.TEMPLATE.DISTRIBUTION.STATUS(templateId)
    );
    return response;
  },

  // Revoke distribution from specific cabang
  revokeDistribution: async (templateId, cabangIds) => {
    const response = await api.post(
      endpoints.TEMPLATE.DISTRIBUTION.REVOKE(templateId),
      {
        cabang_ids: cabangIds
      }
    );
    return response;
  },

  // Update distribution settings for a template
  updateDistributionSettings: async (templateId, settings) => {
    const response = await api.put(
      endpoints.TEMPLATE.DISTRIBUTION.SETTINGS(templateId),
      settings
    );
    return response;
  },

  // Get distribution statistics
  getDistributionStats: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.DISTRIBUTION.STATS, {
      params: {
        period: params.period || 'month',
        template_id: params.template_id || '',
        cabang_id: params.cabang_id || '',
        start_date: params.start_date || '',
        end_date: params.end_date || ''
      }
    });
    return response;
  },

  // Get regional distribution summary
  getRegionalSummary: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.DISTRIBUTION.REGIONAL_SUMMARY, {
      params: {
        period: params.period || 'month',
        region: params.region || ''
      }
    });
    return response;
  },

  // Get adoption rates by template
  getAdoptionRates: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.DISTRIBUTION.ADOPTION_RATES, {
      params: {
        template_ids: params.template_ids || [],
        period: params.period || 'month',
        cabang_id: params.cabang_id || ''
      }
    });
    return response;
  },

  // Get distribution notifications
  getDistributionNotifications: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.DISTRIBUTION.NOTIFICATIONS, {
      params: {
        status: params.status || 'all',
        type: params.type || 'all',
        page: params.page || 1,
        per_page: params.per_page || 20
      }
    });
    return response;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    const response = await api.patch(
      endpoints.TEMPLATE.DISTRIBUTION.MARK_NOTIFICATION_READ(notificationId)
    );
    return response;
  },

  // Send reminder for distribution
  sendDistributionReminder: async (distributionId) => {
    const response = await api.post(
      endpoints.TEMPLATE.DISTRIBUTION.SEND_REMINDER(distributionId)
    );
    return response;
  },

  // Get distribution feedback from cabang
  getDistributionFeedback: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.DISTRIBUTION.FEEDBACK, {
      params: {
        distribution_id: params.distribution_id || '',
        template_id: params.template_id || '',
        cabang_id: params.cabang_id || '',
        rating: params.rating || '',
        page: params.page || 1,
        per_page: params.per_page || 20
      }
    });
    return response;
  },

  // Export distribution report
  exportDistributionReport: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.DISTRIBUTION.EXPORT_REPORT, {
      params: {
        format: params.format || 'excel',
        period: params.period || 'month',
        template_ids: params.template_ids || [],
        cabang_ids: params.cabang_ids || [],
        start_date: params.start_date || '',
        end_date: params.end_date || ''
      },
      responseType: 'blob' // For file download
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `distribution-report-${Date.now()}.${params.format || 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Report downloaded successfully' };
  },

  // Batch operations
  batchOperations: {
    // Activate multiple distributions
    activateDistributions: async (distributionIds) => {
      const response = await api.post(
        endpoints.TEMPLATE.DISTRIBUTION.BATCH_ACTIVATE,
        { distribution_ids: distributionIds }
      );
      return response;
    },

    // Deactivate multiple distributions
    deactivateDistributions: async (distributionIds) => {
      const response = await api.post(
        endpoints.TEMPLATE.DISTRIBUTION.BATCH_DEACTIVATE,
        { distribution_ids: distributionIds }
      );
      return response;
    },

    // Delete multiple distributions
    deleteDistributions: async (distributionIds) => {
      const response = await api.delete(
        endpoints.TEMPLATE.DISTRIBUTION.BATCH_DELETE,
        { data: { distribution_ids: distributionIds } }
      );
      return response;
    }
  }
};

export default distributionApi;