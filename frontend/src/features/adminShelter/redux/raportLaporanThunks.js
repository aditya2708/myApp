import { createAsyncThunk } from '@reduxjs/toolkit';
import { raportLaporanApi } from '../api/raportLaporanApi';

export const fetchLaporanRaport = createAsyncThunk(
  'raportLaporan/fetchLaporanRaport',
  async ({ start_date, end_date, mata_pelajaran, search, page = 1, append = false } = {}, { rejectWithValue }) => {
    try {
      const params = { page };
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (mata_pelajaran) params.mata_pelajaran = mata_pelajaran;
      if (search) params.search = search;
      
      const response = await raportLaporanApi.getLaporanRaport(params);
      return { ...response.data.data, append };
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch laporan raport';
      return rejectWithValue(message);
    }
  }
);

export const fetchChildDetailReport = createAsyncThunk(
  'raportLaporan/fetchChildDetailReport',
  async ({ childId, start_date, end_date, mata_pelajaran }, { rejectWithValue }) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (mata_pelajaran) params.mata_pelajaran = mata_pelajaran;
      
      const response = await raportLaporanApi.getChildDetailReport(childId, params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch child detail report';
      return rejectWithValue(message);
    }
  }
);

export const fetchRaportFilterOptions = createAsyncThunk(
  'raportLaporan/fetchRaportFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const [semesterResponse, mataPelajaranResponse] = await Promise.all([
        raportLaporanApi.getSemesterOptions(),
        raportLaporanApi.getMataPelajaranOptions()
      ]);
      
      return {
        availableSemesters: semesterResponse.data.data,
        availableMataPelajaran: mataPelajaranResponse.data.data
      };
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch filter options';
      return rejectWithValue(message);
    }
  }
);

export const fetchRaportAvailableYears = createAsyncThunk(
  'raportLaporan/fetchRaportAvailableYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await raportLaporanApi.getAvailableYears();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch available years';
      return rejectWithValue(message);
    }
  }
);

export const initializeRaportLaporanPage = createAsyncThunk(
  'raportLaporan/initializeRaportLaporanPage',
  async ({ start_date, end_date, mata_pelajaran, search } = {}, { dispatch, rejectWithValue }) => {
    try {
      const [filterOptionsResult, yearsResult] = await Promise.all([
        dispatch(fetchRaportFilterOptions()).unwrap(),
        dispatch(fetchRaportAvailableYears()).unwrap()
      ]);
      
      await dispatch(fetchLaporanRaport({ 
        start_date, 
        end_date,
        mata_pelajaran,
        search
      })).unwrap();
      
      return { 
        success: true,
        filterOptions: filterOptionsResult,
        years: yearsResult
      };
    } catch (error) {
      const message = error.message || 'Failed to initialize raport laporan page';
      return rejectWithValue(message);
    }
  }
);

export const updateRaportFiltersAndRefreshAll = createAsyncThunk(
  'raportLaporan/updateRaportFiltersAndRefreshAll',
  async ({ newFilters, page = 1, append = false }, { dispatch, getState, rejectWithValue }) => {
    try {
      const { raportLaporan } = getState();
      const updatedFilters = { ...raportLaporan.filters, ...newFilters };
      
      // Update filters in state first
      dispatch({ type: 'raportLaporan/setFilters', payload: newFilters });
      
      // Fetch raport data with new filters
      const raportDataResult = await dispatch(fetchLaporanRaport({
        start_date: updatedFilters.start_date,
        end_date: updatedFilters.end_date,
        mata_pelajaran: updatedFilters.mata_pelajaran,
        search: updatedFilters.search,
        page,
        append
      })).unwrap();
      
      return {
        filters: updatedFilters,
        raportData: raportDataResult,
        append
      };
    } catch (error) {
      const message = error.message || 'Failed to update filters and refresh data';
      return rejectWithValue(message);
    }
  }
);