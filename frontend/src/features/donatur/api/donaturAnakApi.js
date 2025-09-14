import api from '../../../api/axiosConfig';

export const donaturAnakApi = {
  /**
   * Get sponsored children list
   * @returns {Promise} - API response with children data
   */
  getSponsoredChildren: async () => {
    return await api.get('/donatur/children');
  },

  /**
   * Get child details
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with child details
   */
  getChildDetails: async (childId) => {
    return await api.get(`/donatur/children/${childId}`);
  },
};