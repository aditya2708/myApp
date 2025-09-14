import api from '../../../api/axiosConfig';

const BASE_URL = '/admin-cabang/pengajuan-donatur';

export const adminCabangPengajuanDonaturApi = {
  getCpbChildren: async (params = {}) => {
    return await api.get(`${BASE_URL}/cpb-children`, { params });
  },

  getAvailableDonatur: async (params = {}) => {
    return await api.get(`${BASE_URL}/available-donatur`, { params });
  },

  assignDonatur: async (data) => {
    return await api.post(`${BASE_URL}/assign-donatur`, data);
  },

  getChildDetail: async (childId) => {
    return await api.get(`${BASE_URL}/child-detail/${childId}`);
  }
};