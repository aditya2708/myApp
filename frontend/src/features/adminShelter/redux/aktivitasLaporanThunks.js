import { createAsyncThunk } from '@reduxjs/toolkit';
import { aktivitasLaporanApi } from '../api/aktivitasLaporanApi';

export const fetchLaporanAktivitas = createAsyncThunk(
  'aktivitasLaporan/fetchLaporanAktivitas',
  async ({ year, jenisKegiatan, month } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (year) params.year = year;
      if (jenisKegiatan) params.jenis_kegiatan = jenisKegiatan;
      if (month) params.month = month;
      
      console.log('Fetching laporan aktivitas with params:', params);
      const response = await aktivitasLaporanApi.getLaporanAktivitas(params);
      console.log('Laporan aktivitas response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching laporan aktivitas:', error);
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch laporan aktivitas';
      return rejectWithValue(message);
    }
  }
);

export const fetchActivityDetailReport = createAsyncThunk(
  'aktivitasLaporan/fetchActivityDetailReport',
  async (activityId, { rejectWithValue }) => {
    try {
      console.log('Fetching activity detail for ID:', activityId);
      const response = await aktivitasLaporanApi.getActivityDetailReport(activityId);
      console.log('Activity detail response:', response.data);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching activity detail:', error);
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch activity detail report';
      return rejectWithValue(message);
    }
  }
);

export const fetchAktivitasJenisKegiatanOptions = createAsyncThunk(
  'aktivitasLaporan/fetchAktivitasJenisKegiatanOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aktivitasLaporanApi.getJenisKegiatanOptions();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch jenis kegiatan options';
      return rejectWithValue(message);
    }
  }
);

export const fetchAktivitasAvailableYears = createAsyncThunk(
  'aktivitasLaporan/fetchAktivitasAvailableYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aktivitasLaporanApi.getAvailableYears();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch available years';
      return rejectWithValue(message);
    }
  }
);

export const refreshAktivitasLaporanWithFilters = createAsyncThunk(
  'aktivitasLaporan/refreshAktivitasLaporanWithFilters',
  async (_, { getState, dispatch }) => {
    const { aktivitasLaporan } = getState();
    const { year, jenisKegiatan, month } = aktivitasLaporan.filters;
    
    return dispatch(fetchLaporanAktivitas({ 
      year, 
      jenisKegiatan,
      month 
    }));
  }
);

export const initializeAktivitasLaporanPage = createAsyncThunk(
  'aktivitasLaporan/initializeAktivitasLaporanPage',
  async ({ year, jenisKegiatan, month } = {}, { dispatch, rejectWithValue }) => {
    try {
      const yearsResult = await dispatch(fetchAktivitasAvailableYears()).unwrap();
      const activitiesResult = await dispatch(fetchAktivitasJenisKegiatanOptions()).unwrap();
      
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
      const message = error.message || 'Failed to initialize aktivitas laporan page';
      return rejectWithValue(message);
    }
  }
);

export const updateAktivitasFiltersAndRefresh = createAsyncThunk(
  'aktivitasLaporan/updateAktivitasFiltersAndRefresh',
  async (newFilters, { dispatch, getState }) => {
    const { aktivitasLaporan } = getState();
    const updatedFilters = { ...aktivitasLaporan.filters, ...newFilters };
    
    dispatch({ type: 'aktivitasLaporan/setFilters', payload: newFilters });
    
    return dispatch(fetchLaporanAktivitas(updatedFilters)).unwrap();
  }
);