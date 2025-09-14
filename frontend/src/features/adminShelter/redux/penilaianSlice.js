import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { penilaianApi } from '../api/penilaianApi';

// Async thunks
export const fetchPenilaianList = createAsyncThunk(
  'penilaian/fetchList',
  async (params) => {
    const response = await penilaianApi.getAllPenilaian(params);
    return response.data;
  }
);

export const fetchPenilaianByAnakSemester = createAsyncThunk(
  'penilaian/fetchByAnakSemester',
  async ({ idAnak, idSemester }) => {
    const response = await penilaianApi.getByAnakSemester(idAnak, idSemester);
    return response.data;
  }
);

export const fetchPenilaianDetail = createAsyncThunk(
  'penilaian/fetchDetail',
  async (id) => {
    const response = await penilaianApi.getPenilaianDetail(id);
    return response.data;
  }
);

export const createPenilaian = createAsyncThunk(
  'penilaian/create',
  async (penilaianData) => {
    const response = await penilaianApi.createPenilaian(penilaianData);
    return response.data;
  }
);

export const updatePenilaian = createAsyncThunk(
  'penilaian/update',
  async ({ id, penilaianData }) => {
    const response = await penilaianApi.updatePenilaian(id, penilaianData);
    return response.data;
  }
);

export const deletePenilaian = createAsyncThunk(
  'penilaian/delete',
  async (id) => {
    await penilaianApi.deletePenilaian(id);
    return id;
  }
);

export const bulkCreatePenilaian = createAsyncThunk(
  'penilaian/bulkCreate',
  async (penilaianArray) => {
    const response = await penilaianApi.bulkCreatePenilaian(penilaianArray);
    return response.data;
  }
);

export const calculateNilaiAkhir = createAsyncThunk(
  'penilaian/calculateNilaiAkhir',
  async ({ idAnak, idSemester, mataPelajaran }) => {
    const response = await penilaianApi.calculateNilaiAkhir(idAnak, idSemester, mataPelajaran);
    return response.data;
  }
);

export const fetchJenisPenilaian = createAsyncThunk(
  'penilaian/fetchJenisPenilaian',
  async () => {
    const response = await penilaianApi.getJenisPenilaian();
    return response.data;
  }
);

// Slice
const penilaianSlice = createSlice({
  name: 'penilaian',
  initialState: {
    list: [],
    byAnakSemester: {},
    detail: null,
    jenisPenilaian: [],
    nilaiAkhirCalc: null,
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
    clearNilaiAkhirCalc: (state) => {
      state.nilaiAkhirCalc = null;
    },
    updatePenilaianLocally: (state, action) => {
      const index = state.list.findIndex(p => p.id_penilaian === action.payload.id_penilaian);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchPenilaianList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPenilaianList.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.pagination = {
          current_page: action.payload.current_page || 1,
          last_page: action.payload.last_page || 1,
          per_page: action.payload.per_page || 20,
          total: action.payload.total || 0
        };
      })
      .addCase(fetchPenilaianList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch by anak semester
      .addCase(fetchPenilaianByAnakSemester.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPenilaianByAnakSemester.fulfilled, (state, action) => {
        state.loading = false;
        const key = `${action.meta.arg.idAnak}_${action.meta.arg.idSemester}`;
        state.byAnakSemester[key] = action.payload.data || {};
      })
      .addCase(fetchPenilaianByAnakSemester.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch detail
      .addCase(fetchPenilaianDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPenilaianDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload.data;
      })
      .addCase(fetchPenilaianDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create
      .addCase(createPenilaian.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPenilaian.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload.data);
      })
      .addCase(createPenilaian.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update
      .addCase(updatePenilaian.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id_penilaian === action.payload.data.id_penilaian);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.detail?.id_penilaian === action.payload.data.id_penilaian) {
          state.detail = action.payload.data;
        }
      })
      // Delete
      .addCase(deletePenilaian.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id_penilaian !== action.payload);
      })
      // Bulk create
      .addCase(bulkCreatePenilaian.fulfilled, (state, action) => {
        state.list = [...action.payload.data, ...state.list];
      })
      // Calculate nilai akhir
      .addCase(calculateNilaiAkhir.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateNilaiAkhir.fulfilled, (state, action) => {
        state.loading = false;
        state.nilaiAkhirCalc = action.payload.data;
      })
      .addCase(calculateNilaiAkhir.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch jenis penilaian
      .addCase(fetchJenisPenilaian.fulfilled, (state, action) => {
        state.jenisPenilaian = action.payload.data || [];
      });
  }
});

export const { clearError, clearDetail, clearNilaiAkhirCalc, updatePenilaianLocally } = penilaianSlice.actions;
export default penilaianSlice.reducer;

// Selectors
export const selectPenilaianList = (state) => state.penilaian.list;
export const selectPenilaianByAnakSemester = (idAnak, idSemester) => (state) => 
  state.penilaian.byAnakSemester[`${idAnak}_${idSemester}`] || {};
export const selectPenilaianDetail = (state) => state.penilaian.detail;
export const selectJenisPenilaian = (state) => state.penilaian.jenisPenilaian;
export const selectNilaiAkhirCalc = (state) => state.penilaian.nilaiAkhirCalc;
export const selectPenilaianLoading = (state) => state.penilaian.loading;
export const selectPenilaianError = (state) => state.penilaian.error;
export const selectPenilaianPagination = (state) => state.penilaian.pagination;