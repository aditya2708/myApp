import api from '../../../api/axiosConfig';

export const donaturRaportApi = {
  /**
   * Get raport list for specific child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with raport list
   */
  getRaportList: async (childId) => {
    return await api.get(`/donatur/children/${childId}/raport`);
  },

  /**
   * Get raport details
   * @param {number|string} childId - Child ID
   * @param {number|string} raportId - Raport ID
   * @returns {Promise} - API response with raport details
   */
  getRaportDetail: async (childId, raportId) => {
    return await api.get(`/donatur/children/${childId}/raport/${raportId}`);
  },

  /**
   * Get raport summary for child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with raport summary
   */
  getRaportSummary: async (childId) => {
    return await api.get(`/donatur/children/${childId}/raport-summary`);
  },
};