import api from '../../../api/axiosConfig';

export const donaturSuratApi = {
  /**
   * Get surat list for specific child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with surat list
   */
  getSuratList: async (childId) => {
    return await api.get(`/donatur/children/${childId}/surat`);
  },

  /**
   * Get surat details
   * @param {number|string} childId - Child ID
   * @param {number|string} suratId - Surat ID
   * @returns {Promise} - API response with surat details
   */
  getSuratDetail: async (childId, suratId) => {
    return await api.get(`/donatur/children/${childId}/surat/${suratId}`);
  },

  /**
   * Create new surat
   * @param {number|string} childId - Child ID
   * @param {FormData} formData - Form data containing message and optional photo
   * @returns {Promise} - API response
   */
  createSurat: async (childId, formData) => {
    return await api.post(`/donatur/children/${childId}/surat`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Mark surat as read
   * @param {number|string} childId - Child ID
   * @param {number|string} suratId - Surat ID
   * @returns {Promise} - API response
   */
  markAsRead: async (childId, suratId) => {
    return await api.put(`/donatur/children/${childId}/surat/${suratId}/read`);
  },
};