// src/features/adminShelter/api/adminShelterPengajuanAnakApi.js

import api from '../../../api/axiosConfig';

/**
 * Admin Shelter Pengajuan Anak API service
 * Contains methods for submitting new children to existing or new families
 */
export const adminShelterPengajuanAnakApi = {
  /**
   * Get priority families (families without children) in the same shelter
   * @returns {Promise} - API response with priority families
   */
  getPriorityFamilies: async () => {
    return await api.get('/admin-shelter/pengajuan-anak/priority-families');
  },

  /**
   * Search for families by KK number
   * @param {string} searchQuery - KK number to search for
   * @returns {Promise} - API response with matching families
   */
  searchKeluarga: async (searchQuery) => {
    return await api.get('/admin-shelter/pengajuan-anak/search-keluarga', { 
      params: { search: searchQuery }
    });
  },

  /**
   * Validate if a KK number exists
   * @param {string} kkNumber - KK number to validate
   * @returns {Promise} - API response with validation result and family data if found
   */
  validateKK: async (kkNumber) => {
    return await api.post('/admin-shelter/pengajuan-anak/validate-kk', {
      no_kk: kkNumber
    });
  },

  /**
   * Submit child data to an existing family
   * @param {Object} childData - Child data (FormData object)
   * @returns {Promise} - API response
   */
  submitAnak: async (childData) => {
    return await api.post('/admin-shelter/pengajuan-anak/submit', childData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Increase timeout to 30 seconds
    });
  }
};