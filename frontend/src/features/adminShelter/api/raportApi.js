import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

export const raportApi = {
  /**
   * Get all raport with filters
   */
  getAllRaport: async (params = {}) => {
    return await api.get('/admin-shelter/raport', { params });
  },

  /**
   * Get raport by anak
   */
  getRaportByAnak: async (idAnak) => {
    return await api.get(`/admin-shelter/raport/anak/${idAnak}`);
  },

  /**
   * Get raport detail
   */
  getRaportDetail: async (id) => {
    return await api.get(`/admin-shelter/raport/${id}`);
  },

  /**
   * Generate raport
   */
  generateRaport: async (raportData) => {
    return await api.post('/admin-shelter/raport/generate', raportData);
  },

  /**
   * Update raport
   */
  updateRaport: async (id, raportData) => {
    return await api.put(`/admin-shelter/raport/${id}`, raportData);
  },

  /**
   * Publish raport
   */
  publishRaport: async (id) => {
    return await api.post(`/admin-shelter/raport/${id}/publish`);
  },

  /**
   * Archive raport
   */
  archiveRaport: async (id) => {
    return await api.post(`/admin-shelter/raport/${id}/archive`);
  },

  /**
   * Delete raport
   */
  deleteRaport: async (id) => {
    return await api.delete(`/admin-shelter/raport/${id}`);
  },

  /**
   * Get preview data before generating
   */
  getPreviewData: async (idAnak, idSemester) => {
    return await api.get(`/admin-shelter/raport/preview/${idAnak}/${idSemester}`);
  },

  /**
   * Check if raport exists
   */
  checkExistingRaport: async (idAnak, idSemester) => {
    return await api.get(`/admin-shelter/raport/check-existing/${idAnak}/${idSemester}`);
  },

  /**
   * Update raport detail
   */
  updateRaportDetail: async (idRaport, idDetail, detailData) => {
    return await api.put(`/admin-shelter/raport/${idRaport}/detail/${idDetail}`, detailData);
  },

  /**
   * Get nilai sikap
   */
  getNilaiSikap: async (idAnak, idSemester) => {
    return await api.get(`/admin-shelter/nilai-sikap/${idAnak}/${idSemester}`);
  },

  /**
   * Create nilai sikap
   */
  createNilaiSikap: async (nilaiSikapData) => {
    return await api.post('/admin-shelter/nilai-sikap', nilaiSikapData);
  },

  /**
   * Update nilai sikap
   */
  updateNilaiSikap: async (id, nilaiSikapData) => {
    return await api.put(`/admin-shelter/nilai-sikap/${id}`, nilaiSikapData);
  },

  /**
   * Delete nilai sikap
   */
  deleteNilaiSikap: async (id) => {
    return await api.delete(`/admin-shelter/nilai-sikap/${id}`);
  },

  /**
   * Export raport to PDF
   */
  exportToPDF: async (id) => {
    return await api.get(`/admin-shelter/raport/${id}/export-pdf`, {
      responseType: 'blob'
    });
  },

  /**
   * Get ranking statistics
   */
  getRankingStatistics: async (idSemester) => {
    return await api.get(`/admin-shelter/raport/ranking/${idSemester}`);
  }
};