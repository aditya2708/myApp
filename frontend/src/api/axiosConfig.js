import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_TOKEN_KEY } from '../constants/config';
import { getCurrentRole } from '../common/utils/storageHelpers';
import { clearAuthState, refreshAccessToken } from './tokenRefresher';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from storage
      const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      
      // If token exists, add to headers
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      const currentRole = await getCurrentRole();
      if (currentRole?.slug) {
        config.headers['X-Current-Role'] = currentRole.slug;
        if (currentRole.scope_type) {
          config.headers['X-Current-Scope-Type'] = currentRole.scope_type;
        }
        if (currentRole.scope_id !== null && currentRole.scope_id !== undefined) {
          config.headers['X-Current-Scope-Id'] = currentRole.scope_id;
        }
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.warn('Token refresh failed:', refreshError?.message || refreshError);
        await clearAuthState();
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
