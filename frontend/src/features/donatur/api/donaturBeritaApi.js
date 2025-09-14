import api from '../../../api/axiosConfig';

export const donaturBeritaApi = {
  getBeritaList: async (params = {}) => {
    return await api.get('/donatur/berita', { params });
  },

  getBeritaDetail: async (id) => {
    return await api.get(`/donatur/berita/${id}`);
  },

  incrementView: async (id) => {
    return await api.put(`/donatur/berita/${id}/increment-view`);
  }
};