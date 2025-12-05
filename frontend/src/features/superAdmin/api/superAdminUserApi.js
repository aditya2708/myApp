import api from '../../../api/axiosConfig';

const BASE_PATH = '/admin-super';

export const superAdminUserApi = {
  list: (params = {}) =>
    api.get(`${BASE_PATH}/users`, {
      params,
    }),
  show: (id) => api.get(`${BASE_PATH}/users/${id}`),
  update: (id, payload) => api.put(`${BASE_PATH}/users/${id}`, payload),
  listKacabs: () => api.get(`${BASE_PATH}/dropdowns/kacab`),
  listWilbins: (kacabId) =>
    api.get(`${BASE_PATH}/dropdowns/kacab/${kacabId}/wilbin`),
  listShelters: (wilbinId) =>
    api.get(`${BASE_PATH}/dropdowns/wilbin/${wilbinId}/shelter`),
  listSsoDirectory: (params = {}) =>
    api.get(`${BASE_PATH}/sso-users`, {
      params,
    }),
  importFromSso: (sub) =>
    api.post(`${BASE_PATH}/sso-users/import`, {
      sub,
    }),
};
