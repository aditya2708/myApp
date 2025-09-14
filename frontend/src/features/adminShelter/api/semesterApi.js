import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

export const semesterApi = {
  /**
   * Get all semesters
   */
  getAllSemesters: async (params = {}) => {
    return await api.get('/admin-shelter/semester', { params });
  },

  /**
   * Get semester detail
   */
  getSemesterDetail: async (id) => {
    return await api.get(`/admin-shelter/semester/${id}`);
  },

  /**
   * Create new semester
   */
  createSemester: async (semesterData) => {
    return await api.post('/admin-shelter/semester', semesterData);
  },

  /**
   * Update semester
   */
  updateSemester: async (id, semesterData) => {
    return await api.put(`/admin-shelter/semester/${id}`, semesterData);
  },

  /**
   * Delete semester
   */
  deleteSemester: async (id) => {
    return await api.delete(`/admin-shelter/semester/${id}`);
  },

  /**
   * Get active semester
   */
  getActive: async () => {
    return await api.get('/admin-shelter/semester/active');
  },

  /**
   * Set semester as active
   */
  setActive: async (id) => {
    return await api.post(`/admin-shelter/semester/${id}/set-active`);
  },

  /**
   * Get semester statistics
   */
  getStatistics: async (id) => {
    return await api.get(`/admin-shelter/semester/${id}/statistics`);
  },

  /**
   * Get tahun ajaran list
   */
  getTahunAjaran: async () => {
    return await api.get('/admin-shelter/semester/tahun-ajaran');
  },

  /**
   * Get semester by tahun ajaran
   */
  getByTahunAjaran: async (tahunAjaran) => {
    return await api.get('/admin-shelter/semester/by-tahun-ajaran', {
      params: { tahun_ajaran: tahunAjaran }
    });
  },

  /**
   * Check if semester can be deleted
   */
  checkCanDelete: async (id) => {
    return await api.get(`/admin-shelter/semester/${id}/check-can-delete`);
  },

  /**
   * Duplicate semester
   */
  duplicateSemester: async (id, newData) => {
    return await api.post(`/admin-shelter/semester/${id}/duplicate`, newData);
  },

  /**
   * Attach kurikulum to semester
   */
  attachKurikulum: async (semesterId, kurikulumId) => {
    return await api.post(`/admin-shelter/semester/${semesterId}/kurikulum`, {
      kurikulum_id: kurikulumId
    });
  },

  /**
   * Detach kurikulum from semester
   */
  detachKurikulum: async (semesterId) => {
    return await api.delete(`/admin-shelter/semester/${semesterId}/kurikulum`);
  }
};