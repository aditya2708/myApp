import { createSlice } from '@reduxjs/toolkit';
import {
  fetchLaporanAnakBinaan,
  fetchChildDetailReport,
  fetchJenisKegiatanOptions,
  fetchAvailableYears,
  initializeLaporanPage,
  updateFiltersAndRefreshAll,
  exportLaporanAnakPdf
} from './laporanThunks';

const initialState = {
  children: [],
  summary: null,
  pagination: null,
  filterOptions: {
    availableYears: [],
    availableActivityTypes: []
  },
  
  childDetail: {
    child: null,
    attendanceRecords: [],
    filter: null
  },
  
  // PDF export data
  pdfBlob: null,
  pdfFilename: null,
  
  loading: false,
  childDetailLoading: false,
  filterOptionsLoading: false,
  initializingPage: false,
  refreshingAll: false,
  pdfExportLoading: false,
  
  error: null,
  childDetailError: null,
  filterOptionsError: null,
  initializeError: null,
  refreshAllError: null,
  pdfExportError: null,
  
  filters: {
    start_date: null,
    end_date: null,
    jenisKegiatan: null,
    search: ''
  },
  expandedCards: []
};

const laporanSlice = createSlice({
  name: 'laporan',
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
    
    // Card expansion actions
    toggleCardExpanded: (state, action) => {
      const childId = action.payload;
      const index = state.expandedCards.indexOf(childId);
      if (index > -1) {
        state.expandedCards.splice(index, 1);
      } else {
        state.expandedCards.push(childId);
      }
    },
    setCardExpanded: (state, action) => {
      const { childId, expanded } = action.payload;
      const index = state.expandedCards.indexOf(childId);
      if (expanded && index === -1) {
        state.expandedCards.push(childId);
      } else if (!expanded && index > -1) {
        state.expandedCards.splice(index, 1);
      }
    },
    expandAllCards: (state) => {
      state.expandedCards = state.children.map(child => child.id_anak);
    },
    collapseAllCards: (state) => {
      state.expandedCards = [];
    },
    
    // Clear data actions
    clearChildDetail: (state) => {
      state.childDetail = {
        child: null,
        attendanceRecords: [],
        filter: null
      };
      state.childDetailError = null;
    },
    clearPdfData: (state) => {
      state.pdfBlob = null;
      state.pdfFilename = null;
      state.pdfExportError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearChildDetailError: (state) => {
      state.childDetailError = null;
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
    clearPdfExportError: (state) => {
      state.pdfExportError = null;
    },
    clearAllErrors: (state) => {
      state.error = null;
      state.childDetailError = null;
      state.filterOptionsError = null;
      state.initializeError = null;
      state.refreshAllError = null;
      state.pdfExportError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize Laporan Page
      .addCase(initializeLaporanPage.pending, (state) => {
        state.initializingPage = true;
        state.initializeError = null;
      })
      .addCase(initializeLaporanPage.fulfilled, (state) => {
        state.initializingPage = false;
        state.initializeError = null;
      })
      .addCase(initializeLaporanPage.rejected, (state, action) => {
        state.initializingPage = false;
        state.initializeError = action.payload;
      })
      
      // Combined Update Filters and Refresh All
      .addCase(updateFiltersAndRefreshAll.pending, (state) => {
        state.refreshingAll = true;
        state.refreshAllError = null;
        state.error = null;
      })
      .addCase(updateFiltersAndRefreshAll.fulfilled, (state, action) => {
        state.refreshingAll = false;
        state.refreshAllError = null;
        state.error = null;
        
        if (action.payload.data) {
          if (action.payload.data.append) {
            state.children = [...state.children, ...action.payload.data.children];
          } else {
            state.children = action.payload.data.children;
          }
          state.summary = action.payload.data.summary;
          state.pagination = action.payload.data.pagination;
          state.filterOptions = { ...state.filterOptions, ...action.payload.data.filter_options };
        }
      })
      .addCase(updateFiltersAndRefreshAll.rejected, (state, action) => {
        state.refreshingAll = false;
        state.refreshAllError = action.payload;
      })
      
      // Fetch Laporan Anak Binaan
      .addCase(fetchLaporanAnakBinaan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLaporanAnakBinaan.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.append) {
          state.children = [...state.children, ...action.payload.children];
        } else {
          state.children = action.payload.children;
        }
        state.summary = action.payload.summary;
        state.pagination = action.payload.pagination;
        state.filterOptions = { ...state.filterOptions, ...action.payload.filter_options };
        state.error = null;
      })
      .addCase(fetchLaporanAnakBinaan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Child Detail Report
      .addCase(fetchChildDetailReport.pending, (state) => {
        state.childDetailLoading = true;
        state.childDetailError = null;
      })
      .addCase(fetchChildDetailReport.fulfilled, (state, action) => {
        state.childDetailLoading = false;
        state.childDetail = action.payload;
        state.childDetailError = null;
      })
      .addCase(fetchChildDetailReport.rejected, (state, action) => {
        state.childDetailLoading = false;
        state.childDetailError = action.payload;
      })
      
      // Fetch Jenis Kegiatan Options
      .addCase(fetchJenisKegiatanOptions.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchJenisKegiatanOptions.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions.availableActivityTypes = action.payload.availableActivityTypes || action.payload;
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
      })
      
      // Export PDF
      .addCase(exportLaporanAnakPdf.pending, (state) => {
        state.pdfExportLoading = true;
        state.pdfExportError = null;
      })
      .addCase(exportLaporanAnakPdf.fulfilled, (state, action) => {
        state.pdfExportLoading = false;
        state.pdfBlob = action.payload.blob;
        state.pdfFilename = action.payload.filename;
        state.pdfExportError = null;
      })
      .addCase(exportLaporanAnakPdf.rejected, (state, action) => {
        state.pdfExportLoading = false;
        state.pdfExportError = action.payload;
      });
  }
});

// Action creators
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
  clearChildDetail,
  clearPdfData,
  clearError,
  clearChildDetailError,
  clearFilterOptionsError,
  clearInitializeError,
  clearRefreshAllError,
  clearPdfExportError,
  clearAllErrors
} = laporanSlice.actions;

// Selectors
export const selectLaporanState = (state) => state.laporan;
export const selectChildren = (state) => state.laporan.children;
export const selectSummary = (state) => state.laporan.summary;
export const selectPagination = (state) => state.laporan.pagination;
export const selectFilterOptions = (state) => state.laporan.filterOptions;
export const selectChildDetail = (state) => state.laporan.childDetail;
export const selectFilters = (state) => state.laporan.filters;
export const selectExpandedCards = (state) => state.laporan.expandedCards;
export const selectLoading = (state) => state.laporan.loading;
export const selectChildDetailLoading = (state) => state.laporan.childDetailLoading;
export const selectFilterOptionsLoading = (state) => state.laporan.filterOptionsLoading;
export const selectInitializingPage = (state) => state.laporan.initializingPage;
export const selectRefreshingAll = (state) => state.laporan.refreshingAll;
export const selectPdfExportLoading = (state) => state.laporan.pdfExportLoading;
export const selectError = (state) => state.laporan.error;
export const selectChildDetailError = (state) => state.laporan.childDetailError;
export const selectFilterOptionsError = (state) => state.laporan.filterOptionsError;
export const selectInitializeError = (state) => state.laporan.initializeError;
export const selectRefreshAllError = (state) => state.laporan.refreshAllError;
export const selectPdfExportError = (state) => state.laporan.pdfExportError;
export const selectPdfBlob = (state) => state.laporan.pdfBlob;
export const selectPdfFilename = (state) => state.laporan.pdfFilename;

// Derived selectors
export const selectHasActiveFilters = (state) => {
  const { start_date, end_date, jenisKegiatan, search } = state.laporan.filters;
  return !!(start_date || end_date || jenisKegiatan || search);
};

export const selectCurrentFilters = (state) => ({
  start_date: state.laporan.filters.start_date,
  end_date: state.laporan.filters.end_date,
  jenisKegiatan: state.laporan.filters.jenisKegiatan,
  search: state.laporan.filters.search
});

export const selectIsChildCardExpanded = (state, childId) => 
  state.laporan.expandedCards.includes(childId);

export const selectAttendanceRecords = (state) => state.laporan.childDetail.attendanceRecords;
export const selectChildDetailFilter = (state) => state.laporan.childDetail.filter;

export default laporanSlice.reducer;