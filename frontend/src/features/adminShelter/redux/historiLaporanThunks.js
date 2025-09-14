import { createAsyncThunk } from '@reduxjs/toolkit';
import { historiLaporanApi } from '../api/historiLaporanApi';

export const fetchLaporanHistori = createAsyncThunk(
  'historiLaporan/fetchLaporanHistori',
  async ({ start_date, end_date, jenis_histori, search, page = 1, append = false } = {}, { rejectWithValue }) => {
    try {
      const params = { page };
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (jenis_histori) params.jenis_histori = jenis_histori;
      if (search) params.search = search;
      
      const response = await historiLaporanApi.getLaporanHistori(params);
      return { ...response.data.data, append };
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch laporan histori';
      return rejectWithValue(message);
    }
  }
);

export const fetchHistoriDetail = createAsyncThunk(
  'historiLaporan/fetchHistoriDetail',
  async ({ historiId, start_date, end_date, jenis_histori }, { rejectWithValue }) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (jenis_histori) params.jenis_histori = jenis_histori;
      
      const response = await historiLaporanApi.getHistoriDetail(historiId, params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch histori detail';
      return rejectWithValue(message);
    }
  }
);

export const fetchJenisHistoriOptions = createAsyncThunk(
  'historiLaporan/fetchJenisHistoriOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await historiLaporanApi.getJenisHistoriOptions();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch jenis histori options';
      return rejectWithValue(message);
    }
  }
);

export const fetchAvailableYears = createAsyncThunk(
  'historiLaporan/fetchAvailableYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await historiLaporanApi.getAvailableYears();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch available years';
      return rejectWithValue(message);
    }
  }
);

export const initializeHistoriLaporanPage = createAsyncThunk(
  'historiLaporan/initializeHistoriLaporanPage',
  async ({ start_date, end_date, jenis_histori, search } = {}, { dispatch, rejectWithValue }) => {
    try {
      const yearsResult = await dispatch(fetchAvailableYears()).unwrap();
      const jenisHistoriResult = await dispatch(fetchJenisHistoriOptions()).unwrap();
      
      await dispatch(fetchLaporanHistori({ 
        start_date, 
        end_date,
        jenis_histori,
        search
      })).unwrap();
      
      return { 
        success: true,
        years: yearsResult,
        jenisHistoriOptions: jenisHistoriResult
      };
    } catch (error) {
      const message = error.message || 'Failed to initialize histori laporan page';
      return rejectWithValue(message);
    }
  }
);

export const updateFiltersAndRefreshAll = createAsyncThunk(
  'historiLaporan/updateFiltersAndRefreshAll',
  async ({ newFilters, page = 1, append = false }, { dispatch, getState, rejectWithValue }) => {
    try {
      const { historiLaporan } = getState();
      const updatedFilters = { ...historiLaporan.filters, ...newFilters };
      
      dispatch({ type: 'historiLaporan/setFilters', payload: newFilters });
      
      const historiDataResult = await dispatch(fetchLaporanHistori({
        start_date: updatedFilters.start_date,
        end_date: updatedFilters.end_date,
        jenis_histori: updatedFilters.jenis_histori,
        search: updatedFilters.search,
        page,
        append
      })).unwrap();
      
      return {
        filters: updatedFilters,
        historiData: historiDataResult,
        append
      };
    } catch (error) {
      const message = error.message || 'Failed to update filters and refresh data';
      return rejectWithValue(message);
    }
  }
);

export const refreshHistoriLaporanWithFilters = createAsyncThunk(
  'historiLaporan/refreshHistoriLaporanWithFilters',
  async (_, { getState, dispatch }) => {
    const { historiLaporan } = getState();
    const { start_date, end_date, jenis_histori, search } = historiLaporan.filters;
    
    return dispatch(fetchLaporanHistori({ 
      start_date, 
      end_date,
      jenis_histori,
      search 
    }));
  }
);