import { createAsyncThunk } from '@reduxjs/toolkit';
import { laporanAnakApi } from '../api/laporanAnakApi';

// Fetch main laporan anak binaan with summary and children list
export const fetchLaporanAnakBinaan = createAsyncThunk(
  'laporan/fetchLaporanAnakBinaan',
  async ({ start_date, end_date, jenisKegiatan, search, page = 1, append = false } = {}, { rejectWithValue }) => {
    try {
      const params = { page };
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (jenisKegiatan) params.jenisKegiatan = jenisKegiatan;
      if (search) params.search = search;
      
      const response = await laporanAnakApi.getLaporanAnakBinaan(params);
      return { ...response.data.data, append };
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch laporan anak binaan';
      return rejectWithValue(message);
    }
  }
);

// Fetch child detail report
export const fetchChildDetailReport = createAsyncThunk(
  'laporan/fetchChildDetailReport',
  async ({ childId, start_date, end_date, jenisKegiatan }, { rejectWithValue }) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (jenisKegiatan) params.jenisKegiatan = jenisKegiatan;
      
      const response = await laporanAnakApi.getChildDetailReport(childId, params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch child detail report';
      return rejectWithValue(message);
    }
  }
);

// Fetch jenis kegiatan options for filter
export const fetchJenisKegiatanOptions = createAsyncThunk(
  'laporan/fetchJenisKegiatanOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await laporanAnakApi.getJenisKegiatanOptions();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch jenis kegiatan options';
      return rejectWithValue(message);
    }
  }
);

// Fetch available years for filter
export const fetchAvailableYears = createAsyncThunk(
  'laporan/fetchAvailableYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await laporanAnakApi.getAvailableYears();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch available years';
      return rejectWithValue(message);
    }
  }
);

// Initialize laporan page
export const initializeLaporanPage = createAsyncThunk(
  'laporan/initializeLaporanPage',
  async ({ start_date, end_date, jenisKegiatan, search } = {}, { dispatch, rejectWithValue }) => {
    try {
      // Fetch filter options first
      const yearsResult = await dispatch(fetchAvailableYears()).unwrap();
      const activitiesResult = await dispatch(fetchJenisKegiatanOptions()).unwrap();
      
      // Fetch main data
      await dispatch(fetchLaporanAnakBinaan({ 
        start_date, 
        end_date,
        jenisKegiatan,
        search
      })).unwrap();
      
      return { 
        success: true,
        years: yearsResult,
        activities: activitiesResult
      };
    } catch (error) {
      const message = error.message || 'Failed to initialize laporan page';
      return rejectWithValue(message);
    }
  }
);

// Combined update filters and refresh all data
export const updateFiltersAndRefreshAll = createAsyncThunk(
  'laporan/updateFiltersAndRefreshAll',
  async ({ newFilters, page = 1 }, { dispatch, getState, rejectWithValue }) => {
    try {
      const { laporan } = getState();
      const updatedFilters = { ...laporan.filters, ...newFilters };
      
      dispatch({ type: 'laporan/setFilters', payload: newFilters });
      
      const result = await dispatch(fetchLaporanAnakBinaan({
        start_date: updatedFilters.start_date,
        end_date: updatedFilters.end_date,
        jenisKegiatan: updatedFilters.jenisKegiatan,
        search: updatedFilters.search,
        page
      })).unwrap();
      
      return {
        filters: updatedFilters,
        data: result
      };
    } catch (error) {
      const message = error.message || 'Failed to update filters and refresh data';
      return rejectWithValue(message);
    }
  }
);

// Refresh laporan with current filters
export const refreshLaporanWithFilters = createAsyncThunk(
  'laporan/refreshLaporanWithFilters',
  async (_, { getState, dispatch }) => {
    const { laporan } = getState();
    const { start_date, end_date, jenisKegiatan, search } = laporan.filters;
    
    return dispatch(fetchLaporanAnakBinaan({ 
      start_date, 
      end_date,
      jenisKegiatan,
      search 
    }));
  }
);