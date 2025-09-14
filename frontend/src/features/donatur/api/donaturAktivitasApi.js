import api from '../../../api/axiosConfig';

export const donaturAktivitasApi = {
  /**
   * Get aktivitas list for specific child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with aktivitas list
   */
  getAktivitasList: async (childId) => {
    return await api.get(`/donatur/children/${childId}/aktivitas`);
  },

  /**
   * Get aktivitas details
   * @param {number|string} childId - Child ID
   * @param {number|string} aktivitasId - Aktivitas ID
   * @returns {Promise} - API response with aktivitas details
   */
  getAktivitasDetail: async (childId, aktivitasId) => {
    return await api.get(`/donatur/children/${childId}/aktivitas/${aktivitasId}`);
  },

  /**
   * Get attendance summary for child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with attendance summary
   */
  getAttendanceSummary: async (childId) => {
    return await api.get(`/donatur/children/${childId}/attendance-summary`);
  },
};