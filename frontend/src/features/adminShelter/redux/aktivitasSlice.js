import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aktivitasApi } from '../api/aktivitasApi';
import { adminShelterKelompokApi } from '../api/adminShelterKelompokApi';
import { kurikulumShelterApi } from '../api/kurikulumShelterApi';
import { activityReportApi } from '../api/activityReportApi';
import { kegiatanApi } from '../api/kegiatanApi';
import {
  MANUAL_ATTENDANCE_ACTIVITY_SET,
  MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET,
} from '../constants/activityTypes';

export const ACTIVITY_REPORT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
export const ACTIVITY_REPORT_ERROR_RETRY_DELAY = 30 * 1000; // 30 seconds

const extractReportData = (payload) => {
  if (!payload) return null;
  if (payload.data && typeof payload.data === 'object') {
    return payload.data;
  }
  return payload;
};

// Initial state
const initialState = {
  aktivitasList: [],
  aktivitasDetail: null,
  loading: false,
  error: null,
  conflicts: null,
  statusUpdating: false,
  attendanceSummary: null,
  kelompokDetail: null,
  kelompokLoading: false,
  kelompokError: null,
  pagination: {
    total: 0,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    from: 0,
    to: 0
  },
  isLoadingMore: false,
  
  // NEW: Kurikulum caching support
  materiCache: [],
  materiCacheLoading: false,
  materiCacheError: null,
  selectedMateri: null,
  lastCacheUpdate: null,
  cacheExpiryMinutes: 10, // Cache expiry time
  
  // Activity Reports
  activityReport: null,
  reportLoading: false,
  reportError: null,
  reportCache: {},
  
  // Dashboard data
  todayActivities: [],
  todayActivitiesLoading: false,
  todayActivitiesError: null,
  calendarActivities: [],
  calendarActivitiesLoading: false,
  calendarActivitiesError: null,
  selectedDateActivities: [],
  selectedDateActivitiesLoading: false,
  selectedDate: null,

  // Kegiatan master data
  kegiatanOptions: [],
  kegiatanOptionsLoading: false,
  kegiatanOptionsError: null
};

// Async thunks
export const fetchAllAktivitas = createAsyncThunk(
  'aktivitas/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await aktivitasApi.getAllAktivitas(params);
      return { 
        ...response.data, 
        isLoadMore: params.page && params.page > 1,
        page: params.page || 1 
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal mengambil aktivitas');
    }
  }
);

export const fetchAktivitasDetail = createAsyncThunk(
  'aktivitas/fetchDetail',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await aktivitasApi.getAktivitasDetail(id);
      
      const aktivitasData = response.data.data;
      const jenisKegiatan = aktivitasData?.jenis_kegiatan;
      const needsKelompokDetail =
        aktivitasData?.nama_kelompok &&
        jenisKegiatan &&
        (
          MANUAL_ATTENDANCE_ACTIVITY_SET.has(jenisKegiatan) ||
          MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET.has(jenisKegiatan.toLowerCase())
        );

      if (needsKelompokDetail) {
        dispatch(fetchKelompokByName(aktivitasData.nama_kelompok));
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal mengambil detail aktivitas');
    }
  }
);

export const fetchKelompokByName = createAsyncThunk(
  'aktivitas/fetchKelompokByName',
  async (kelompokName, { rejectWithValue }) => {
    try {
      const response = await adminShelterKelompokApi.getAllKelompok();
      const kelompokList = response.data.data || [];
      
      const matchingKelompok = kelompokList.find(
        kelompok => kelompok.nama_kelompok === kelompokName
      );
      
      if (matchingKelompok) {
        const detailResponse = await adminShelterKelompokApi.getKelompokDetail(matchingKelompok.id_kelompok);
        return detailResponse.data;
      } else {
        return rejectWithValue('Kelompok not found with name: ' + kelompokName);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal mengambil detail kelompok');
    }
  }
);

export const createAktivitas = createAsyncThunk(
  'aktivitas/create',
  async ({ aktivitasData, queryClient }, { rejectWithValue }) => {
    try {
      const response = await aktivitasApi.createAktivitas(aktivitasData);
      
      // Invalidate React Query cache to refresh the list
      try {
        if (queryClient) {
          await queryClient.invalidateQueries({ queryKey: ['adminShelterAktivitasList'] });
        }
      } catch (invalidateError) {
        console.warn('Failed to invalidate React Query cache:', invalidateError);
        // Don't fail the action if invalidation fails
      }
      
      return response.data;
    } catch (error) {
      // Preserve full error response for conflict handling
      const errorPayload = {
        message: error.response?.data?.message || 'Gagal membuat aktivitas',
        conflicts: error.response?.data?.conflicts || null,
        fullResponse: error.response?.data
      };
      return rejectWithValue(errorPayload);
    }
  }
);

export const updateAktivitas = createAsyncThunk(
  'aktivitas/update',
  async ({ id, aktivitasData, queryClient }, { rejectWithValue }) => {
    try {
      const response = await aktivitasApi.updateAktivitas(id, aktivitasData);
      
      // Invalidate React Query cache to refresh the list
      try {
        if (queryClient) {
          await queryClient.invalidateQueries({ queryKey: ['adminShelterAktivitasList'] });
        }
      } catch (invalidateError) {
        console.warn('Failed to invalidate React Query cache:', invalidateError);
        // Don't fail the action if invalidation fails
      }
      
      return response.data;
    } catch (error) {
      // Preserve full error response for conflict handling
      const errorPayload = {
        message: error.response?.data?.message || 'Gagal memperbarui aktivitas',
        conflicts: error.response?.data?.conflicts || null,
        fullResponse: error.response?.data
      };
      return rejectWithValue(errorPayload);
    }
  }
);

export const updateAktivitasStatus = createAsyncThunk(
  'aktivitas/updateStatus',
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      const payload = { status };
      if (notes !== undefined && notes !== null && notes !== '') {
        payload.notes = notes;
      }

      const response = await aktivitasApi.updateAktivitasStatus(id, payload);
      return { id, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Gagal memperbarui status aktivitas'
      );
    }
  }
);

export const deleteAktivitas = createAsyncThunk(
  'aktivitas/delete',
  async ({ id, queryClient }, { rejectWithValue }) => {
    try {
      const response = await aktivitasApi.deleteAktivitas(id);
      
      // Invalidate React Query cache to refresh the list
      try {
        if (queryClient) {
          await queryClient.invalidateQueries({ queryKey: ['adminShelterAktivitasList'] });
        }
      } catch (invalidateError) {
        console.warn('Failed to invalidate React Query cache:', invalidateError);
        // Don't fail the action if invalidation fails
      }
      
      return { id, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal menghapus aktivitas');
    }
  }
);

// NEW: Kurikulum caching async thunks
export const fetchAllMateri = createAsyncThunk(
  'aktivitas/fetchAllMateri',
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { lastCacheUpdate, cacheExpiryMinutes, materiCache } = state.aktivitas;
      
      // Check if cache is still valid (unless force refresh)
      if (!forceRefresh && lastCacheUpdate && materiCache.length > 0) {
        const cacheAge = (Date.now() - lastCacheUpdate) / (1000 * 60); // minutes
        if (cacheAge < cacheExpiryMinutes) {
          return {
            data: materiCache,
            fromCache: true,
            cacheAge: Math.round(cacheAge)
          };
        }
      }
      
      const response = await kurikulumShelterApi.getAllMateri();
      return {
        data: response.data.data?.hierarchy?.materi_list || [],
        fromCache: false,
        timestamp: Date.now()
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal mengambil materi');
    }
  }
);

export const setSelectedMateri = createAsyncThunk(
  'aktivitas/setSelectedMateri',
  async (materi, { rejectWithValue }) => {
    try {
      return materi;
    } catch (error) {
      return rejectWithValue('Gagal mengatur materi terpilih');
    }
  }
);

export const clearMateriCache = createAsyncThunk(
  'aktivitas/clearMateriCache',
  async (_, { rejectWithValue }) => {
    try {
      return {};
    } catch (error) {
      return rejectWithValue('Gagal menghapus cache');
    }
  }
);

// Activity Report async thunks
export const createActivityReport = createAsyncThunk(
  'aktivitas/createActivityReport',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await activityReportApi.createReport(formData);
      return response.data;
    } catch (error) {
      const payload = error.response?.data;
      const message = payload?.message || error.message || 'Gagal membuat laporan';
      return rejectWithValue({
        message,
        errors: payload?.errors || null,
        status: error.response?.status
      });
    }
  }
);

export const fetchActivityReport = createAsyncThunk(
  'aktivitas/fetchActivityReport',
  async (id_aktivitas, { rejectWithValue }) => {
    try {
      const response = await activityReportApi.getByActivity(id_aktivitas);
      return response.data;
    } catch (error) {
      const status = error.response?.status ?? error.status ?? error.code;
      const message = error.response?.data?.message || error.message || 'Gagal mengambil laporan';
      return rejectWithValue({ message, status });
    }
  }
);

export const deleteActivityReport = createAsyncThunk(
  'aktivitas/deleteActivityReport',
  async (id, { rejectWithValue }) => {
    try {
      const response = await activityReportApi.deleteReport(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal menghapus laporan');
    }
  }
);

// Dashboard async thunks
export const fetchTodayActivities = createAsyncThunk(
  'aktivitas/fetchTodayActivities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aktivitasApi.getTodayActivities();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal mengambil aktivitas hari ini');
    }
  }
);

export const fetchActivitiesByDate = createAsyncThunk(
  'aktivitas/fetchActivitiesByDate',
  async (date, { rejectWithValue }) => {
    try {
      const response = await aktivitasApi.getActivitiesByDate(date);
      return { data: response.data, selectedDate: date };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal mengambil aktivitas untuk tanggal tersebut');
    }
  }
);

export const fetchActivitiesForCalendar = createAsyncThunk(
  'aktivitas/fetchActivitiesForCalendar',
  async (month, { rejectWithValue }) => {
    try {
      const response = await aktivitasApi.getActivitiesForCalendar(month);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal mengambil aktivitas untuk kalender');
    }
  }
);

export const fetchKegiatanOptions = createAsyncThunk(
  'aktivitas/fetchKegiatanOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await kegiatanApi.getAllKegiatan();
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal mengambil daftar kegiatan');
    }
  }
);

// Slice
const aktivitasSlice = createSlice({
  name: 'aktivitas',
  initialState,
  reducers: {
    resetAktivitasDetail: (state) => {
      state.aktivitasDetail = null;
      state.kelompokDetail = null;
    },
    resetAktivitasError: (state) => {
      state.error = null;
      state.conflicts = null;
    },
    resetAktivitasList: (state) => {
      state.aktivitasList = [];
      state.pagination = initialState.pagination;
    },
    // NEW: Kurikulum cache reducers
    clearSelectedMateri: (state) => {
      state.selectedMateri = null;
    },
    resetMateriCacheError: (state) => {
      state.materiCacheError = null;
    },
    // Dashboard reducers
    resetTodayActivitiesError: (state) => {
      state.todayActivitiesError = null;
    },
    resetCalendarActivitiesError: (state) => {
      state.calendarActivitiesError = null;
    },
    clearSelectedDateActivities: (state) => {
      state.selectedDateActivities = [];
      state.selectedDate = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAllAktivitas
      .addCase(fetchAllAktivitas.pending, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        if (isLoadMore) {
          state.isLoadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
        state.conflicts = null;
      })
      .addCase(fetchAllAktivitas.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoadingMore = false;
        
        const { data, meta, isLoadMore } = action.payload;
        
        // Update activities list
        if (isLoadMore) {
          // For pagination, append new data to existing list
          state.aktivitasList = [...state.aktivitasList, ...data];
        } else {
          // For new search/filter, replace entire list
          state.aktivitasList = data;
        }
        
        // Update pagination metadata
        if (meta) {
          state.pagination = {
            total: meta.total || 0,
            currentPage: meta.current_page || 1,
            lastPage: meta.last_page || 1,
            perPage: meta.per_page || 10,
            from: meta.from || 0,
            to: meta.to || 0
          };
        }
      })
      .addCase(fetchAllAktivitas.rejected, (state, action) => {
        state.loading = false;
        state.isLoadingMore = false;
        state.error = action.payload || 'Failed to fetch activities';
      })
      
      // fetchAktivitasDetail
      .addCase(fetchAktivitasDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.conflicts = null;
      })
      .addCase(fetchAktivitasDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.aktivitasDetail = action.payload.data;
        
        // Keep time fields as strings to avoid timezone issues
        
        const resolvedJenis = state.aktivitasDetail?.jenis_kegiatan;
        const manualEligible =
          resolvedJenis &&
          (
            MANUAL_ATTENDANCE_ACTIVITY_SET.has(resolvedJenis) ||
            MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET.has(resolvedJenis.toLowerCase())
          );

        if (
          manualEligible &&
          state.kelompokDetail &&
          state.kelompokDetail.data
        ) {
          state.aktivitasDetail.selectedKelompokId = state.kelompokDetail.data.id_kelompok;
        }
      })
      .addCase(fetchAktivitasDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch activity details';
      })
      
      // fetchKelompokByName
      .addCase(fetchKelompokByName.pending, (state) => {
        state.kelompokLoading = true;
        state.kelompokError = null;
      })
      .addCase(fetchKelompokByName.fulfilled, (state, action) => {
        state.kelompokLoading = false;
        state.kelompokDetail = action.payload;
        
        if (state.aktivitasDetail && action.payload.data) {
          state.aktivitasDetail.selectedKelompokId = action.payload.data.id_kelompok;
        }
      })
      .addCase(fetchKelompokByName.rejected, (state, action) => {
        state.kelompokLoading = false;
        state.kelompokError = action.payload || 'Failed to fetch kelompok details';
      })
      
      // createAktivitas
      .addCase(createAktivitas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.conflicts = null;
      })
      .addCase(createAktivitas.fulfilled, (state, action) => {
        state.loading = false;
        state.aktivitasList = [action.payload.data, ...state.aktivitasList];
        state.pagination.total += 1;
      })
      .addCase(createAktivitas.rejected, (state, action) => {
        state.loading = false;
        // Store error message as string and conflicts separately
        if (typeof action.payload === 'object') {
          state.error = action.payload.message || 'Failed to create activity';
          state.conflicts = action.payload.conflicts || null;
        } else {
          state.error = action.payload || 'Failed to create activity';
          state.conflicts = null;
        }
      })
      
      // updateAktivitas
      .addCase(updateAktivitas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.conflicts = null;
      })
      .addCase(updateAktivitas.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAktivitas = action.payload.data;
        
        state.aktivitasList = state.aktivitasList.map(item => 
          item.id_aktivitas === updatedAktivitas.id_aktivitas ? updatedAktivitas : item
        );
        
        if (state.aktivitasDetail && state.aktivitasDetail.id_aktivitas === updatedAktivitas.id_aktivitas) {
          if (updatedAktivitas.start_time) {
            try {
              updatedAktivitas.start_time = new Date(`2000-01-01T${updatedAktivitas.start_time}`);
            } catch (error) {
              console.error('Error parsing start_time:', error);
            }
          }
          
          if (updatedAktivitas.end_time) {
            try {
              updatedAktivitas.end_time = new Date(`2000-01-01T${updatedAktivitas.end_time}`);
            } catch (error) {
              console.error('Error parsing end_time:', error);
            }
          }
          
          if (updatedAktivitas.late_threshold) {
            try {
              updatedAktivitas.late_threshold = new Date(`2000-01-01T${updatedAktivitas.late_threshold}`);
            } catch (error) {
              console.error('Error parsing late_threshold:', error);
            }
          }
          
          state.aktivitasDetail = updatedAktivitas;
        }
      })
      .addCase(updateAktivitas.rejected, (state, action) => {
        state.loading = false;
        // Store error message as string and conflicts separately
        if (typeof action.payload === 'object') {
          state.error = action.payload.message || 'Failed to update activity';
          state.conflicts = action.payload.conflicts || null;
        } else {
          state.error = action.payload || 'Failed to update activity';
          state.conflicts = null;
        }
      })

      // updateAktivitasStatus
      .addCase(updateAktivitasStatus.pending, (state) => {
        state.statusUpdating = true;
        state.error = null;
        state.attendanceSummary = null;
      })
      .addCase(updateAktivitasStatus.fulfilled, (state, action) => {
        state.statusUpdating = false;

        const { id, data } = action.payload;
        const responseData = data?.data ?? data;
        const updatedAktivitas = responseData?.aktivitas ?? responseData;
        const summary =
          responseData?.attendance_summary ??
          updatedAktivitas?.attendance_summary ??
          null;

        state.attendanceSummary = summary;

        const newStatus =
          (updatedAktivitas && updatedAktivitas.status) ?? action.meta.arg.status;

        if (state.aktivitasDetail && state.aktivitasDetail.id_aktivitas === id) {
          if (updatedAktivitas && typeof updatedAktivitas === 'object') {
            state.aktivitasDetail = {
              ...state.aktivitasDetail,
              ...updatedAktivitas,
              status: newStatus || state.aktivitasDetail.status
            };
          } else if (newStatus) {
            state.aktivitasDetail.status = newStatus;
          }
        }

        state.aktivitasList = state.aktivitasList.map(item => {
          if (item.id_aktivitas !== id) {
            return item;
          }

          if (updatedAktivitas && typeof updatedAktivitas === 'object') {
            return {
              ...item,
              ...updatedAktivitas,
              status: newStatus || item.status
            };
          }

          return {
            ...item,
            status: newStatus || item.status
          };
        });
      })
      .addCase(updateAktivitasStatus.rejected, (state, action) => {
        state.statusUpdating = false;
        state.error = action.payload || 'Failed to update activity status';
        state.attendanceSummary = null;
      })

      // deleteAktivitas
      .addCase(deleteAktivitas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.conflicts = null;
      })
      .addCase(deleteAktivitas.fulfilled, (state, action) => {
        state.loading = false;
        state.aktivitasList = state.aktivitasList.filter(
          item => item.id_aktivitas !== action.payload.id
        );
        state.pagination.total -= 1;
        
        if (state.aktivitasDetail && state.aktivitasDetail.id_aktivitas === action.payload.id) {
          state.aktivitasDetail = null;
          state.kelompokDetail = null;
        }
      })
      .addCase(deleteAktivitas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete activity';
      })
      
      // NEW: fetchAllMateri cases
      .addCase(fetchAllMateri.pending, (state) => {
        state.materiCacheLoading = true;
        state.materiCacheError = null;
      })
      .addCase(fetchAllMateri.fulfilled, (state, action) => {
        state.materiCacheLoading = false;
        const { data, fromCache, timestamp, cacheAge } = action.payload;
        
        if (!fromCache) {
          // Transform data to ensure all fields are safe for rendering
          const transformedData = data.map(materi => ({
            ...materi,
            nama_materi: (materi.nama_materi || '').toString(),
            kategori: (materi.kategori || '').toString(),
            deskripsi: (materi.deskripsi || '').toString(),
            urutan: (materi.urutan || '').toString(),
            file_name: (materi.file_name || '').toString(),
            // Ensure relationship objects are properly handled
            mataPelajaran: materi.mataPelajaran ? {
              ...materi.mataPelajaran,
              nama_mata_pelajaran: (materi.mataPelajaran.nama_mata_pelajaran || '').toString()
            } : (materi.mata_pelajaran ? {
              ...materi.mata_pelajaran,
              nama_mata_pelajaran: (materi.mata_pelajaran.nama_mata_pelajaran || '').toString()
            } : null),
            kelas: materi.kelas ? {
              ...materi.kelas,
              nama_kelas: (materi.kelas.nama_kelas || '').toString(),
              jenjang: materi.kelas.jenjang ? {
                ...materi.kelas.jenjang,
                nama_jenjang: (materi.kelas.jenjang.nama_jenjang || '').toString()
              } : null
            } : null
          }));
          
          state.materiCache = transformedData;
          state.lastCacheUpdate = timestamp;
        }
        // If from cache, no need to update the cache data
      })
      .addCase(fetchAllMateri.rejected, (state, action) => {
        state.materiCacheLoading = false;
        state.materiCacheError = action.payload || 'Failed to fetch materi';
      })
      
      // setSelectedMateri cases
      .addCase(setSelectedMateri.fulfilled, (state, action) => {
        state.selectedMateri = action.payload;
      })
      
      // clearMateriCache cases
      .addCase(clearMateriCache.fulfilled, (state) => {
        state.materiCache = [];
        state.selectedMateri = null;
        state.lastCacheUpdate = null;
        state.materiCacheError = null;
        console.log('Materi cache cleared');
      })
      
      // Activity Report cases
      .addCase(createActivityReport.pending, (state) => {
        state.reportLoading = true;
        state.reportError = null;
      })
      .addCase(createActivityReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        const reportData = extractReportData(action.payload);
        state.activityReport = reportData;
        if (reportData?.id_aktivitas) {
          state.reportCache[reportData.id_aktivitas] = {
            status: 'exists',
            data: reportData,
            fetchedAt: Date.now(),
            error: null
          };
        }
        // Update activity status to reported
        if (state.aktivitasDetail && state.aktivitasDetail.id_aktivitas === reportData?.id_aktivitas) {
          state.aktivitasDetail.status = 'reported';
        }
      })
      .addCase(createActivityReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.reportError = action.payload?.message || action.payload || 'Gagal membuat laporan';
      })
      
      .addCase(fetchActivityReport.pending, (state) => {
        state.reportLoading = true;
        state.reportError = null;
      })
      .addCase(fetchActivityReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        const reportData = extractReportData(action.payload);
        state.activityReport = reportData;
        const activityId = action.meta.arg;
        if (activityId) {
          state.reportCache[activityId] = {
            status: reportData ? 'exists' : 'missing',
            data: reportData || null,
            fetchedAt: Date.now(),
            error: null
          };
        }
      })
      .addCase(fetchActivityReport.rejected, (state, action) => {
        state.reportLoading = false;
        const activityId = action.meta.arg;
        const status = action.payload?.status;
        const normalizedStatus = typeof status === 'number' ? status : undefined;
        const message = action.payload?.message || action.payload || 'Gagal mengambil laporan';
        state.reportError = message;
        if (activityId) {
          state.reportCache[activityId] = {
            status: normalizedStatus === 404 ? 'missing' : 'error',
            data: null,
            fetchedAt: Date.now(),
            error: { message, status: normalizedStatus }
          };
        }
      })
      
      .addCase(deleteActivityReport.pending, (state) => {
        state.reportLoading = true;
        state.reportError = null;
      })
      .addCase(deleteActivityReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.activityReport = null;
        // Update activity status back to completed
        if (state.aktivitasDetail) {
          state.aktivitasDetail.status = 'completed';
        }
      })
      .addCase(deleteActivityReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.reportError = action.payload;
      })
      
      // Dashboard cases
      .addCase(fetchTodayActivities.pending, (state) => {
        state.todayActivitiesLoading = true;
        state.todayActivitiesError = null;
      })
      .addCase(fetchTodayActivities.fulfilled, (state, action) => {
        state.todayActivitiesLoading = false;
        state.todayActivities = action.payload.data || [];
      })
      .addCase(fetchTodayActivities.rejected, (state, action) => {
        state.todayActivitiesLoading = false;
        state.todayActivitiesError = action.payload;
      })
      
      .addCase(fetchActivitiesByDate.pending, (state) => {
        state.selectedDateActivitiesLoading = true;
      })
      .addCase(fetchActivitiesByDate.fulfilled, (state, action) => {
        state.selectedDateActivitiesLoading = false;
        state.selectedDateActivities = action.payload.data.data || [];
        state.selectedDate = action.payload.selectedDate;
      })
      .addCase(fetchActivitiesByDate.rejected, (state, action) => {
        state.selectedDateActivitiesLoading = false;
        state.todayActivitiesError = action.payload;
      })
      
      .addCase(fetchActivitiesForCalendar.pending, (state) => {
        state.calendarActivitiesLoading = true;
        state.calendarActivitiesError = null;
      })
      .addCase(fetchActivitiesForCalendar.fulfilled, (state, action) => {
        state.calendarActivitiesLoading = false;
        state.calendarActivities = action.payload.data || [];
      })
      .addCase(fetchActivitiesForCalendar.rejected, (state, action) => {
        state.calendarActivitiesLoading = false;
        state.calendarActivitiesError = action.payload;
      })

      .addCase(fetchKegiatanOptions.pending, (state) => {
        state.kegiatanOptionsLoading = true;
        state.kegiatanOptionsError = null;
      })
      .addCase(fetchKegiatanOptions.fulfilled, (state, action) => {
        state.kegiatanOptionsLoading = false;
        state.kegiatanOptions = action.payload || [];
      })
      .addCase(fetchKegiatanOptions.rejected, (state, action) => {
        state.kegiatanOptionsLoading = false;
        state.kegiatanOptionsError = action.payload;
      });
  }
});

// Actions
export const { 
  resetAktivitasDetail, 
  resetAktivitasError, 
  resetAktivitasList,
  clearSelectedMateri,
  resetMateriCacheError,
  resetTodayActivitiesError,
  resetCalendarActivitiesError,
  clearSelectedDateActivities
} = aktivitasSlice.actions;

// Selectors
export const selectAktivitasList = (state) => state.aktivitas.aktivitasList;
export const selectAktivitasDetail = (state) => state.aktivitas.aktivitasDetail;
export const selectAktivitasLoading = (state) => state.aktivitas.loading;
export const selectAktivitasError = (state) => state.aktivitas.error;
export const selectAktivitasConflicts = (state) => state.aktivitas.conflicts;
export const selectAktivitasPagination = (state) => state.aktivitas.pagination;
export const selectKelompokDetail = (state) => state.aktivitas.kelompokDetail?.data;
export const selectKelompokLoading = (state) => state.aktivitas.kelompokLoading;
export const selectIsLoadingMore = (state) => state.aktivitas.isLoadingMore;
export const selectAktivitasStatusUpdating = (state) => state.aktivitas.statusUpdating;
export const selectAktivitasAttendanceSummary = (state) => state.aktivitas.attendanceSummary;

// NEW: Kurikulum selectors
export const selectMateriCache = (state) => state.aktivitas.materiCache;
export const selectMateriCacheLoading = (state) => state.aktivitas.materiCacheLoading;
export const selectMateriCacheError = (state) => state.aktivitas.materiCacheError;
export const selectSelectedMateri = (state) => state.aktivitas.selectedMateri;
export const selectLastCacheUpdate = (state) => state.aktivitas.lastCacheUpdate;
export const selectIsCacheValid = (state) => {
  const { lastCacheUpdate, cacheExpiryMinutes } = state.aktivitas;
  if (!lastCacheUpdate) return false;
  const cacheAge = (Date.now() - lastCacheUpdate) / (1000 * 60); // minutes
  return cacheAge < cacheExpiryMinutes;
};

// Activity Report selectors
export const selectActivityReport = (state) => state.aktivitas.activityReport;
export const selectReportLoading = (state) => state.aktivitas.reportLoading;
export const selectReportError = (state) => state.aktivitas.reportError;
export const selectActivityReportCache = (state) => state.aktivitas.reportCache;

// Dashboard selectors
export const selectTodayActivities = (state) => state.aktivitas.todayActivities;
export const selectTodayActivitiesLoading = (state) => state.aktivitas.todayActivitiesLoading;
export const selectTodayActivitiesError = (state) => state.aktivitas.todayActivitiesError;
export const selectCalendarActivities = (state) => state.aktivitas.calendarActivities;
export const selectCalendarActivitiesLoading = (state) => state.aktivitas.calendarActivitiesLoading;
export const selectCalendarActivitiesError = (state) => state.aktivitas.calendarActivitiesError;
export const selectSelectedDateActivities = (state) => state.aktivitas.selectedDateActivities;
export const selectSelectedDateActivitiesLoading = (state) => state.aktivitas.selectedDateActivitiesLoading;
export const selectSelectedDate = (state) => state.aktivitas.selectedDate;
export const selectKegiatanOptions = (state) => state.aktivitas.kegiatanOptions;
export const selectKegiatanOptionsLoading = (state) => state.aktivitas.kegiatanOptionsLoading;
export const selectKegiatanOptionsError = (state) => state.aktivitas.kegiatanOptionsError;

export default aktivitasSlice.reducer;
