import api from '../../../api/axiosConfig';
import { DONATUR_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Donatur API service
 * Contains methods for donatur specific API requests
 */
export const donaturApi = {
  /**
   * Get donatur dashboard data
   * @returns {Promise} - API response with dashboard data
   */
  getDashboard: async () => {
    return await api.get(DONATUR_ENDPOINTS.DASHBOARD);
  },

  /**
   * Get donatur profile
   * @returns {Promise} - API response with profile data
   */
  getProfile: async () => {
    return await api.get(DONATUR_ENDPOINTS.PROFILE);
  },

  /**
   * Update donatur profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - API response
   */
  updateProfile: async (profileData) => {
    return await api.post(DONATUR_ENDPOINTS.PROFILE, profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get sponsored children
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with children data
   */
  getSponsoredChildren: async (params = {}) => {
    return await api.get(DONATUR_ENDPOINTS.CHILDREN, { params });
  },

  /**
   * Get sponsored child details
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with child details
   */
  getChildDetails: async (childId) => {
    return await api.get(DONATUR_ENDPOINTS.CHILD_DETAIL(childId));
  },

  /**
   * Get donation history
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with donation history
   */
  getDonationHistory: async (params = {}) => {
    return await api.get('/donations', { params });
  },

  /**
   * Get donation details
   * @param {number|string} donationId - Donation ID
   * @returns {Promise} - API response with donation details
   */
  getDonationDetails: async (donationId) => {
    return await api.get(`/donations/${donationId}`);
  },

  /**
   * Create new donation
   * @param {Object} donationData - Donation data
   * @returns {Promise} - API response
   */
  createDonation: async (donationData) => {
    return await api.post('/donations', donationData);
  },

  /**
   * Get notifications
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with notifications
   */
  getNotifications: async (params = {}) => {
    return await api.get('/notifications', { params });
  },

  /**
   * Mark notification as read
   * @param {number|string} notificationId - Notification ID
   * @returns {Promise} - API response
   */
  markNotificationAsRead: async (notificationId) => {
    return await api.put(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise} - API response
   */
  markAllNotificationsAsRead: async () => {
    return await api.put('/notifications/read-all');
  },

  /**
   * Get upcoming events
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with events data
   */
  getEvents: async (params = {}) => {
    return await api.get('/events', { params });
  },

  /**
   * Get child attendance history
   * @param {number|string} childId - Child ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with attendance data
   */
  getChildAttendance: async (childId, params = {}) => {
    return await api.get(`/children/${childId}/attendance`, { params });
  },

  /**
   * Get child academic progress
   * @param {number|string} childId - Child ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with academic progress data
   */
  getChildProgress: async (childId, params = {}) => {
    return await api.get(`/children/${childId}/progress`, { params });
  },

  // Surat (Messages) API
  /**
   * Get surat list for child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with surat list
   */
  getChildSurat: async (childId) => {
    return await api.get(DONATUR_ENDPOINTS.SURAT.LIST(childId));
  },

  /**
   * Create new surat
   * @param {number|string} childId - Child ID
   * @param {Object} suratData - Surat data
   * @returns {Promise} - API response
   */
  createSurat: async (childId, suratData) => {
    return await api.post(DONATUR_ENDPOINTS.SURAT.CREATE(childId), suratData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get surat details
   * @param {number|string} childId - Child ID
   * @param {number|string} suratId - Surat ID
   * @returns {Promise} - API response with surat details
   */
  getSuratDetails: async (childId, suratId) => {
    return await api.get(DONATUR_ENDPOINTS.SURAT.DETAIL(childId, suratId));
  },

  /**
   * Mark surat as read
   * @param {number|string} childId - Child ID
   * @param {number|string} suratId - Surat ID
   * @returns {Promise} - API response
   */
  markSuratAsRead: async (childId, suratId) => {
    return await api.put(DONATUR_ENDPOINTS.SURAT.MARK_READ(childId, suratId));
  },

  // Prestasi (Achievements) API
  /**
   * Get prestasi list for child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with prestasi list
   */
  getChildPrestasi: async (childId) => {
    return await api.get(DONATUR_ENDPOINTS.PRESTASI.LIST(childId));
  },

  /**
   * Get prestasi details
   * @param {number|string} childId - Child ID
   * @param {number|string} prestasiId - Prestasi ID
   * @returns {Promise} - API response with prestasi details
   */
  getPrestasiDetails: async (childId, prestasiId) => {
    return await api.get(DONATUR_ENDPOINTS.PRESTASI.DETAIL(childId, prestasiId));
  },

  /**
   * Mark prestasi as read
   * @param {number|string} childId - Child ID
   * @param {number|string} prestasiId - Prestasi ID
   * @returns {Promise} - API response
   */
  markPrestasiAsRead: async (childId, prestasiId) => {
    return await api.put(DONATUR_ENDPOINTS.PRESTASI.MARK_READ(childId, prestasiId));
  },

  // Raport (Report Cards) API
  /**
   * Get raport list for child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with raport list
   */
  getChildRaport: async (childId) => {
    return await api.get(DONATUR_ENDPOINTS.RAPORT.LIST(childId));
  },

  /**
   * Get raport details
   * @param {number|string} childId - Child ID
   * @param {number|string} raportId - Raport ID
   * @returns {Promise} - API response with raport details
   */
  getRaportDetails: async (childId, raportId) => {
    return await api.get(DONATUR_ENDPOINTS.RAPORT.DETAIL(childId, raportId));
  },

  /**
   * Get raport summary
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with raport summary
   */
  getRaportSummary: async (childId) => {
    return await api.get(DONATUR_ENDPOINTS.RAPORT.SUMMARY(childId));
  },

  // Aktivitas (Activities) API
  /**
   * Get aktivitas list for child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with aktivitas list
   */
  getChildActivities: async (childId) => {
    return await api.get(DONATUR_ENDPOINTS.AKTIVITAS.LIST(childId));
  },

  /**
   * Get aktivitas details
   * @param {number|string} childId - Child ID
   * @param {number|string} aktivitasId - Aktivitas ID
   * @returns {Promise} - API response with aktivitas details
   */
  getActivityDetails: async (childId, aktivitasId) => {
    return await api.get(DONATUR_ENDPOINTS.AKTIVITAS.DETAIL(childId, aktivitasId));
  },

  /**
   * Get attendance summary for child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with attendance summary
   */
};