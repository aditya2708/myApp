import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

export const adminShelterKelompokApi = {
  getAllKelompok: async (params = {}) => api.get(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.LIST, { params }),
  getKelompokDetail: async (id) => api.get(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.DETAIL(id)),
  createKelompok: async (data) => api.post(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.CREATE, data),
  updateKelompok: async (id, data) => api.post(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.UPDATE(id), data),
  deleteKelompok: async (id) => api.delete(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.DELETE(id)),
  getAvailableKelas: async () => api.get(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.AVAILABLE_KELAS),
  getAvailableAnak: async (kelompokId) => api.get(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.AVAILABLE_ANAK(kelompokId)),
  addAnak: async (kelompokId, data) => api.post(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.ADD_ANAK(kelompokId), data),
  removeAnak: async (kelompokId, anakId) => api.delete(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.REMOVE_ANAK(kelompokId, anakId)),
  getKelompokStats: async (kelompokId) => api.get(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.STATS(kelompokId)),

  getGroupChildren: async (kelompokId) => {
    const response = await api.get(ADMIN_SHELTER_ENDPOINTS.KELOMPOK.DETAIL(kelompokId));
    
    // Handle full anak objects (correct path from your API response)
    if (response.data?.data?.anak?.length) {
      const students = response.data.data.anak.map(anak => ({
        id_anak: anak.id_anak,
        full_name: anak.full_name,
        nick_name: anak.full_name,
        foto_url: anak.foto_url,
        jenis_kelamin: anak.jenis_kelamin,
        agama: anak.agama,
        status_validasi: anak.status_validasi,
        tanggal_lahir: anak.tanggal_lahir,
        nik_anak: anak.nik_anak,
        anakPendidikan: anak.anakPendidikan
      }));
      return { ...response, data: { data: students } };
    }
    
    return { ...response, data: { data: [] } };
  }
};