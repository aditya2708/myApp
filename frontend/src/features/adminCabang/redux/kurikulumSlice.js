import { createSlice } from '@reduxjs/toolkit';

/**
 * Kurikulum slice for Admin Cabang
 * Manages kurikulum hierarchy navigation state and structure data
 */
const kurikulumSlice = createSlice({
  name: 'kurikulum',
  initialState: {
    // Navigation state
    currentJenjang: null,
    currentKelas: null,
    currentMataPelajaran: null,
    
    // Structure data
    struktur: [],
    kelasList: [],
    mataPelajaranList: [],
    
    // Statistics
    statistics: {
      total_jenjang: 0,
      total_kelas: 0,
      total_mata_pelajaran: 0,
      total_materi: 0,
      kelas_custom: 0,
      mata_pelajaran_custom: 0
    },
    
    // Loading states
    loading: {
      struktur: false,
      kelas: false,
      mataPelajaran: false,
      statistics: false
    },
    
    // Error states
    error: {
      struktur: null,
      kelas: null,
      mataPelajaran: null,
      statistics: null
    }
  },
  reducers: {
    // Navigation actions
    setCurrentJenjang: (state, action) => {
      state.currentJenjang = action.payload;
      // Reset dependent states
      state.currentKelas = null;
      state.currentMataPelajaran = null;
      state.kelasList = [];
      state.mataPelajaranList = [];
    },
    
    setCurrentKelas: (state, action) => {
      state.currentKelas = action.payload;
      // Reset dependent states
      state.currentMataPelajaran = null;
    },
    
    setCurrentMataPelajaran: (state, action) => {
      state.currentMataPelajaran = action.payload;
    },
    
    // Reset navigation
    resetNavigation: (state) => {
      state.currentJenjang = null;
      state.currentKelas = null;
      state.currentMataPelajaran = null;
      state.kelasList = [];
      state.mataPelajaranList = [];
    },
    
    // Data loading actions
    setStrukturLoading: (state, action) => {
      state.loading.struktur = action.payload;
      if (action.payload) {
        state.error.struktur = null;
      }
    },
    
    setStrukturSuccess: (state, action) => {
      state.loading.struktur = false;
      state.struktur = action.payload;
      state.error.struktur = null;
    },
    
    setStrukturError: (state, action) => {
      state.loading.struktur = false;
      state.error.struktur = action.payload;
    },
    
    // Kelas actions
    setKelasLoading: (state, action) => {
      state.loading.kelas = action.payload;
      if (action.payload) {
        state.error.kelas = null;
      }
    },
    
    setKelasSuccess: (state, action) => {
      state.loading.kelas = false;
      state.kelasList = action.payload;
      state.error.kelas = null;
    },
    
    setKelasError: (state, action) => {
      state.loading.kelas = false;
      state.error.kelas = action.payload;
    },
    
    // Mata Pelajaran actions
    setMataPelajaranLoading: (state, action) => {
      state.loading.mataPelajaran = action.payload;
      if (action.payload) {
        state.error.mataPelajaran = null;
      }
    },
    
    setMataPelajaranSuccess: (state, action) => {
      state.loading.mataPelajaran = false;
      state.mataPelajaranList = action.payload;
      state.error.mataPelajaran = null;
    },
    
    setMataPelajaranError: (state, action) => {
      state.loading.mataPelajaran = false;
      state.error.mataPelajaran = action.payload;
    },
    
    // Statistics actions
    setStatisticsLoading: (state, action) => {
      state.loading.statistics = action.payload;
      if (action.payload) {
        state.error.statistics = null;
      }
    },
    
    setStatisticsSuccess: (state, action) => {
      state.loading.statistics = false;
      state.statistics = action.payload;
      state.error.statistics = null;
    },
    
    setStatisticsError: (state, action) => {
      state.loading.statistics = false;
      state.error.statistics = action.payload;
    },
    
    // Clear all data
    clearKurikulumData: (state) => {
      state.struktur = [];
      state.kelasList = [];
      state.mataPelajaranList = [];
      state.statistics = {
        total_jenjang: 0,
        total_kelas: 0,
        total_mata_pelajaran: 0,
        total_materi: 0,
        kelas_custom: 0,
        mata_pelajaran_custom: 0
      };
      state.loading = {
        struktur: false,
        kelas: false,
        mataPelajaran: false,
        statistics: false
      };
      state.error = {
        struktur: null,
        kelas: null,
        mataPelajaran: null,
        statistics: null
      };
    }
  }
});

export const {
  setCurrentJenjang,
  setCurrentKelas,
  setCurrentMataPelajaran,
  resetNavigation,
  setStrukturLoading,
  setStrukturSuccess,
  setStrukturError,
  setKelasLoading,
  setKelasSuccess,
  setKelasError,
  setMataPelajaranLoading,
  setMataPelajaranSuccess,
  setMataPelajaranError,
  setStatisticsLoading,
  setStatisticsSuccess,
  setStatisticsError,
  clearKurikulumData
} = kurikulumSlice.actions;

// Selectors
export const selectCurrentJenjang = (state) => state.kurikulum.currentJenjang;
export const selectCurrentKelas = (state) => state.kurikulum.currentKelas;
export const selectCurrentMataPelajaran = (state) => state.kurikulum.currentMataPelajaran;
export const selectStruktur = (state) => state.kurikulum.struktur;
export const selectKelasList = (state) => state.kurikulum.kelasList;
export const selectMataPelajaranList = (state) => state.kurikulum.mataPelajaranList;
export const selectStatistics = (state) => state.kurikulum.statistics;
export const selectKurikulumLoading = (state) => state.kurikulum.loading;
export const selectKurikulumError = (state) => state.kurikulum.error;

// Combined selectors
export const selectNavigationState = (state) => ({
  jenjang: state.kurikulum.currentJenjang,
  kelas: state.kurikulum.currentKelas,
  mataPelajaran: state.kurikulum.currentMataPelajaran
});

export const selectBreadcrumbData = (state) => {
  const breadcrumbs = [];
  
  if (state.kurikulum.currentJenjang) {
    breadcrumbs.push({
      label: state.kurikulum.currentJenjang.nama_jenjang,
      type: 'jenjang',
      data: state.kurikulum.currentJenjang
    });
  }
  
  if (state.kurikulum.currentKelas) {
    breadcrumbs.push({
      label: state.kurikulum.currentKelas.nama_kelas,
      type: 'kelas',
      data: state.kurikulum.currentKelas
    });
  }
  
  if (state.kurikulum.currentMataPelajaran) {
    breadcrumbs.push({
      label: state.kurikulum.currentMataPelajaran.nama_mata_pelajaran,
      type: 'mata_pelajaran',
      data: state.kurikulum.currentMataPelajaran
    });
  }
  
  return breadcrumbs;
};

export default kurikulumSlice.reducer;