import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Shelter Keuangan API service
 * Contains methods for keuangan (financial) management API requests
 */
export const adminShelterKeuanganApi = {
  /**
   * Get list of keuangan records
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} - API response with keuangan data
   */
  getAllKeuangan: async (params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.KEUANGAN.LIST, { params });
  },

  /**
   * Get keuangan details
   * @param {number|string} id - Keuangan ID
   * @returns {Promise} - API response with keuangan details
   */
  getKeuanganDetail: async (id) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.KEUANGAN.DETAIL(id));
  },

  /**
   * Create new keuangan record
   * @param {Object} keuanganData - Keuangan data
   * @returns {Promise} - API response
   */
  createKeuangan: async (keuanganData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.KEUANGAN.CREATE, keuanganData);
  },

  /**
   * Update existing keuangan record
   * @param {number|string} id - Keuangan ID
   * @param {Object} keuanganData - Keuangan data to update
   * @returns {Promise} - API response
   */
  updateKeuangan: async (id, keuanganData) => {
    return await api.put(ADMIN_SHELTER_ENDPOINTS.KEUANGAN.UPDATE(id), keuanganData);
  },

  /**
   * Delete keuangan record
   * @param {number|string} id - Keuangan ID
   * @returns {Promise} - API response
   */
  deleteKeuangan: async (id) => {
    return await api.delete(ADMIN_SHELTER_ENDPOINTS.KEUANGAN.DELETE(id));
  },

  /**
   * Get keuangan records by child ID
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with child's keuangan data
   */
  getKeuanganByChild: async (childId) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.KEUANGAN.BY_CHILD(childId));
  },

  /**
   * Get keuangan statistics
   * @returns {Promise} - API response with statistics data
   */
  getKeuanganStatistics: async () => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.KEUANGAN.STATISTICS);
  }
};