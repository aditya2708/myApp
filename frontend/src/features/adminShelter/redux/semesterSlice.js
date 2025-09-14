import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { semesterApi } from '../api/semesterApi';
import { kurikulumShelterApi } from '../api/kurikulumShelterApi';

// Async thunks
export const fetchSemesterList = createAsyncThunk(
  'semester/fetchList',
  async (params) => {
    const response = await semesterApi.getAllSemesters(params);
    return response.data;
  }
);

export const fetchSemesterDetail = createAsyncThunk(
  'semester/fetchDetail',
  async (id) => {
    const response = await semesterApi.getSemesterDetail(id);
    return response.data;
  }
);

export const fetchActiveSemester = createAsyncThunk(
  'semester/fetchActive',
  async () => {
    const response = await semesterApi.getActive();
    return response.data;
  }
);

export const createSemester = createAsyncThunk(
  'semester/create',
  async (semesterData) => {
    const response = await semesterApi.createSemester(semesterData);
    return response.data;
  }
);

export const updateSemester = createAsyncThunk(
  'semester/update',
  async ({ id, semesterData }) => {
    const response = await semesterApi.updateSemester(id, semesterData);
    return response.data;
  }
);

export const deleteSemester = createAsyncThunk(
  'semester/delete',
  async (id) => {
    await semesterApi.deleteSemester(id);
    return id;
  }
);

export const setActiveSemester = createAsyncThunk(
  'semester/setActive',
  async (id) => {
    const response = await semesterApi.setActive(id);
    return response.data;
  }
);

export const fetchSemesterStatistics = createAsyncThunk(
  'semester/fetchStatistics',
  async (id) => {
    const response = await semesterApi.getStatistics(id);
    return response.data;
  }
);

export const fetchTahunAjaran = createAsyncThunk(
  'semester/fetchTahunAjaran',
  async () => {
    const response = await semesterApi.getTahunAjaran();
    return response.data;
  }
);

export const fetchKurikulumOptions = createAsyncThunk(
  'semester/fetchKurikulumOptions',
  async (params = {}) => {
    const response = await kurikulumShelterApi.getKurikulumList(params);
    return response.data;
  }
);

export const attachKurikulumToSemester = createAsyncThunk(
  'semester/attachKurikulum',
  async ({ semesterId, kurikulumId }) => {
    const response = await semesterApi.attachKurikulum(semesterId, kurikulumId);
    return response.data;
  }
);

export const detachKurikulumFromSemester = createAsyncThunk(
  'semester/detachKurikulum',
  async (semesterId) => {
    const response = await semesterApi.detachKurikulum(semesterId);
    return response.data;
  }
);

// Slice
const semesterSlice = createSlice({
  name: 'semester',
  initialState: {
    list: [],
    detail: null,
    activeSemester: null,
    statistics: null,
    tahunAjaran: [],
    kurikulumOptions: [],
    kurikulumPagination: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0
    },
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0
    },
    selectedKurikulumForSemester: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDetail: (state) => {
      state.detail = null;
    },
    clearStatistics: (state) => {
      state.statistics = null;
    },
    updateSemesterLocally: (state, action) => {
      const index = state.list.findIndex(s => s.id_semester === action.payload.id_semester);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    setSelectedKurikulumForSemester: (state, action) => {
      state.selectedKurikulumForSemester = action.payload;
    },
    clearSelectedKurikulumForSemester: (state) => {
      state.selectedKurikulumForSemester = null;
    },
    clearKurikulumOptions: (state) => {
      state.kurikulumOptions = [];
      state.kurikulumPagination = {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchSemesterList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSemesterList.fulfilled, (state, action) => {
        state.loading = false;
        const responseData = action.payload.data || {};
        state.list = responseData.data || [];
        state.pagination = {
          current_page: responseData.current_page || 1,
          last_page: responseData.last_page || 1,
          per_page: responseData.per_page || 20,
          total: responseData.total || 0
        };
      })
      .addCase(fetchSemesterList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch detail
      .addCase(fetchSemesterDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSemesterDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload.data;
      })
      .addCase(fetchSemesterDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch active
      .addCase(fetchActiveSemester.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSemester.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSemester = action.payload.data;
      })
      .addCase(fetchActiveSemester.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create
      .addCase(createSemester.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSemester.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.list) {
          state.list = [];
        }
        state.list.unshift(action.payload.data);
        // Update active semester if the new one is set as active
        if (action.payload.data.is_active) {
          state.activeSemester = action.payload.data;
          // Deactivate others
          state.list = state.list.map(s => ({
            ...s,
            is_active: s.id_semester === action.payload.data.id_semester
          }));
        }
        // Clear selected kurikulum after successful creation
        state.selectedKurikulumForSemester = null;
      })
      .addCase(createSemester.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update
      .addCase(updateSemester.fulfilled, (state, action) => {
        const index = state.list.findIndex(s => s.id_semester === action.payload.data.id_semester);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.detail?.id_semester === action.payload.data.id_semester) {
          state.detail = action.payload.data;
        }
        // Update active semester if changed
        if (action.payload.data.is_active) {
          state.activeSemester = action.payload.data;
          // Deactivate others
          state.list = state.list.map(s => ({
            ...s,
            is_active: s.id_semester === action.payload.data.id_semester
          }));
        }
      })
      // Delete
      .addCase(deleteSemester.fulfilled, (state, action) => {
        state.list = state.list.filter(s => s.id_semester !== action.payload);
        if (state.activeSemester?.id_semester === action.payload) {
          state.activeSemester = null;
        }
      })
      // Set active
      .addCase(setActiveSemester.fulfilled, (state, action) => {
        state.activeSemester = action.payload.data;
        // Update list to reflect active status
        state.list = state.list.map(s => ({
          ...s,
          is_active: s.id_semester === action.payload.data.id_semester
        }));
      })
      // Fetch statistics
      .addCase(fetchSemesterStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSemesterStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload.data;
      })
      .addCase(fetchSemesterStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch tahun ajaran
      .addCase(fetchTahunAjaran.fulfilled, (state, action) => {
        state.tahunAjaran = action.payload.data || [];
      })
      // Fetch kurikulum options
      .addCase(fetchKurikulumOptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKurikulumOptions.fulfilled, (state, action) => {
        state.loading = false;
        const responseData = action.payload.data || {};
        state.kurikulumOptions = responseData.data || [];
        state.kurikulumPagination = {
          current_page: responseData.current_page || 1,
          last_page: responseData.last_page || 1,
          per_page: responseData.per_page || 20,
          total: responseData.total || 0
        };
      })
      .addCase(fetchKurikulumOptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Attach kurikulum to semester
      .addCase(attachKurikulumToSemester.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(attachKurikulumToSemester.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSemester = action.payload.data;
        
        // Update semester in list
        const index = state.list.findIndex(s => s.id_semester === updatedSemester.id_semester);
        if (index !== -1) {
          state.list[index] = updatedSemester;
        }
        
        // Update detail if it's the same semester
        if (state.detail?.id_semester === updatedSemester.id_semester) {
          state.detail = updatedSemester;
        }
        
        // Update active semester if it's the same
        if (state.activeSemester?.id_semester === updatedSemester.id_semester) {
          state.activeSemester = updatedSemester;
        }
      })
      .addCase(attachKurikulumToSemester.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Detach kurikulum from semester
      .addCase(detachKurikulumFromSemester.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(detachKurikulumFromSemester.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSemester = action.payload.data;
        
        // Update semester in list
        const index = state.list.findIndex(s => s.id_semester === updatedSemester.id_semester);
        if (index !== -1) {
          state.list[index] = updatedSemester;
        }
        
        // Update detail if it's the same semester
        if (state.detail?.id_semester === updatedSemester.id_semester) {
          state.detail = updatedSemester;
        }
        
        // Update active semester if it's the same
        if (state.activeSemester?.id_semester === updatedSemester.id_semester) {
          state.activeSemester = updatedSemester;
        }
      })
      .addCase(detachKurikulumFromSemester.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { 
  clearError, 
  clearDetail, 
  clearStatistics,
  updateSemesterLocally,
  setSelectedKurikulumForSemester,
  clearSelectedKurikulumForSemester,
  clearKurikulumOptions
} = semesterSlice.actions;

export default semesterSlice.reducer;

// Selectors
export const selectSemesterList = (state) => state.semester.list;
export const selectSemesterDetail = (state) => state.semester.detail;
export const selectActiveSemester = (state) => state.semester.activeSemester;
export const selectSemesterStatistics = (state) => state.semester.statistics;
export const selectTahunAjaran = (state) => state.semester.tahunAjaran;
export const selectKurikulumOptions = (state) => state.semester.kurikulumOptions;
export const selectKurikulumPagination = (state) => state.semester.kurikulumPagination;
export const selectSemesterLoading = (state) => state.semester.loading;
export const selectSemesterError = (state) => state.semester.error;
export const selectSemesterPagination = (state) => state.semester.pagination;
export const selectSelectedKurikulumForSemester = (state) => state.semester.selectedKurikulumForSemester;