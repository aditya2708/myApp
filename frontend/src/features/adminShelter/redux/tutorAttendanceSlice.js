import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { tutorAttendanceApi } from '../api/tutorAttendanceApi';

export const recordTutorAttendanceByQr = createAsyncThunk(
  'tutorAttendance/recordByQr',
  async ({ id_aktivitas, token, arrival_time, gps_data }, { rejectWithValue }) => {
    try {
      const response = await tutorAttendanceApi.recordTutorAttendanceByQr(id_aktivitas, token, arrival_time, gps_data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        return rejectWithValue({
          message: error.response.data.message || 'Tutor attendance already recorded for this activity',
          isDuplicate: true,
          existingRecord: error.response.data.data
        });
      }
      if (error.response?.status === 422) {
        return rejectWithValue({
          message: error.response.data.message || 'GPS validation failed or invalid activity date',
          isDateValidationError: !error.response.data.error_type || error.response.data.error_type !== 'gps_validation_failed',
          error_type: error.response.data.error_type,
          gps_validation: error.response.data.gps_validation
        });
      }
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const recordTutorAttendanceManually = createAsyncThunk(
  'tutorAttendance/recordManually',
  async ({ id_tutor, id_aktivitas, status, notes, arrival_time, gps_data }, { rejectWithValue }) => {
    try {
      const response = await tutorAttendanceApi.recordTutorAttendanceManually(id_tutor, id_aktivitas, status, notes, arrival_time, gps_data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        return rejectWithValue({
          message: error.response.data.message || 'Tutor attendance already recorded for this activity',
          isDuplicate: true,
          existingRecord: error.response.data.data
        });
      }
      if (error.response?.status === 422) {
        return rejectWithValue({
          message: error.response.data.message || 'GPS validation failed or invalid activity date',
          isDateValidationError: !error.response.data.error_type || error.response.data.error_type !== 'gps_validation_failed',
          error_type: error.response.data.error_type,
          gps_validation: error.response.data.gps_validation
        });
      }
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getTutorAttendanceByActivity = createAsyncThunk(
  'tutorAttendance/getByActivity',
  async (id_aktivitas, { rejectWithValue }) => {
    try {
      const response = await tutorAttendanceApi.getTutorAttendanceByActivity(id_aktivitas);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getTutorAttendanceHistory = createAsyncThunk(
  'tutorAttendance/getHistory',
  async ({ id_tutor, filters }, { rejectWithValue }) => {
    try {
      const response = await tutorAttendanceApi.getTutorAttendanceHistory(id_tutor, filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const generateTutorToken = createAsyncThunk(
  'tutorAttendance/generateToken',
  async ({ id_tutor, validDays = 30 }, { rejectWithValue }) => {
    try {
      const response = await tutorAttendanceApi.generateTutorToken(id_tutor, validDays);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  attendanceRecords: {},
  activityRecords: {},
  tutorRecords: {},
  tokens: {},
  currentToken: null,
  loading: false,
  error: null,
  duplicateError: null,
  dateValidationError: null,
  lastUpdated: null,
  offlineQueue: [],
  isSyncing: false
};

const tutorAttendanceSlice = createSlice({
  name: 'tutorAttendance',
  initialState,
  reducers: {
    resetTutorAttendanceError: (state) => {
      state.error = null;
      state.duplicateError = null;
      state.dateValidationError = null;
    },
    resetTutorDuplicateError: (state) => {
      state.duplicateError = null;
    },
    resetTutorDateValidationError: (state) => {
      state.dateValidationError = null;
    },
    queueOfflineTutorAttendance: (state, action) => {
      state.offlineQueue.push(action.payload);
    },
    removeFromOfflineQueue: (state, action) => {
      state.offlineQueue = state.offlineQueue.filter(item => item.id !== action.payload);
    },
    setSyncing: (state, action) => {
      state.isSyncing = action.payload;
    },
    clearTutorHistory: (state, action) => {
      if (action.payload) {
        delete state.tutorRecords[action.payload];
      } else {
        state.tutorRecords = {};
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(recordTutorAttendanceByQr.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.duplicateError = null;
        state.dateValidationError = null;
      })
      .addCase(recordTutorAttendanceByQr.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const attendance = action.payload.data;
          state.attendanceRecords[attendance.id_absen] = attendance;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(recordTutorAttendanceByQr.rejected, (state, action) => {
        state.loading = false;
        
        if (action.payload?.isDuplicate) {
          state.duplicateError = action.payload.message;
          if (action.payload.existingRecord) {
            const record = action.payload.existingRecord;
            state.attendanceRecords[record.id_absen] = record;
          }
        } else if (action.payload?.isDateValidationError) {
          state.dateValidationError = action.payload.message;
        } else {
          state.error = action.payload?.message || 'Failed to record tutor attendance';
        }
      })
      .addCase(recordTutorAttendanceManually.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.duplicateError = null;
        state.dateValidationError = null;
      })
      .addCase(recordTutorAttendanceManually.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const attendance = action.payload.data;
          state.attendanceRecords[attendance.id_absen] = attendance;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(recordTutorAttendanceManually.rejected, (state, action) => {
        state.loading = false;
        
        if (action.payload?.isDuplicate) {
          state.duplicateError = action.payload.message;
          if (action.payload.existingRecord) {
            const record = action.payload.existingRecord;
            state.attendanceRecords[record.id_absen] = record;
          }
        } else if (action.payload?.isDateValidationError) {
          state.dateValidationError = action.payload.message;
        } else {
          state.error = action.payload?.message || 'Failed to record tutor attendance manually';
        }
      })
      .addCase(getTutorAttendanceByActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTutorAttendanceByActivity.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const id_aktivitas = action.meta.arg;
          state.activityRecords[id_aktivitas] = action.payload.data;
          
          if (action.payload.data.id_absen) {
            state.attendanceRecords[action.payload.data.id_absen] = action.payload.data;
          }
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getTutorAttendanceByActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get tutor attendance';
      })
      .addCase(getTutorAttendanceHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTutorAttendanceHistory.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data && Array.isArray(action.payload.data)) {
          const id_tutor = action.meta.arg.id_tutor;
          state.tutorRecords[id_tutor] = action.payload.data;
          
          action.payload.data.forEach(record => {
            state.attendanceRecords[record.id_absen] = record;
          });
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getTutorAttendanceHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get tutor attendance history';
      })
      .addCase(generateTutorToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateTutorToken.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const token = action.payload.data;
          state.tokens[token.token] = token;
          state.currentToken = token;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(generateTutorToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to generate tutor token';
      });
  }
});

export const { 
  resetTutorAttendanceError,
  resetTutorDuplicateError,
  resetTutorDateValidationError,
  queueOfflineTutorAttendance, 
  removeFromOfflineQueue, 
  setSyncing,
  clearTutorHistory
} = tutorAttendanceSlice.actions;

const emptyArray = [];
const selectTutorAttendanceState = state => state.tutorAttendance;
const selectActivityRecords = state => state.tutorAttendance.activityRecords;
const selectTutorRecordsState = state => state.tutorAttendance.tutorRecords;

export const selectTutorAttendanceLoading = (state) => state.tutorAttendance.loading;
export const selectTutorAttendanceError = (state) => state.tutorAttendance.error;
export const selectTutorDuplicateError = (state) => state.tutorAttendance.duplicateError;
export const selectTutorDateValidationError = (state) => state.tutorAttendance.dateValidationError;
export const selectTutorAttendanceRecords = (state) => state.tutorAttendance.attendanceRecords;
export const selectTutorTokens = (state) => state.tutorAttendance.tokens;
export const selectCurrentTutorToken = (state) => state.tutorAttendance.currentToken;

export const selectTutorAttendanceByActivity = createSelector(
  [selectActivityRecords, (_, id_aktivitas) => id_aktivitas],
  (activityRecords, id_aktivitas) => activityRecords[id_aktivitas] || null
);

export const selectTutorAttendanceHistory = createSelector(
  [selectTutorRecordsState, (_, id_tutor) => id_tutor],
  (tutorRecords, id_tutor) => tutorRecords[id_tutor] || emptyArray
);

export const selectTutorAttendanceStats = createSelector(
  [selectTutorAttendanceHistory],
  (history) => {
    const total = history.length;
    const present = history.filter(record => record.absen === 'Ya').length;
    const late = history.filter(record => record.absen === 'Terlambat').length;
    const absent = history.filter(record => record.absen === 'Tidak').length;
    const verified = history.filter(record => record.is_verified).length;

    return {
      total,
      present,
      late,
      absent,
      verified,
      presentRate: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
      attendanceRate: total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0,
      verificationRate: total > 0 ? ((verified / total) * 100).toFixed(1) : 0
    };
  }
);

export const selectOfflineQueue = (state) => state.tutorAttendance.offlineQueue;
export const selectIsSyncing = (state) => state.tutorAttendance.isSyncing;

export default tutorAttendanceSlice.reducer;