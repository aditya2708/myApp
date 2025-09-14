import api from '../../../api/axiosConfig';

export const tutorLaporanApi = {
  getLaporanTutor: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/tutor', { params });
  },

  getTutorDetailReport: async (tutorId, params = {}) => {
    return await api.get(`/admin-shelter/laporan/tutor/detail/${tutorId}`, { params });
  },

  getMapelOptions: async () => {
    return await api.get('/admin-shelter/laporan/mapel-options');
  },

  getJenisKegiatanOptions: async () => {
    return await api.get('/admin-shelter/laporan/tutor/jenis-kegiatan-options');
  },

  getAvailableYears: async () => {
    return await api.get('/admin-shelter/laporan/tutor/available-years');
  },

  exportTutorData: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/tutor/export', { params });
  },

  exportTutorPdf: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/tutor/export', {
      params: { ...params, format: 'pdf' },
      responseType: 'blob'
    });
  }
};