import { createSlice } from '@reduxjs/toolkit';
import {
  fetchLaporanAktivitas,
  fetchActivityDetailReport,
  fetchJenisKegiatanOptions,
  fetchAvailableYears,
  initializeLaporanAktivitasPage,
  updateFiltersAndRefreshAktivitas
} from './laporanAktivitasThunks';

const initialState = {
  // Main report data
  activities: [],
  summary: null,
  filterOptions: {
    availableYears: [],
    availableActivityTypes: [],
    months: {},
    currentYear: new Date().getFullYear(),
    currentActivityType: null,
    currentMonth: null
  },
  
  // Activity detail data
  activityDetail: {
    activity: null,
    attendanceRecords: [],
    attendanceStats: null,
    filter: null
  },
  
  // Loading states
  loading: false,
  activityDetailLoading: false,
  filterOptionsLoading: false,
  initializingPage: false,
  
  // Error states
  error: null,
  activityDetailError: null,
  filterOptionsError: null,
  initializeError: null,
  
  // UI state
  filters: {
    year: new Date().getFullYear(),
    jenisKegiatan: null,
    month: null
  },
  expandedCards: [], // Track which activity cards are expanded
};

const laporanAktivitasSlice = createSlice({
  name: 'laporanAktivitas',
  initialState,
  reducers: {
    // Filter actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setYear: (state, action) => {
      state.filters.year = action.payload;
    },
    setJenisKegiatan: (state, action) => {
      state.filters.jenisKegiatan = action.payload;
    },
    setMonth: (state, action) => {
      state.filters.month = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        year: new Date().getFullYear(),
        jenisKegiatan: null,
        month: null
      };
    },
    
    // UI state actions
    toggleCardExpanded: (state, action) => {
      const activityId = action.payload;
      const index = state.expandedCards.indexOf(activityId);
      if (index > -1) {
        state.expandedCards.splice(index, 1);
      } else {
        state.expandedCards.push(activityId);
      }
    },
    setCardExpanded: (state, action) => {
      const { activityId, expanded } = action.payload;
      const index = state.expandedCards.indexOf(activityId);
      if (expanded && index === -1) {
        state.expandedCards.push(activityId);
      } else if (!expanded && index > -1) {
        state.expandedCards.splice(index, 1);
      }
    },
    expandAllCards: (state) => {
      state.expandedCards = state.activities.map(activity => activity.id_aktivitas);
    },
    collapseAllCards: (state) => {
      state.expandedCards = [];
    },
    
    // Clear data actions
    clearActivityDetail: (state) => {
      state.activityDetail = {
        activity: null,
        attendanceRecords: [],
        attendanceStats: null,
        filter: null
      };
      state.activityDetailError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearActivityDetailError: (state) => {
      state.activityDetailError = null;
    },
    clearFilterOptionsError: (state) => {
      state.filterOptionsError = null;
    },
    clearInitializeError: (state) => {
      state.initializeError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize Laporan Aktivitas Page
      .addCase(initializeLaporanAktivitasPage.pending, (state) => {
        state.initializingPage = true;
        state.initializeError = null;
      })
      .addCase(initializeLaporanAktivitasPage.fulfilled, (state) => {
        state.initializingPage = false;
        state.initializeError = null;
      })
      .addCase(initializeLaporanAktivitasPage.rejected, (state, action) => {
        state.initializingPage = false;
        state.initializeError = action.payload;
      })
      
      // Update Filters and Refresh
      .addCase(updateFiltersAndRefreshAktivitas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFiltersAndRefreshAktivitas.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateFiltersAndRefreshAktivitas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Laporan Aktivitas
      .addCase(fetchLaporanAktivitas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLaporanAktivitas.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload.activities;
        state.summary = action.payload.summary;
        state.filterOptions = { ...state.filterOptions, ...action.payload.filter_options };
        state.error = null;
      })
      .addCase(fetchLaporanAktivitas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Activity Detail Report
      .addCase(fetchActivityDetailReport.pending, (state) => {
        state.activityDetailLoading = true;
        state.activityDetailError = null;
      })
      .addCase(fetchActivityDetailReport.fulfilled, (state, action) => {
        state.activityDetailLoading = false;
        state.activityDetail = action.payload;
        state.activityDetailError = null;
      })
      .addCase(fetchActivityDetailReport.rejected, (state, action) => {
        state.activityDetailLoading = false;
        state.activityDetailError = action.payload;
      })
      
      // Fetch Jenis Kegiatan Options
      .addCase(fetchJenisKegiatanOptions.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchJenisKegiatanOptions.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions.availableActivityTypes = action.payload;
        state.filterOptionsError = null;
      })
      .addCase(fetchJenisKegiatanOptions.rejected, (state, action) => {
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
  setYear,
  setJenisKegiatan,
  setMonth,
  resetFilters,
  toggleCardExpanded,
  setCardExpanded,
  expandAllCards,
  collapseAllCards,
  clearActivityDetail,
  clearError,
  clearActivityDetailError,
  clearFilterOptionsError,
  clearInitializeError
} = laporanAktivitasSlice.actions;

// Selectors
export const selectLaporanAktivitasState = (state) => state.laporanAktivitas;
export const selectActivities = (state) => state.laporanAktivitas.activities;
export const selectSummary = (state) => state.laporanAktivitas.summary;
export const selectFilterOptions = (state) => state.laporanAktivitas.filterOptions;
export const selectFilters = (state) => state.laporanAktivitas.filters;
export const selectExpandedCards = (state) => state.laporanAktivitas.expandedCards;
export const selectActivityDetail = (state) => state.laporanAktivitas.activityDetail;
export const selectLoading = (state) => state.laporanAktivitas.loading;
export const selectActivityDetailLoading = (state) => state.laporanAktivitas.activityDetailLoading;
export const selectFilterOptionsLoading = (state) => state.laporanAktivitas.filterOptionsLoading;
export const selectInitializingPage = (state) => state.laporanAktivitas.initializingPage;
export const selectError = (state) => state.laporanAktivitas.error;
export const selectActivityDetailError = (state) => state.laporanAktivitas.activityDetailError;
export const selectFilterOptionsError = (state) => state.laporanAktivitas.filterOptionsError;
export const selectInitializeError = (state) => state.laporanAktivitas.initializeError;

// Derived selectors
export const selectIsCardExpanded = (state, activityId) => 
  state.laporanAktivitas.expandedCards.includes(activityId);

export const selectFilteredActivities = (state) => {
  // Return activities as-is since filtering is done on backend
  return state.laporanAktivitas.activities;
};

export const selectCurrentFilters = (state) => ({
  year: state.laporanAktivitas.filters.year,
  jenisKegiatan: state.laporanAktivitas.filters.jenisKegiatan,
  month: state.laporanAktivitas.filters.month
});

export default laporanAktivitasSlice.reducer;