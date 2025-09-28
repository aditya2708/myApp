import api from '../../../api/axiosConfig';
import { ADMIN_CABANG_ENDPOINTS } from '../../../constants/endpoints';

const {
  REPORTS: {
    SUMMARY,
    ANAK: { LIST, DETAIL, FILTERS }
  }
} = ADMIN_CABANG_ENDPOINTS;

export const adminCabangReportApi = {
  async getSummary(params = {}) {
    return api.get(SUMMARY, { params });
  },

  async getLaporanAnakBinaan(params = {}) {
    return api.get(LIST, { params });
  },

  async getChildDetailReport(childId, params = {}) {
    return api.get(DETAIL(childId), { params });
  },

  async getJenisKegiatanOptions() {
    return api.get(FILTERS.JENIS_KEGIATAN);
  },

  async getWilayahBinaanOptions() {
    return api.get(FILTERS.WILAYAH_BINAAN);
  },

  async getShelterOptionsByWilayah(wilbinId) {
    return api.get(FILTERS.SHELTER_BY_WILAYAH(wilbinId));
  }
};
