import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { shelterOperationsApi } from '../api/shelterOperationsApi';

// Async thunks for kurikulum consumer operations

// Get all materi from cabang (SIMPLIFIED approach)
export const getAllMateri = createAsyncThunk(
  'kurikulumConsumer/getAllMateri',
  async (_, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.getAllMateri();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get all materi'
      );
    }
  }
);

// Get kurikulum detail for preview
export const getKurikulumDetail = createAsyncThunk(
  'kurikulumConsumer/getKurikulumDetail',
  async (kurikulumId, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.getKurikulumDetail(kurikulumId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get kurikulum detail'
      );
    }
  }
);

// Apply kurikulum to kelompok
export const applyKurikulumToKelompok = createAsyncThunk(
  'kurikulumConsumer/applyKurikulumToKelompok',
  async ({ kurikulumId, kelompokId, semesterId }, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.applyKurikulumToKelompok({
        kurikulumId,
        kelompokId,
        semesterId
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to apply kurikulum to kelompok'
      );
    }
  }
);

// Get applied kurikulum for kelompok
export const getKelompokKurikulum = createAsyncThunk(
  'kurikulumConsumer/getKelompokKurikulum',
  async (kelompokId, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.getKelompokKurikulum(kelompokId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get kelompok kurikulum'
      );
    }
  }
);

// Get materi compatibility for kelas gabungan
export const getMateriCompatibility = createAsyncThunk(
  'kurikulumConsumer/getMateriCompatibility',
  async (kelasGabungan, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.getMateriCompatibility({
        kelas_gabungan: kelasGabungan
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get materi compatibility'
      );
    }
  }
);

// Get shelter semester info
export const getSemesterInfo = createAsyncThunk(
  'kurikulumConsumer/getSemesterInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.getSemesterInfo();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get semester info'
      );
    }
  }
);

// Search kurikulum with advanced filters
export const searchKurikulum = createAsyncThunk(
  'kurikulumConsumer/searchKurikulum',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.searchKurikulum(searchParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to search kurikulum'
      );
    }
  }
);

// Get kurikulum suggestions based on kelompok profile
export const getKurikulumSuggestions = createAsyncThunk(
  'kurikulumConsumer/getKurikulumSuggestions',
  async (kelompokId, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.getKurikulumSuggestions(kelompokId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get kurikulum suggestions'
      );
    }
  }
);

const initialState = {
  // Browse kurikulum state
  kurikulumList: [],
  kurikulumPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasMore: false
  },
  browseLoading: false,
  browseError: null,
  
  // Current kurikulum detail
  currentKurikulum: null,
  kurikulumDetail: null,
  detailLoading: false,
  detailError: null,
  
  // Applied kurikulum for kelompok
  kelompokKurikulum: {},
  kelompokKurikulumLoading: {},
  kelompokKurikulumError: {},
  
  // Materi compatibility data
  materiCompatibility: {},
  compatibilityLoading: false,
  compatibilityError: null,
  
  // Semester information
  semesterInfo: null,
  semesterLoading: false,
  semesterError: null,
  
  // Search state
  searchResults: [],
  searchLoading: false,
  searchError: null,
  lastSearchQuery: null,
  
  // Suggestions
  suggestions: [],
  suggestionsLoading: false,
  suggestionsError: null,
  
  // Apply kurikulum state
  applyLoading: false,
  applyError: null,
  applySuccess: false,
  
  // Filter state (for UI)
  activeFilters: {
    jenjang: '',
    semester: '',
    kelasGabungan: [],
    searchQuery: ''
  },
  
  // Cache for performance
  kurikulumCache: {},
  cacheTimestamps: {}
};

const kurikulumConsumerSlice = createSlice({
  name: 'kurikulumConsumer',
  initialState,
  reducers: {
    // Clear errors
    clearBrowseError: (state) => {
      state.browseError = null;
    },
    clearDetailError: (state) => {
      state.detailError = null;
    },
    clearApplyError: (state) => {
      state.applyError = null;
    },
    clearSearchError: (state) => {
      state.searchError = null;
    },
    
    // Reset apply state
    resetApplyState: (state) => {
      state.applyLoading = false;
      state.applyError = null;
      state.applySuccess = false;
    },
    
    // Update active filters
    setActiveFilters: (state, action) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload };
    },
    
    // Clear filters
    clearFilters: (state) => {
      state.activeFilters = initialState.activeFilters;
    },
    
    // Update kurikulum list (for manual updates)
    updateKurikulumList: (state, action) => {
      const { kurikulumId, updates } = action.payload;
      const index = state.kurikulumList.findIndex(k => k.id_kurikulum === kurikulumId);
      if (index !== -1) {
        state.kurikulumList[index] = { ...state.kurikulumList[index], ...updates };
      }
    },
    
    // Cache kurikulum detail
    cacheKurikulumDetail: (state, action) => {
      const { kurikulumId, detail } = action.payload;
      state.kurikulumCache[kurikulumId] = detail;
      state.cacheTimestamps[kurikulumId] = Date.now();
    },
    
    // Clear cache
    clearKurikulumCache: (state) => {
      state.kurikulumCache = {};
      state.cacheTimestamps = {};
    },
    
    // Set current kurikulum for preview
    setCurrentKurikulum: (state, action) => {
      state.currentKurikulum = action.payload;
    },
    
    // Add to kurikulum list (for infinite scroll)
    appendKurikulumList: (state, action) => {
      const { data, pagination } = action.payload;
      state.kurikulumList = [...state.kurikulumList, ...data];
      state.kurikulumPagination = pagination;
    },
    
    // Reset kurikulum list
    resetKurikulumList: (state) => {
      state.kurikulumList = [];
      state.kurikulumPagination = initialState.kurikulumPagination;
    }
  },
  extraReducers: (builder) => {
    // Get all materi (simplified)
    builder
      .addCase(getAllMateri.pending, (state) => {
        state.browseLoading = true;
        state.browseError = null;
      })
      .addCase(getAllMateri.fulfilled, (state, action) => {
        state.browseLoading = false;
        // Backend returns: { success, message, materi, total, kacab }
        state.kurikulumList = action.payload.materi || [];
        state.kurikulumPagination = {
          currentPage: 1,
          totalPages: 1,
          totalItems: action.payload.total || 0,
          hasMore: false
        };
      })
      .addCase(getAllMateri.rejected, (state, action) => {
        state.browseLoading = false;
        state.browseError = action.payload;
      });
    
    // Get kurikulum detail
    builder
      .addCase(getKurikulumDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(getKurikulumDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.kurikulumDetail = action.payload.data;
        
        // Cache the detail
        if (action.payload.data) {
          state.kurikulumCache[action.payload.data.id_kurikulum] = action.payload.data;
          state.cacheTimestamps[action.payload.data.id_kurikulum] = Date.now();
        }
      })
      .addCase(getKurikulumDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });
    
    // Apply kurikulum to kelompok
    builder
      .addCase(applyKurikulumToKelompok.pending, (state) => {
        state.applyLoading = true;
        state.applyError = null;
        state.applySuccess = false;
      })
      .addCase(applyKurikulumToKelompok.fulfilled, (state, action) => {
        state.applyLoading = false;
        state.applySuccess = true;
        
        // Update kelompok kurikulum data if present
        const { kelompokId } = action.meta.arg;
        if (kelompokId) {
          state.kelompokKurikulum[kelompokId] = action.payload.data;
        }
      })
      .addCase(applyKurikulumToKelompok.rejected, (state, action) => {
        state.applyLoading = false;
        state.applyError = action.payload;
        state.applySuccess = false;
      });
    
    // Get kelompok kurikulum
    builder
      .addCase(getKelompokKurikulum.pending, (state, action) => {
        const kelompokId = action.meta.arg;
        state.kelompokKurikulumLoading[kelompokId] = true;
        state.kelompokKurikulumError[kelompokId] = null;
      })
      .addCase(getKelompokKurikulum.fulfilled, (state, action) => {
        const kelompokId = action.meta.arg;
        state.kelompokKurikulumLoading[kelompokId] = false;
        state.kelompokKurikulum[kelompokId] = action.payload.data;
      })
      .addCase(getKelompokKurikulum.rejected, (state, action) => {
        const kelompokId = action.meta.arg;
        state.kelompokKurikulumLoading[kelompokId] = false;
        state.kelompokKurikulumError[kelompokId] = action.payload;
      });
    
    // Get materi compatibility
    builder
      .addCase(getMateriCompatibility.pending, (state) => {
        state.compatibilityLoading = true;
        state.compatibilityError = null;
      })
      .addCase(getMateriCompatibility.fulfilled, (state, action) => {
        state.compatibilityLoading = false;
        state.materiCompatibility = action.payload.data || {};
      })
      .addCase(getMateriCompatibility.rejected, (state, action) => {
        state.compatibilityLoading = false;
        state.compatibilityError = action.payload;
      });
    
    // Get semester info
    builder
      .addCase(getSemesterInfo.pending, (state) => {
        state.semesterLoading = true;
        state.semesterError = null;
      })
      .addCase(getSemesterInfo.fulfilled, (state, action) => {
        state.semesterLoading = false;
        state.semesterInfo = action.payload.data;
      })
      .addCase(getSemesterInfo.rejected, (state, action) => {
        state.semesterLoading = false;
        state.semesterError = action.payload;
      });
    
    // Search kurikulum
    builder
      .addCase(searchKurikulum.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchKurikulum.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.data || [];
        state.lastSearchQuery = action.meta.arg;
      })
      .addCase(searchKurikulum.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      });
    
    // Get kurikulum suggestions
    builder
      .addCase(getKurikulumSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
        state.suggestionsError = null;
      })
      .addCase(getKurikulumSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload.data || [];
      })
      .addCase(getKurikulumSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestionsError = action.payload;
      });
  }
});

// Export actions
export const {
  clearBrowseError,
  clearDetailError,
  clearApplyError,
  clearSearchError,
  resetApplyState,
  setActiveFilters,
  clearFilters,
  updateKurikulumList,
  cacheKurikulumDetail,
  clearKurikulumCache,
  setCurrentKurikulum,
  appendKurikulumList,
  resetKurikulumList
} = kurikulumConsumerSlice.actions;

// Selectors
export const selectKurikulumList = (state) => state.kurikulumConsumer.kurikulumList;
export const selectKurikulumPagination = (state) => state.kurikulumConsumer.kurikulumPagination;
export const selectBrowseLoading = (state) => state.kurikulumConsumer.browseLoading;
export const selectBrowseError = (state) => state.kurikulumConsumer.browseError;

export const selectKurikulumDetail = (state) => state.kurikulumConsumer.kurikulumDetail;
export const selectDetailLoading = (state) => state.kurikulumConsumer.detailLoading;
export const selectDetailError = (state) => state.kurikulumConsumer.detailError;

export const selectKelompokKurikulum = (kelompokId) => (state) => 
  state.kurikulumConsumer.kelompokKurikulum[kelompokId];
export const selectKelompokKurikulumLoading = (kelompokId) => (state) => 
  state.kurikulumConsumer.kelompokKurikulumLoading[kelompokId] || false;
export const selectKelompokKurikulumError = (kelompokId) => (state) => 
  state.kurikulumConsumer.kelompokKurikulumError[kelompokId];

export const selectMateriCompatibility = (state) => state.kurikulumConsumer.materiCompatibility;
export const selectCompatibilityLoading = (state) => state.kurikulumConsumer.compatibilityLoading;

export const selectSemesterInfo = (state) => state.kurikulumConsumer.semesterInfo;
export const selectSemesterLoading = (state) => state.kurikulumConsumer.semesterLoading;

export const selectSearchResults = (state) => state.kurikulumConsumer.searchResults;
export const selectSearchLoading = (state) => state.kurikulumConsumer.searchLoading;
export const selectLastSearchQuery = (state) => state.kurikulumConsumer.lastSearchQuery;

export const selectSuggestions = (state) => state.kurikulumConsumer.suggestions;
export const selectSuggestionsLoading = (state) => state.kurikulumConsumer.suggestionsLoading;

export const selectApplyLoading = (state) => state.kurikulumConsumer.applyLoading;
export const selectApplyError = (state) => state.kurikulumConsumer.applyError;
export const selectApplySuccess = (state) => state.kurikulumConsumer.applySuccess;

export const selectActiveFilters = (state) => state.kurikulumConsumer.activeFilters;
export const selectCurrentKurikulum = (state) => state.kurikulumConsumer.currentKurikulum;

// Memoized selectors for performance
export const selectCachedKurikulumDetail = (kurikulumId) => (state) => {
  const cached = state.kurikulumConsumer.kurikulumCache[kurikulumId];
  const timestamp = state.kurikulumConsumer.cacheTimestamps[kurikulumId];
  
  // Cache valid for 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;
  if (cached && timestamp && (Date.now() - timestamp < CACHE_DURATION)) {
    return cached;
  }
  return null;
};

export const selectFilteredKurikulumList = (state) => {
  const { kurikulumList, activeFilters } = state.kurikulumConsumer;
  
  return kurikulumList.filter(kurikulum => {
    // Filter by jenjang
    if (activeFilters.jenjang && !kurikulum.jenjang_summary?.includes(activeFilters.jenjang)) {
      return false;
    }
    
    // Filter by kelas gabungan compatibility
    if (activeFilters.kelasGabungan?.length > 0) {
      const hasCompatibleKelas = activeFilters.kelasGabungan.some(selectedKelas =>
        kurikulum.kelas_gabungan?.some(kurikulumKelas =>
          kurikulumKelas.jenjang === selectedKelas.jenjang &&
          kurikulumKelas.kelas === selectedKelas.kelas
        )
      );
      if (!hasCompatibleKelas) {
        return false;
      }
    }
    
    // Filter by search query
    if (activeFilters.searchQuery) {
      const query = activeFilters.searchQuery.toLowerCase();
      const matchesName = kurikulum.nama_kurikulum?.toLowerCase().includes(query);
      const matchesDescription = kurikulum.description?.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });
};

export default kurikulumConsumerSlice.reducer;