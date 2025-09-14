import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { raportApi } from '../api/raportApi';

// Async thunks
export const fetchRaportList = createAsyncThunk(
  'raport/fetchList',
  async (params) => {
    const response = await raportApi.getAllRaport(params);
    return response.data;
  }
);

export const fetchRaportByAnak = createAsyncThunk(
  'raport/fetchByAnak',
  async (idAnak) => {
    const response = await raportApi.getRaportByAnak(idAnak);
    return response.data;
  }
);

export const fetchRaportDetail = createAsyncThunk(
  'raport/fetchDetail',
  async (id) => {
    const response = await raportApi.getRaportDetail(id);
    return response.data;
  }
);

export const generateRaport = createAsyncThunk(
  'raport/generate',
  async (raportData) => {
    const response = await raportApi.generateRaport(raportData);
    return response.data;
  }
);

export const updateRaport = createAsyncThunk(
  'raport/update',
  async ({ id, raportData }) => {
    const response = await raportApi.updateRaport(id, raportData);
    return response.data;
  }
);

export const publishRaport = createAsyncThunk(
  'raport/publish',
  async (id) => {
    const response = await raportApi.publishRaport(id);
    return response.data;
  }
);

export const archiveRaport = createAsyncThunk(
  'raport/archive',
  async (id) => {
    const response = await raportApi.archiveRaport(id);
    return response.data;
  }
);

export const deleteRaport = createAsyncThunk(
  'raport/delete',
  async (id) => {
    await raportApi.deleteRaport(id);
    return id;
  }
);

export const fetchPreviewData = createAsyncThunk(
  'raport/fetchPreview',
  async ({ idAnak, idSemester }) => {
    const response = await raportApi.getPreviewData(idAnak, idSemester);
    return response.data;
  }
);

export const checkExistingRaport = createAsyncThunk(
  'raport/checkExisting',
  async ({ idAnak, idSemester }) => {
    const response = await raportApi.checkExistingRaport(idAnak, idSemester);
    return response.data;
  }
);

export const updateRaportDetail = createAsyncThunk(
  'raport/updateDetail',
  async ({ idRaport, idDetail, detailData }) => {
    const response = await raportApi.updateRaportDetail(idRaport, idDetail, detailData);
    return response.data;
  }
);

export const fetchNilaiSikap = createAsyncThunk(
  'raport/fetchNilaiSikap',
  async ({ idAnak, idSemester }) => {
    const response = await raportApi.getNilaiSikap(idAnak, idSemester);
    return response.data;
  }
);

export const createNilaiSikap = createAsyncThunk(
  'raport/createNilaiSikap',
  async (nilaiSikapData) => {
    const response = await raportApi.createNilaiSikap(nilaiSikapData);
    return response.data;
  }
);

export const updateNilaiSikap = createAsyncThunk(
  'raport/updateNilaiSikap',
  async ({ id, nilaiSikapData }) => {
    const response = await raportApi.updateNilaiSikap(id, nilaiSikapData);
    return response.data;
  }
);

// Slice
const raportSlice = createSlice({
  name: 'raport',
  initialState: {
    list: [],
    byAnak: {},
    detail: null,
    previewData: null,
    nilaiSikap: null,
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDetail: (state) => {
      state.detail = null;
    },
    clearPreviewData: (state) => {
      state.previewData = null;
    },
    clearNilaiSikap: (state) => {
      state.nilaiSikap = null;
    },
    updateRaportLocally: (state, action) => {
      const index = state.list.findIndex(r => r.id_raport === action.payload.id_raport);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchRaportList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRaportList.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.pagination = {
          current_page: action.payload.current_page || 1,
          last_page: action.payload.last_page || 1,
          per_page: action.payload.per_page || 20,
          total: action.payload.total || 0
        };
      })
      .addCase(fetchRaportList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch by anak
      .addCase(fetchRaportByAnak.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRaportByAnak.fulfilled, (state, action) => {
        state.loading = false;
        state.byAnak[action.meta.arg] = action.payload.data || [];
      })
      .addCase(fetchRaportByAnak.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch detail
      .addCase(fetchRaportDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRaportDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload.data;
      })
      .addCase(fetchRaportDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Generate
      .addCase(generateRaport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateRaport.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload.data);
      })
      .addCase(generateRaport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update
      .addCase(updateRaport.fulfilled, (state, action) => {
        const index = state.list.findIndex(r => r.id_raport === action.payload.data.id_raport);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.detail?.id_raport === action.payload.data.id_raport) {
          state.detail = action.payload.data;
        }
      })
      // Publish
      .addCase(publishRaport.fulfilled, (state, action) => {
        const index = state.list.findIndex(r => r.id_raport === action.payload.data.id_raport);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.detail?.id_raport === action.payload.data.id_raport) {
          state.detail = action.payload.data;
        }
      })
      // Archive
      .addCase(archiveRaport.fulfilled, (state, action) => {
        const index = state.list.findIndex(r => r.id_raport === action.payload.data.id_raport);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.detail?.id_raport === action.payload.data.id_raport) {
          state.detail = action.payload.data;
        }
      })
      // Delete
      .addCase(deleteRaport.fulfilled, (state, action) => {
        state.list = state.list.filter(r => r.id_raport !== action.payload);
      })
      // Fetch preview
      .addCase(fetchPreviewData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPreviewData.fulfilled, (state, action) => {
        state.loading = false;
        state.previewData = action.payload.data;
      })
      .addCase(fetchPreviewData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update detail
      .addCase(updateRaportDetail.fulfilled, (state, action) => {
        if (state.detail) {
          const index = state.detail.raportDetail.findIndex(
            d => d.id_raport_detail === action.payload.data.id_raport_detail
          );
          if (index !== -1) {
            state.detail.raportDetail[index] = action.payload.data;
          }
        }
      })
      // Fetch nilai sikap
      .addCase(fetchNilaiSikap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNilaiSikap.fulfilled, (state, action) => {
        state.loading = false;
        state.nilaiSikap = action.payload.data;
      })
      .addCase(fetchNilaiSikap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create nilai sikap
      .addCase(createNilaiSikap.fulfilled, (state, action) => {
        state.nilaiSikap = action.payload.data;
      })
      // Update nilai sikap
      .addCase(updateNilaiSikap.fulfilled, (state, action) => {
        state.nilaiSikap = action.payload.data;
      });
  }
});

export const { 
  clearError, 
  clearDetail, 
  clearPreviewData, 
  clearNilaiSikap,
  updateRaportLocally 
} = raportSlice.actions;
export default raportSlice.reducer;

// Selectors
export const selectRaportList = (state) => state.raport.list;
export const selectRaportByAnak = (idAnak) => (state) => state.raport.byAnak[idAnak] || [];
export const selectRaportDetail = (state) => state.raport.detail;
export const selectRaportPreviewData = (state) => state.raport.previewData;
export const selectNilaiSikap = (state) => state.raport.nilaiSikap;
export const selectRaportLoading = (state) => state.raport.loading;
export const selectRaportError = (state) => state.raport.error;
export const selectRaportPagination = (state) => state.raport.pagination;