import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { kurikulumShelterApi } from '../api/kurikulumShelterApi';

// Async thunks
export const fetchKurikulumList = createAsyncThunk(
  'kurikulumShelter/fetchList',
  async (params) => {
    const response = await kurikulumShelterApi.getAllKurikulum(params);
    return response.data;
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
    loading: false,
    error: null
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
        state.list = action.payload.data || [];
      })
      .addCase(fetchKurikulumList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
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
  clearSelectedKurikulum
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