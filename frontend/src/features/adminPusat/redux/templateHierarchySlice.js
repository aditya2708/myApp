import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { templateApi } from '../api/templateApi';

// ==================== ASYNC THUNKS ====================

/**
 * Fetch template structure hierarchy
 */
export const fetchTemplateStruktur = createAsyncThunk(
  'templateHierarchy/fetchStruktur',
  async (_, { rejectWithValue }) => {
    try {
      const response = await templateApi.getStruktur();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch struktur');
    }
  }
);

/**
 * Fetch kelas list for a jenjang
 */
export const fetchKelas = createAsyncThunk(
  'templateHierarchy/fetchKelas',
  async (jenjangId, { rejectWithValue }) => {
    try {
      const response = await templateApi.getKelas(jenjangId);
      return { jenjangId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch kelas');
    }
  }
);

/**
 * Fetch mata pelajaran list for a kelas
 */
export const fetchMataPelajaran = createAsyncThunk(
  'templateHierarchy/fetchMataPelajaran',
  async ({ kelasId, jenjangId }, { rejectWithValue }) => {
    try {
      const response = await templateApi.getMataPelajaran(kelasId);
      return { kelasId, jenjangId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch mata pelajaran');
    }
  }
);

/**
 * Fetch template statistics for mata pelajaran & kelas
 */
export const fetchTemplateStats = createAsyncThunk(
  'templateHierarchy/fetchTemplateStats',
  async ({ mataPelajaranId, kelasId }, { rejectWithValue }) => {
    try {
      const response = await templateApi.getTemplateStats(mataPelajaranId, kelasId);
      return { mataPelajaranId, kelasId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch template stats');
    }
  }
);

/**
 * Clear hierarchy cache
 */
export const clearHierarchyCache = createAsyncThunk(
  'templateHierarchy/clearCache',
  async (_, { rejectWithValue }) => {
    try {
      const response = await templateApi.clearCache();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cache');
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Hierarchy data
  struktur: [],
  kelasList: {},
  mataPelajaranList: {},
  templateStats: {},
  
  // Navigation state
  currentPath: {
    jenjang: null,
    kelas: null,
    mataPelajaran: null
  },
  breadcrumb: [],
  
  // Loading states
  loading: {
    struktur: false,
    kelas: false,
    mataPelajaran: false,
    stats: false,
    cache: false
  },
  
  // Error states
  error: {
    struktur: null,
    kelas: null,
    mataPelajaran: null,
    stats: null,
    cache: null
  },
  
  // Cache management
  cacheTimestamp: null,
  cacheExpired: false
};

// ==================== SLICE ====================

const templateHierarchySlice = createSlice({
  name: 'templateHierarchy',
  initialState,
  reducers: {
    // Navigation actions
    setCurrentPath: (state, action) => {
      const { jenjang, kelas, mataPelajaran } = action.payload;
      state.currentPath = { jenjang, kelas, mataPelajaran };
      
      // Update breadcrumb
      state.breadcrumb = [];
      if (jenjang) {
        const jenjangData = state.struktur.find(j => j.id_jenjang === jenjang);
        if (jenjangData) {
          state.breadcrumb.push({
            type: 'jenjang',
            id: jenjang,
            name: jenjangData.nama_jenjang,
            level: 0
          });
        }
      }
      if (kelas && jenjang) {
        const kelasData = state.kelasList[jenjang]?.find(k => k.id_kelas === kelas);
        if (kelasData) {
          state.breadcrumb.push({
            type: 'kelas',
            id: kelas,
            name: kelasData.nama_kelas,
            level: 1
          });
        }
      }
      if (mataPelajaran && kelas) {
        const mapelData = state.mataPelajaranList[kelas]?.find(m => m.id_mata_pelajaran === mataPelajaran);
        if (mapelData) {
          state.breadcrumb.push({
            type: 'mataPelajaran',
            id: mataPelajaran,
            name: mapelData.nama_mata_pelajaran,
            level: 2
          });
        }
      }
    },
    
    // Navigation helpers
    navigateToJenjang: (state, action) => {
      const jenjangId = action.payload;
      state.currentPath = {
        jenjang: jenjangId,
        kelas: null,
        mataPelajaran: null
      };
    },
    
    navigateToKelas: (state, action) => {
      const { jenjangId, kelasId } = action.payload;
      state.currentPath = {
        jenjang: jenjangId,
        kelas: kelasId,
        mataPelajaran: null
      };
    },
    
    navigateToMataPelajaran: (state, action) => {
      const { jenjangId, kelasId, mataPelajaranId } = action.payload;
      state.currentPath = {
        jenjang: jenjangId,
        kelas: kelasId,
        mataPelajaran: mataPelajaranId
      };
    },
    
    // Reset navigation
    resetNavigation: (state) => {
      state.currentPath = {
        jenjang: null,
        kelas: null,
        mataPelajaran: null
      };
      state.breadcrumb = [];
    },
    
    // Clear specific errors
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state.error[errorType]) {
        state.error[errorType] = null;
      }
    },
    
    // Clear all errors
    clearAllErrors: (state) => {
      Object.keys(state.error).forEach(key => {
        state.error[key] = null;
      });
    },
    
    // Cache management
    setCacheExpired: (state, action) => {
      state.cacheExpired = action.payload;
    },
    
    // Reset state
    resetHierarchyState: (state) => {
      return { ...initialState };
    }
  },
  
  extraReducers: (builder) => {
    builder
      // ==================== FETCH STRUKTUR ====================
      .addCase(fetchTemplateStruktur.pending, (state) => {
        state.loading.struktur = true;
        state.error.struktur = null;
      })
      .addCase(fetchTemplateStruktur.fulfilled, (state, action) => {
        state.loading.struktur = false;
        state.struktur = action.payload.jenjang || [];
        state.cacheTimestamp = Date.now();
        state.cacheExpired = false;
      })
      .addCase(fetchTemplateStruktur.rejected, (state, action) => {
        state.loading.struktur = false;
        state.error.struktur = action.payload;
      })
      
      // ==================== FETCH KELAS ====================
      .addCase(fetchKelas.pending, (state) => {
        state.loading.kelas = true;
        state.error.kelas = null;
      })
      .addCase(fetchKelas.fulfilled, (state, action) => {
        state.loading.kelas = false;
        const { jenjangId, data } = action.payload;
        state.kelasList[jenjangId] = data.kelas || [];
      })
      .addCase(fetchKelas.rejected, (state, action) => {
        state.loading.kelas = false;
        state.error.kelas = action.payload;
      })
      
      // ==================== FETCH MATA PELAJARAN ====================
      .addCase(fetchMataPelajaran.pending, (state) => {
        state.loading.mataPelajaran = true;
        state.error.mataPelajaran = null;
      })
      .addCase(fetchMataPelajaran.fulfilled, (state, action) => {
        state.loading.mataPelajaran = false;
        const { kelasId, data } = action.payload;
        state.mataPelajaranList[kelasId] = data.mata_pelajaran || [];
      })
      .addCase(fetchMataPelajaran.rejected, (state, action) => {
        state.loading.mataPelajaran = false;
        state.error.mataPelajaran = action.payload;
      })
      
      // ==================== FETCH TEMPLATE STATS ====================
      .addCase(fetchTemplateStats.pending, (state) => {
        state.loading.stats = true;
        state.error.stats = null;
      })
      .addCase(fetchTemplateStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        const { mataPelajaranId, kelasId, data } = action.payload;
        const key = `${mataPelajaranId}_${kelasId}`;
        state.templateStats[key] = data;
      })
      .addCase(fetchTemplateStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error.stats = action.payload;
      })
      
      // ==================== CLEAR CACHE ====================
      .addCase(clearHierarchyCache.pending, (state) => {
        state.loading.cache = true;
        state.error.cache = null;
      })
      .addCase(clearHierarchyCache.fulfilled, (state) => {
        state.loading.cache = false;
        // Clear all cached data to force refetch
        state.struktur = [];
        state.kelasList = {};
        state.mataPelajaranList = {};
        state.templateStats = {};
        state.cacheTimestamp = null;
        state.cacheExpired = true;
      })
      .addCase(clearHierarchyCache.rejected, (state, action) => {
        state.loading.cache = false;
        state.error.cache = action.payload;
      });
  }
});

// ==================== ACTIONS & SELECTORS ====================

export const {
  setCurrentPath,
  navigateToJenjang,
  navigateToKelas,
  navigateToMataPelajaran,
  resetNavigation,
  clearError,
  clearAllErrors,
  setCacheExpired,
  resetHierarchyState
} = templateHierarchySlice.actions;

// Selectors
export const selectHierarchyStruktur = (state) => state.templateHierarchy.struktur;
export const selectKelasList = (state, jenjangId) => state.templateHierarchy.kelasList[jenjangId] || [];
export const selectMataPelajaranList = (state, kelasId) => state.templateHierarchy.mataPelajaranList[kelasId] || [];
export const selectTemplateStats = (state, mataPelajaranId, kelasId) => {
  const key = `${mataPelajaranId}_${kelasId}`;
  return state.templateHierarchy.templateStats[key] || null;
};
export const selectCurrentPath = (state) => state.templateHierarchy.currentPath;
export const selectBreadcrumb = (state) => state.templateHierarchy.breadcrumb;
export const selectHierarchyLoading = (state) => state.templateHierarchy.loading;
export const selectHierarchyError = (state) => state.templateHierarchy.error;
export const selectCacheStatus = (state) => ({
  timestamp: state.templateHierarchy.cacheTimestamp,
  expired: state.templateHierarchy.cacheExpired
});

export default templateHierarchySlice.reducer;