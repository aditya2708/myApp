import { createAsyncThunk } from '@reduxjs/toolkit';
import { laporanSuratApi } from '../api/laporanSuratApi';

// Fetch main laporan surat with statistics
export const fetchLaporanSurat = createAsyncThunk(
  'laporanSurat/fetchLaporanSurat',
  async ({ start_date, end_date, is_read } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (is_read !== null && is_read !== undefined) params.is_read = is_read;
      
      const response = await laporanSuratApi.getLaporanSurat(params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch laporan surat';
      return rejectWithValue(message);
    }
  }
);

// Fetch shelter detail with surat list
export const fetchShelterDetail = createAsyncThunk(
  'laporanSurat/fetchShelterDetail',
  async ({ shelterId, start_date, end_date, is_read, search, page, per_page }, { rejectWithValue }) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (is_read !== null && is_read !== undefined) params.is_read = is_read;
      if (search) params.search = search;
      if (page) params.page = page;
      if (per_page) params.per_page = per_page;
      
      const response = await laporanSuratApi.getShelterDetail(shelterId, params);
      return {
        shelter_id: shelterId,
        data: response.data.data
      };
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch shelter detail';
      return rejectWithValue(message);
    }
  }
);

// Fetch filter options
export const fetchFilterOptions = createAsyncThunk(
  'laporanSurat/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await laporanSuratApi.getFilterOptions();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch filter options';
      return rejectWithValue(message);
    }
  }
);

// Fetch available years
export const fetchAvailableYears = createAsyncThunk(
  'laporanSurat/fetchAvailableYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await laporanSuratApi.getAvailableYears();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch available years';
      return rejectWithValue(message);
    }
  }
);

// Initialize laporan surat page
export const initializeLaporanSuratPage = createAsyncThunk(
  'laporanSurat/initializeLaporanSuratPage',
  async ({ start_date, end_date, is_read } = {}, { dispatch, rejectWithValue }) => {
    try {
      // Fetch filter options first
      const filterOptionsResult = await dispatch(fetchFilterOptions()).unwrap();
      const yearsResult = await dispatch(fetchAvailableYears()).unwrap();
      
      // Fetch main data
      await dispatch(fetchLaporanSurat({ 
        start_date, 
        end_date, 
        is_read 
      })).unwrap();
      
      return { 
        success: true,
        filterOptions: filterOptionsResult,
        years: yearsResult
      };
    } catch (error) {
      const message = error.message || 'Failed to initialize laporan surat page';
      return rejectWithValue(message);
    }
  }
);

// Combined update filters and refresh all data (NEW - MAIN SOLUTION)
export const updateFiltersAndRefreshAll = createAsyncThunk(
  'laporanSurat/updateFiltersAndRefreshAll',
  async ({ newFilters, shelterId, page = 1, per_page }, { dispatch, getState, rejectWithValue }) => {
    try {
      const { laporanSurat } = getState();
      const updatedFilters = { ...laporanSurat.filters, ...newFilters };
      
      // Update filters in state first
      dispatch({ type: 'laporanSurat/setFilters', payload: newFilters });
      
      // Fetch statistics with new filters
      const statisticsResult = await dispatch(fetchLaporanSurat(updatedFilters)).unwrap();
      
      // Fetch surat list with new filters if shelterId is provided
      let shelterDetailResult = null;
      if (shelterId) {
        shelterDetailResult = await dispatch(fetchShelterDetail({
          shelterId,
          page,
          per_page,
          ...updatedFilters
        })).unwrap();
      }
      
      return {
        filters: updatedFilters,
        statistics: statisticsResult,
        shelterDetail: shelterDetailResult
      };
    } catch (error) {
      const message = error.message || 'Failed to update filters and refresh data';
      return rejectWithValue(message);
    }
  }
);

// Update filters and refresh (DEPRECATED - kept for backward compatibility)
export const updateFiltersAndRefresh = createAsyncThunk(
  'laporanSurat/updateFiltersAndRefresh',
  async (newFilters, { dispatch, getState }) => {
    const { laporanSurat } = getState();
    const updatedFilters = { ...laporanSurat.filters, ...newFilters };
    
    // Update filters in state first
    dispatch({ type: 'laporanSurat/setFilters', payload: newFilters });
    
    // Then fetch with new filters
    return dispatch(fetchLaporanSurat(updatedFilters)).unwrap();
  }
);