import { createSlice } from '@reduxjs/toolkit';
import {
  fetchLaporanHistori,
  fetchHistoriDetail,
  fetchJenisHistoriOptions,
  fetchAvailableYears,
  initializeHistoriLaporanPage,
  updateFiltersAndRefreshAll
} from './historiLaporanThunks';

const initialState = {
  historiList: [],
  summary: null,
  pagination: null,
  filterOptions: {
    availableYears: [],
    availableJenisHistori: []
  },
  
  selectedHistori: null,
  
  loading: false,
  detailLoading: false,
  filterOptionsLoading: false,
  initializingPage: false,
  refreshingAll: false,
  
  error: null,
  detailError: null,
  filterOptionsError: null,
  initializeError: null,
  refreshAllError: null,
  
  filters: {
    start_date: null,
    end_date: null,
    jenis_histori: null,
    search: ''
  },
  expandedCards: [],
};

const historiLaporanSlice = createSlice({
  name: 'historiLaporan',
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
    setJenisHistori: (state, action) => {
      state.filters.jenis_histori = action.payload;
    },
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        start_date: null,
        end_date: null,
        jenis_histori: null,
        search: ''
      };
    },
    
    toggleCardExpanded: (state, action) => {
      const historiId = action.payload;
      const index = state.expandedCards.indexOf(historiId);
      if (index > -1) {
        state.expandedCards.splice(index, 1);
      } else {
        state.expandedCards.push(historiId);
      }
    },
    setCardExpanded: (state, action) => {
      const { historiId, expanded } = action.payload;
      const index = state.expandedCards.indexOf(historiId);
      if (expanded && index === -1) {
        state.expandedCards.push(historiId);
      } else if (!expanded && index > -1) {
        state.expandedCards.splice(index, 1);
      }
    },
    expandAllCards: (state) => {
      state.expandedCards = state.historiList.map(histori => histori.id_histori);
    },
    collapseAllCards: (state) => {
      state.expandedCards = [];
    },
    
    clearSelectedHistori: (state) => {
      state.selectedHistori = null;
      state.detailError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDetailError: (state) => {
      state.detailError = null;
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
      state.detailError = null;
      state.filterOptionsError = null;
      state.initializeError = null;
      state.refreshAllError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeHistoriLaporanPage.pending, (state) => {
        state.initializingPage = true;
        state.initializeError = null;
      })
      .addCase(initializeHistoriLaporanPage.fulfilled, (state) => {
        state.initializingPage = false;
        state.initializeError = null;
      })
      .addCase(initializeHistoriLaporanPage.rejected, (state, action) => {
        state.initializingPage = false;
        state.initializeError = action.payload;
      })
      
      .addCase(updateFiltersAndRefreshAll.pending, (state) => {
        state.refreshingAll = true;
        state.refreshAllError = null;
        state.error = null;
      })
      .addCase(updateFiltersAndRefreshAll.fulfilled, (state, action) => {
        state.refreshingAll = false;
        state.refreshAllError = null;
        state.error = null;
        
        if (action.payload.historiData) {
          if (action.payload.append) {
            state.historiList = [...state.historiList, ...action.payload.historiData.histori_list];
          } else {
            state.historiList = action.payload.historiData.histori_list;
          }
          state.summary = action.payload.historiData.summary;
          state.pagination = action.payload.historiData.pagination;
          state.filterOptions = { ...state.filterOptions, ...action.payload.historiData.filter_options };
        }
      })
      .addCase(updateFiltersAndRefreshAll.rejected, (state, action) => {
        state.refreshingAll = false;
        state.refreshAllError = action.payload;
      })
      
      .addCase(fetchLaporanHistori.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLaporanHistori.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.append) {
          state.historiList = [...state.historiList, ...action.payload.histori_list];
        } else {
          state.historiList = action.payload.histori_list;
        }
        state.summary = action.payload.summary;
        state.pagination = action.payload.pagination;
        state.filterOptions = { ...state.filterOptions, ...action.payload.filter_options };
        state.error = null;
      })
      .addCase(fetchLaporanHistori.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchHistoriDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchHistoriDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedHistori = action.payload;
        state.detailError = null;
      })
      .addCase(fetchHistoriDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      })
      
      .addCase(fetchJenisHistoriOptions.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchJenisHistoriOptions.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions.availableJenisHistori = action.payload;
        state.filterOptionsError = null;
      })
      .addCase(fetchJenisHistoriOptions.rejected, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptionsError = action.payload;
      })
      
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

export const {
  setFilters,
  setStartDate,
  setEndDate,
  setJenisHistori,
  setSearch,
  resetFilters,
  toggleCardExpanded,
  setCardExpanded,
  expandAllCards,
  collapseAllCards,
  clearSelectedHistori,
  clearError,
  clearDetailError,
  clearFilterOptionsError,
  clearInitializeError,
  clearRefreshAllError,
  clearAllErrors
} = historiLaporanSlice.actions;

// Selectors
export const selectHistoriLaporanState = (state) => state.historiLaporan;
export const selectHistoriList = (state) => state.historiLaporan.historiList;
export const selectSummary = (state) => state.historiLaporan.summary;
export const selectPagination = (state) => state.historiLaporan.pagination;
export const selectFilterOptions = (state) => state.historiLaporan.filterOptions;
export const selectFilters = (state) => state.historiLaporan.filters;
export const selectExpandedCards = (state) => state.historiLaporan.expandedCards;
export const selectSelectedHistori = (state) => state.historiLaporan.selectedHistori;
export const selectLoading = (state) => state.historiLaporan.loading;
export const selectDetailLoading = (state) => state.historiLaporan.detailLoading;
export const selectFilterOptionsLoading = (state) => state.historiLaporan.filterOptionsLoading;
export const selectInitializingPage = (state) => state.historiLaporan.initializingPage;
export const selectRefreshingAll = (state) => state.historiLaporan.refreshingAll;
export const selectError = (state) => state.historiLaporan.error;
export const selectDetailError = (state) => state.historiLaporan.detailError;
export const selectFilterOptionsError = (state) => state.historiLaporan.filterOptionsError;
export const selectInitializeError = (state) => state.historiLaporan.initializeError;
export const selectRefreshAllError = (state) => state.historiLaporan.refreshAllError;

export const selectIsHistoriCardExpanded = (state, historiId) => 
  state.historiLaporan.expandedCards.includes(historiId);

export const selectCurrentFilters = (state) => ({
  start_date: state.historiLaporan.filters.start_date,
  end_date: state.historiLaporan.filters.end_date,
  jenis_histori: state.historiLaporan.filters.jenis_histori,
  search: state.historiLaporan.filters.search
});

export const selectHasActiveFilters = (state) => {
  const { start_date, end_date, jenis_histori, search } = state.historiLaporan.filters;
  return !!(start_date || end_date || jenis_histori || search);
};

export default historiLaporanSlice.reducer;