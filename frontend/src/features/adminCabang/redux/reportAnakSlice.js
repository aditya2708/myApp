import { createSlice, createSelector } from '@reduxjs/toolkit';
import {
  initializeReportAnak,
  fetchReportAnakList,
  fetchMoreReportAnak,
  fetchReportAnakChildDetail,
  fetchShelterOptionsByWilayah
} from './reportAnakThunks';

const initialState = {
  children: [],
  summary: null,
  pagination: null,
  hasMore: false,
  hasFetched: false,

  filters: {
    start_date: null,
    end_date: null,
    jenisKegiatan: null,
    wilayahBinaan: null,
    shelter: null,
    search: '',
  },

  filterOptions: {
    jenisKegiatan: [],
    wilayahBinaan: [],
    sheltersByWilayah: {},
    sheltersLoading: false,
    sheltersError: null,
  },

  loading: false,
  loadingMore: false,
  initializing: false,
  error: null,

  detail: {
    child: null,
    summary: null,
    activities: [],
    monthlyData: null,
    metadata: {},
    loading: false,
    error: null,
  },
};

const reportAnakSlice = createSlice({
  name: 'reportAnak',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setDateRange: (state, action) => {
      const { start_date = null, end_date = null } = action.payload || {};
      state.filters.start_date = start_date;
      state.filters.end_date = end_date;
    },
    setJenisKegiatan: (state, action) => {
      state.filters.jenisKegiatan = action.payload ?? null;
    },
    setWilayahBinaan: (state, action) => {
      state.filters.wilayahBinaan = action.payload ?? null;
      state.filters.shelter = null;
    },
    setShelter: (state, action) => {
      state.filters.shelter = action.payload ?? null;
    },
    setSearch: (state, action) => {
      state.filters.search = action.payload ?? '';
    },
    resetFilters: (state) => {
      state.filters = { ...initialState.filters };
      state.children = [];
      state.summary = null;
      state.pagination = null;
      state.hasMore = false;
      state.error = null;
      state.hasFetched = false;
    },
    clearDetail: (state) => {
      state.detail = { ...initialState.detail };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDetailError: (state) => {
      state.detail.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeReportAnak.pending, (state) => {
        state.initializing = true;
        state.error = null;
        state.children = [];
        state.summary = null;
        state.pagination = null;
        state.hasMore = false;
        state.hasFetched = false;
      })
      .addCase(initializeReportAnak.fulfilled, (state, action) => {
        state.initializing = false;
        const incomingOptions = action.payload?.filterOptions || {};

        state.filterOptions = {
          ...state.filterOptions,
          ...incomingOptions,
          sheltersByWilayah: {
            ...state.filterOptions.sheltersByWilayah,
            ...(incomingOptions.sheltersByWilayah || {}),
          },
          sheltersLoading: false,
          sheltersError: null,
        };
        state.hasFetched = false;
      })
      .addCase(initializeReportAnak.rejected, (state, action) => {
        state.initializing = false;
        state.error = action.payload || 'Gagal memuat opsi filter laporan anak.';
      })

      .addCase(fetchReportAnakList.pending, (state, action) => {
        const isFirstPage = !action.meta.arg || action.meta.arg.page === 1;
        const isAppend = Boolean(action.meta.arg?.append);

        if (isFirstPage && !isAppend) {
          state.loading = true;
          state.hasFetched = true;
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchReportAnakList.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.hasFetched = true;

        const { append, children, summary, pagination, filterOptions } = action.payload;

        if (append) {
          state.children = [...state.children, ...(children || [])];
        } else {
          state.children = children || [];
        }

        state.summary = summary || state.summary;
        state.pagination = pagination || state.pagination;
        state.hasMore = Boolean(
          pagination &&
          pagination.current_page < pagination.last_page
        );

        if (filterOptions) {
          state.filterOptions = {
            ...state.filterOptions,
            ...filterOptions,
            sheltersByWilayah: {
              ...state.filterOptions.sheltersByWilayah,
              ...(filterOptions.sheltersByWilayah || {}),
            },
            sheltersLoading: false,
            sheltersError: null,
          };
        }
      })
      .addCase(fetchReportAnakList.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload || 'Gagal memuat daftar anak.';
        state.hasFetched = true;
      })

      .addCase(fetchMoreReportAnak.pending, (state) => {
        state.loadingMore = true;
        state.error = null;
      })
      .addCase(fetchMoreReportAnak.fulfilled, (state, action) => {
        state.loadingMore = false;
        const { children, pagination, summary } = action.payload;
        state.children = [...state.children, ...(children || [])];
        state.summary = summary || state.summary;
        state.pagination = pagination || state.pagination;
        state.hasMore = Boolean(
          pagination &&
          pagination.current_page < pagination.last_page
        );
      })
      .addCase(fetchMoreReportAnak.rejected, (state, action) => {
        state.loadingMore = false;
        state.error = action.payload || 'Gagal memuat data tambahan.';
      })

      .addCase(fetchReportAnakChildDetail.pending, (state) => {
        state.detail.loading = true;
        state.detail.error = null;
      })
      .addCase(fetchReportAnakChildDetail.fulfilled, (state, action) => {
        state.detail.loading = false;
        state.detail = {
          ...state.detail,
          child: action.payload.child || null,
          summary: action.payload.summary || null,
          activities: action.payload.activities || [],
          monthlyData: action.payload.monthlyData || null,
          metadata: action.payload.metadata || {},
          error: null,
        };
      })
      .addCase(fetchReportAnakChildDetail.rejected, (state, action) => {
        state.detail.loading = false;
        state.detail.error = action.payload || 'Gagal memuat detail anak.';
      })

      .addCase(fetchShelterOptionsByWilayah.pending, (state) => {
        state.filterOptions.sheltersLoading = true;
        state.filterOptions.sheltersError = null;
      })
      .addCase(fetchShelterOptionsByWilayah.fulfilled, (state, action) => {
        state.filterOptions.sheltersLoading = false;
        const wilbinId = action.meta.arg;
        state.filterOptions.sheltersByWilayah = {
          ...state.filterOptions.sheltersByWilayah,
          [wilbinId]: action.payload || [],
        };
      })
      .addCase(fetchShelterOptionsByWilayah.rejected, (state, action) => {
        state.filterOptions.sheltersLoading = false;
        state.filterOptions.sheltersError = action.payload || 'Gagal memuat daftar shelter.';
      });
  },
});

export const {
  setFilters,
  setDateRange,
  setJenisKegiatan,
  setWilayahBinaan,
  setShelter,
  setSearch,
  resetFilters,
  clearDetail,
  clearError,
  clearDetailError,
} = reportAnakSlice.actions;

const selectReportAnakState = (state) => state.reportAnak;

export const selectReportAnakChildren = createSelector(
  selectReportAnakState,
  (state) => state.children
);

export const selectReportAnakSummary = createSelector(
  selectReportAnakState,
  (state) => state.summary
);

export const selectReportAnakPagination = createSelector(
  selectReportAnakState,
  (state) => state.pagination
);

export const selectReportAnakHasMore = createSelector(
  selectReportAnakState,
  (state) => state.hasMore
);

export const selectReportAnakHasFetched = createSelector(
  selectReportAnakState,
  (state) => state.hasFetched
);

export const selectReportAnakFilters = createSelector(
  selectReportAnakState,
  (state) => state.filters
);

export const selectReportAnakFilterOptions = createSelector(
  selectReportAnakState,
  (state) => state.filterOptions
);

export const selectReportAnakLoadingStates = createSelector(
  selectReportAnakState,
  ({ loading, loadingMore, initializing }) => ({ loading, loadingMore, initializing })
);

export const selectReportAnakError = createSelector(
  selectReportAnakState,
  (state) => state.error
);

export const selectReportAnakDetail = createSelector(
  selectReportAnakState,
  (state) => state.detail
);

export default reportAnakSlice.reducer;
