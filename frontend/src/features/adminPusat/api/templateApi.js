import api from '../../../api/axiosConfig';
import { ADMIN_PUSAT_ENDPOINTS } from '../../../constants/endpoints';

/**
 * Template API service untuk Admin Pusat
 * Handles template management, distribution, and monitoring
 */
export const templateApi = {
  // ==================== HIERARCHY & NAVIGATION ====================
  
  /**
   * Get template structure hierarchy
   * @returns {Promise} - API response with jenjang structure + template counts
   */
  getStruktur: async () => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.STRUKTUR);
  },

  /**
   * Get kelas list per jenjang
   * @param {string} jenjangId - Jenjang ID
   * @returns {Promise} - API response with kelas list + template counts
   */
  getKelas: async (jenjangId) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.KELAS(jenjangId));
  },

  /**
   * Get mata pelajaran list per kelas
   * @param {string} kelasId - Kelas ID
   * @returns {Promise} - API response with mata pelajaran list + template counts
   */
  getMataPelajaran: async (kelasId) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.MATA_PELAJARAN(kelasId));
  },

  /**
   * Get template statistics per mata pelajaran & kelas
   * @param {string} mataPelajaranId - Mata Pelajaran ID
   * @param {string} kelasId - Kelas ID
   * @returns {Promise} - API response with template stats & adoption rates
   */
  getTemplateStats: async (mataPelajaranId, kelasId) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.MATA_PELAJARAN_STATS(mataPelajaranId, kelasId));
  },

  /**
   * Clear template hierarchy cache
   * @returns {Promise} - API response
   */
  clearCache: async () => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.CLEAR_CACHE);
  },

  // ==================== TEMPLATE CRUD ====================

  /**
   * Get template list with filters & pagination
   * @param {Object} params - Query parameters
   * @param {string}Params.mata_pelajaran - Filter by mata pelajaran ID
   * @param {string} params.kelas - Filter by kelas ID
   * @param {string} params.search - Search term
   * @param {string} params.status - Filter by status (active, inactive, all)
   * @param {string} params.kategori - Filter by kategori
   * @returns {Promise} - API response with template list
   */
  getTemplates: async (params = {}) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.LIST, { params });
  },

  /**
   * Get template by mata pelajaran & kelas
   * @param {string} mataPelajaranId - Mata Pelajaran ID
   * @param {string} kelasId - Kelas ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - API response with filtered templates
   */
  getTemplatesByMapel: async (mataPelajaranId, kelasId, params = {}) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.BY_MAPEL(mataPelajaranId, kelasId), { params });
  },

  /**
   * Get template detail by ID
   * @param {string} templateId - Template ID
   * @returns {Promise} - API response with template detail + adoption stats
   */
  getTemplate: async (templateId) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DETAIL(templateId));
  },

  /**
   * Create new template with file upload
   * @param {FormData} formData - Template data including file
   * @returns {Promise} - API response with created template
   */
  createTemplate: async (formData) => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Update template
   * @param {string} templateId - Template ID
   * @param {FormData} formData - Updated template data
   * @returns {Promise} - API response with updated template
   */
  updateTemplate: async (templateId, formData) => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.UPDATE(templateId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete template
   * @param {string} templateId - Template ID
   * @returns {Promise} - API response
   */
  deleteTemplate: async (templateId) => {
    return await api.delete(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DELETE(templateId));
  },

  /**
   * Activate template for distribution
   * @param {string} templateId - Template ID
   * @returns {Promise} - API response
   */
  activateTemplate: async (templateId) => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.ACTIVATE(templateId));
  },

  /**
   * Deactivate template
   * @param {string} templateId - Template ID
   * @returns {Promise} - API response
   */
  deactivateTemplate: async (templateId) => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DEACTIVATE(templateId));
  },

  /**
   * Duplicate existing template
   * @param {string} templateId - Template ID to duplicate
   * @param {Object} duplicateData - Data for the duplicated template
   * @returns {Promise} - API response with new template
   */
  duplicateTemplate: async (templateId, duplicateData) => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DUPLICATE(templateId), duplicateData);
  },

  // ==================== DISTRIBUTION ====================

  /**
   * Get available cabang for distribution
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search cabang name
   * @param {boolean} params.with_stats - Include adoption statistics
   * @returns {Promise} - API response with cabang list
   */
  getAvailableCabang: async (params = {}) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DISTRIBUTION.CABANG_LIST, { params });
  },

  /**
   * Distribute template to selected cabang
   * @param {string} templateId - Template ID
   * @param {Object} distributionData - Distribution settings & selected cabang
   * @returns {Promise} - API response with distribution results
   */
  distributeTemplate: async (templateId, distributionData) => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DISTRIBUTION.DISTRIBUTE(templateId), distributionData);
  },

  /**
   * Bulk distribute multiple templates
   * @param {Object} bulkData - Templates and cabang for bulk distribution
   * @returns {Promise} - API response with bulk distribution results
   */
  bulkDistribute: async (bulkData) => {
    return await api.post(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DISTRIBUTION.BULK_DISTRIBUTE, bulkData);
  },

  /**
   * Get distribution history for a template
   * @param {string} templateId - Template ID
   * @returns {Promise} - API response with distribution history
   */
  getDistributionHistory: async (templateId) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DISTRIBUTION.HISTORY(templateId));
  },

  /**
   * Get distribution summary overview
   * @returns {Promise} - API response with distribution statistics
   */
  getDistributionSummary: async () => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DISTRIBUTION.SUMMARY);
  },

  /**
   * Cancel pending distribution
   * @param {string} adoptionId - Template adoption ID
   * @returns {Promise} - API response
   */
  cancelDistribution: async (adoptionId) => {
    return await api.delete(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.DISTRIBUTION.CANCEL(adoptionId));
  },

  // ==================== MONITORING & ANALYTICS ====================

  /**
   * Get dashboard monitoring statistics
   * @returns {Promise} - API response with dashboard stats
   */
  getDashboardStats: async () => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.MONITORING.DASHBOARD);
  },

  /**
   * Get cabang adoption rates
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} - API response with cabang performance data
   */
  getCabangAdoptionRates: async (params = {}) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.MONITORING.CABANG_ADOPTION, { params });
  },

  /**
   * Get template performance statistics
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} - API response with template performance data
   */
  getTemplatePerformance: async (params = {}) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.MONITORING.TEMPLATE_PERFORMANCE, { params });
  },

  /**
   * Get adoption trends over time
   * @param {Object} params - Query parameters for period filtering
   * @returns {Promise} - API response with trend data
   */
  getAdoptionTrends: async (params = {}) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.MONITORING.ADOPTION_TRENDS, { params });
  },

  /**
   * Get detailed cabang adoption performance
   * @param {string} kacabId - Kacab ID
   * @returns {Promise} - API response with cabang detail performance
   */
  getCabangDetails: async (kacabId) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.MONITORING.CABANG_DETAIL(kacabId));
  },

  /**
   * Get template usage statistics
   * @param {string} templateId - Template ID
   * @returns {Promise} - API response with template usage analytics
   */
  getTemplateUsageStats: async (templateId) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.MONITORING.TEMPLATE_USAGE(templateId));
  },

  /**
   * Export adoption report
   * @param {Object} params - Export parameters
   * @returns {Promise} - API response with report data/file
   */
  exportAdoptionReport: async (params = {}) => {
    return await api.get(ADMIN_PUSAT_ENDPOINTS.TEMPLATE.MONITORING.EXPORT_REPORT, { params });
  }
};

export default templateApi;