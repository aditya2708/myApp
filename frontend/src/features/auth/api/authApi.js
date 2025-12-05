import api from '../../../api/axiosConfig';
import { AUTH_ENDPOINTS } from '../../../constants/endpoints';

export const authApi = {
  logout: async () => {
    return await api.post('/auth/logout');
  },

  getCurrentUser: async () => {
    return await api.get('/me');
  },
};
