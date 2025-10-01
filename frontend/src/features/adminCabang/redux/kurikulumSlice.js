import { createSlice } from '@reduxjs/toolkit';

const resolveKurikulumId = (kurikulum) => (
  kurikulum?.id_kurikulum
  ?? kurikulum?.kurikulum_id
  ?? kurikulum?.id
  ?? null
);

/**
 * Kurikulum slice for Admin Cabang
 * Manages kurikulum hierarchy navigation state and structure data
 */
const kurikulumSlice = createSlice({
  name: 'kurikulum',
  initialState: {
    // Navigation state
    selectedKurikulumId: null,
    selectedKurikulum: null,
    activeKurikulumId: null,
    activeKurikulum: null,
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
    setSelectedKurikulum: (state, action) => {
      state.selectedKurikulum = action.payload || null;
      state.selectedKurikulumId = action.payload?.id_kurikulum ?? action.payload?.id ?? null;
    },

    setActiveKurikulum: (state, action) => {
      const payload = action.payload || null;
      const resolvedActiveId = resolveKurikulumId(payload);
      const previousActiveId = state.activeKurikulumId
        ?? resolveKurikulumId(state.activeKurikulum);
      const selectedId = state.selectedKurikulumId
        ?? resolveKurikulumId(state.selectedKurikulum);

      state.activeKurikulum = payload;
      state.activeKurikulumId = resolvedActiveId;

      if (!selectedId || (previousActiveId && selectedId === previousActiveId)) {
        state.selectedKurikulum = payload;
        state.selectedKurikulumId = resolvedActiveId;
      }
    },

    clearActiveKurikulum: (state) => {
      const previousActiveId = state.activeKurikulumId
        ?? resolveKurikulumId(state.activeKurikulum);
      const selectedId = state.selectedKurikulumId
        ?? resolveKurikulumId(state.selectedKurikulum);

      state.activeKurikulum = null;
      state.activeKurikulumId = null;

      if (!selectedId || (previousActiveId && selectedId === previousActiveId)) {
        state.selectedKurikulum = null;
        state.selectedKurikulumId = null;
      }
    },

    clearSelectedKurikulum: (state) => {
      state.selectedKurikulum = null;
      state.selectedKurikulumId = null;
    },

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
      state.selectedKurikulum = null;
      state.selectedKurikulumId = null;
      state.activeKurikulum = null;
      state.activeKurikulumId = null;
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
  setSelectedKurikulum,
  clearSelectedKurikulum,
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
  clearKurikulumData,
  setActiveKurikulum,
  clearActiveKurikulum
} = kurikulumSlice.actions;

// Selectors
export const selectSelectedKurikulum = (state) => state.kurikulum.selectedKurikulum;
export const selectSelectedKurikulumId = (state) => state.kurikulum.selectedKurikulumId;
export const selectActiveKurikulum = (state) => state.kurikulum.activeKurikulum;
export const selectActiveKurikulumId = (state) => state.kurikulum.activeKurikulumId;
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
export const selectEffectiveKurikulum = (state) => (
  state.kurikulum.selectedKurikulum || state.kurikulum.activeKurikulum
);

export const selectEffectiveKurikulumId = (state) => {
  const selectedId = state.kurikulum.selectedKurikulumId
    ?? resolveKurikulumId(state.kurikulum.selectedKurikulum);

  if (selectedId) {
    return selectedId;
  }

  return state.kurikulum.activeKurikulumId
    ?? resolveKurikulumId(state.kurikulum.activeKurikulum)
    ?? null;
};

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