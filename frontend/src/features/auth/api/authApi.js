import api from '../../../api/axiosConfig';
import { AUTH_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Authentication API service
 * Contains methods for authentication-related API requests
 */
export const authApi = {
  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise} - API response
   */
  login: async (credentials) => {
    return await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
  },
  
  /**
   * Logout user
   * Requires authentication token in headers
   * @returns {Promise} - API response
   */
  logout: async () => {
    return await api.post(AUTH_ENDPOINTS.LOGOUT);
  },
  
  /**
   * Get current user data
   * Requires authentication token in headers
   * @returns {Promise} - API response with user data
   */
  getCurrentUser: async () => {
    return await api.get(AUTH_ENDPOINTS.USER);
  },
  
  /**
   * Check if auth token is valid 
   * This is a lightweight call to verify token validity
   * @returns {Promise} - API response
   */
  validateToken: async () => {
    return await api.get(AUTH_ENDPOINTS.USER, { timeout: 5000 });
  }
};