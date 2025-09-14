import { createAsyncThunk } from '@reduxjs/toolkit';
import { cpbLaporanApi } from '../api/cpbLaporanApi';

// Fetch main CPB report with summary counts
export const fetchCpbReport = createAsyncThunk(
  'cpbLaporan/fetchCpbReport',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await cpbLaporanApi.getCpbReport();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch CPB report';
      return rejectWithValue(message);
    }
  }
);

// Fetch children by specific CPB status
export const fetchCpbByStatus = createAsyncThunk(
  'cpbLaporan/fetchCpbByStatus',
  async ({ status, search }, { rejectWithValue }) => {
    try {
      const params = {};
      if (search) params.search = search;
      
      const response = await cpbLaporanApi.getCpbByStatus(status, params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch children by CPB status';
      return rejectWithValue(message);
    }
  }
);

// Export CPB data (JSON)
export const exportCpbData = createAsyncThunk(
  'cpbLaporan/exportCpbData',
  async ({ status } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (status) params.status = status;
      
      const response = await cpbLaporanApi.exportCpbData(params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to export CPB data';
      return rejectWithValue(message);
    }
  }
);

// Export CPB data as PDF
export const exportCpbPdf = createAsyncThunk(
  'cpbLaporan/exportCpbPdf',
  async ({ status } = {}, { rejectWithValue }) => {
    try {
      const params = { format: 'pdf' };
      if (status) params.status = status;
      
      const response = await cpbLaporanApi.exportCpbPdf(params);
      
      // Handle blob response for PDF
      if (response.data instanceof Blob) {
        return {
          blob: response.data,
          filename: response.headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1] || 
                   `laporan-cpb-${status ? status.toLowerCase() + '-' : ''}${new Date().toISOString().split('T')[0]}.pdf`
        };
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to export CPB PDF';
      return rejectWithValue(message);
    }
  }
);

// Initialize CPB laporan page data
export const initializeCpbLaporanPage = createAsyncThunk(
  'cpbLaporan/initializeCpbLaporanPage',
  async (params = {}, { dispatch, rejectWithValue }) => {
    try {
      // Fetch main summary data
      const reportResult = await dispatch(fetchCpbReport()).unwrap();
      
      // Fetch initial BCPB children data
      await dispatch(fetchCpbByStatus({ status: 'BCPB' })).unwrap();
      
      return { 
        success: true,
        report: reportResult
      };
    } catch (error) {
      const message = error.message || 'Failed to initialize CPB laporan page';
      return rejectWithValue(message);
    }
  }
);

// Fetch children for specific tab
export const fetchCpbTabData = createAsyncThunk(
  'cpbLaporan/fetchCpbTabData',
  async (status, { getState, dispatch }) => {
    const { cpbLaporan } = getState();
    const { search } = cpbLaporan.filters;
    
    return dispatch(fetchCpbByStatus({ status, search })).unwrap();
  }
);