import axios from 'axios';
import { API_BASE_URL } from '../../../constants/config';
import { ADMIN_PUSAT_ENDPOINTS } from '../../../constants/endpoints';

const endpoints = ADMIN_PUSAT_ENDPOINTS;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const monitoringApi = {
  // Get dashboard statistics
  getDashboardStats: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.MONITORING.DASHBOARD, {
      params: {
        period: params.period || 'month',
        start_date: params.start_date || '',
        end_date: params.end_date || ''
      }
    });
    return response;
  },

  // Get cabang adoption performance
  getCabangPerformance: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.MONITORING.CABANG_ADOPTION, {
      params: {
        period: params.period || 'month',
        sort_by: params.sort_by || 'adoption_rate',
        sort_order: params.sort_order || 'desc',
        search: params.search || '',
        region: params.region || '',
        page: params.page || 1,
        per_page: params.per_page || 20
      }
    });
    return response;
  },

  // Get detailed cabang information
  getCabangDetail: async (cabangId) => {
    const response = await api.get(endpoints.TEMPLATE.MONITORING.CABANG_DETAIL(cabangId));
    return response;
  },

  // Get adoption trends data
  getAdoptionTrends: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.MONITORING.ADOPTION_TRENDS, {
      params: {
        period: params.period || 'month',
        granularity: params.granularity || 'daily', // daily, weekly, monthly
        template_id: params.template_id || '',
        cabang_id: params.cabang_id || '',
        start_date: params.start_date || '',
        end_date: params.end_date || ''
      }
    });
    return response;
  },

  // Get template performance metrics
  getTemplatePerformance: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.MONITORING.TEMPLATE_PERFORMANCE, {
      params: {
        period: params.period || 'month',
        sort_by: params.sort_by || 'usage_count',
        sort_order: params.sort_order || 'desc',
        search: params.search || '',
        kategori: params.kategori || '',
        status: params.status || 'active',
        page: params.page || 1,
        per_page: params.per_page || 20
      }
    });
    return response;
  },

  // Get specific template usage details
  getTemplateUsage: async (templateId) => {
    const response = await api.get(endpoints.TEMPLATE.MONITORING.TEMPLATE_USAGE(templateId));
    return response;
  },

  // Export monitoring report
  exportReport: async (params = {}) => {
    const response = await api.get(endpoints.TEMPLATE.MONITORING.EXPORT_REPORT, {
      params: {
        format: params.format || 'excel',
        type: params.type || 'dashboard', // dashboard, cabang, template, trends
        period: params.period || 'month',
        start_date: params.start_date || '',
        end_date: params.end_date || '',
        cabang_ids: params.cabang_ids || [],
        template_ids: params.template_ids || []
      },
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `monitoring-report-${Date.now()}.${params.format || 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Report downloaded successfully' };
  },

  // Get regional performance summary
  getRegionalPerformance: async (params = {}) => {
    const response = await api.get('/admin-pusat/monitoring/regional-performance', {
      params: {
        period: params.period || 'month',
        region: params.region || ''
      }
    });
    return response;
  },

  // Get template adoption timeline
  getTemplateAdoptionTimeline: async (templateId, params = {}) => {
    const response = await api.get(`/admin-pusat/monitoring/template/${templateId}/timeline`, {
      params: {
        period: params.period || 'month',
        granularity: params.granularity || 'daily'
      }
    });
    return response;
  },

  // Get cabang adoption timeline
  getCabangAdoptionTimeline: async (cabangId, params = {}) => {
    const response = await api.get(`/admin-pusat/monitoring/cabang/${cabangId}/timeline`, {
      params: {
        period: params.period || 'month',
        granularity: params.granularity || 'daily'
      }
    });
    return response;
  },

  // Get performance comparison
  getPerformanceComparison: async (params = {}) => {
    const response = await api.get('/admin-pusat/monitoring/comparison', {
      params: {
        type: params.type || 'cabang', // cabang, template, region
        ids: params.ids || [], // Array of IDs to compare
        period: params.period || 'month',
        metric: params.metric || 'adoption_rate'
      }
    });
    return response;
  },

  // Get alerts and notifications
  getMonitoringAlerts: async (params = {}) => {
    const response = await api.get('/admin-pusat/monitoring/alerts', {
      params: {
        type: params.type || 'all', // all, low_adoption, inactive_cabang, unused_template
        severity: params.severity || 'all', // all, high, medium, low
        status: params.status || 'active',
        page: params.page || 1,
        per_page: params.per_page || 20
      }
    });
    return response;
  },

  // Mark alert as read
  markAlertAsRead: async (alertId) => {
    const response = await api.patch(`/admin-pusat/monitoring/alerts/${alertId}/read`);
    return response;
  },

  // Get health score metrics
  getHealthScore: async (params = {}) => {
    const response = await api.get('/admin-pusat/monitoring/health-score', {
      params: {
        type: params.type || 'overall', // overall, cabang, template
        id: params.id || null,
        period: params.period || 'month'
      }
    });
    return response;
  }
};

export default monitoringApi;