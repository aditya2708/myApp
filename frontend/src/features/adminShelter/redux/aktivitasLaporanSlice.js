import { createSlice } from '@reduxjs/toolkit';
import {
  fetchLaporanAktivitas,
  fetchActivityDetailReport,
  fetchAktivitasJenisKegiatanOptions,
  fetchAktivitasAvailableYears,
  initializeAktivitasLaporanPage,
  updateAktivitasFiltersAndRefresh
} from './aktivitasLaporanThunks';

const initialState = {
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
  
  activityDetail: {
    activity: null,
    attendanceRecords: [],
    attendanceStats: null
  },
  
  loading: false,
  activityDetailLoading: false,
  filterOptionsLoading: false,
  initializingPage: false,
  
  error: null,
  activityDetailError: null,
  filterOptionsError: null,
  initializeError: null,
  
  filters: {
    year: new Date().getFullYear(),
    jenisKegiatan: null,
    month: null
  }
};

const aktivitasLaporanSlice = createSlice({
  name: 'aktivitasLaporan',
  initialState,
  reducers: {
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
    
    clearActivityDetail: (state) => {
      state.activityDetail = {
        activity: null,
        attendanceRecords: [],
        attendanceStats: null
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
      .addCase(initializeAktivitasLaporanPage.pending, (state) => {
        state.initializingPage = true;
        state.initializeError = null;
      })
      .addCase(initializeAktivitasLaporanPage.fulfilled, (state) => {
        state.initializingPage = false;
        state.initializeError = null;
      })
      .addCase(initializeAktivitasLaporanPage.rejected, (state, action) => {
        state.initializingPage = false;
        state.initializeError = action.payload;
      })
      
      .addCase(updateAktivitasFiltersAndRefresh.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAktivitasFiltersAndRefresh.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateAktivitasFiltersAndRefresh.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchLaporanAktivitas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLaporanAktivitas.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload.activities || [];
        state.summary = action.payload.summary || null;
        state.filterOptions = { ...state.filterOptions, ...action.payload.filter_options };
        state.error = null;
      })
      .addCase(fetchLaporanAktivitas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.activities = [];
        state.summary = null;
      })
      
      .addCase(fetchActivityDetailReport.pending, (state) => {
        state.activityDetailLoading = true;
        state.activityDetailError = null;
        state.activityDetail = {
          activity: null,
          attendanceRecords: [],
          attendanceStats: null
        };
      })
      .addCase(fetchActivityDetailReport.fulfilled, (state, action) => {
        state.activityDetailLoading = false;
        state.activityDetail = {
          activity: action.payload.activity || null,
          attendanceRecords: action.payload.attendance_records || [],
          attendanceStats: action.payload.attendance_stats || null
        };
        state.activityDetailError = null;
      })
      .addCase(fetchActivityDetailReport.rejected, (state, action) => {
        state.activityDetailLoading = false;
        state.activityDetailError = action.payload;
        state.activityDetail = {
          activity: null,
          attendanceRecords: [],
          attendanceStats: null
        };
      })
      
      .addCase(fetchAktivitasJenisKegiatanOptions.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchAktivitasJenisKegiatanOptions.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions.availableActivityTypes = action.payload || [];
        state.filterOptionsError = null;
      })
      .addCase(fetchAktivitasJenisKegiatanOptions.rejected, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptionsError = action.payload;
      })
      
      .addCase(fetchAktivitasAvailableYears.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchAktivitasAvailableYears.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions.availableYears = action.payload || [];
        state.filterOptionsError = null;
      })
      .addCase(fetchAktivitasAvailableYears.rejected, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptionsError = action.payload;
      });
  }
});

export const {
  setFilters,
  setYear,
  setJenisKegiatan,
  setMonth,
  resetFilters,
  clearActivityDetail,
  clearError,
  clearActivityDetailError,
  clearFilterOptionsError,
  clearInitializeError
} = aktivitasLaporanSlice.actions;

// Selectors
export const selectAktivitasLaporanState = (state) => state.aktivitasLaporan;
export const selectActivities = (state) => state.aktivitasLaporan.activities;
export const selectAktivitasSummary = (state) => state.aktivitasLaporan.summary;
export const selectAktivitasFilterOptions = (state) => state.aktivitasLaporan.filterOptions;
export const selectAktivitasFilters = (state) => state.aktivitasLaporan.filters;
export const selectActivityDetail = (state) => state.aktivitasLaporan.activityDetail;
export const selectAktivitasLoading = (state) => state.aktivitasLaporan.loading;
export const selectActivityDetailLoading = (state) => state.aktivitasLaporan.activityDetailLoading;
export const selectAktivitasFilterOptionsLoading = (state) => state.aktivitasLaporan.filterOptionsLoading;
export const selectAktivitasInitializingPage = (state) => state.aktivitasLaporan.initializingPage;
export const selectAktivitasError = (state) => state.aktivitasLaporan.error;
export const selectActivityDetailError = (state) => state.aktivitasLaporan.activityDetailError;
export const selectAktivitasFilterOptionsError = (state) => state.aktivitasLaporan.filterOptionsError;
export const selectAktivitasInitializeError = (state) => state.aktivitasLaporan.initializeError;

export const selectAktivitasCurrentFilters = (state) => ({
  year: state.aktivitasLaporan.filters.year,
  jenisKegiatan: state.aktivitasLaporan.filters.jenisKegiatan,
  month: state.aktivitasLaporan.filters.month
});

export default aktivitasLaporanSlice.reducer;