import { createSlice, createSelector } from '@reduxjs/toolkit';
import {
  fetchCpbReport,
  fetchCpbByStatus,
  initializeCpbLaporanPage,
  exportCpbData,
  exportCpbPdf
} from './cpbLaporanThunks';

const initialState = {
  // Main report data
  summary: {
    BCPB: 0,
    CPB: 0,
    NPB: 0,
    PB: 0,
    total: 0
  },
  children: [],
  currentStatus: null,
  
  // Export data
  exportData: null,
  pdfBlob: null,
  pdfFilename: null,
  
  // Loading states
  loading: false,
  childrenLoading: false,
  initializingPage: false,
  exportLoading: false,
  pdfExportLoading: false,
  
  // Error states
  error: null,
  childrenError: null,
  initializeError: null,
  exportError: null,
  pdfExportError: null,
  
  // UI state
  filters: {
    search: ''
  },
  activeTab: 'BCPB',
};

const cpbLaporanSlice = createSlice({
  name: 'cpbLaporan',
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    resetFilters: (state) => {
      state.filters = { search: '' };
    },
    
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      state.currentStatus = action.payload;
    },
    
    clearChildren: (state) => {
      state.children = [];
      state.currentStatus = null;
      state.childrenError = null;
    },
    clearExportData: (state) => {
      state.exportData = null;
      state.exportError = null;
    },
    clearPdfData: (state) => {
      state.pdfBlob = null;
      state.pdfFilename = null;
      state.pdfExportError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearChildrenError: (state) => {
      state.childrenError = null;
    },
    clearInitializeError: (state) => {
      state.initializeError = null;
    },
    clearExportError: (state) => {
      state.exportError = null;
    },
    clearPdfExportError: (state) => {
      state.pdfExportError = null;
    },
    clearAllErrors: (state) => {
      state.error = null;
      state.childrenError = null;
      state.initializeError = null;
      state.exportError = null;
      state.pdfExportError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize CPB Laporan Page
      .addCase(initializeCpbLaporanPage.pending, (state) => {
        state.initializingPage = true;
        state.initializeError = null;
      })
      .addCase(initializeCpbLaporanPage.fulfilled, (state) => {
        state.initializingPage = false;
        state.initializeError = null;
      })
      .addCase(initializeCpbLaporanPage.rejected, (state, action) => {
        state.initializingPage = false;
        state.initializeError = action.payload;
      })
      
      // Fetch CPB Report
      .addCase(fetchCpbReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCpbReport.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
        state.error = null;
      })
      .addCase(fetchCpbReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch CPB By Status
      .addCase(fetchCpbByStatus.pending, (state) => {
        state.childrenLoading = true;
        state.childrenError = null;
      })
      .addCase(fetchCpbByStatus.fulfilled, (state, action) => {
        state.childrenLoading = false;
        state.children = action.payload.children;
        state.currentStatus = action.payload.status;
        state.childrenError = null;
      })
      .addCase(fetchCpbByStatus.rejected, (state, action) => {
        state.childrenLoading = false;
        state.childrenError = action.payload;
      })
      
      // Export CPB Data (JSON)
      .addCase(exportCpbData.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportCpbData.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.exportData = action.payload;
        state.exportError = null;
      })
      .addCase(exportCpbData.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload;
      })
      
      // Export CPB PDF
      .addCase(exportCpbPdf.pending, (state) => {
        state.pdfExportLoading = true;
        state.pdfExportError = null;
      })
      .addCase(exportCpbPdf.fulfilled, (state, action) => {
        state.pdfExportLoading = false;
        state.pdfBlob = action.payload.blob;
        state.pdfFilename = action.payload.filename;
        state.pdfExportError = null;
      })
      .addCase(exportCpbPdf.rejected, (state, action) => {
        state.pdfExportLoading = false;
        state.pdfExportError = action.payload;
      });
  }
});

// Action creators
export const {
  setSearch,
  resetFilters,
  setActiveTab,
  clearChildren,
  clearExportData,
  clearPdfData,
  clearError,
  clearChildrenError,
  clearInitializeError,
  clearExportError,
  clearPdfExportError,
  clearAllErrors
} = cpbLaporanSlice.actions;

// Selectors
export const selectCpbLaporanState = (state) => state.cpbLaporan;
export const selectCpbSummary = (state) => state.cpbLaporan.summary;
export const selectCpbChildren = (state) => state.cpbLaporan.children;
export const selectCpbCurrentStatus = (state) => state.cpbLaporan.currentStatus;
export const selectCpbFilters = (state) => state.cpbLaporan.filters;
export const selectCpbActiveTab = (state) => state.cpbLaporan.activeTab;
export const selectCpbExportData = (state) => state.cpbLaporan.exportData;
export const selectCpbPdfBlob = (state) => state.cpbLaporan.pdfBlob;
export const selectCpbPdfFilename = (state) => state.cpbLaporan.pdfFilename;
export const selectCpbLoading = (state) => state.cpbLaporan.loading;
export const selectCpbChildrenLoading = (state) => state.cpbLaporan.childrenLoading;
export const selectCpbInitializingPage = (state) => state.cpbLaporan.initializingPage;
export const selectCpbExportLoading = (state) => state.cpbLaporan.exportLoading;
export const selectCpbPdfExportLoading = (state) => state.cpbLaporan.pdfExportLoading;
export const selectCpbError = (state) => state.cpbLaporan.error;
export const selectCpbChildrenError = (state) => state.cpbLaporan.childrenError;
export const selectCpbInitializeError = (state) => state.cpbLaporan.initializeError;
export const selectCpbExportError = (state) => state.cpbLaporan.exportError;
export const selectCpbPdfExportError = (state) => state.cpbLaporan.pdfExportError;

// Derived selectors
export const selectCpbHasActiveFilters = (state) => {
  const { search } = state.cpbLaporan.filters;
  return !!search;
};

export const selectCpbCurrentFilters = (state) => ({
  search: state.cpbLaporan.filters.search
});

export const selectCpbTabCounts = createSelector(
  [(state) => state.cpbLaporan.summary],
  (summary) => ({
    BCPB: summary.BCPB || 0,
    CPB: summary.CPB || 0,
    NPB: summary.NPB || 0,
    PB: summary.PB || 0
  })
);

export default cpbLaporanSlice.reducer;