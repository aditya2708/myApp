import { createSlice } from '@reduxjs/toolkit';
import {
  fetchLaporanTutor,
  fetchTutorDetailReport,
  fetchTutorJenisKegiatanOptions,
  fetchTutorAvailableYears,
  initializeTutorLaporanPage,
  updateTutorFiltersAndRefreshAll,
  exportTutorData
} from './tutorLaporanThunks';

const initialState = {
  tutors: [],
  summary: null,
  pagination: null,
  filterOptions: {
    availableYears: [],
    availableActivityTypes: [],
    currentActivityType: null
  },
  months: {},
  
  tutorDetail: {
    tutor: null,
    attendanceRecords: [],
    filter: null
  },
  
  // Export data
  exportData: null,

  loading: false,
  tutorDetailLoading: false,
  filterOptionsLoading: false,
  initializingPage: false,
  refreshingAll: false,
  exportLoading: false,

  error: null,
  tutorDetailError: null,
  filterOptionsError: null,
  initializeError: null,
  refreshAllError: null,
  exportError: null,
  
  filters: {
    start_date: null,
    end_date: null,
    jenisKegiatan: null,
    search: ''
  },
  expandedCards: [],
};

const tutorLaporanSlice = createSlice({
  name: 'tutorLaporan',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setStartDate: (state, action) => {
      state.filters.start_date = action.payload;
    },
    setEndDate: (state, action) => {
      state.filters.end_date = action.payload;
    },
    setJenisKegiatan: (state, action) => {
      state.filters.jenisKegiatan = action.payload;
    },
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        start_date: null,
        end_date: null,
        jenisKegiatan: null,
        search: ''
      };
    },
    
    toggleCardExpanded: (state, action) => {
      const tutorId = action.payload;
      const index = state.expandedCards.indexOf(tutorId);
      if (index > -1) {
        state.expandedCards.splice(index, 1);
      } else {
        state.expandedCards.push(tutorId);
      }
    },
    setCardExpanded: (state, action) => {
      const { tutorId, expanded } = action.payload;
      const index = state.expandedCards.indexOf(tutorId);
      if (expanded && index === -1) {
        state.expandedCards.push(tutorId);
      } else if (!expanded && index > -1) {
        state.expandedCards.splice(index, 1);
      }
    },
    expandAllCards: (state) => {
      state.expandedCards = state.tutors.map(tutor => tutor.id_tutor);
    },
    collapseAllCards: (state) => {
      state.expandedCards = [];
    },
    
    clearTutorDetail: (state) => {
      state.tutorDetail = {
        tutor: null,
        attendanceRecords: [],
        filter: null
      };
      state.tutorDetailError = null;
    },
    clearExportData: (state) => {
      state.exportData = null;
      state.exportError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTutorDetailError: (state) => {
      state.tutorDetailError = null;
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
    clearExportError: (state) => {
      state.exportError = null;
    },
    clearAllErrors: (state) => {
      state.error = null;
      state.tutorDetailError = null;
      state.filterOptionsError = null;
      state.initializeError = null;
      state.refreshAllError = null;
      state.exportError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeTutorLaporanPage.pending, (state) => {
        state.initializingPage = true;
        state.initializeError = null;
      })
      .addCase(initializeTutorLaporanPage.fulfilled, (state) => {
        state.initializingPage = false;
        state.initializeError = null;
      })
      .addCase(initializeTutorLaporanPage.rejected, (state, action) => {
        state.initializingPage = false;
        state.initializeError = action.payload;
      })
      
      .addCase(updateTutorFiltersAndRefreshAll.pending, (state) => {
        state.refreshingAll = true;
        state.refreshAllError = null;
        state.error = null;
      })
      .addCase(updateTutorFiltersAndRefreshAll.fulfilled, (state, action) => {
        state.refreshingAll = false;
        state.refreshAllError = null;
        state.error = null;
        
        if (action.payload.tutorData) {
          if (action.payload.append) {
            state.tutors = [...state.tutors, ...action.payload.tutorData.tutors];
          } else {
            state.tutors = action.payload.tutorData.tutors;
          }
          state.summary = action.payload.tutorData.summary;
          state.pagination = action.payload.tutorData.pagination;
          state.filterOptions = { ...state.filterOptions, ...action.payload.tutorData.filter_options };
          state.months = action.payload.tutorData.months;
        }
      })
      .addCase(updateTutorFiltersAndRefreshAll.rejected, (state, action) => {
        state.refreshingAll = false;
        state.refreshAllError = action.payload;
      })
      
      .addCase(fetchLaporanTutor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLaporanTutor.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.append) {
          state.tutors = [...state.tutors, ...action.payload.tutors];
        } else {
          state.tutors = action.payload.tutors;
        }
        state.summary = action.payload.summary;
        state.pagination = action.payload.pagination;
        state.filterOptions = { ...state.filterOptions, ...action.payload.filter_options };
        state.months = action.payload.months;
        state.error = null;
      })
      .addCase(fetchLaporanTutor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchTutorDetailReport.pending, (state) => {
        state.tutorDetailLoading = true;
        state.tutorDetailError = null;
      })
      .addCase(fetchTutorDetailReport.fulfilled, (state, action) => {
        state.tutorDetailLoading = false;
        state.tutorDetail = action.payload;
        state.tutorDetailError = null;
      })
      .addCase(fetchTutorDetailReport.rejected, (state, action) => {
        state.tutorDetailLoading = false;
        state.tutorDetailError = action.payload;
      })
      
      .addCase(fetchTutorJenisKegiatanOptions.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchTutorJenisKegiatanOptions.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions.availableActivityTypes = action.payload;
        state.filterOptionsError = null;
      })
      .addCase(fetchTutorJenisKegiatanOptions.rejected, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptionsError = action.payload;
      })
      
      .addCase(fetchTutorAvailableYears.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchTutorAvailableYears.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions.availableYears = action.payload;
        state.filterOptionsError = null;
      })
      .addCase(fetchTutorAvailableYears.rejected, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptionsError = action.payload;
      })
      
      // Export Data (JSON)
      .addCase(exportTutorData.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportTutorData.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.exportData = action.payload;
        state.exportError = null;
      })
      .addCase(exportTutorData.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload;
      });
  }
});

export const {
  setFilters,
  setStartDate,
  setEndDate,
  setJenisKegiatan,
  setSearch,
  resetFilters,
  toggleCardExpanded,
  setCardExpanded,
  expandAllCards,
  collapseAllCards,
  clearTutorDetail,
  clearExportData,
  clearError,
  clearTutorDetailError,
  clearFilterOptionsError,
  clearInitializeError,
  clearRefreshAllError,
  clearExportError,
  clearAllErrors
} = tutorLaporanSlice.actions;

// Selectors
export const selectTutorLaporanState = (state) => state.tutorLaporan;
export const selectTutors = (state) => state.tutorLaporan.tutors;
export const selectTutorSummary = (state) => state.tutorLaporan.summary;
export const selectTutorPagination = (state) => state.tutorLaporan.pagination;
export const selectTutorFilterOptions = (state) => state.tutorLaporan.filterOptions;
export const selectTutorMonths = (state) => state.tutorLaporan.months;
export const selectTutorFilters = (state) => state.tutorLaporan.filters;
export const selectTutorExpandedCards = (state) => state.tutorLaporan.expandedCards;
export const selectTutorDetail = (state) => state.tutorLaporan.tutorDetail;
export const selectTutorExportData = (state) => state.tutorLaporan.exportData;
export const selectTutorLoading = (state) => state.tutorLaporan.loading;
export const selectTutorDetailLoading = (state) => state.tutorLaporan.tutorDetailLoading;
export const selectTutorFilterOptionsLoading = (state) => state.tutorLaporan.filterOptionsLoading;
export const selectTutorInitializingPage = (state) => state.tutorLaporan.initializingPage;
export const selectTutorRefreshingAll = (state) => state.tutorLaporan.refreshingAll;
export const selectTutorExportLoading = (state) => state.tutorLaporan.exportLoading;
export const selectTutorError = (state) => state.tutorLaporan.error;
export const selectTutorDetailError = (state) => state.tutorLaporan.tutorDetailError;
export const selectTutorFilterOptionsError = (state) => state.tutorLaporan.filterOptionsError;
export const selectTutorInitializeError = (state) => state.tutorLaporan.initializeError;
export const selectTutorRefreshAllError = (state) => state.tutorLaporan.refreshAllError;
export const selectTutorExportError = (state) => state.tutorLaporan.exportError;

export const selectIsTutorCardExpanded = (state, tutorId) => 
  state.tutorLaporan.expandedCards.includes(tutorId);

export const selectTutorCurrentFilters = (state) => ({
  start_date: state.tutorLaporan.filters.start_date,
  end_date: state.tutorLaporan.filters.end_date,
  jenisKegiatan: state.tutorLaporan.filters.jenisKegiatan,
  search: state.tutorLaporan.filters.search
});

export const selectTutorHasActiveFilters = (state) => {
  const { start_date, end_date, jenisKegiatan, search } = state.tutorLaporan.filters;
  return !!(start_date || end_date || jenisKegiatan || search);
};

export default tutorLaporanSlice.reducer;