import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MANAGEMENT_BASE_URL, STORAGE_TOKEN_KEY } from '../constants/config';
import { clearAuthState, refreshAccessToken } from './tokenRefresher';

const managementApiClient = axios.create({
  baseURL: MANAGEMENT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

managementApiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error attaching management auth token:', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

managementApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return managementApiClient(originalRequest);
        }
      } catch (refreshError) {
        console.warn('Management token refresh failed:', refreshError?.message || refreshError);
        await clearAuthState();
      }
    }

    return Promise.reject(error);
  }
);

export default managementApiClient;
