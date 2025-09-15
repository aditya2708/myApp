import api from '../../../api/axiosConfig';

// Base endpoint for all penilaian related requests
const PENILAIAN_BASE_URL = '/admin-shelter/penilaian';

export const penilaianApi = {
  /**
   * Get all penilaian with filters
   */
  getAllPenilaian: async (params = {}) => {
    return await api.get(PENILAIAN_BASE_URL, { params });
  },

  /**
   * Get penilaian by anak and semester
   */
  getByAnakSemester: async (idAnak, idSemester, params = {}) => {
    return await api.get(
      `${PENILAIAN_BASE_URL}/anak/${idAnak}/semester/${idSemester}`,
      { params }
    );
  },

  /**
   * Get penilaian detail
   */
  getPenilaianDetail: async (id, params = {}) => {
    return await api.get(`${PENILAIAN_BASE_URL}/${id}`, { params });
  },

  /**
   * Create new penilaian
   */
  createPenilaian: async (penilaianData, params = {}) => {
    return await api.post(PENILAIAN_BASE_URL, penilaianData, { params });
  },

  /**
   * Update penilaian
   */
  updatePenilaian: async (id, penilaianData, params = {}) => {
    return await api.put(`${PENILAIAN_BASE_URL}/${id}`, penilaianData, { params });
  },

  /**
   * Delete penilaian
   */
  deletePenilaian: async (id, params = {}) => {
    return await api.delete(`${PENILAIAN_BASE_URL}/${id}`, { params });
  },

  /**
   * Bulk create penilaian
   */
  bulkCreatePenilaian: async (penilaianArray, params = {}) => {
    return await api.post(
      `${PENILAIAN_BASE_URL}/bulk`,
      { penilaian: penilaianArray },
      { params }
    );
  },

  /**
   * Calculate nilai akhir
   */
  calculateNilaiAkhir: async (idAnak, idSemester, mataPelajaran, params = {}) => {
    return await api.post(
      `${PENILAIAN_BASE_URL}/calculate-nilai-akhir`,
      {
        id_anak: idAnak,
        id_semester: idSemester,
        mata_pelajaran: mataPelajaran
      },
      { params }
    );
  },

  /**
   * Get jenis penilaian list
   */
  getJenisPenilaian: async (params = {}) => {
    return await api.get('/admin-shelter/jenis-penilaian', { params });
  },

  /**
   * Get penilaian statistics for anak
   */
  getStatistics: async (idAnak, idSemester, params = {}) => {
    return await api.get(
      `${PENILAIAN_BASE_URL}/statistics/${idAnak}/${idSemester}`,
      { params }
    );
  },

  /**
   * Export penilaian to Excel
   */
  exportToExcel: async (params = {}) => {
    return await api.get(`${PENILAIAN_BASE_URL}/export`, {
      params,
      responseType: 'blob'
    });
  }
};