import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { distributionApi } from '../api/distributionApi';

// Async thunks
export const fetchCabangList = createAsyncThunk(
  'distribution/fetchCabangList',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await distributionApi.getCabangList(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const distributeTemplate = createAsyncThunk(
  'distribution/distributeTemplate',
  async ({ templateId, distributionData }, { rejectWithValue }) => {
    try {
      return await distributionApi.distributeTemplate(templateId, distributionData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const bulkDistributeTemplates = createAsyncThunk(
  'distribution/bulkDistributeTemplates',
  async ({ templateIds, distributionData }, { rejectWithValue }) => {
    try {
      return await distributionApi.bulkDistributeTemplates(templateIds, distributionData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchDistributionHistory = createAsyncThunk(
  'distribution/fetchDistributionHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await distributionApi.getDistributionHistory(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTemplateDistributionStatus = createAsyncThunk(
  'distribution/fetchTemplateDistributionStatus',
  async (templateId, { rejectWithValue }) => {
    try {
      return await distributionApi.getTemplateDistributionStatus(templateId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const revokeDistribution = createAsyncThunk(
  'distribution/revokeDistribution',
  async ({ templateId, cabangIds }, { rejectWithValue }) => {
    try {
      return await distributionApi.revokeDistribution(templateId, cabangIds);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateDistributionSettings = createAsyncThunk(
  'distribution/updateDistributionSettings',
  async ({ templateId, settings }, { rejectWithValue }) => {
    try {
      return await distributionApi.updateDistributionSettings(templateId, settings);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchDistributionStats = createAsyncThunk(
  'distribution/fetchDistributionStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await distributionApi.getDistributionStats(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  // Cabang data
  cabangList: [],
  selectedCabang: [],
  cabangFilters: {
    search: '',
    region: '',
    status: 'active',
    adoption_rate: '',
  },
  
  // Distribution data
  distributionHistory: [],
  templateDistributionStatus: {},
  distributionStats: {
    total_distributions: 0,
    active_distributions: 0,
    total_cabang: 0,
    avg_adoption_rate: 0,
    recent_distributions: []
  },
  
  // Distribution settings
  distributionSettings: {
    auto_notify: true,
    require_feedback: false,
    expiry_days: null,
    priority: 'normal',
    notes: ''
  },
  
  // Progress tracking
  distributionProgress: {},
  
  // Pagination
  pagination: {
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1
  },
  
  // Loading states
  loading: {
    cabangList: false,
    distribute: false,
    bulkDistribute: false,
    history: false,
    status: false,
    revoke: false,
    updateSettings: false,
    stats: false
  },
  
  // Error states
  error: {
    cabangList: null,
    distribute: null,
    bulkDistribute: null,
    history: null,
    status: null,
    revoke: null,
    updateSettings: null,
    stats: null
  },
  
  // UI states
  selectionMode: false,
  currentDistribution: null,
  showDistributionModal: false,
  
  // Filters & Search
  historyFilters: {
    search: '',
    template: '',
    cabang: '',
    status: 'all',
    date_range: ''
  }
};

const distributionSlice = createSlice({
  name: 'distribution',
  initialState,
  reducers: {
    // Cabang selection
    setCabangSelection: (state, action) => {
      state.selectedCabang = action.payload;
    },
    
    addCabangSelection: (state, action) => {
      const cabangId = action.payload;
      if (!state.selectedCabang.includes(cabangId)) {
        state.selectedCabang.push(cabangId);
      }
    },
    
    removeCabangSelection: (state, action) => {
      state.selectedCabang = state.selectedCabang.filter(id => id !== action.payload);
    },
    
    selectAllCabang: (state) => {
      state.selectedCabang = state.cabangList.map(cabang => cabang.id_cabang);
    },
    
    deselectAllCabang: (state) => {
      state.selectedCabang = [];
    },
    
    // Distribution settings
    setDistributionSettings: (state, action) => {
      state.distributionSettings = { ...state.distributionSettings, ...action.payload };
    },
    
    resetDistributionSettings: (state) => {
      state.distributionSettings = initialState.distributionSettings;
    },
    
    // Progress tracking
    setDistributionProgress: (state, action) => {
      const { templateId, progress } = action.payload;
      state.distributionProgress[templateId] = progress;
    },
    
    clearDistributionProgress: (state, action) => {
      const templateId = action.payload;
      delete state.distributionProgress[templateId];
    },
    
    // Filters
    setCabangFilters: (state, action) => {
      state.cabangFilters = { ...state.cabangFilters, ...action.payload };
    },
    
    setHistoryFilters: (state, action) => {
      state.historyFilters = { ...state.historyFilters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.cabangFilters = initialState.cabangFilters;
      state.historyFilters = initialState.historyFilters;
    },
    
    // UI state
    setSelectionMode: (state, action) => {
      state.selectionMode = action.payload;
      if (!action.payload) {
        state.selectedCabang = [];
      }
    },
    
    toggleSelectionMode: (state) => {
      state.selectionMode = !state.selectionMode;
      if (!state.selectionMode) {
        state.selectedCabang = [];
      }
    },
    
    setCurrentDistribution: (state, action) => {
      state.currentDistribution = action.payload;
    },
    
    setShowDistributionModal: (state, action) => {
      state.showDistributionModal = action.payload;
    },
    
    // Clear errors
    clearError: (state, action) => {
      const errorType = action.payload;
      if (errorType && state.error[errorType]) {
        state.error[errorType] = null;
      }
    },
    
    clearAllErrors: (state) => {
      Object.keys(state.error).forEach(key => {
        state.error[key] = null;
      });
    },
    
    // Reset state
    resetDistributionState: (state) => {
      return { ...initialState };
    }
  },
  
  extraReducers: (builder) => {
    // Fetch Cabang List
    builder
      .addCase(fetchCabangList.pending, (state) => {
        state.loading.cabangList = true;
        state.error.cabangList = null;
      })
      .addCase(fetchCabangList.fulfilled, (state, action) => {
        state.loading.cabangList = false;
        state.cabangList = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchCabangList.rejected, (state, action) => {
        state.loading.cabangList = false;
        state.error.cabangList = action.payload;
      });
    
    // Distribute Template
    builder
      .addCase(distributeTemplate.pending, (state) => {
        state.loading.distribute = true;
        state.error.distribute = null;
      })
      .addCase(distributeTemplate.fulfilled, (state, action) => {
        state.loading.distribute = false;
        
        // Update distribution history
        if (action.payload.distribution) {
          state.distributionHistory.unshift(action.payload.distribution);
        }
        
        // Update stats
        if (action.payload.stats) {
          state.distributionStats = { ...state.distributionStats, ...action.payload.stats };
        }
        
        // Clear progress
        if (action.meta.arg.templateId) {
          delete state.distributionProgress[action.meta.arg.templateId];
        }
      })
      .addCase(distributeTemplate.rejected, (state, action) => {
        state.loading.distribute = false;
        state.error.distribute = action.payload;
        
        // Clear progress on error
        if (action.meta.arg.templateId) {
          delete state.distributionProgress[action.meta.arg.templateId];
        }
      });
    
    // Bulk Distribute Templates
    builder
      .addCase(bulkDistributeTemplates.pending, (state) => {
        state.loading.bulkDistribute = true;
        state.error.bulkDistribute = null;
      })
      .addCase(bulkDistributeTemplates.fulfilled, (state, action) => {
        state.loading.bulkDistribute = false;
        
        // Update distribution history with bulk distributions
        if (action.payload.distributions) {
          state.distributionHistory = [
            ...action.payload.distributions,
            ...state.distributionHistory
          ];
        }
        
        // Update stats
        if (action.payload.stats) {
          state.distributionStats = { ...state.distributionStats, ...action.payload.stats };
        }
        
        // Clear progress for all templates
        action.meta.arg.templateIds.forEach(templateId => {
          delete state.distributionProgress[templateId];
        });
      })
      .addCase(bulkDistributeTemplates.rejected, (state, action) => {
        state.loading.bulkDistribute = false;
        state.error.bulkDistribute = action.payload;
        
        // Clear progress on error
        action.meta.arg.templateIds.forEach(templateId => {
          delete state.distributionProgress[templateId];
        });
      });
    
    // Fetch Distribution History
    builder
      .addCase(fetchDistributionHistory.pending, (state) => {
        state.loading.history = true;
        state.error.history = null;
      })
      .addCase(fetchDistributionHistory.fulfilled, (state, action) => {
        state.loading.history = false;
        state.distributionHistory = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchDistributionHistory.rejected, (state, action) => {
        state.loading.history = false;
        state.error.history = action.payload;
      });
    
    // Fetch Template Distribution Status
    builder
      .addCase(fetchTemplateDistributionStatus.pending, (state) => {
        state.loading.status = true;
        state.error.status = null;
      })
      .addCase(fetchTemplateDistributionStatus.fulfilled, (state, action) => {
        state.loading.status = false;
        const templateId = action.meta.arg;
        state.templateDistributionStatus[templateId] = action.payload;
      })
      .addCase(fetchTemplateDistributionStatus.rejected, (state, action) => {
        state.loading.status = false;
        state.error.status = action.payload;
      });
    
    // Revoke Distribution
    builder
      .addCase(revokeDistribution.pending, (state) => {
        state.loading.revoke = true;
        state.error.revoke = null;
      })
      .addCase(revokeDistribution.fulfilled, (state, action) => {
        state.loading.revoke = false;
        
        // Update distribution status for the template
        const templateId = action.meta.arg.templateId;
        if (state.templateDistributionStatus[templateId]) {
          const revokedCabangIds = action.meta.arg.cabangIds;
          state.templateDistributionStatus[templateId].cabang = 
            state.templateDistributionStatus[templateId].cabang.filter(
              cabang => !revokedCabangIds.includes(cabang.id_cabang)
            );
        }
        
        // Update stats
        if (action.payload.stats) {
          state.distributionStats = { ...state.distributionStats, ...action.payload.stats };
        }
      })
      .addCase(revokeDistribution.rejected, (state, action) => {
        state.loading.revoke = false;
        state.error.revoke = action.payload;
      });
    
    // Update Distribution Settings
    builder
      .addCase(updateDistributionSettings.pending, (state) => {
        state.loading.updateSettings = true;
        state.error.updateSettings = null;
      })
      .addCase(updateDistributionSettings.fulfilled, (state, action) => {
        state.loading.updateSettings = false;
        
        // Update settings in current distribution if available
        if (state.currentDistribution) {
          state.currentDistribution.settings = action.payload.settings;
        }
      })
      .addCase(updateDistributionSettings.rejected, (state, action) => {
        state.loading.updateSettings = false;
        state.error.updateSettings = action.payload;
      });
    
    // Fetch Distribution Stats
    builder
      .addCase(fetchDistributionStats.pending, (state) => {
        state.loading.stats = true;
        state.error.stats = null;
      })
      .addCase(fetchDistributionStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.distributionStats = { ...state.distributionStats, ...action.payload };
      })
      .addCase(fetchDistributionStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error.stats = action.payload;
      });
  }
});

export const {
  setCabangSelection,
  addCabangSelection,
  removeCabangSelection,
  selectAllCabang,
  deselectAllCabang,
  setDistributionSettings,
  resetDistributionSettings,
  setDistributionProgress,
  clearDistributionProgress,
  setCabangFilters,
  setHistoryFilters,
  resetFilters,
  setSelectionMode,
  toggleSelectionMode,
  setCurrentDistribution,
  setShowDistributionModal,
  clearError,
  clearAllErrors,
  resetDistributionState
} = distributionSlice.actions;

// Selectors
export const selectCabangList = (state) => state.distribution.cabangList;
export const selectSelectedCabang = (state) => state.distribution.selectedCabang;
export const selectCabangFilters = (state) => state.distribution.cabangFilters;
export const selectDistributionHistory = (state) => state.distribution.distributionHistory;
export const selectTemplateDistributionStatus = (state, templateId) => 
  state.distribution.templateDistributionStatus[templateId];
export const selectDistributionStats = (state) => state.distribution.distributionStats;
export const selectDistributionSettings = (state) => state.distribution.distributionSettings;
export const selectDistributionProgress = (state, templateId) => 
  state.distribution.distributionProgress[templateId];
export const selectDistributionLoading = (state) => state.distribution.loading;
export const selectDistributionError = (state) => state.distribution.error;
export const selectDistributionPagination = (state) => state.distribution.pagination;
export const selectDistributionSelectionMode = (state) => state.distribution.selectionMode;
export const selectCurrentDistribution = (state) => state.distribution.currentDistribution;
export const selectShowDistributionModal = (state) => state.distribution.showDistributionModal;
export const selectHistoryFilters = (state) => state.distribution.historyFilters;

// Computed selectors
export const selectFilteredCabangList = (state) => {
  const cabangList = selectCabangList(state);
  const filters = selectCabangFilters(state);
  
  return cabangList.filter(cabang => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        cabang.nama_cabang.toLowerCase().includes(searchLower) ||
        cabang.kode_cabang.toLowerCase().includes(searchLower) ||
        (cabang.alamat && cabang.alamat.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Region filter
    if (filters.region && cabang.region !== filters.region) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && cabang.status !== filters.status) {
      return false;
    }
    
    // Adoption rate filter
    if (filters.adoption_rate) {
      const rate = cabang.adoption_rate || 0;
      switch (filters.adoption_rate) {
        case 'high':
          return rate >= 80;
        case 'medium':
          return rate >= 50 && rate < 80;
        case 'low':
          return rate < 50;
        default:
          return true;
      }
    }
    
    return true;
  });
};

export const selectDistributionSummary = (state) => {
  const selectedCabang = selectSelectedCabang(state);
  const cabangList = selectCabangList(state);
  
  const selectedCabangDetails = cabangList.filter(cabang => 
    selectedCabang.includes(cabang.id_cabang)
  );
  
  return {
    total_selected: selectedCabang.length,
    selected_cabang: selectedCabangDetails,
    estimated_reach: selectedCabangDetails.reduce((sum, cabang) => 
      sum + (cabang.total_users || 0), 0
    ),
    avg_adoption_rate: selectedCabangDetails.length > 0 
      ? Math.round(
          selectedCabangDetails.reduce((sum, cabang) => 
            sum + (cabang.adoption_rate || 0), 0
          ) / selectedCabangDetails.length
        )
      : 0
  };
};

export default distributionSlice.reducer;