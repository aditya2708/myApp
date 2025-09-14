import api from '../../../api/axiosConfig';
import { DONATUR_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Donatur Billing API service
 * Contains methods for billing/keuangan specific API requests
 */
export const donaturBillingApi = {
  /**
   * Get billing list for sponsored children
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response with billing data
   */
  getBilling: async (params = {}) => {
    return await api.get(DONATUR_ENDPOINTS.BILLING.LIST, { params });
  },

  /**
   * Get billing details
   * @param {number|string} billingId - Billing ID
   * @returns {Promise} - API response with billing details
   */
  getBillingDetails: async (billingId) => {
    return await api.get(DONATUR_ENDPOINTS.BILLING.DETAIL(billingId));
  },

  /**
   * Get billing for specific child
   * @param {number|string} childId - Child ID
   * @returns {Promise} - API response with child's billing data
   */
  getChildBilling: async (childId) => {
    return await api.get(DONATUR_ENDPOINTS.BILLING.BY_CHILD(childId));
  },

  /**
   * Get billing summary for donatur dashboard
   * @returns {Promise} - API response with billing summary
   */
  getBillingSummary: async () => {
    return await api.get(DONATUR_ENDPOINTS.BILLING.SUMMARY);
  },

  /**
   * Get available semesters for billing filter
   * @returns {Promise} - API response with semester options
   */
  getBillingSemesters: async () => {
    return await api.get(DONATUR_ENDPOINTS.BILLING.SEMESTERS);
  }
};