import managementApiClient from '../../../api/managementAxios';

export const managementApi = {
  login: (credentials) =>
    managementApiClient.post('/api/auth/login', credentials),
  logout: (token) =>
    managementApiClient.post(
      '/api/auth/logout',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    ),
  userinfo: (token) =>
    managementApiClient.get('/api/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
