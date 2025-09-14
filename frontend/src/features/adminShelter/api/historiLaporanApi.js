import api from '../../../api/axiosConfig';

export const historiLaporanApi = {
  getLaporanHistori: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/histori', { params });
  },

  getHistoriDetail: async (historiId, params = {}) => {
    return await api.get(`/admin-shelter/laporan/histori/detail/${historiId}`, { params });
  },

  getJenisHistoriOptions: async () => {
    return await api.get('/admin-shelter/laporan/histori/jenis-histori-options');
  },

  getAvailableYears: async () => {
    return await api.get('/admin-shelter/laporan/histori/available-years');
  }
};