import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

export const adminShelterRiwayatApi = {
  getAllRiwayat: async (anakId, params = {}) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.RIWAYAT.LIST(anakId), { params });
  },

  getRiwayatDetail: async (anakId, riwayatId) => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.RIWAYAT.DETAIL(anakId, riwayatId));
  },

  createRiwayat: async (anakId, riwayatData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.RIWAYAT.CREATE(anakId), riwayatData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateRiwayat: async (anakId, riwayatId, riwayatData) => {
    return await api.post(ADMIN_SHELTER_ENDPOINTS.RIWAYAT.UPDATE(anakId, riwayatId), riwayatData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteRiwayat: async (anakId, riwayatId) => {
    return await api.delete(ADMIN_SHELTER_ENDPOINTS.RIWAYAT.DELETE(anakId, riwayatId));
  }
};