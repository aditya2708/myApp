import api from '../../../api/axiosConfig';
import { DONATUR_ENDPOINTS } from '../../../constants/endpoints';

export const donaturMarketplaceApi = {
  getAvailableChildren: async (params = {}) => {
    return await api.get(DONATUR_ENDPOINTS.MARKETPLACE.AVAILABLE_CHILDREN, { params });
  },

  getChildProfile: async (childId) => {
    return await api.get(DONATUR_ENDPOINTS.MARKETPLACE.CHILD_PROFILE(childId));
  },

  sponsorChild: async (childId, sponsorshipData = {}) => {
    return await api.post(DONATUR_ENDPOINTS.MARKETPLACE.SPONSOR_CHILD(childId), sponsorshipData);
  },

  getFilters: async () => {
    return await api.get(DONATUR_ENDPOINTS.MARKETPLACE.FILTERS);
  },

  getFeaturedChildren: async () => {
    return await api.get(DONATUR_ENDPOINTS.MARKETPLACE.FEATURED_CHILDREN);
  }
};