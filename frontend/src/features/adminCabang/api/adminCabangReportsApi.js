import api from '../../../api/axiosConfig';
import { ADMIN_CABANG_ENDPOINTS } from '../../../constants/endpoints';

const { REPORTS } = ADMIN_CABANG_ENDPOINTS;

export const adminCabangReportsApi = {
  async getSummary(params) {
    return api.get(REPORTS.SUMMARY, { params });
  },
};
