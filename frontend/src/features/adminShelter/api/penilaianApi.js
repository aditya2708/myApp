import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

export const penilaianApi = {
  /**
   * Get all penilaian with filters
   */
  getAllPenilaian: async (params = {}) => {
    return await api.get('/admin-shelter/penilaian', { params });
  },

  /**
   * Get penilaian by anak and semester
   */
  getByAnakSemester: async (idAnak, idSemester) => {
    return await api.get(`/admin-shelter/penilaian/anak/${idAnak}/semester/${idSemester}`);
  },

  /**
   * Get penilaian detail
   */
  getPenilaianDetail: async (id) => {
    return await api.get(`/admin-shelter/penilaian/${id}`);
  },

  /**
   * Create new penilaian
   */
  createPenilaian: async (penilaianData) => {
    return await api.post('/admin-shelter/penilaian', penilaianData);
  },

  /**
   * Update penilaian
   */
  updatePenilaian: async (id, penilaianData) => {
    return await api.put(`/admin-shelter/penilaian/${id}`, penilaianData);
  },

  /**
   * Delete penilaian
   */
  deletePenilaian: async (id) => {
    return await api.delete(`/admin-shelter/penilaian/${id}`);
  },

  /**
   * Bulk create penilaian
   */
  bulkCreatePenilaian: async (penilaianArray) => {
    return await api.post('/admin-shelter/penilaian/bulk', { penilaian: penilaianArray });
  },

  /**
   * Calculate nilai akhir
   */
  calculateNilaiAkhir: async (idAnak, idSemester, mataPelajaran) => {
    return await api.post('/admin-shelter/penilaian/calculate-nilai-akhir', {
      id_anak: idAnak,
      id_semester: idSemester,
      mata_pelajaran: mataPelajaran
    });
  },

  /**
   * Get jenis penilaian list
   */
  getJenisPenilaian: async () => {
    return await api.get('/admin-shelter/jenis-penilaian');
  },

  /**
   * Get penilaian statistics for anak
   */
  getStatistics: async (idAnak, idSemester) => {
    return await api.get(`/admin-shelter/penilaian/statistics/${idAnak}/${idSemester}`);
  },

  /**
   * Export penilaian to Excel
   */
  exportToExcel: async (params = {}) => {
    return await api.get('/admin-shelter/penilaian/export', {
      params,
      responseType: 'blob'
    });
  }
};