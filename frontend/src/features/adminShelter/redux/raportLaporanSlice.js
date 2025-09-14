import { createSlice } from '@reduxjs/toolkit';
import {
  fetchLaporanRaport,
  fetchChildDetailReport,
  fetchRaportFilterOptions,
  fetchRaportAvailableYears,
  initializeRaportLaporanPage,
  updateRaportFiltersAndRefreshAll
} from './raportLaporanThunks';

const initialState = {
  // Main report data
  children: [],
  summary: {
    total_children: 0,
    total_raport: 0,
    published_raport: 0,
    draft_raport: 0,
    average_grade: 0,
    passing_percentage: 0
  },
  pagination: null,
  
  // Child detail data
  childDetail: {
    child: null,
    raport_records: [],
    filter: null
  },
  
  // Filter options
  filterOptions: {
    availableYears: [],
    availableMataPelajaran: [],
    availableSemesters: []
  },
  
  // Loading states
  loading: false,
  childDetailLoading: false,
  filterOptionsLoading: false,
  initializingPage: false,
  refreshingAll: false,
  
  // Error states
  error: null,
  childDetailError: null,
  filterOptionsError: null,
  initializeError: null,
  refreshAllError: null,
  
  // UI state
  filters: {
    start_date: null,
    end_date: null,
    mata_pelajaran: null,
    search: ''
  },
  expandedCards: []
};

const raportLaporanSlice = createSlice({
  name: 'raportLaporan',
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
    setMataPelajaran: (state, action) => {
      state.filters.mata_pelajaran = action.payload;
    },
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        start_date: null,
        end_date: null,
        mata_pelajaran: null,
        search: ''
      };
    },
    
    // Card expansion
    toggleCardExpanded: (state, action) => {
      const childId = action.payload;
      const index = state.expandedCards.indexOf(childId);
      if (index > -1) {
        state.expandedCards.splice(index, 1);
      } else {
        state.expandedCards.push(childId);
      }
    },
    
    // Clear data actions
    clearChildDetail: (state) => {
      state.childDetail = {
        child: null,
        raport_records: [],
        filter: null
      };
      state.childDetailError = null;
    },
    clearAllErrors: (state) => {
      state.error = null;
      state.childDetailError = null;
      state.filterOptionsError = null;
      state.initializeError = null;
      state.refreshAllError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize Page
      .addCase(initializeRaportLaporanPage.pending, (state) => {
        state.initializingPage = true;
        state.initializeError = null;
      })
      .addCase(initializeRaportLaporanPage.fulfilled, (state) => {
        state.initializingPage = false;
      })
      .addCase(initializeRaportLaporanPage.rejected, (state, action) => {
        state.initializingPage = false;
        state.initializeError = action.payload;
      })
      
      // Update Filters and Refresh All
      .addCase(updateRaportFiltersAndRefreshAll.pending, (state) => {
        state.refreshingAll = true;
        state.refreshAllError = null;
      })
      .addCase(updateRaportFiltersAndRefreshAll.fulfilled, (state, action) => {
        state.refreshingAll = false;
        
        if (action.payload.raportData) {
          if (action.payload.append) {
            state.children = [...state.children, ...action.payload.raportData.children];
          } else {
            state.children = action.payload.raportData.children;
          }
          state.summary = action.payload.raportData.summary;
          state.pagination = action.payload.raportData.pagination;
          state.filterOptions = { ...state.filterOptions, ...action.payload.raportData.filter_options };
        }
      })
      .addCase(updateRaportFiltersAndRefreshAll.rejected, (state, action) => {
        state.refreshingAll = false;
        state.refreshAllError = action.payload;
      })
      
      // Fetch Laporan Raport
      .addCase(fetchLaporanRaport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLaporanRaport.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.append) {
          state.children = [...state.children, ...action.payload.children];
        } else {
          state.children = action.payload.children;
        }
        state.summary = action.payload.summary;
        state.pagination = action.payload.pagination;
        state.filterOptions = { ...state.filterOptions, ...action.payload.filter_options };
      })
      .addCase(fetchLaporanRaport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Child Detail
      .addCase(fetchChildDetailReport.pending, (state) => {
        state.childDetailLoading = true;
        state.childDetailError = null;
      })
      .addCase(fetchChildDetailReport.fulfilled, (state, action) => {
        state.childDetailLoading = false;
        state.childDetail = action.payload;
      })
      .addCase(fetchChildDetailReport.rejected, (state, action) => {
        state.childDetailLoading = false;
        state.childDetailError = action.payload;
      })
      
      // Fetch Filter Options
      .addCase(fetchRaportFilterOptions.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchRaportFilterOptions.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions = { ...state.filterOptions, ...action.payload };
      })
      .addCase(fetchRaportFilterOptions.rejected, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptionsError = action.payload;
      })
      
      // Fetch Available Years
      .addCase(fetchRaportAvailableYears.fulfilled, (state, action) => {
        state.filterOptions.availableYears = action.payload;
      });
  }
});

export const {
  setFilters,
  setStartDate,
  setEndDate,
  setMataPelajaran,
  setSearch,
  resetFilters,
  toggleCardExpanded,
  clearChildDetail,
  clearAllErrors
} = raportLaporanSlice.actions;

// Selectors
export const selectRaportLaporanState = (state) => state.raportLaporan;
export const selectRaportChildren = (state) => state.raportLaporan.children;
export const selectRaportSummary = (state) => state.raportLaporan.summary;
export const selectRaportPagination = (state) => state.raportLaporan.pagination;
export const selectRaportFilterOptions = (state) => state.raportLaporan.filterOptions;
export const selectRaportFilters = (state) => state.raportLaporan.filters;
export const selectRaportExpandedCards = (state) => state.raportLaporan.expandedCards;
export const selectRaportChildDetail = (state) => state.raportLaporan.childDetail;
export const selectRaportLoading = (state) => state.raportLaporan.loading;
export const selectRaportChildDetailLoading = (state) => state.raportLaporan.childDetailLoading;
export const selectRaportFilterOptionsLoading = (state) => state.raportLaporan.filterOptionsLoading;
export const selectRaportInitializingPage = (state) => state.raportLaporan.initializingPage;
export const selectRaportRefreshingAll = (state) => state.raportLaporan.refreshingAll;
export const selectRaportError = (state) => state.raportLaporan.error;
export const selectRaportChildDetailError = (state) => state.raportLaporan.childDetailError;
export const selectRaportFilterOptionsError = (state) => state.raportLaporan.filterOptionsError;
export const selectRaportInitializeError = (state) => state.raportLaporan.initializeError;
export const selectRaportRefreshAllError = (state) => state.raportLaporan.refreshAllError;

export const selectRaportHasActiveFilters = (state) => {
  const { start_date, end_date, mata_pelajaran, search } = state.raportLaporan.filters;
  return !!(start_date || end_date || mata_pelajaran || search);
};

export const selectRaportCurrentFilters = (state) => ({
  start_date: state.raportLaporan.filters.start_date,
  end_date: state.raportLaporan.filters.end_date,
  mata_pelajaran: state.raportLaporan.filters.mata_pelajaran,
  search: state.raportLaporan.filters.search
});

export default raportLaporanSlice.reducer;