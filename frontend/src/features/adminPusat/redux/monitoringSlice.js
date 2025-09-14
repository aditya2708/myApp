import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { monitoringApi } from '../api/monitoringApi';

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'monitoring/fetchDashboardStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await monitoringApi.getDashboardStats(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCabangPerformance = createAsyncThunk(
  'monitoring/fetchCabangPerformance',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await monitoringApi.getCabangPerformance(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAdoptionTrends = createAsyncThunk(
  'monitoring/fetchAdoptionTrends',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await monitoringApi.getAdoptionTrends(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTemplatePerformance = createAsyncThunk(
  'monitoring/fetchTemplatePerformance',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await monitoringApi.getTemplatePerformance(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCabangDetail = createAsyncThunk(
  'monitoring/fetchCabangDetail',
  async (cabangId, { rejectWithValue }) => {
    try {
      return await monitoringApi.getCabangDetail(cabangId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTemplateUsage = createAsyncThunk(
  'monitoring/fetchTemplateUsage',
  async (templateId, { rejectWithValue }) => {
    try {
      return await monitoringApi.getTemplateUsage(templateId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  // Dashboard statistics
  dashboardStats: {
    total_templates: 0,
    active_templates: 0,
    total_distributions: 0,
    total_adoptions: 0,
    overall_adoption_rate: 0,
    total_cabang: 0,
    active_cabang: 0,
    recent_adoptions: 0,
    pending_adoptions: 0,
    trends: {
      templates: { current: 0, previous: 0, change: 0 },
      distributions: { current: 0, previous: 0, change: 0 },
      adoptions: { current: 0, previous: 0, change: 0 },
      adoption_rate: { current: 0, previous: 0, change: 0 }
    }
  },

  // Cabang performance data
  cabangPerformance: [],
  cabangDetail: null,

  // Adoption trends data
  adoptionTrends: {
    daily: [],
    weekly: [],
    monthly: [],
    by_template: [],
    by_cabang: []
  },

  // Template performance data
  templatePerformance: [],
  templateUsage: null,

  // Filters and settings
  selectedPeriod: 'month', // week, month, quarter, year
  selectedMetric: 'adoption_rate', // adoption_rate, usage_count, performance_score
  
  // UI state
  currentView: 'dashboard', // dashboard, cabang, template, trends
  selectedCabang: null,
  selectedTemplate: null,

  // Pagination
  pagination: {
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1
  },

  // Loading states
  loading: {
    dashboardStats: false,
    cabangPerformance: false,
    cabangDetail: false,
    adoptionTrends: false,
    templatePerformance: false,
    templateUsage: false
  },

  // Error states
  error: {
    dashboardStats: null,
    cabangPerformance: null,
    cabangDetail: null,
    adoptionTrends: null,
    templatePerformance: null,
    templateUsage: null
  },

  // Cache management
  lastUpdated: null,
  cacheExpiry: 5 * 60 * 1000 // 5 minutes
};

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    // Period selection
    setSelectedPeriod: (state, action) => {
      state.selectedPeriod = action.payload;
    },

    // Metric selection
    setSelectedMetric: (state, action) => {
      state.selectedMetric = action.payload;
    },

    // View navigation
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },

    // Selection management
    setSelectedCabang: (state, action) => {
      state.selectedCabang = action.payload;
      if (action.payload === null) {
        state.cabangDetail = null;
      }
    },

    setSelectedTemplate: (state, action) => {
      state.selectedTemplate = action.payload;
      if (action.payload === null) {
        state.templateUsage = null;
      }
    },

    // Cache management
    updateLastUpdated: (state) => {
      state.lastUpdated = Date.now();
    },

    shouldRefreshCache: (state) => {
      if (!state.lastUpdated) return true;
      return Date.now() - state.lastUpdated > state.cacheExpiry;
    },

    // Clear data
    clearCabangDetail: (state) => {
      state.cabangDetail = null;
      state.selectedCabang = null;
    },

    clearTemplateUsage: (state) => {
      state.templateUsage = null;
      state.selectedTemplate = null;
    },

    // Error management
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
    resetMonitoringState: (state) => {
      return { ...initialState };
    }
  },

  extraReducers: (builder) => {
    // Fetch Dashboard Stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.dashboardStats = true;
        state.error.dashboardStats = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.dashboardStats = false;
        state.dashboardStats = { ...state.dashboardStats, ...action.payload };
        state.lastUpdated = Date.now();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.dashboardStats = false;
        state.error.dashboardStats = action.payload;
      });

    // Fetch Cabang Performance
    builder
      .addCase(fetchCabangPerformance.pending, (state) => {
        state.loading.cabangPerformance = true;
        state.error.cabangPerformance = null;
      })
      .addCase(fetchCabangPerformance.fulfilled, (state, action) => {
        state.loading.cabangPerformance = false;
        state.cabangPerformance = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchCabangPerformance.rejected, (state, action) => {
        state.loading.cabangPerformance = false;
        state.error.cabangPerformance = action.payload;
      });

    // Fetch Cabang Detail
    builder
      .addCase(fetchCabangDetail.pending, (state) => {
        state.loading.cabangDetail = true;
        state.error.cabangDetail = null;
      })
      .addCase(fetchCabangDetail.fulfilled, (state, action) => {
        state.loading.cabangDetail = false;
        state.cabangDetail = action.payload;
      })
      .addCase(fetchCabangDetail.rejected, (state, action) => {
        state.loading.cabangDetail = false;
        state.error.cabangDetail = action.payload;
      });

    // Fetch Adoption Trends
    builder
      .addCase(fetchAdoptionTrends.pending, (state) => {
        state.loading.adoptionTrends = true;
        state.error.adoptionTrends = null;
      })
      .addCase(fetchAdoptionTrends.fulfilled, (state, action) => {
        state.loading.adoptionTrends = false;
        state.adoptionTrends = { ...state.adoptionTrends, ...action.payload };
      })
      .addCase(fetchAdoptionTrends.rejected, (state, action) => {
        state.loading.adoptionTrends = false;
        state.error.adoptionTrends = action.payload;
      });

    // Fetch Template Performance
    builder
      .addCase(fetchTemplatePerformance.pending, (state) => {
        state.loading.templatePerformance = true;
        state.error.templatePerformance = null;
      })
      .addCase(fetchTemplatePerformance.fulfilled, (state, action) => {
        state.loading.templatePerformance = false;
        state.templatePerformance = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchTemplatePerformance.rejected, (state, action) => {
        state.loading.templatePerformance = false;
        state.error.templatePerformance = action.payload;
      });

    // Fetch Template Usage
    builder
      .addCase(fetchTemplateUsage.pending, (state) => {
        state.loading.templateUsage = true;
        state.error.templateUsage = null;
      })
      .addCase(fetchTemplateUsage.fulfilled, (state, action) => {
        state.loading.templateUsage = false;
        state.templateUsage = action.payload;
      })
      .addCase(fetchTemplateUsage.rejected, (state, action) => {
        state.loading.templateUsage = false;
        state.error.templateUsage = action.payload;
      });
  }
});

export const {
  setSelectedPeriod,
  setSelectedMetric,
  setCurrentView,
  setSelectedCabang,
  setSelectedTemplate,
  updateLastUpdated,
  shouldRefreshCache,
  clearCabangDetail,
  clearTemplateUsage,
  clearError,
  clearAllErrors,
  resetMonitoringState
} = monitoringSlice.actions;

// Selectors
export const selectDashboardStats = (state) => state.monitoring.dashboardStats;
export const selectCabangPerformance = (state) => state.monitoring.cabangPerformance;
export const selectCabangDetail = (state) => state.monitoring.cabangDetail;
export const selectAdoptionTrends = (state) => state.monitoring.adoptionTrends;
export const selectTemplatePerformance = (state) => state.monitoring.templatePerformance;
export const selectTemplateUsage = (state) => state.monitoring.templateUsage;
export const selectSelectedPeriod = (state) => state.monitoring.selectedPeriod;
export const selectSelectedMetric = (state) => state.monitoring.selectedMetric;
export const selectCurrentView = (state) => state.monitoring.currentView;
export const selectSelectedCabang = (state) => state.monitoring.selectedCabang;
export const selectSelectedTemplate = (state) => state.monitoring.selectedTemplate;
export const selectMonitoringLoading = (state) => state.monitoring.loading;
export const selectMonitoringError = (state) => state.monitoring.error;
export const selectMonitoringPagination = (state) => state.monitoring.pagination;

// Computed selectors
export const selectTopPerformingCabang = (state) => {
  return state.monitoring.cabangPerformance
    .slice()
    .sort((a, b) => (b.adoption_rate || 0) - (a.adoption_rate || 0))
    .slice(0, 5);
};

export const selectTopPerformingTemplates = (state) => {
  return state.monitoring.templatePerformance
    .slice()
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 5);
};

export const selectRecentTrends = (state) => {
  const trends = state.monitoring.dashboardStats.trends;
  return {
    templates: {
      value: trends.templates.current,
      change: trends.templates.change,
      isPositive: trends.templates.change >= 0
    },
    distributions: {
      value: trends.distributions.current,
      change: trends.distributions.change,
      isPositive: trends.distributions.change >= 0
    },
    adoptions: {
      value: trends.adoptions.current,
      change: trends.adoptions.change,
      isPositive: trends.adoptions.change >= 0
    },
    adoption_rate: {
      value: trends.adoption_rate.current,
      change: trends.adoption_rate.change,
      isPositive: trends.adoption_rate.change >= 0
    }
  };
};

export const selectShouldRefreshData = (state) => {
  if (!state.monitoring.lastUpdated) return true;
  return Date.now() - state.monitoring.lastUpdated > state.monitoring.cacheExpiry;
};

export default monitoringSlice.reducer;