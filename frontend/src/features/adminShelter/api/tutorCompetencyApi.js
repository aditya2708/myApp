import api from '../../../api/axiosConfig';

export const tutorCompetencyApi = {
  getJenisKompetensi: async () => {
    return await api.get('/admin-shelter/jenis-kompetensi');
  },

  getCompetencies: async (tutorId) => {
    return await api.get(`/admin-shelter/tutor/${tutorId}/competency`);
  },

  getCompetencyDetail: async (tutorId, competencyId) => {
    return await api.get(`/admin-shelter/tutor/${tutorId}/competency/${competencyId}`);
  },

  createCompetency: async (tutorId, competencyData) => {
    return await api.post(`/admin-shelter/tutor/${tutorId}/competency`, competencyData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
  },

  updateCompetency: async (tutorId, competencyId, competencyData) => {
    return await api.post(`/admin-shelter/tutor/${tutorId}/competency/${competencyId}`, competencyData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
  },

  deleteCompetency: async (tutorId, competencyId) => {
    return await api.delete(`/admin-shelter/tutor/${tutorId}/competency/${competencyId}`);
  }
};