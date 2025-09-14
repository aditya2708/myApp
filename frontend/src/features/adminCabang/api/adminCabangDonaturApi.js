import api from '../../../api/axiosConfig';

const BASE_URL = '/admin-cabang';

export const adminCabangDonaturApi = {
  /**
   * Get list of donatur with filtering
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with donatur data
   */
  getDonatur: async (params = {}) => {
    return await api.get(`${BASE_URL}/donatur`, { params });
  },

  /**
   * Get donatur details
   * @param {number|string} donaturId - Donatur ID
   * @returns {Promise} - API response with donatur details
   */
  getDonaturDetail: async (donaturId) => {
    return await api.get(`${BASE_URL}/donatur/${donaturId}`);
  },

  /**
   * Create new donatur
   * @param {Object} donaturData - Donatur data
   * @returns {Promise} - API response
   */
  createDonatur: async (donaturData) => {
    return await api.post(`${BASE_URL}/donatur`, donaturData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Update donatur
   * @param {number|string} donaturId - Donatur ID
   * @param {Object} donaturData - Donatur data
   * @returns {Promise} - API response
   */
  updateDonatur: async (donaturId, donaturData) => {
    return await api.post(`${BASE_URL}/donatur/${donaturId}`, donaturData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete donatur
   * @param {number|string} donaturId - Donatur ID
   * @returns {Promise} - API response
   */
  deleteDonatur: async (donaturId) => {
    return await api.delete(`${BASE_URL}/donatur/${donaturId}`);
  },

  /**
   * Get filter options for donatur form
   * @returns {Promise} - API response with filter options
   */
  getFilterOptions: async () => {
    return await api.get(`${BASE_URL}/donatur-filter-options`);
  },

  /**
   * Get shelters by wilbin ID
   * @param {number|string} wilbinId - Wilbin ID
   * @returns {Promise} - API response with shelters
   */
  getSheltersByWilbin: async (wilbinId) => {
    return await api.get(`${BASE_URL}/donatur-shelters/${wilbinId}`);
  },

  /**
   * Get donatur statistics
   * @returns {Promise} - API response with statistics
   */
  getStats: async () => {
    return await api.get(`${BASE_URL}/donatur-stats`);
  }
};