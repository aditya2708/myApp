import api from '../../../api/axiosConfig';

/**
 * QR Token API service
 * Contains methods for QR token management API requests
 */
export const qrTokenApi = {
  /**
   * Generate a QR token for a student
   * @param {number|string} id_anak - Student ID
   * @param {number} validDays - Number of days token should be valid
   * @returns {Promise} - API response with generated token
   */
  generateToken: async (id_anak, options = {}) => {
    const { validDays, expiryStrategy } = options || {};

    const payload = {
      id_anak
    };

    const shouldIncludeValidDays =
      (expiryStrategy === undefined || expiryStrategy === 'days') &&
      typeof validDays === 'number';

    if (shouldIncludeValidDays) {
      payload.valid_days = validDays;
    } else if (expiryStrategy === undefined && validDays === undefined) {
      payload.valid_days = 30;
    }

    if (expiryStrategy) {
      payload.expiry_strategy = expiryStrategy;
    }

    return await api.post('/admin-shelter/qr-tokens/generate', payload);
  },

  /**
   * Generate QR tokens for multiple students
   * @param {Array} studentIds - Array of student IDs
   * @param {number} validDays - Number of days tokens should be valid
   * @returns {Promise} - API response with generated tokens
   */
  generateBatchTokens: async (studentIds, options = {}) => {
    const { validDays, expiryStrategy } = options || {};

    const payload = {
      student_ids: studentIds
    };

    const shouldIncludeValidDays =
      (expiryStrategy === undefined || expiryStrategy === 'days') &&
      typeof validDays === 'number';

    if (shouldIncludeValidDays) {
      payload.valid_days = validDays;
    } else if (expiryStrategy === undefined && validDays === undefined) {
      payload.valid_days = 30;
    }

    if (expiryStrategy) {
      payload.expiry_strategy = expiryStrategy;
    }

    return await api.post('/admin-shelter/qr-tokens/generate-batch', payload);
  },

  /**
   * Validate a QR token
   * @param {string} token - QR token string
   * @returns {Promise} - API response with validation result
   */
 validateToken: async (token) => {
    return await api.post('/admin-shelter/qr-tokens/validate-token', {
        token
    });
},

  /**
   * Get active QR token for a student
   * @param {number|string} id_anak - Student ID
   * @returns {Promise} - API response with student's active token
   */
  getActiveToken: async (id_anak) => {
    return await api.get(`/admin-shelter/qr-tokens/student/${id_anak}`);
  },

  /**
   * Invalidate a QR token
   * @param {string} token - QR token to invalidate
   * @returns {Promise} - API response
   */
  invalidateToken: async (token) => {
    return await api.post('/admin-shelter/qr-tokens/invalidate', {
      token
    });
  },

  /**
   * Get GPS configuration for an activity
   * @param {number|string} id_aktivitas - Activity ID
   * @returns {Promise} - API response with GPS configuration
   */
  getActivityGpsConfig: async (id_aktivitas) => {
    return await api.get(`/admin-shelter/qr-tokens/activity/${id_aktivitas}/gps-config`);
  },

  /**
   * Validate token with activity context (includes GPS config)
   * @param {string} token - QR token string
   * @param {number|string} id_aktivitas - Activity ID for context
   * @returns {Promise} - API response with validation result and GPS config
   */
  validateTokenWithActivity: async (token, id_aktivitas) => {
    return await api.post('/admin-shelter/qr-tokens/validate-token-activity', {
      token,
      id_aktivitas
    });
  }
};