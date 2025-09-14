import api from '../../../api/axiosConfig';

export const kurikulumShelterApi = {
  /**
   * Get all materi from cabang (for frontend caching & filtering)
   * Used by SmartMateriSelector for client-side filtering
   * Response: { data: { hierarchy: { materi_list: [], total_count: number, kacab_info: {} } } }
   */
  getAllMateri: async () => {
    return await api.get('/admin-shelter/kurikulum/all-materi');
  },

  /**
   * Get available kelas for kelompok form
   * Used by KelasGabunganSelector
   * Response: { data: { hierarchy: { kelas_list: [], grouped_kelas: {}, total_count: number } } }
   */
  getAvailableKelas: async () => {
    return await api.get('/admin-shelter/kurikulum/available-kelas');
  },

  /**
   * Get active semester info
   * Response: { data: { hierarchy: { semester: {}, progress_percentage: number, status: string, days_remaining: number } } }
   */
  getSemesterAktif: async () => {
    return await api.get('/admin-shelter/kurikulum/semester-aktif');
  },

  /**
   * Get materi detail for preview
   * Used by SmartMateriSelector preview functionality  
   * Response: { data: { hierarchy: { materi: {}, usage_stats: {}, file_info: {} } } }
   */
  getMateriDetail: async (materiId) => {
    return await api.get(`/admin-shelter/kurikulum/materi/${materiId}`);
  },

  // Legacy methods - kept for backward compatibility
  /**
   * @deprecated Use getAllMateri instead
   */
  getAllKurikulum: async (params = {}) => {
    console.warn('getAllKurikulum is deprecated. Use getAllMateri instead.');
    return await api.get('/admin-shelter/kurikulum', { params });
  },

  /**
   * @deprecated Use getMateriDetail instead
   */
  getKurikulumDetail: async (id) => {
    console.warn('getKurikulumDetail is deprecated. Use getMateriDetail instead.');
    return await api.get(`/admin-shelter/kurikulum/${id}`);
  },

  /**
   * @deprecated Use getMateriDetail instead
   */
  getKurikulumPreview: async (id) => {
    console.warn('getKurikulumPreview is deprecated. Use getMateriDetail instead.');
    return await api.get(`/admin-shelter/kurikulum/${id}/preview`);
  },

  /**
   * @deprecated Use getAllMateri or getAvailableKelas instead
   */
  getForDropdown: async () => {
    console.warn('getForDropdown is deprecated. Use getAllMateri or getAvailableKelas instead.');
    return await api.get('/admin-shelter/kurikulum-dropdown');
  },

  /**
   * @deprecated Use getAllMateri instead
   */
  getKurikulumList: async (params = {}) => {
    console.warn('getKurikulumList is deprecated. Use getAllMateri instead.');
    return await api.get('/admin-shelter/kurikulum', { params });
  }
};