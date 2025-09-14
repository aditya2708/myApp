import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tutorCompetencyApi } from '../api/tutorCompetencyApi';

const initialState = {
  competencies: [],
  selectedCompetency: null,
  jenisKompetensi: [],
  status: 'idle',
  error: null,
  actionStatus: {
    create: 'idle',
    update: 'idle',
    delete: 'idle'
  },
  actionError: {
    create: null,
    update: null,
    delete: null
  }
};

export const fetchJenisKompetensi = createAsyncThunk(
  'tutorCompetency/fetchJenisKompetensi',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorCompetencyApi.getJenisKompetensi();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch jenis kompetensi');
    }
  }
);

export const fetchCompetencies = createAsyncThunk(
  'tutorCompetency/fetchCompetencies',
  async (tutorId, { rejectWithValue }) => {
    try {
      const response = await tutorCompetencyApi.getCompetencies(tutorId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch competencies');
    }
  }
);

export const fetchCompetencyDetail = createAsyncThunk(
  'tutorCompetency/fetchCompetencyDetail',
  async ({ tutorId, competencyId }, { rejectWithValue }) => {
    try {
      const response = await tutorCompetencyApi.getCompetencyDetail(tutorId, competencyId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch competency detail');
    }
  }
);

export const createCompetency = createAsyncThunk(
  'tutorCompetency/createCompetency',
  async ({ tutorId, competencyData }, { rejectWithValue }) => {
    try {
      const response = await tutorCompetencyApi.createCompetency(tutorId, competencyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create competency');
    }
  }
);

export const updateCompetency = createAsyncThunk(
  'tutorCompetency/updateCompetency',
  async ({ tutorId, competencyId, competencyData }, { rejectWithValue }) => {
    try {
      const response = await tutorCompetencyApi.updateCompetency(tutorId, competencyId, competencyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update competency');
    }
  }
);

export const deleteCompetency = createAsyncThunk(
  'tutorCompetency/deleteCompetency',
  async ({ tutorId, competencyId }, { rejectWithValue }) => {
    try {
      const response = await tutorCompetencyApi.deleteCompetency(tutorId, competencyId);
      return { competencyId, response: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete competency');
    }
  }
);

const tutorCompetencySlice = createSlice({
  name: 'tutorCompetency',
  initialState,
  reducers: {
    resetCompetencyDetail: (state) => {
      state.selectedCompetency = null;
    },
    resetStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
    resetActionStatus: (state, action) => {
      const actionType = action.payload;
      if (actionType && state.actionStatus[actionType]) {
        state.actionStatus[actionType] = 'idle';
        state.actionError[actionType] = null;
      } else {
        Object.keys(state.actionStatus).forEach(key => {
          state.actionStatus[key] = 'idle';
          state.actionError[key] = null;
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJenisKompetensi.fulfilled, (state, action) => {
        state.jenisKompetensi = action.payload.data || [];
      })
      
      .addCase(fetchCompetencies.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCompetencies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.competencies = action.payload.data || [];
      })
      .addCase(fetchCompetencies.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch competencies';
      })
      
      .addCase(fetchCompetencyDetail.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCompetencyDetail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedCompetency = action.payload.data;
      })
      .addCase(fetchCompetencyDetail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch competency detail';
      })
      
      .addCase(createCompetency.pending, (state) => {
        state.actionStatus.create = 'loading';
      })
      .addCase(createCompetency.fulfilled, (state, action) => {
        state.actionStatus.create = 'succeeded';
        state.competencies.unshift(action.payload.data);
      })
      .addCase(createCompetency.rejected, (state, action) => {
        state.actionStatus.create = 'failed';
        state.actionError.create = action.payload || 'Failed to create competency';
      })
      
      .addCase(updateCompetency.pending, (state) => {
        state.actionStatus.update = 'loading';
      })
      .addCase(updateCompetency.fulfilled, (state, action) => {
        state.actionStatus.update = 'succeeded';
        const index = state.competencies.findIndex(c => c.id_competency === action.payload.data.id_competency);
        if (index !== -1) {
          state.competencies[index] = action.payload.data;
        }
        if (state.selectedCompetency && state.selectedCompetency.id_competency === action.payload.data.id_competency) {
          state.selectedCompetency = action.payload.data;
        }
      })
      .addCase(updateCompetency.rejected, (state, action) => {
        state.actionStatus.update = 'failed';
        state.actionError.update = action.payload || 'Failed to update competency';
      })
      
      .addCase(deleteCompetency.pending, (state) => {
        state.actionStatus.delete = 'loading';
      })
      .addCase(deleteCompetency.fulfilled, (state, action) => {
        state.actionStatus.delete = 'succeeded';
        state.competencies = state.competencies.filter(c => c.id_competency !== action.payload.competencyId);
        if (state.selectedCompetency && state.selectedCompetency.id_competency === action.payload.competencyId) {
          state.selectedCompetency = null;
        }
      })
      .addCase(deleteCompetency.rejected, (state, action) => {
        state.actionStatus.delete = 'failed';
        state.actionError.delete = action.payload || 'Failed to delete competency';
      });
  }
});

export const {
  resetCompetencyDetail,
  resetStatus,
  resetActionStatus
} = tutorCompetencySlice.actions;

export const selectCompetencies = state => state.tutorCompetency.competencies;
export const selectSelectedCompetency = state => state.tutorCompetency.selectedCompetency;
export const selectJenisKompetensi = state => state.tutorCompetency.jenisKompetensi;
export const selectCompetencyStatus = state => state.tutorCompetency.status;
export const selectCompetencyError = state => state.tutorCompetency.error;
export const selectCompetencyActionStatus = (state, action) => state.tutorCompetency.actionStatus[action];
export const selectCompetencyActionError = (state, action) => state.tutorCompetency.actionError[action];

export default tutorCompetencySlice.reducer;