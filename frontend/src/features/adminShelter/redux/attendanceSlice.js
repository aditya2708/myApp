import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { attendanceApi } from '../api/attendanceApi';

export const recordAttendanceByQr = createAsyncThunk(
  'attendance/recordByQr',
  async ({ id_anak, id_aktivitas, status, token, arrival_time, gps_data }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.recordAttendanceByQr(id_anak, id_aktivitas, status, token, arrival_time, gps_data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        return rejectWithValue({
          message: error.response.data.message || 'Attendance already recorded for this student in this activity',
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

export const recordAttendanceManually = createAsyncThunk(
  'attendance/recordManually',
  async ({ id_anak, id_aktivitas, status, notes, arrival_time, gps_data }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.recordAttendanceManually(id_anak, id_aktivitas, status, notes, arrival_time, gps_data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        return rejectWithValue({
          message: error.response.data.message || 'Attendance already recorded for this student in this activity',
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

export const getAttendanceByActivity = createAsyncThunk(
  'attendance/getByActivity',
  async ({ id_aktivitas, filters }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getAttendanceByActivity(id_aktivitas, filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchActivityMembersWithAttendance = createAsyncThunk(
  'attendance/fetchMembers',
  async (id_aktivitas, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getActivityMembers(id_aktivitas, {
        include_summary: true
      });
      return { id_aktivitas, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Gagal mengambil data anggota aktivitas'
      );
    }
  }
);


export const getAttendanceByStudent = createAsyncThunk(
  'attendance/getByStudent',
  async ({ id_anak, filters }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getAttendanceByStudent(id_anak, filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const manualVerify = createAsyncThunk(
  'attendance/manualVerify',
  async ({ id_absen, notes }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.manualVerify(id_absen, notes);
      return { ...response.data, id_absen };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const rejectVerification = createAsyncThunk(
  'attendance/rejectVerification',
  async ({ id_absen, reason }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.rejectVerification(id_absen, reason);
      return { ...response.data, id_absen };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getVerificationHistory = createAsyncThunk(
  'attendance/getVerificationHistory',
  async (id_absen, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getVerificationHistory(id_absen);
      return { data: response.data.data, id_absen };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const generateStats = createAsyncThunk(
  'attendance/generateStats',
  async ({ startDate, endDate, id_shelter }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.generateStats(startDate, endDate, id_shelter);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  attendanceRecords: {},
  activityRecords: {},
  members: {},
  attendanceSummary: {},
  activityMembersLoading: {},
  activityMembersError: {},
  studentRecords: {},
  verificationHistory: {},
  stats: null,
  loading: false,
  error: null,
  duplicateError: null,
  dateValidationError: null,
  gpsError: null,
  lastUpdated: null,
  offlineQueue: [],
  isSyncing: false
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    resetAttendanceError: (state) => {
      state.error = null;
      state.duplicateError = null;
      state.dateValidationError = null;
      state.gpsError = null;
    },
    resetDuplicateError: (state) => {
      state.duplicateError = null;
    },
    resetDateValidationError: (state) => {
      state.dateValidationError = null;
    },
    resetGpsError: (state) => {
      state.gpsError = null;
    },
    queueOfflineAttendance: (state, action) => {
      state.offlineQueue.push(action.payload);
    },
    removeFromOfflineQueue: (state, action) => {
      state.offlineQueue = state.offlineQueue.filter(item => item.id !== action.payload);
    },
    setSyncing: (state, action) => {
      state.isSyncing = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(recordAttendanceByQr.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.duplicateError = null;
        state.dateValidationError = null;
        state.gpsError = null;
      })
      .addCase(recordAttendanceByQr.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const attendance = action.payload.data;
          state.attendanceRecords[attendance.id_absen] = attendance;
          
          // Update activity records to include the new attendance
          if (attendance.aktivitas?.id_aktivitas) {
            const activityId = attendance.aktivitas.id_aktivitas;
            if (!state.activityRecords[activityId]) {
              state.activityRecords[activityId] = [];
            }
            // Check if this attendance record already exists in the activity records
            const existingIndex = state.activityRecords[activityId].findIndex(
              record => record.id_absen === attendance.id_absen
            );
            if (existingIndex === -1) {
              // Add new record if it doesn't exist
              state.activityRecords[activityId].push(attendance);
            } else {
              // Update existing record
              state.activityRecords[activityId][existingIndex] = attendance;
            }
          }
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(recordAttendanceByQr.rejected, (state, action) => {
        state.loading = false;
        
        if (action.payload?.isDuplicate) {
          state.duplicateError = action.payload.message;
          if (action.payload.existingRecord) {
            const record = action.payload.existingRecord;
            state.attendanceRecords[record.id_absen] = record;

            const activityId = action.meta?.arg?.id_aktivitas;
            if (activityId) {
              if (!state.activityRecords[activityId]) {
                state.activityRecords[activityId] = [];
              }

              const existingIndex = state.activityRecords[activityId].findIndex(
                activityRecord => activityRecord.id_absen === record.id_absen
              );

              if (existingIndex === -1) {
                state.activityRecords[activityId].push(record);
              } else {
                state.activityRecords[activityId][existingIndex] = record;
              }
            }
          }
        } else if (action.payload?.isDateValidationError) {
          state.dateValidationError = action.payload.message;
        } else if (action.payload?.error_type === 'gps_validation_failed' || action.payload?.gps_validation) {
          // Handle GPS validation errors
          state.gpsError = {
            message: action.payload.message || 'GPS validation failed',
            error_type: action.payload.error_type,
            gps_validation: action.payload.gps_validation,
            details: action.payload
          };
        } else {
          state.error = action.payload?.message || 'Failed to record attendance';
        }
      })
      
      .addCase(recordAttendanceManually.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.duplicateError = null;
        state.dateValidationError = null;
        state.gpsError = null;
      })
      .addCase(recordAttendanceManually.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const attendance = action.payload.data;
          state.attendanceRecords[attendance.id_absen] = attendance;
          
          // Update activity records to include the new attendance
          if (attendance.aktivitas?.id_aktivitas) {
            const activityId = attendance.aktivitas.id_aktivitas;
            if (!state.activityRecords[activityId]) {
              state.activityRecords[activityId] = [];
            }
            // Check if this attendance record already exists in the activity records
            const existingIndex = state.activityRecords[activityId].findIndex(
              record => record.id_absen === attendance.id_absen
            );
            if (existingIndex === -1) {
              // Add new record if it doesn't exist
              state.activityRecords[activityId].push(attendance);
            } else {
              // Update existing record
              state.activityRecords[activityId][existingIndex] = attendance;
            }
          }
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(recordAttendanceManually.rejected, (state, action) => {
        state.loading = false;
        
        if (action.payload?.isDuplicate) {
          state.duplicateError = action.payload.message;
          if (action.payload.existingRecord) {
            const record = action.payload.existingRecord;
            state.attendanceRecords[record.id_absen] = record;

            const activityId = action.meta?.arg?.id_aktivitas;
            if (activityId) {
              if (!state.activityRecords[activityId]) {
                state.activityRecords[activityId] = [];
              }

              const existingIndex = state.activityRecords[activityId].findIndex(
                activityRecord => activityRecord.id_absen === record.id_absen
              );

              if (existingIndex === -1) {
                state.activityRecords[activityId].push(record);
              } else {
                state.activityRecords[activityId][existingIndex] = record;
              }
            }
          }
        } else if (action.payload?.isDateValidationError) {
          state.dateValidationError = action.payload.message;
        } else if (action.payload?.error_type === 'gps_validation_failed' || action.payload?.gps_validation) {
          // Handle GPS validation errors
          state.gpsError = {
            message: action.payload.message || 'GPS validation failed',
            error_type: action.payload.error_type,
            gps_validation: action.payload.gps_validation,
            details: action.payload
          };
        } else {
          state.error = action.payload?.message || 'Failed to record attendance manually';
        }
      })
      
      .addCase(getAttendanceByActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAttendanceByActivity.fulfilled, (state, action) => {
        state.loading = false;
        // Handle the correct API response structure: data.students contains the attendance records
        const attendanceData = action.payload.data?.students || action.payload.data;
        if (attendanceData && Array.isArray(attendanceData)) {
          const id_aktivitas = action.meta.arg.id_aktivitas;
          state.activityRecords[id_aktivitas] = attendanceData;
          
          attendanceData.forEach(record => {
            state.attendanceRecords[record.id_absen] = record;
          });
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getAttendanceByActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get attendance records';
      })

      .addCase(fetchActivityMembersWithAttendance.pending, (state, action) => {
        const id_aktivitas = action.meta.arg;
        state.activityMembersLoading[id_aktivitas] = true;
        state.activityMembersError[id_aktivitas] = null;
      })
      .addCase(fetchActivityMembersWithAttendance.fulfilled, (state, action) => {
        const activityId = action.meta?.arg;
        const payload = action.payload || {};
        let { data = [], summary = null } = payload;

        if (!Array.isArray(data)) {
          if (Array.isArray(payload?.members)) {
            data = payload.members;
          } else if (Array.isArray(payload?.data?.members)) {
            data = payload.data.members;
          } else {
            data = [];
          }
        }

        if (summary == null) {
          summary = payload?.attendance_summary ?? payload?.data?.summary ?? null;
        }

        if (activityId == null) {
          return;
        }

        state.members[activityId] = data;
        state.attendanceSummary[activityId] = summary;
        state.activityMembersLoading[activityId] = false;
        state.activityMembersError[activityId] = null;
      })
      .addCase(fetchActivityMembersWithAttendance.rejected, (state, action) => {
        const id_aktivitas = action.meta.arg;
        state.activityMembersLoading[id_aktivitas] = false;
        state.activityMembersError[id_aktivitas] = action.payload || 'Failed to fetch activity members';
      })


      .addCase(getAttendanceByStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAttendanceByStudent.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data && Array.isArray(action.payload.data)) {
          const id_anak = action.meta.arg.id_anak;
          state.studentRecords[id_anak] = action.payload.data;
          
          action.payload.data.forEach(record => {
            state.attendanceRecords[record.id_absen] = record;
          });
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getAttendanceByStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get student attendance records';
      })
      
      .addCase(manualVerify.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(manualVerify.fulfilled, (state, action) => {
        state.loading = false;
        const { id_absen } = action.payload;
        
        if (state.attendanceRecords[id_absen]) {
          state.attendanceRecords[id_absen].is_verified = true;
          state.attendanceRecords[id_absen].verification_status = 'manual';
        }
        
        Object.keys(state.activityRecords).forEach(activityId => {
          state.activityRecords[activityId] = state.activityRecords[activityId].map(record => {
            if (record.id_absen === id_absen) {
              return {
                ...record,
                is_verified: true,
                verification_status: 'manual'
              };
            }
            return record;
          });
        });
        
        Object.keys(state.studentRecords).forEach(studentId => {
          state.studentRecords[studentId] = state.studentRecords[studentId].map(record => {
            if (record.id_absen === id_absen) {
              return {
                ...record,
                is_verified: true,
                verification_status: 'manual'
              };
            }
            return record;
          });
        });
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(manualVerify.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to verify attendance';
      })
      
      .addCase(rejectVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectVerification.fulfilled, (state, action) => {
        state.loading = false;
        const { id_absen } = action.payload;
        
        if (state.attendanceRecords[id_absen]) {
          state.attendanceRecords[id_absen].is_verified = false;
          state.attendanceRecords[id_absen].verification_status = 'rejected';
        }
        
        Object.keys(state.activityRecords).forEach(activityId => {
          state.activityRecords[activityId] = state.activityRecords[activityId].map(record => {
            if (record.id_absen === id_absen) {
              return {
                ...record,
                is_verified: false,
                verification_status: 'rejected'
              };
            }
            return record;
          });
        });
        
        Object.keys(state.studentRecords).forEach(studentId => {
          state.studentRecords[studentId] = state.studentRecords[studentId].map(record => {
            if (record.id_absen === id_absen) {
              return {
                ...record,
                is_verified: false,
                verification_status: 'rejected'
              };
            }
            return record;
          });
        });
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(rejectVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to reject verification';
      })
      
      .addCase(getVerificationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVerificationHistory.fulfilled, (state, action) => {
        state.loading = false;
        const { data, id_absen } = action.payload;
        state.verificationHistory[id_absen] = data;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getVerificationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get verification history';
      })
      
      .addCase(generateStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.data;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(generateStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to generate statistics';
      });
  }
});

export const { 
  resetAttendanceError,
  resetDuplicateError,
  resetDateValidationError,
  resetGpsError,
  queueOfflineAttendance, 
  removeFromOfflineQueue, 
  setSyncing 
} = attendanceSlice.actions;

const emptyArray = [];
const selectAttendanceState = state => state.attendance;
const selectActivityRecords = state => state.attendance.activityRecords;
const selectStudentRecords = state => state.attendance.studentRecords;
const selectVerificationHistoryRecords = state => state.attendance.verificationHistory;
const selectMembersMap = state => state.attendance.members;
const selectAttendanceSummaryMap = state => state.attendance.attendanceSummary;

export const selectAttendanceLoading = state => state.attendance.loading;
export const selectAttendanceError = state => state.attendance.error;
export const selectDuplicateError = state => state.attendance.duplicateError;
export const selectDateValidationError = state => state.attendance.dateValidationError;
export const selectGpsError = state => state.attendance.gpsError;
export const selectAttendanceRecords = state => state.attendance.attendanceRecords;
export const selectActivityMembersLoading = (state, id_aktivitas) =>
  state.attendance.activityMembersLoading[id_aktivitas] || false;
export const selectActivityMembersError = (state, id_aktivitas) =>
  state.attendance.activityMembersError[id_aktivitas] || null;

export const selectActivityAttendance = createSelector(
  [selectActivityRecords, (_, id_aktivitas) => id_aktivitas],
  (activityRecords, id_aktivitas) => activityRecords[id_aktivitas] || emptyArray
);

export const selectActivityMembers = createSelector(
  [selectMembersMap, (_, id_aktivitas) => id_aktivitas],
  (membersMap, id_aktivitas) => membersMap[id_aktivitas] || emptyArray
);

export const selectActivityAttendanceSummary = createSelector(
  [selectAttendanceSummaryMap, (_, id_aktivitas) => id_aktivitas],
  (attendanceSummaryMap, id_aktivitas) =>
    attendanceSummaryMap[id_aktivitas] ?? null
);


export const selectStudentAttendance = createSelector(
  [selectStudentRecords, (_, id_anak) => id_anak],
  (studentRecords, id_anak) => studentRecords[id_anak] || emptyArray
);

export const selectVerificationHistory = createSelector(
  [selectVerificationHistoryRecords, (_, id_absen) => id_absen],
  (verificationHistory, id_absen) => verificationHistory[id_absen] || emptyArray
);

export const selectPresentAttendance = createSelector(
  [selectAttendanceRecords],
  (records) => Object.values(records).filter(record => record.absen === 'Ya')
);

export const selectLateAttendance = createSelector(
  [selectAttendanceRecords],
  (records) => Object.values(records).filter(record => record.absen === 'Terlambat')
);

export const selectAbsentAttendance = createSelector(
  [selectAttendanceRecords],
  (records) => Object.values(records).filter(record => record.absen === 'Tidak')
);

export const selectAttendanceStats = state => state.attendance.stats;
export const selectOfflineQueue = state => state.attendance.offlineQueue;
export const selectIsSyncing = state => state.attendance.isSyncing;

export default attendanceSlice.reducer;