import api from '../../../api/axiosConfig';

export const aktivitasLaporanApi = {
  getLaporanAktivitas: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/aktivitas', { params });
  },

  getActivityDetailReport: async (activityId) => {
    return await api.get(`/admin-shelter/laporan/aktivitas/detail/${activityId}`);
  },

  getJenisKegiatanOptions: async () => {
    return await api.get('/admin-shelter/laporan/aktivitas/jenis-kegiatan-options');
  },

  getAvailableYears: async () => {
    return await api.get('/admin-shelter/laporan/aktivitas/available-years');
  }
};