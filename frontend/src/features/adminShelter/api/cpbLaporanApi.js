import api from '../../../api/axiosConfig';

export const cpbLaporanApi = {
  getCpbReport: async () => {
    return await api.get('/admin-shelter/laporan/cpb');
  },

  getCpbByStatus: async (status, params = {}) => {
    return await api.get(`/admin-shelter/laporan/cpb/status/${status}`, { params });
  },

  exportCpbData: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/cpb/export', { params });
  },

  exportCpbPdf: async (params = {}) => {
    return await api.get('/admin-shelter/laporan/cpb/export', { 
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
  }
};