import api from '../../../api/axiosConfig';
import { ADMIN_PUSAT_ENDPOINTS, MANAGEMENT_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Pusat API service
 * Contains methods for admin pusat specific API requests
 */
export const adminPusatApi = {
  /**
   * Get admin pusat dashboard data
   * @returns {Promise} - API response with dashboard data
   */
  getDashboard: async () => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.DASHBOARD);
  },

  /**
   * Get admin pusat profile
   * @returns {Promise} - API response with profile data
   */
  getProfile: async () => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.PROFILE);
  },

  /**
   * Update admin pusat profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - API response
   */
  updateProfile: async (profileData) => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.PROFILE, profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get list of users
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with users data
   */
  getUsers: async (params = {}) => {
    return await api.get(MANAGEMENT_ENDPOINTS.USERS, { params });
  },

  /**
   * Get user details
   * @param {number|string} userId - User ID
   * @returns {Promise} - API response with user details
   */
  getUserDetail: async (userId) => {
    return await api.get(MANAGEMENT_ENDPOINTS.USER_DETAIL(userId));
  },

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise} - API response
   */
  createUser: async (userData) => {
    return await api.post(MANAGEMENT_ENDPOINTS.USERS, userData);
  },

  /**
   * Update user
   * @param {number|string} userId - User ID
   * @param {Object} userData - User data
   * @returns {Promise} - API response
   */
  updateUser: async (userId, userData) => {
    return await api.put(MANAGEMENT_ENDPOINTS.USER_DETAIL(userId), userData);
  },

  /**
   * Delete user
   * @param {number|string} userId - User ID
   * @returns {Promise} - API response
   */
  deleteUser: async (userId) => {
    return await api.delete(MANAGEMENT_ENDPOINTS.USER_DETAIL(userId));
  },

  /**
   * Get list of kacab (cabang)
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with kacab data
   */
  getKacab: async (params = {}) => {
    return await api.get(MANAGEMENT_ENDPOINTS.KACAB, { params });
  },

  /**
   * Get kacab details
   * @param {number|string} kacabId - Kacab ID
   * @returns {Promise} - API response with kacab details
   */
  getKacabDetail: async (kacabId) => {
    return await api.get(MANAGEMENT_ENDPOINTS.KACAB_DETAIL(kacabId));
  },

  /**
   * Create new kacab
   * @param {Object} kacabData - Kacab data
   * @returns {Promise} - API response
   */
  createKacab: async (kacabData) => {
    return await api.post(MANAGEMENT_ENDPOINTS.KACAB, kacabData);
  },

  /**
   * Update kacab
   * @param {number|string} kacabId - Kacab ID
   * @param {Object} kacabData - Kacab data
   * @returns {Promise} - API response
   */
  updateKacab: async (kacabId, kacabData) => {
    return await api.put(MANAGEMENT_ENDPOINTS.KACAB_DETAIL(kacabId), kacabData);
  },

  /**
   * Delete kacab
   * @param {number|string} kacabId - Kacab ID
   * @returns {Promise} - API response
   */
  deleteKacab: async (kacabId) => {
    return await api.delete(MANAGEMENT_ENDPOINTS.KACAB_DETAIL(kacabId));
  },

  /**
   * Get list of wilbin
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with wilbin data
   */
  getWilbin: async (params = {}) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.WILBIN, { params });
  },

  /**
   * Get wilbin details
   * @param {number|string} wilbinId - Wilbin ID
   * @returns {Promise} - API response with wilbin details
   */
  getWilbinDetail: async (wilbinId) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.WILBIN_DETAIL(wilbinId));
  },

  /**
   * Create new wilbin
   * @param {Object} wilbinData - Wilbin data
   * @param {number|string} wilbinData.id_kacab - Kacab ID associated with wilbin
   * @param {string} wilbinData.nama_wilbin - Wilbin name
   * @returns {Promise} - API response
   */
  createWilbin: async ({ id_kacab, nama_wilbin }) => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.WILBIN, { id_kacab, nama_wilbin });
  },

  /**
   * Update wilbin
   * @param {number|string} wilbinId - Wilbin ID
   * @param {Object} wilbinData - Wilbin data
   * @param {number|string} wilbinData.id_kacab - Kacab ID associated with wilbin
   * @param {string} wilbinData.nama_wilbin - Wilbin name
   * @returns {Promise} - API response
   */
  updateWilbin: async (wilbinId, { id_kacab, nama_wilbin }) => {
    return await api.put(ADMIN_PUSAT_ENDPOINTS.WILBIN_DETAIL(wilbinId), { id_kacab, nama_wilbin });
  },

  /**
   * Delete wilbin
   * @param {number|string} wilbinId - Wilbin ID
   * @returns {Promise} - API response
   */
  deleteWilbin: async (wilbinId) => {
    return await api.delete(ADMIN_PUSAT_ENDPOINTS.WILBIN_DETAIL(wilbinId));
  }
};
