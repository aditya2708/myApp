import { createSlice, createSelector } from '@reduxjs/toolkit';

/**
 * Template Adoption Redux Slice
 * Manages state for template adoption workflow
 */
const templateAdoptionSlice = createSlice({
  name: 'templateAdoption',
  initialState: {
    // Pending adoptions
    pendingAdoptions: [],
    pendingLoading: false,
    pendingError: null,
    
    // Adoption history
    adoptionHistory: [],
    historyLoading: false,
    historyError: null,
    
    // Selected template for preview/action
    selectedTemplate: null,
    
    // Modal states
    showPreviewModal: false,
    showCustomizeModal: false,
    showConfirmationModal: false,
    
    // Form states
    customizationNotes: '',
    adoptionAction: null, // 'adopt', 'customize', 'skip'
    
    // Action loading states
    isAdopting: false,
    isCustomizing: false,
    isSkipping: false,
    
    // Filters and pagination
    filters: {
      status: 'pending',
      mata_pelajaran: null,
      kelas: null,
      search: '',
    },
    
    // Statistics
    stats: {
      total_pending: 0,
      total_adopted: 0,
      total_customized: 0,
      total_skipped: 0,
    },
    
    // UI state
    selectedTab: 'pending', // 'pending', 'history'
    refreshing: false,
  },
  reducers: {
    // Pending adoptions actions
    setPendingAdoptions: (state, action) => {
      state.pendingAdoptions = action.payload;
    },
    setPendingLoading: (state, action) => {
      state.pendingLoading = action.payload;
    },
    setPendingError: (state, action) => {
      state.pendingError = action.payload;
    },
    
    // Adoption history actions
    setAdoptionHistory: (state, action) => {
      state.adoptionHistory = action.payload;
    },
    setHistoryLoading: (state, action) => {
      state.historyLoading = action.payload;
    },
    setHistoryError: (state, action) => {
      state.historyError = action.payload;
    },
    
    // Template selection
    setSelectedTemplate: (state, action) => {
      state.selectedTemplate = action.payload;
    },
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
      state.customizationNotes = '';
      state.adoptionAction = null;
    },
    
    // Modal actions
    setShowPreviewModal: (state, action) => {
      state.showPreviewModal = action.payload;
    },
    setShowCustomizeModal: (state, action) => {
      state.showCustomizeModal = action.payload;
    },
    setShowConfirmationModal: (state, action) => {
      state.showConfirmationModal = action.payload;
    },
    closeAllModals: (state) => {
      state.showPreviewModal = false;
      state.showCustomizeModal = false;
      state.showConfirmationModal = false;
    },
    
    // Form actions
    setCustomizationNotes: (state, action) => {
      state.customizationNotes = action.payload;
    },
    setAdoptionAction: (state, action) => {
      state.adoptionAction = action.payload;
    },
    
    // Action loading states
    setIsAdopting: (state, action) => {
      state.isAdopting = action.payload;
    },
    setIsCustomizing: (state, action) => {
      state.isCustomizing = action.payload;
    },
    setIsSkipping: (state, action) => {
      state.isSkipping = action.payload;
    },
    
    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        status: 'pending',
        mata_pelajaran: null,
        kelas: null,
        search: '',
      };
    },
    
    // Statistics
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    
    // UI state
    setSelectedTab: (state, action) => {
      state.selectedTab = action.payload;
    },
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    
    // Adoption workflow actions
    startAdoptionFlow: (state, action) => {
      const { template, action: adoptionAction } = action.payload;
      state.selectedTemplate = template;
      state.adoptionAction = adoptionAction;
      
      if (adoptionAction === 'customize') {
        state.showCustomizeModal = true;
      } else {
        state.showConfirmationModal = true;
      }
    },
    
    // Optimistic updates
    optimisticAdoptTemplate: (state, action) => {
      const { templateId, adoptionData } = action.payload;
      
      // Remove from pending
      state.pendingAdoptions = state.pendingAdoptions.filter(
        adoption => adoption.id_adoption !== templateId
      );
      
      // Add to history
      state.adoptionHistory.unshift({
        ...adoptionData,
        id_adoption: templateId,
        adopted_at: new Date().toISOString(),
      });
      
      // Update stats
      state.stats.total_pending = Math.max(0, state.stats.total_pending - 1);
      if (adoptionData.status === 'adopted') {
        state.stats.total_adopted += 1;
      } else if (adoptionData.status === 'customized') {
        state.stats.total_customized += 1;
      } else if (adoptionData.status === 'skipped') {
        state.stats.total_skipped += 1;
      }
    },
    
    // Revert optimistic update on error
    revertOptimisticUpdate: (state, action) => {
      // This would require storing the original state
      // For now, we'll trigger a refetch instead
      state.pendingError = 'Adopsi gagal, silakan coba lagi';
    },
    
    // Reset state
    resetState: (state) => {
      return {
        ...state,
        selectedTemplate: null,
        showPreviewModal: false,
        showCustomizeModal: false,
        showConfirmationModal: false,
        customizationNotes: '',
        adoptionAction: null,
        isAdopting: false,
        isCustomizing: false,
        isSkipping: false,
        pendingError: null,
        historyError: null,
      };
    },
  },
});

// Action creators
export const {
  setPendingAdoptions,
  setPendingLoading,
  setPendingError,
  setAdoptionHistory,
  setHistoryLoading,
  setHistoryError,
  setSelectedTemplate,
  clearSelectedTemplate,
  setShowPreviewModal,
  setShowCustomizeModal,
  setShowConfirmationModal,
  closeAllModals,
  setCustomizationNotes,
  setAdoptionAction,
  setIsAdopting,
  setIsCustomizing,
  setIsSkipping,
  setFilters,
  resetFilters,
  setStats,
  setSelectedTab,
  setRefreshing,
  startAdoptionFlow,
  optimisticAdoptTemplate,
  revertOptimisticUpdate,
  resetState,
} = templateAdoptionSlice.actions;

// Selectors
export const selectPendingAdoptions = (state) => state.templateAdoption.pendingAdoptions;
export const selectAdoptionHistory = (state) => state.templateAdoption.adoptionHistory;
export const selectSelectedTemplate = (state) => state.templateAdoption.selectedTemplate;
export const selectAdoptionStats = (state) => state.templateAdoption.stats;
export const selectAdoptionFilters = (state) => state.templateAdoption.filters;
// Memoized selectors to prevent unnecessary re-renders
export const selectAdoptionUI = createSelector(
  [(state) => state.templateAdoption],
  (templateAdoption) => ({
    selectedTab: templateAdoption.selectedTab,
    showPreviewModal: templateAdoption.showPreviewModal,
    showCustomizeModal: templateAdoption.showCustomizeModal,
    showConfirmationModal: templateAdoption.showConfirmationModal,
    refreshing: templateAdoption.refreshing,
  })
);

export const selectAdoptionLoading = createSelector(
  [(state) => state.templateAdoption],
  (templateAdoption) => ({
    pendingLoading: templateAdoption.pendingLoading,
    historyLoading: templateAdoption.historyLoading,
    isAdopting: templateAdoption.isAdopting,
    isCustomizing: templateAdoption.isCustomizing,
    isSkipping: templateAdoption.isSkipping,
  })
);

// Complex selectors with memoization
export const selectFilteredPendingAdoptions = createSelector(
  [
    (state) => state.templateAdoption.pendingAdoptions,
    (state) => state.templateAdoption.filters,
  ],
  (pendingAdoptions, filters) => {
    return pendingAdoptions.filter(adoption => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = adoption.template_materi?.nama_template?.toLowerCase().includes(searchLower);
        const matchesDescription = adoption.template_materi?.deskripsi?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) return false;
      }
      
      // Mata pelajaran filter
      if (filters.mata_pelajaran && adoption.template_materi?.id_mata_pelajaran !== filters.mata_pelajaran) {
        return false;
      }
      
      // Kelas filter
      if (filters.kelas && adoption.template_materi?.id_kelas !== filters.kelas) {
        return false;
      }
      
      return true;
    });
  }
);

export const selectPendingAdoptionsCount = createSelector(
  [(state) => state.templateAdoption.pendingAdoptions],
  (pendingAdoptions) => pendingAdoptions.length
);

export const selectCanAdopt = createSelector(
  [
    (state) => state.templateAdoption.selectedTemplate,
    (state) => state.templateAdoption.isAdopting,
    (state) => state.templateAdoption.isCustomizing,
    (state) => state.templateAdoption.isSkipping,
  ],
  (selectedTemplate, isAdopting, isCustomizing, isSkipping) => {
    return selectedTemplate && !isAdopting && !isCustomizing && !isSkipping;
  }
);

export default templateAdoptionSlice.reducer;