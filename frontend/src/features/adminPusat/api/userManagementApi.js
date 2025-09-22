// FEATURES PATH: features/adminPusat/api/userManagementApi.js
// Service API khusus Manajemen User (Admin Pusat)
// Backend tersedia:
//  - GET  /api/admin-pusat/users?level=admin_pusat|admin_cabang|admin_shelter (level wajib)
//  - GET  /api/admin-pusat/users/{id}   (detail user)
//  - POST /api/admin-pusat/create-user  (payload sesuai contoh dari user)
//  - PUT  /api/admin-pusat/users/{id}   (update user)
//  - GET  /api/admin-pusat/dropdowns/kacab
//  - GET  /api/admin-pusat/dropdowns/kacab/{id}/wilbin
//  - GET  /api/admin-pusat/dropdowns/wilbin/{id}/shelter

import api from '../../../api/axiosConfig';

/**
 * Admin Pusat - User Management API
 */
export const userManagementApi = {
  /** Ambil daftar user berdasarkan level (WAJIB) */
  getUsers: async ({ level }) => {
    if (!level) {
      const err = new Error('Parameter level wajib diisi');
      err.code = 'LEVEL_REQUIRED';
      throw err;
    }
    return await api.get('/admin-pusat/users', { params: { level } });
  },

  /** Ambil detail user berdasarkan ID user */
  getUserDetail: async (idUsers) => {
    if (idUsers === undefined || idUsers === null || idUsers === '') {
      const err = new Error('Parameter id user wajib diisi');
      err.code = 'ID_REQUIRED';
      throw err;
    }
    return await api.get(`/admin-pusat/users/${idUsers}`);
  },

  /** Buat user baru */
  createUser: async (payload) => {
    return await api.post('/admin-pusat/create-user', payload);
  },

  /** Update user berdasarkan ID */
  updateUser: async (idUsers, payload) => {
    if (!idUsers) {
      const err = new Error('Parameter id user wajib diisi');
      err.code = 'ID_REQUIRED';
      throw err;
    }
    return await api.put(`/admin-pusat/users/${idUsers}`, payload);
  },

  // --- Tambahan untuk dropdown berjenjang ---

  /** Ambil semua kacab */
  getKacab: async () => {
    return await api.get('/admin-pusat/dropdowns/kacab');
  },

  /** Ambil wilbin berdasarkan kacab */
  getWilbinByKacab: async (idKacab) => {
    if (!idKacab) {
      const err = new Error('Parameter id_kacab wajib diisi');
      err.code = 'KACAB_ID_REQUIRED';
      throw err;
    }
    return await api.get(`/admin-pusat/dropdowns/kacab/${idKacab}/wilbin`);
  },

  /** Ambil shelter berdasarkan wilbin */
  getShelterByWilbin: async (idWilbin) => {
    if (!idWilbin) {
      const err = new Error('Parameter id_wilbin wajib diisi');
      err.code = 'WILBIN_ID_REQUIRED';
      throw err;
    }
    return await api.get(`/admin-pusat/dropdowns/wilbin/${idWilbin}/shelter`);
  },

  // Placeholder: delete belum tersedia
  deleteUser: async () => {
    throw new Error('Endpoint delete user belum tersedia di backend');
  },
};

export default userManagementApi;
