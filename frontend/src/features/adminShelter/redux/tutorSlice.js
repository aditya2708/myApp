import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { adminShelterTutorApi } from '../api/adminShelterTutorApi';

// Initial state
const initialState = {
  tutorList: [],
  selectedTutor: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  currentPage: 1,
  totalPages: 1,
  total: 0,
  perPage: 10,
  filters: {
    search: '',
  },
  actionStatus: {
    create: 'idle',
    update: 'idle',
    delete: 'idle',
    toggle: 'idle',
  },
  actionError: {
    create: null,
    update: null,
    delete: null,
    toggle: null,
  }
};

// Async thunks for API calls
export const fetchTutors = createAsyncThunk(
  'tutor/fetchTutors',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { tutor } = getState();
      const queryParams = {
        page: params.page || tutor.currentPage,
        per_page: params.perPage || tutor.perPage,
        search: params.search !== undefined ? params.search : tutor.filters.search
      };

      const response = await adminShelterTutorApi.getTutors(queryParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tutors');
    }
  }
);

export const fetchTutorDetail = createAsyncThunk(
  'tutor/fetchTutorDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminShelterTutorApi.getTutorDetail(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tutor details');
    }
  }
);

export const createTutor = createAsyncThunk(
  'tutor/createTutor',
  async (tutorData, { rejectWithValue }) => {
    try {
      const response = await adminShelterTutorApi.createTutor(tutorData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create tutor');
    }
  }
);

export const updateTutor = createAsyncThunk(
  'tutor/updateTutor',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await adminShelterTutorApi.updateTutor(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tutor');
    }
  }
);

export const deleteTutor = createAsyncThunk(
  'tutor/deleteTutor',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminShelterTutorApi.deleteTutor(id);
      return { id, response: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tutor');
    }
  }
);

export const toggleTutorStatus = createAsyncThunk(
  'tutor/toggleTutorStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await adminShelterTutorApi.toggleTutorStatus(id, {
        is_active: isActive,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tutor status');
    }
  }
);

// Slice
const tutorSlice = createSlice({
  name: 'tutor',
  initialState,
  reducers: {
    resetTutorDetail: (state) => {
      state.selectedTutor = null;
    },
    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        search: '',
      };
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
        // Reset all action statuses
        Object.keys(state.actionStatus).forEach(key => {
          state.actionStatus[key] = 'idle';
          state.actionError[key] = null;
        });
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch Tutors List
    builder
      .addCase(fetchTutors.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTutors.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tutorList = action.payload.data || [];
        
        // Update pagination data if available
        if (action.payload.pagination) {
          state.currentPage = action.payload.pagination.current_page || 1;
          state.totalPages = action.payload.pagination.last_page || 1;
          state.total = action.payload.pagination.total || 0;
          state.perPage = action.payload.pagination.per_page || 10;
        }
      })
      .addCase(fetchTutors.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch tutors';
      })
      
    // Fetch Tutor Detail
      .addCase(fetchTutorDetail.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTutorDetail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedTutor = action.payload.data;
      })
      .addCase(fetchTutorDetail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch tutor details';
      })
      
    // Create Tutor
      .addCase(createTutor.pending, (state) => {
        state.actionStatus.create = 'loading';
      })
      .addCase(createTutor.fulfilled, (state, action) => {
        state.actionStatus.create = 'succeeded';
        // Add the new tutor to the list if it's not already there
        const exists = state.tutorList.some(t => t.id_tutor === action.payload.data.id_tutor);
        if (!exists) {
          state.tutorList.unshift(action.payload.data);
        }
      })
      .addCase(createTutor.rejected, (state, action) => {
        state.actionStatus.create = 'failed';
        state.actionError.create = action.payload || 'Failed to create tutor';
      })
      
    // Update Tutor
      .addCase(updateTutor.pending, (state) => {
        state.actionStatus.update = 'loading';
      })
      .addCase(updateTutor.fulfilled, (state, action) => {
        state.actionStatus.update = 'succeeded';
        // Update in the tutorList
        const index = state.tutorList.findIndex(t => t.id_tutor === action.payload.data.id_tutor);
        if (index !== -1) {
          state.tutorList[index] = action.payload.data;
        }
        // Update selectedTutor if it's the same one
        if (state.selectedTutor && state.selectedTutor.id_tutor === action.payload.data.id_tutor) {
          state.selectedTutor = action.payload.data;
        }
      })
      .addCase(updateTutor.rejected, (state, action) => {
        state.actionStatus.update = 'failed';
        state.actionError.update = action.payload || 'Failed to update tutor';
      })
      
    // Delete Tutor
      .addCase(deleteTutor.pending, (state) => {
        state.actionStatus.delete = 'loading';
      })
      .addCase(deleteTutor.fulfilled, (state, action) => {
        state.actionStatus.delete = 'succeeded';
        // Remove from tutorList
        state.tutorList = state.tutorList.filter(t => t.id_tutor !== action.payload.id);
        // Clear selectedTutor if it's the same one
        if (state.selectedTutor && state.selectedTutor.id_tutor === action.payload.id) {
          state.selectedTutor = null;
        }
      })
      .addCase(deleteTutor.rejected, (state, action) => {
        state.actionStatus.delete = 'failed';
        state.actionError.delete = action.payload || 'Failed to delete tutor';
      })
      
    // Toggle Tutor Status
      .addCase(toggleTutorStatus.pending, (state) => {
        state.actionStatus.toggle = 'loading';
      })
      .addCase(toggleTutorStatus.fulfilled, (state, action) => {
        state.actionStatus.toggle = 'succeeded';
        const updatedTutor = action.payload.data;

        const index = state.tutorList.findIndex(t => t.id_tutor === updatedTutor.id_tutor);
        if (index !== -1) {
          state.tutorList[index] = updatedTutor;
        }

        if (state.selectedTutor && state.selectedTutor.id_tutor === updatedTutor.id_tutor) {
          state.selectedTutor = updatedTutor;
        }
      })
      .addCase(toggleTutorStatus.rejected, (state, action) => {
        state.actionStatus.toggle = 'failed';
        state.actionError.toggle = action.payload || 'Failed to update tutor status';
      });
  }
});

// Export actions
export const {
  resetTutorDetail,
  setSearchFilter,
  resetFilters,
  resetStatus,
  resetActionStatus
} = tutorSlice.actions;

// Basic selectors
const selectTutorState = state => state.tutor;

// Export selectors
export const selectAllTutors = state => state.tutor.tutorList;
export const selectTutorById = (state, tutorId) => 
  state.tutor.tutorList.find(tutor => tutor.id_tutor === tutorId);
export const selectSelectedTutor = state => state.tutor.selectedTutor;
export const selectTutorStatus = state => state.tutor.status;
export const selectTutorError = state => state.tutor.error;

// Memoized pagination selector to prevent unnecessary rerenders
export const selectTutorPagination = createSelector(
  [selectTutorState],
  (tutorState) => ({
    currentPage: tutorState.currentPage,
    totalPages: tutorState.totalPages,
    total: tutorState.total,
    perPage: tutorState.perPage
  })
);

export const selectTutorFilters = state => state.tutor.filters;
export const selectTutorActionStatus = (state, action) => state.tutor.actionStatus[action];
export const selectTutorActionError = (state, action) => state.tutor.actionError[action];

// Export reducer
export default tutorSlice.reducer;
