import api from '../../../api/axiosConfig';

export const donaturPrestasiApi = {
  /**
   * Get prestasi list for specific child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with prestasi list
   */
  getPrestasiList: async (childId) => {
    return await api.get(`/donatur/children/${childId}/prestasi`);
  },

  /**
   * Get prestasi details
   * @param {number|string} childId - Child ID
   * @param {number|string} prestasiId - Prestasi ID
   * @returns {Promise} - API response with prestasi details
   */
  getPrestasiDetail: async (childId, prestasiId) => {
    return await api.get(`/donatur/children/${childId}/prestasi/${prestasiId}`);
  },

  /**
   * Mark prestasi as read
   * @param {number|string} childId - Child ID
   * @param {number|string} prestasiId - Prestasi ID
   * @returns {Promise} - API response
   */
  markAsRead: async (childId, prestasiId) => {
    return await api.put(`/donatur/children/${childId}/prestasi/${prestasiId}/read`);
  },
};