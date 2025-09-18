// FEATURES PATH: features/adminCabang/api/adminCabangUserManagementApi.js
// DESC: API service untuk manajemen user admin cabang (list/detail/create/update + dropdown wilbin/shelter)

import api from '../../../api/axiosConfig';
import { ADMIN_CABANG_ENDPOINTS } from '../../../constants/endpoints';

const USER_ENDPOINTS = ADMIN_CABANG_ENDPOINTS.USERS;

export const adminCabangUserManagementApi = {
  /**
   * Ambil daftar user berdasarkan level (admin_cabang/admin_shelter)
   */
  getUsers: async ({ level } = {}) => {
    if (!level) {
      const error = new Error('Parameter level wajib diisi');
      error.code = 'LEVEL_REQUIRED';
      throw error;
    }
    return await api.get(USER_ENDPOINTS.LIST, { params: { level } });
  },

  /** Ambil detail user */
  getUserDetail: async (idUsers) => {
    if (!idUsers && idUsers !== 0) {
      const error = new Error('Parameter id user wajib diisi');
      error.code = 'ID_REQUIRED';
      throw error;
    }
    return await api.get(USER_ENDPOINTS.DETAIL(idUsers));
  },

  /** Buat user baru */
  createUser: async (payload) => {
    return await api.post(USER_ENDPOINTS.CREATE, payload);
  },

  /** Update user */
  updateUser: async (idUsers, payload) => {
    if (!idUsers && idUsers !== 0) {
      const error = new Error('Parameter id user wajib diisi');
      error.code = 'ID_REQUIRED';
      throw error;
    }
    return await api.put(USER_ENDPOINTS.UPDATE(idUsers), payload);
  },

  /** Dropdown wilbin untuk cabang */
  getWilbinDropdown: async () => {
    return await api.get(USER_ENDPOINTS.DROPDOWN.WILBIN);
  },

  /** Dropdown shelter berdasarkan wilbin */
  getShelterByWilbin: async (wilbinId) => {
    if (!wilbinId && wilbinId !== 0) {
      const error = new Error('Parameter id wilbin wajib diisi');
      error.code = 'WILBIN_ID_REQUIRED';
      throw error;
    }
    return await api.get(USER_ENDPOINTS.DROPDOWN.SHELTER_BY_WILBIN(wilbinId));
  },
};

export default adminCabangUserManagementApi;
