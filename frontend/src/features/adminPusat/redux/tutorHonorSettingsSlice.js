import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tutorHonorSettingsApi } from '../api/tutorHonorSettingsApi';
import { formatRupiah } from '../../../utils/currencyFormatter';

const initialState = {
  settings: [],
  activeSetting: null,
  selectedSetting: null,
  statistics: null,
  preview: null,
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  },
  actionStatus: {
    create: 'idle',
    update: 'idle',
    delete: 'idle',
    setActive: 'idle'
  },
  actionError: {
    create: null,
    update: null,
    delete: null,
    setActive: null
  },
  paymentSystems: [
    { value: 'flat_monthly', label: 'Honor Bulanan Tetap' },
    { value: 'per_session', label: 'Per Sesi/Pertemuan' },
    { value: 'per_student_category', label: 'Per Kategori Siswa' },
    { value: 'session_per_student_category', label: 'Per Sesi + Per Kategori Siswa' }
  ]
};

export const fetchSettings = createAsyncThunk(
  'tutorHonorSettings/fetchSettings',
  async (params, { rejectWithValue }) => {
    try {
      const response = await tutorHonorSettingsApi.getSettings(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal memuat pengaturan');
    }
  }
);

export const fetchActiveSetting = createAsyncThunk(
  'tutorHonorSettings/fetchActiveSetting',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorHonorSettingsApi.getActiveSetting();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal memuat pengaturan aktif');
    }
  }
);

export const fetchSetting = createAsyncThunk(
  'tutorHonorSettings/fetchSetting',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tutorHonorSettingsApi.getSetting(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal memuat pengaturan');
    }
  }
);

export const createSetting = createAsyncThunk(
  'tutorHonorSettings/createSetting',
  async (data, { rejectWithValue }) => {
    try {
      const response = await tutorHonorSettingsApi.createSetting(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal membuat pengaturan');
    }
  }
);

export const updateSetting = createAsyncThunk(
  'tutorHonorSettings/updateSetting',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await tutorHonorSettingsApi.updateSetting(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal memperbarui pengaturan');
    }
  }
);

export const setActiveSetting = createAsyncThunk(
  'tutorHonorSettings/setActiveSetting',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tutorHonorSettingsApi.setActive(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal mengaktifkan pengaturan');
    }
  }
);

export const deleteSetting = createAsyncThunk(
  'tutorHonorSettings/deleteSetting',
  async (id, { rejectWithValue }) => {
    try {
      await tutorHonorSettingsApi.deleteSetting(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal menghapus pengaturan');
    }
  }
);

export const calculatePreview = createAsyncThunk(
  'tutorHonorSettings/calculatePreview',
  async (data, { rejectWithValue }) => {
    try {
      const response = await tutorHonorSettingsApi.calculatePreview(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal menghitung pratinjau');
    }
  }
);

export const fetchStatistics = createAsyncThunk(
  'tutorHonorSettings/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorHonorSettingsApi.getStatistics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Gagal memuat statistik');
    }
  }
);

const addFormattedRates = (setting) => {
  if (!setting) return setting;
  
  const formatted = { ...setting };
  
  // Add formatted rates based on payment system
  switch (setting.payment_system) {
    case 'flat_monthly':
      if (setting.flat_monthly_rate !== null && setting.flat_monthly_rate !== undefined) {
        formatted.formatted_flat_monthly_rate = formatRupiah(setting.flat_monthly_rate);
      }
      break;
    case 'per_session':
      if (setting.session_rate !== null && setting.session_rate !== undefined) {
        formatted.formatted_session_rate = formatRupiah(setting.session_rate);
      }
      break;
    case 'per_student_category':
      if (setting.cpb_rate !== null && setting.cpb_rate !== undefined) {
        formatted.formatted_cpb_rate = formatRupiah(setting.cpb_rate);
      }
      if (setting.pb_rate !== null && setting.pb_rate !== undefined) {
        formatted.formatted_pb_rate = formatRupiah(setting.pb_rate);
      }
      if (setting.npb_rate !== null && setting.npb_rate !== undefined) {
        formatted.formatted_npb_rate = formatRupiah(setting.npb_rate);
      }
      break;
    case 'session_per_student_category':
      if (setting.session_rate !== null && setting.session_rate !== undefined) {
        formatted.formatted_session_rate = formatRupiah(setting.session_rate);
      }
      if (setting.cpb_rate !== null && setting.cpb_rate !== undefined) {
        formatted.formatted_cpb_rate = formatRupiah(setting.cpb_rate);
      }
      if (setting.pb_rate !== null && setting.pb_rate !== undefined) {
        formatted.formatted_pb_rate = formatRupiah(setting.pb_rate);
      }
      if (setting.npb_rate !== null && setting.npb_rate !== undefined) {
        formatted.formatted_npb_rate = formatRupiah(setting.npb_rate);
      }
      break;
  }
  
  return formatted;
};

const tutorHonorSettingsSlice = createSlice({
  name: 'tutorHonorSettings',
  initialState,
  reducers: {
    resetError: (state) => {
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
    },
    clearSelectedSetting: (state) => {
      state.selectedSetting = null;
    },
    clearPreview: (state) => {
      state.preview = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        const settingsData = action.payload.data || [];
        
        // Add formatted rates to each setting
        state.settings = settingsData.map(setting => addFormattedRates(setting));
        
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchActiveSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSetting = addFormattedRates(action.payload.data);
      })
      .addCase(fetchActiveSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSetting = addFormattedRates(action.payload.data);
      })
      .addCase(fetchSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(createSetting.pending, (state) => {
        state.actionStatus.create = 'loading';
        state.actionError.create = null;
      })
      .addCase(createSetting.fulfilled, (state, action) => {
        state.actionStatus.create = 'succeeded';
        const newSetting = addFormattedRates(action.payload.data);
        state.settings.unshift(newSetting);
        
        if (newSetting.is_active) {
          state.activeSetting = newSetting;
        }
      })
      .addCase(createSetting.rejected, (state, action) => {
        state.actionStatus.create = 'failed';
        state.actionError.create = action.payload;
      })
      
      .addCase(updateSetting.pending, (state) => {
        state.actionStatus.update = 'loading';
        state.actionError.update = null;
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        state.actionStatus.update = 'succeeded';
        const updatedSetting = addFormattedRates(action.payload.data);
        
        const index = state.settings.findIndex(s => s.id_setting === updatedSetting.id_setting);
        if (index !== -1) {
          state.settings[index] = updatedSetting;
        }
        
        if (updatedSetting.is_active) {
          state.activeSetting = updatedSetting;
        }
        
        if (state.selectedSetting && state.selectedSetting.id_setting === updatedSetting.id_setting) {
          state.selectedSetting = updatedSetting;
        }
      })
      .addCase(updateSetting.rejected, (state, action) => {
        state.actionStatus.update = 'failed';
        state.actionError.update = action.payload;
      })
      
      .addCase(setActiveSetting.pending, (state) => {
        state.actionStatus.setActive = 'loading';
        state.actionError.setActive = null;
      })
      .addCase(setActiveSetting.fulfilled, (state, action) => {
        state.actionStatus.setActive = 'succeeded';
        const activatedSetting = addFormattedRates(action.payload.data);
        
        // Update active status in settings list
        state.settings.forEach(setting => {
          setting.is_active = setting.id_setting === activatedSetting.id_setting;
        });
        
        state.activeSetting = activatedSetting;
      })
      .addCase(setActiveSetting.rejected, (state, action) => {
        state.actionStatus.setActive = 'failed';
        state.actionError.setActive = action.payload;
      })
      
      .addCase(deleteSetting.pending, (state) => {
        state.actionStatus.delete = 'loading';
        state.actionError.delete = null;
      })
      .addCase(deleteSetting.fulfilled, (state, action) => {
        state.actionStatus.delete = 'succeeded';
        state.settings = state.settings.filter(s => s.id_setting !== action.payload);
        
        if (state.selectedSetting && state.selectedSetting.id_setting === action.payload) {
          state.selectedSetting = null;
        }
      })
      .addCase(deleteSetting.rejected, (state, action) => {
        state.actionStatus.delete = 'failed';
        state.actionError.delete = action.payload;
      })
      
      .addCase(calculatePreview.fulfilled, (state, action) => {
        const previewData = action.payload.data;
        
        // Add formatted total if not already present
        if (previewData && previewData.calculation && !previewData.formatted_total) {
          previewData.formatted_total = formatRupiah(previewData.calculation.total_amount || 0);
        }
        
        // Add formatted amounts to breakdown
        if (previewData && previewData.calculation && previewData.calculation.breakdown) {
          Object.keys(previewData.calculation.breakdown).forEach(key => {
            const item = previewData.calculation.breakdown[key];
            if (item && typeof item === 'object') {
              if (item.amount !== undefined) {
                item.formatted_amount = formatRupiah(item.amount);
              }
              if (item.rate !== undefined) {
                item.formatted_rate = formatRupiah(item.rate);
              }
            }
          });
        }
        
        state.preview = previewData;
      })
      
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        const statistics = action.payload.data;
        
        // Add formatted amounts to statistics
        if (statistics) {
          if (statistics.current_active_setting) {
            statistics.current_active_setting = addFormattedRates(statistics.current_active_setting);
          }
        }
        
        state.statistics = statistics;
      });
  }
});

export const {
  resetError,
  resetActionStatus,
  clearSelectedSetting,
  clearPreview
} = tutorHonorSettingsSlice.actions;

// Selectors
export const selectSettings = state => state.tutorHonorSettings.settings;
export const selectActiveSetting = state => state.tutorHonorSettings.activeSetting;
export const selectSelectedSetting = state => state.tutorHonorSettings.selectedSetting;
export const selectStatistics = state => state.tutorHonorSettings.statistics;
export const selectPreview = state => state.tutorHonorSettings.preview;
export const selectLoading = state => state.tutorHonorSettings.loading;
export const selectError = state => state.tutorHonorSettings.error;
export const selectPagination = state => state.tutorHonorSettings.pagination;
export const selectActionStatus = (state, action) => state.tutorHonorSettings.actionStatus[action];
export const selectActionError = (state, action) => state.tutorHonorSettings.actionError[action];
export const selectPaymentSystems = state => state.tutorHonorSettings.paymentSystems;

export default tutorHonorSettingsSlice.reducer;