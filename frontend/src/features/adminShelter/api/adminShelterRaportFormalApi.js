import api from '../../../api/axiosConfig';

export const adminShelterRaportFormalApi = {
  getRaportFormal: async (anakId) => {
    return await api.get(`/admin-shelter/anak/${anakId}/raport-formal`);
  },

  getRaportFormalDetail: async (anakId, raportId) => {
    return await api.get(`/admin-shelter/anak/${anakId}/raport-formal/${raportId}`);
  },

  createRaportFormal: async (anakId, raportData) => {
    return await api.post(`/admin-shelter/anak/${anakId}/raport-formal`, raportData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateRaportFormal: async (anakId, raportId, raportData) => {
    return await api.post(`/admin-shelter/anak/${anakId}/raport-formal/${raportId}`, raportData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteRaportFormal: async (anakId, raportId) => {
    return await api.delete(`/admin-shelter/anak/${anakId}/raport-formal/${raportId}`);
  }
};