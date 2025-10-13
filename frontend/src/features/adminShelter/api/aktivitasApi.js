import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Aktivitas API service
 * Contains methods for aktivitas (activities) management API requests
 */
export const aktivitasApi = {
  /**
   * Get list of activities
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} - API response with activities data
   */
  getAllAktivitas: async (params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.AKTIVITAS.LIST, { params });
  },

  /**
   * Get activity details
   * @param {number|string} id - Activity ID
   * @returns {Promise} - API response with activity details
   */
  getAktivitasDetail: async (id) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.AKTIVITAS.DETAIL(id));
  },

  /**
   * Create new activity
   * @param {Object} aktivitasData - Activity data (FormData object)
   * @returns {Promise} - API response
   */
  createAktivitas: async (aktivitasData) => {
    // For FormData, the browser will automatically set the correct Content-Type with boundary
    return await api.post(ADMIN_SHELTER_ENDPOINTS.AKTIVITAS.CREATE, aktivitasData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Update existing activity
   * @param {number|string} id - Activity ID
   * @param {Object} aktivitasData - Activity data to update (FormData object)
   * @returns {Promise} - API response
   */
  updateAktivitas: async (id, aktivitasData) => {
    return await api.put(ADMIN_SHELTER_ENDPOINTS.AKTIVITAS.DETAIL(id), aktivitasData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  /**
   * Update activity status
   * @param {number|string} id - Activity ID
   * @param {Object} payload - Status update payload
   * @returns {Promise} - API response
   */
  updateAktivitasStatus: async (id, payload) => {
    return await api.put(ADMIN_SHELTER_ENDPOINTS.AKTIVITAS.UPDATE_STATUS(id), payload);
  },

  /**
   * Delete activity
   * @param {number|string} id - Activity ID
   * @returns {Promise} - API response
   */
  deleteAktivitas: async (id) => {
    return await api.delete(ADMIN_SHELTER_ENDPOINTS.AKTIVITAS.DETAIL(id));
  },

  /**
   * Get today's activities for dashboard
   * @returns {Promise} - API response with today's activities
   */
  getTodayActivities: async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return await api.get(ADMIN_SHELTER_ENDPOINTS.AKTIVITAS.LIST, {
      params: {
        date_from: today,
        date_to: today,
        per_page: 5, // Limit for dashboard display
        sort_by: 'start_time',
        sort_order: 'asc'
      }
    });
  },

  /**
   * Get activities by specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} - API response with activities for the date
   */
  getActivitiesByDate: async (date) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.AKTIVITAS.LIST, {
      params: {
        date_from: date,
        date_to: date,
        per_page: 50, // More items for date view
        sort_by: 'start_time',
        sort_order: 'asc'
      }
    });
  },

  /**
   * Get activities for calendar view (monthly)
   * @param {string} month - Month in YYYY-MM format
   * @returns {Promise} - API response with activities for the month
   */
  getActivitiesForCalendar: async (month) => {
    const startOfMonth = `${month}-01`;
    const date = new Date(month);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString().split('T')[0];
    
    return await api.get(ADMIN_SHELTER_ENDPOINTS.AKTIVITAS.LIST, {
      params: {
        date_from: startOfMonth,
        date_to: endOfMonth,
        per_page: 200, // High limit for calendar
        sort_by: 'tanggal',
        sort_order: 'asc'
      }
    });
  }
};