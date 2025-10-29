import api from '../../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../../constants/endpoints';

export const kegiatanApi = {
  getAllKegiatan: async () => {
    return await api.get(ADMIN_SHELTER_ENDPOINTS.KEGIATAN.LIST);
  }
};
