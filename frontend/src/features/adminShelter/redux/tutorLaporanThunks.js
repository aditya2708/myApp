import { createAsyncThunk } from '@reduxjs/toolkit';
import { tutorLaporanApi } from '../api/tutorLaporanApi';

export const fetchLaporanTutor = createAsyncThunk(
  'tutorLaporan/fetchLaporanTutor',
  async ({ start_date, end_date, jenisKegiatan, search, page = 1, append = false } = {}, { rejectWithValue }) => {
    try {
      const params = { page };
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (jenisKegiatan) params.jenis_kegiatan = jenisKegiatan;
      if (search) params.search = search;
      
      const response = await tutorLaporanApi.getLaporanTutor(params);
      return { ...response.data.data, append };
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch laporan tutor';
      return rejectWithValue(message);
    }
  }
);

export const fetchTutorDetailReport = createAsyncThunk(
  'tutorLaporan/fetchTutorDetailReport',
  async ({ tutorId, start_date, end_date, jenisKegiatan }, { rejectWithValue }) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (jenisKegiatan) params.jenis_kegiatan = jenisKegiatan;
      
      const response = await tutorLaporanApi.getTutorDetailReport(tutorId, params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch tutor detail report';
      return rejectWithValue(message);
    }
  }
);

export const exportTutorData = createAsyncThunk(
  'tutorLaporan/exportTutorData',
  async ({ start_date, end_date, jenisKegiatan, search } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (jenisKegiatan) params.jenis_kegiatan = jenisKegiatan;
      if (search) params.search = search;
      
      const response = await tutorLaporanApi.exportTutorData(params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to export tutor data';
      return rejectWithValue(message);
    }
  }
);

export const exportTutorPdf = createAsyncThunk(
  'tutorLaporan/exportTutorPdf',
  async ({ start_date, end_date, jenisKegiatan, search } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (jenisKegiatan) params.jenis_kegiatan = jenisKegiatan;
      if (search) params.search = search;
      
      const response = await tutorLaporanApi.exportTutorPdf(params);
      
      // Handle blob response for PDF
      if (response.data instanceof Blob) {
        return {
          blob: response.data,
          filename: response.headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1] || 
                   `laporan-tutor-${new Date().toISOString().split('T')[0]}.pdf`
        };
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to export tutor PDF';
      return rejectWithValue(message);
    }
  }
);

export const fetchTutorJenisKegiatanOptions = createAsyncThunk(
  'tutorLaporan/fetchTutorJenisKegiatanOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorLaporanApi.getJenisKegiatanOptions();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch jenis kegiatan options';
      return rejectWithValue(message);
    }
  }
);

export const fetchTutorAvailableYears = createAsyncThunk(
  'tutorLaporan/fetchTutorAvailableYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorLaporanApi.getAvailableYears();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.message || 
        'Failed to fetch available years';
      return rejectWithValue(message);
    }
  }
);

export const refreshTutorLaporanWithFilters = createAsyncThunk(
  'tutorLaporan/refreshTutorLaporanWithFilters',
  async (_, { getState, dispatch }) => {
    const { tutorLaporan } = getState();
    const { start_date, end_date, jenisKegiatan, search } = tutorLaporan.filters;
    
    return dispatch(fetchLaporanTutor({ 
      start_date, 
      end_date,
      jenisKegiatan,
      search 
    }));
  }
);

export const initializeTutorLaporanPage = createAsyncThunk(
  'tutorLaporan/initializeTutorLaporanPage',
  async ({ start_date, end_date, jenisKegiatan, search } = {}, { dispatch, rejectWithValue }) => {
    try {
      const yearsResult = await dispatch(fetchTutorAvailableYears()).unwrap();
      const activitiesResult = await dispatch(fetchTutorJenisKegiatanOptions()).unwrap();
      
      await dispatch(fetchLaporanTutor({ 
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
      const message = error.message || 'Failed to initialize tutor laporan page';
      return rejectWithValue(message);
    }
  }
);

export const updateTutorFiltersAndRefreshAll = createAsyncThunk(
  'tutorLaporan/updateTutorFiltersAndRefreshAll',
  async ({ newFilters, page = 1, append = false }, { dispatch, getState, rejectWithValue }) => {
    try {
      const { tutorLaporan } = getState();
      const updatedFilters = { ...tutorLaporan.filters, ...newFilters };
      
      // Update filters in state first
      dispatch({ type: 'tutorLaporan/setFilters', payload: newFilters });
      
      // Fetch tutor data with new filters
      const tutorDataResult = await dispatch(fetchLaporanTutor({
        start_date: updatedFilters.start_date,
        end_date: updatedFilters.end_date,
        jenisKegiatan: updatedFilters.jenisKegiatan,
        search: updatedFilters.search,
        page,
        append
      })).unwrap();
      
      return {
        filters: updatedFilters,
        tutorData: tutorDataResult,
        append
      };
    } catch (error) {
      const message = error.message || 'Failed to update filters and refresh data';
      return rejectWithValue(message);
    }
  }
);