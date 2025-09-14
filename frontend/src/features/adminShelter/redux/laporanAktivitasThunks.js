import { createAsyncThunk } from '@reduxjs/toolkit';
import { laporanAktivitasApi } from '../api/laporanAktivitasApi';

// Fetch main laporan aktivitas with filters
export const fetchLaporanAktivitas = createAsyncThunk(
  'laporanAktivitas/fetchLaporanAktivitas',
  async ({ year, jenisKegiatan, month } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (year) params.year = year;
      if (jenisKegiatan) params.jenis_kegiatan = jenisKegiatan;
      if (month) params.month = month;
      
      const response = await laporanAktivitasApi.getLaporanAktivitas(params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch laporan aktivitas';
      return rejectWithValue(message);
    }
  }
);

// Fetch activity detail report
export const fetchActivityDetailReport = createAsyncThunk(
  'laporanAktivitas/fetchActivityDetailReport',
  async (activityId, { rejectWithValue }) => {
    try {
      const response = await laporanAktivitasApi.getActivityDetailReport(activityId);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch activity detail report';
      return rejectWithValue(message);
    }
  }
);

// Fetch jenis kegiatan options for filter
export const fetchJenisKegiatanOptions = createAsyncThunk(
  'laporanAktivitas/fetchJenisKegiatanOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await laporanAktivitasApi.getJenisKegiatanOptions();
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
  'laporanAktivitas/fetchAvailableYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await laporanAktivitasApi.getAvailableYears();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch available years';
      return rejectWithValue(message);
    }
  }
);

// Combined thunk to refresh laporan with current filters
export const refreshLaporanAktivitasWithFilters = createAsyncThunk(
  'laporanAktivitas/refreshLaporanAktivitasWithFilters',
  async (_, { getState, dispatch }) => {
    const { laporanAktivitas } = getState();
    const { year, jenisKegiatan, month } = laporanAktivitas.filters;
    
    return dispatch(fetchLaporanAktivitas({ 
      year, 
      jenisKegiatan,
      month 
    }));
  }
);

// Initialize laporan aktivitas page data (fetch filters and initial data)
export const initializeLaporanAktivitasPage = createAsyncThunk(
  'laporanAktivitas/initializeLaporanAktivitasPage',
  async ({ year, jenisKegiatan, month } = {}, { dispatch, rejectWithValue }) => {
    try {
      // Fetch filter options first
      const yearsResult = await dispatch(fetchAvailableYears()).unwrap();
      const activitiesResult = await dispatch(fetchJenisKegiatanOptions()).unwrap();
      
      // Fetch main data with current or provided filters
      const currentYear = year || new Date().getFullYear();
      await dispatch(fetchLaporanAktivitas({ 
        year: currentYear, 
        jenisKegiatan,
        month 
      })).unwrap();
      
      return { 
        success: true,
        years: yearsResult,
        activities: activitiesResult
      };
    } catch (error) {
      const message = error.message || 'Failed to initialize laporan aktivitas page';
      return rejectWithValue(message);
    }
  }
);

// Update filters and refresh data
export const updateFiltersAndRefreshAktivitas = createAsyncThunk(
  'laporanAktivitas/updateFiltersAndRefreshAktivitas',
  async (newFilters, { dispatch, getState }) => {
    const { laporanAktivitas } = getState();
    const updatedFilters = { ...laporanAktivitas.filters, ...newFilters };
    
    // Update filters in state first
    dispatch({ type: 'laporanAktivitas/setFilters', payload: newFilters });
    
    // Then fetch with new filters
    return dispatch(fetchLaporanAktivitas(updatedFilters)).unwrap();
  }
);