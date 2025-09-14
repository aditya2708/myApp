import { createSlice } from '@reduxjs/toolkit';
import {
  fetchLaporanSurat,
  fetchShelterDetail,
  fetchFilterOptions,
  fetchAvailableYears,
  initializeLaporanSuratPage,
  updateFiltersAndRefresh,
  updateFiltersAndRefreshAll
} from './laporanSuratThunks';

const initialState = {
  // Main report data
  statistics: {
    total_shelter: 0,
    total_surat: 0,
    total_terbaca: 0,
    total_belum_terbaca: 0
  },
  shelterStats: [],
  
  // Shelter detail data
  shelterDetail: {
    shelter_id: null,
    surat_list: [],
    pagination: null
  },
  
  // Filter options
  filterOptions: {
    shelter: [],
    availableYears: []
  },
  
  // Loading states
  loading: false,
  shelterDetailLoading: false,
  filterOptionsLoading: false,
  initializingPage: false,
  refreshingAll: false, // NEW loading state for combined refresh
  
  // Error states
  error: null,
  shelterDetailError: null,
  filterOptionsError: null,
  initializeError: null,
  refreshAllError: null, // NEW error state for combined refresh
  
  // UI state
  filters: {
    start_date: null,
    end_date: null,
    is_read: null,
    search: ''
  }
};

const laporanSuratSlice = createSlice({
  name: 'laporanSurat',
  initialState,
  reducers: {
    // Filter actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setStartDate: (state, action) => {
      state.filters.start_date = action.payload;
    },
    setEndDate: (state, action) => {
      state.filters.end_date = action.payload;
    },
    setIsRead: (state, action) => {
      state.filters.is_read = action.payload;
    },
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        start_date: null,
        end_date: null,
        is_read: null,
        search: ''
      };
    },
    
    // Clear data actions
    clearShelterDetail: (state) => {
      state.shelterDetail = {
        shelter_id: null,
        surat_list: [],
        pagination: null
      };
      state.shelterDetailError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearShelterDetailError: (state) => {
      state.shelterDetailError = null;
    },
    clearFilterOptionsError: (state) => {
      state.filterOptionsError = null;
    },
    clearInitializeError: (state) => {
      state.initializeError = null;
    },
    clearRefreshAllError: (state) => {
      state.refreshAllError = null;
    },
    clearAllErrors: (state) => {
      state.error = null;
      state.shelterDetailError = null;
      state.filterOptionsError = null;
      state.initializeError = null;
      state.refreshAllError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize Laporan Surat Page
      .addCase(initializeLaporanSuratPage.pending, (state) => {
        state.initializingPage = true;
        state.initializeError = null;
      })
      .addCase(initializeLaporanSuratPage.fulfilled, (state) => {
        state.initializingPage = false;
        state.initializeError = null;
      })
      .addCase(initializeLaporanSuratPage.rejected, (state, action) => {
        state.initializingPage = false;
        state.initializeError = action.payload;
      })
      
      // Combined Update Filters and Refresh All (NEW - MAIN HANDLER)
      .addCase(updateFiltersAndRefreshAll.pending, (state) => {
        state.refreshingAll = true;
        state.refreshAllError = null;
        state.error = null;
        state.shelterDetailError = null;
      })
      .addCase(updateFiltersAndRefreshAll.fulfilled, (state, action) => {
        state.refreshingAll = false;
        state.refreshAllError = null;
        state.error = null;
        state.shelterDetailError = null;
        
        // Update statistics if provided
        if (action.payload.statistics) {
          state.statistics = action.payload.statistics.statistics;
          state.shelterStats = action.payload.statistics.shelter_stats;
        }
        
        // Update shelter detail if provided
        if (action.payload.shelterDetail) {
          state.shelterDetail = {
            shelter_id: action.payload.shelterDetail.shelter_id,
            surat_list: action.payload.shelterDetail.data.data,
            pagination: {
              current_page: action.payload.shelterDetail.data.current_page,
              last_page: action.payload.shelterDetail.data.last_page,
              per_page: action.payload.shelterDetail.data.per_page,
              total: action.payload.shelterDetail.data.total
            }
          };
        }
      })
      .addCase(updateFiltersAndRefreshAll.rejected, (state, action) => {
        state.refreshingAll = false;
        state.refreshAllError = action.payload;
      })
      
      // Update Filters and Refresh (DEPRECATED - kept for backward compatibility)
      .addCase(updateFiltersAndRefresh.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFiltersAndRefresh.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateFiltersAndRefresh.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Laporan Surat
      .addCase(fetchLaporanSurat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLaporanSurat.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload.statistics;
        state.shelterStats = action.payload.shelter_stats;
        state.error = null;
      })
      .addCase(fetchLaporanSurat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Shelter Detail
      .addCase(fetchShelterDetail.pending, (state) => {
        state.shelterDetailLoading = true;
        state.shelterDetailError = null;
      })
      .addCase(fetchShelterDetail.fulfilled, (state, action) => {
        state.shelterDetailLoading = false;
        state.shelterDetail = {
          shelter_id: action.payload.shelter_id,
          surat_list: action.payload.data.data,
          pagination: {
            current_page: action.payload.data.current_page,
            last_page: action.payload.data.last_page,
            per_page: action.payload.data.per_page,
            total: action.payload.data.total
          }
        };
        state.shelterDetailError = null;
      })
      .addCase(fetchShelterDetail.rejected, (state, action) => {
        state.shelterDetailLoading = false;
        state.shelterDetailError = action.payload;
      })
      
      // Fetch Filter Options
      .addCase(fetchFilterOptions.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions = { ...state.filterOptions, ...action.payload };
        state.filterOptionsError = null;
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptionsError = action.payload;
      })
      
      // Fetch Available Years
      .addCase(fetchAvailableYears.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchAvailableYears.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions.availableYears = action.payload;
        state.filterOptionsError = null;
      })
      .addCase(fetchAvailableYears.rejected, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptionsError = action.payload;
      });
  }
});

// Action creators
export const {
  setFilters,
  setStartDate,
  setEndDate,
  setIsRead,
  setSearch,
  resetFilters,
  clearShelterDetail,
  clearError,
  clearShelterDetailError,
  clearFilterOptionsError,
  clearInitializeError,
  clearRefreshAllError,
  clearAllErrors
} = laporanSuratSlice.actions;

// Selectors
export const selectLaporanSuratState = (state) => state.laporanSurat;
export const selectStatistics = (state) => state.laporanSurat.statistics;
export const selectShelterStats = (state) => state.laporanSurat.shelterStats;
export const selectShelterDetail = (state) => state.laporanSurat.shelterDetail;
export const selectFilterOptions = (state) => state.laporanSurat.filterOptions;
export const selectFilters = (state) => state.laporanSurat.filters;
export const selectLoading = (state) => state.laporanSurat.loading;
export const selectShelterDetailLoading = (state) => state.laporanSurat.shelterDetailLoading;
export const selectFilterOptionsLoading = (state) => state.laporanSurat.filterOptionsLoading;
export const selectInitializingPage = (state) => state.laporanSurat.initializingPage;
export const selectRefreshingAll = (state) => state.laporanSurat.refreshingAll; // NEW selector
export const selectError = (state) => state.laporanSurat.error;
export const selectShelterDetailError = (state) => state.laporanSurat.shelterDetailError;
export const selectFilterOptionsError = (state) => state.laporanSurat.filterOptionsError;
export const selectInitializeError = (state) => state.laporanSurat.initializeError;
export const selectRefreshAllError = (state) => state.laporanSurat.refreshAllError; // NEW selector

// Derived selectors
export const selectHasActiveFilters = (state) => {
  const { start_date, end_date, is_read, search } = state.laporanSurat.filters;
  return !!(start_date || end_date || is_read !== null || search);
};

export const selectCurrentFilters = (state) => ({
  start_date: state.laporanSurat.filters.start_date,
  end_date: state.laporanSurat.filters.end_date,
  is_read: state.laporanSurat.filters.is_read,
  search: state.laporanSurat.filters.search
});

export const selectSuratList = (state) => state.laporanSurat.shelterDetail.surat_list;
export const selectPagination = (state) => state.laporanSurat.shelterDetail.pagination;
export const selectCurrentShelterId = (state) => state.laporanSurat.shelterDetail.shelter_id;

export default laporanSuratSlice.reducer;