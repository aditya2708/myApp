import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { kurikulumShelterApi } from '../api/kurikulumShelterApi';

const normalizeKurikulumList = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const getKurikulumId = (item) => item?.id_kurikulum ?? item?.id;

// Async thunks
export const fetchKurikulumList = createAsyncThunk(
  'kurikulumShelter/fetchList',
  async ({ params } = {}) => {
    const response = await kurikulumShelterApi.getKurikulumList(params);
    return response.data;
  },
  {
    condition: (arg = {}, { getState }) => {
      const { force } = arg;
      const state = getState().kurikulumShelter;

      if (state.loading) {
        return false;
      }

      if (force) {
        return true;
      }

      return state.isStale;
    }
  }
);

export const fetchKurikulumDetail = createAsyncThunk(
  'kurikulumShelter/fetchDetail',
  async (id) => {
    const response = await kurikulumShelterApi.getKurikulumDetail(id);
    return response.data;
  }
);

export const fetchKurikulumPreview = createAsyncThunk(
  'kurikulumShelter/fetchPreview',
  async (id) => {
    const response = await kurikulumShelterApi.getKurikulumPreview(id);
    return response.data;
  }
);

export const fetchKurikulumDropdown = createAsyncThunk(
  'kurikulumShelter/fetchDropdown',
  async () => {
    const response = await kurikulumShelterApi.getForDropdown();
    return response.data;
  }
);

// Slice
const kurikulumShelterSlice = createSlice({
  name: 'kurikulumShelter',
  initialState: {
    list: [],
    detail: null,
    preview: null,
    dropdown: [],
    selectedKurikulum: null,
    activeKurikulum: null,
    loading: false,
    error: null,
    lastFetchedAt: null,
    isStale: true
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDetail: (state) => {
      state.detail = null;
    },
    clearPreview: (state) => {
      state.preview = null;
    },
    setSelectedKurikulum: (state, action) => {
      state.selectedKurikulum = action.payload;
    },
    clearSelectedKurikulum: (state) => {
      state.selectedKurikulum = null;
    },
    markKurikulumListStale: (state) => {
      state.isStale = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchKurikulumList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKurikulumList.fulfilled, (state, action) => {
        state.loading = false;
        const list = normalizeKurikulumList(action.payload) || [];
        state.list = list;

        const activeKurikulum = list.find((item) => item?.is_active) || null;
        state.activeKurikulum = activeKurikulum || null;

        if (state.selectedKurikulum) {
          const selectedId = getKurikulumId(state.selectedKurikulum);
          const updatedSelected = list.find(
            (item) => getKurikulumId(item)?.toString() === selectedId?.toString()
          );

          if (updatedSelected) {
            state.selectedKurikulum = updatedSelected;
          } else if (activeKurikulum) {
            state.selectedKurikulum = activeKurikulum;
          } else {
            state.selectedKurikulum = null;
          }
        } else if (activeKurikulum) {
          state.selectedKurikulum = activeKurikulum;
        }

        state.lastFetchedAt = Date.now();
        state.isStale = false;
      })
      .addCase(fetchKurikulumList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.isStale = true;
      })
      // Fetch detail
      .addCase(fetchKurikulumDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKurikulumDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload.data;
      })
      .addCase(fetchKurikulumDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch preview
      .addCase(fetchKurikulumPreview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKurikulumPreview.fulfilled, (state, action) => {
        state.loading = false;
        state.preview = action.payload.data;
      })
      .addCase(fetchKurikulumPreview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch dropdown
      .addCase(fetchKurikulumDropdown.fulfilled, (state, action) => {
        state.dropdown = action.payload.data || [];
      });
  }
});

export const {
  clearError,
  clearDetail,
  clearPreview,
  setSelectedKurikulum,
  clearSelectedKurikulum,
  markKurikulumListStale
} = kurikulumShelterSlice.actions;

export default kurikulumShelterSlice.reducer;

// Selectors
export const selectKurikulumList = (state) => state.kurikulumShelter.list;
export const selectKurikulumDetail = (state) => state.kurikulumShelter.detail;
export const selectKurikulumPreview = (state) => state.kurikulumShelter.preview;
export const selectKurikulumDropdown = (state) => state.kurikulumShelter.dropdown;
export const selectSelectedKurikulum = (state) => state.kurikulumShelter.selectedKurikulum;
export const selectKurikulumLoading = (state) => state.kurikulumShelter.loading;
export const selectKurikulumError = (state) => state.kurikulumShelter.error;
export const selectActiveKurikulum = (state) => state.kurikulumShelter.activeKurikulum;
export const selectKurikulumLastFetchedAt = (state) => state.kurikulumShelter.lastFetchedAt;
export const selectKurikulumIsStale = (state) => state.kurikulumShelter.isStale;