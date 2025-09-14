import api from '../../../api/axiosConfig';
import { ADMIN_CABANG_ENDPOINTS, MANAGEMENT_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Admin Cabang API service - Main entry point
 * Organized by sections: Core, Master Data, Akademik
 */
export const adminCabangApi = {
  // GPS Approval Management
  getGpsApprovalList: async (params = {}) => {
    return await api.get(ADMIN_CABANG_ENDPOINTS.GPS_APPROVAL.LIST, { params });
  },
  
  getGpsApprovalDetail: async (shelterId) => {
    return await api.get(ADMIN_CABANG_ENDPOINTS.GPS_APPROVAL.DETAIL.replace(':id', shelterId));
  },
  
  approveGpsRequest: async (shelterId, data) => {
    return await api.post(ADMIN_CABANG_ENDPOINTS.GPS_APPROVAL.APPROVE.replace(':id', shelterId), data);
  },
  
  rejectGpsRequest: async (shelterId, data) => {
    return await api.post(ADMIN_CABANG_ENDPOINTS.GPS_APPROVAL.REJECT.replace(':id', shelterId), data);
  },
  // ==================== CORE ADMIN CABANG ====================
  
  /**
   * Get admin cabang dashboard data
   */
  getDashboard: async () => {
    return await api.get(ADMIN_CABANG_ENDPOINTS.DASHBOARD);
  },

  /**
   * Get admin cabang profile
   */
  getProfile: async () => {
    return await api.get(ADMIN_CABANG_ENDPOINTS.PROFILE);
  },

  /**
   * Update admin cabang profile
   */
  updateProfile: async (profileData) => {
    return await api.post(ADMIN_CABANG_ENDPOINTS.PROFILE, profileData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Get list of wilbin (wilayah binaan)
   */
  getWilbin: async (params = {}) => {
    return await api.get(MANAGEMENT_ENDPOINTS.WILBIN, { params });
  },

  /**
   * Get wilbin details
   */
  getWilbinDetail: async (wilbinId) => {
    return await api.get(MANAGEMENT_ENDPOINTS.WILBIN_DETAIL(wilbinId));
  },

  /**
   * Create new wilbin
   */
  createWilbin: async (wilbinData) => {
    return await api.post(MANAGEMENT_ENDPOINTS.WILBIN, wilbinData);
  },

  /**
   * Update wilbin
   */
  updateWilbin: async (wilbinId, wilbinData) => {
    return await api.put(MANAGEMENT_ENDPOINTS.WILBIN_DETAIL(wilbinId), wilbinData);
  },

  /**
   * Delete wilbin
   */
  deleteWilbin: async (wilbinId) => {
    return await api.delete(MANAGEMENT_ENDPOINTS.WILBIN_DETAIL(wilbinId));
  },
};


// Default export
export default adminCabangApi;