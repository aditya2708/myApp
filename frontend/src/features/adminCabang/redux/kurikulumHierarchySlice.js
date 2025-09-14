import { createSlice } from '@reduxjs/toolkit';

/**
 * Kurikulum Hierarchy Redux Slice
 * Manages state for kurikulum navigation hierarchy and breadcrumb
 */
const kurikulumHierarchySlice = createSlice({
  name: 'kurikulumHierarchy',
  initialState: {
    // Navigation state
    currentPath: [],
    navigationHistory: [],
    
    // Hierarchy data
    struktur: null,
    strukturLoading: false,
    strukturError: null,
    
    // Current selections
    selectedJenjang: null,
    selectedKelas: null,
    selectedMataPelajaran: null,
    
    // Cached data for performance
    cachedKelas: {},
    cachedMataPelajaran: {},
    cachedMataPelajaranStats: {},
    
    // UI state
    showBreadcrumb: true,
    breadcrumbCompact: false,
    
    // Search and filters
    searchQuery: '',
    filters: {
      jenjang: null,
      kelas: null,
      kategori: null,
      status: 'active',
    },
    
    // Statistics
    hierarchyStats: {
      total_jenjang: 0,
      total_kelas: 0,
      total_mata_pelajaran: 0,
      total_materi: 0,
    },
    
    // Loading states for individual components
    loadingStates: {
      jenjang: false,
      kelas: false,
      mataPelajaran: false,
      stats: false,
    },
  },
  reducers: {
    // Navigation actions
    setCurrentPath: (state, action) => {
      state.currentPath = action.payload;
    },
    pushToPath: (state, action) => {
      state.currentPath.push(action.payload);
    },
    popFromPath: (state) => {
      state.currentPath.pop();
    },
    navigateToLevel: (state, action) => {
      const { level } = action.payload;
      state.currentPath = state.currentPath.slice(0, level + 1);
    },
    addToHistory: (state, action) => {
      state.navigationHistory.push({
        path: [...state.currentPath],
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
      
      // Keep only last 20 history items
      if (state.navigationHistory.length > 20) {
        state.navigationHistory = state.navigationHistory.slice(-20);
      }
    },
    clearHistory: (state) => {
      state.navigationHistory = [];
    },
    
    // Hierarchy data actions
    setStruktur: (state, action) => {
      state.struktur = action.payload;
      state.strukturError = null;
    },
    setStrukturLoading: (state, action) => {
      state.strukturLoading = action.payload;
    },
    setStrukturError: (state, action) => {
      state.strukturError = action.payload;
      state.strukturLoading = false;
    },
    
    // Selection actions
    setSelectedJenjang: (state, action) => {
      state.selectedJenjang = action.payload;
      // Clear dependent selections
      state.selectedKelas = null;
      state.selectedMataPelajaran = null;
    },
    setSelectedKelas: (state, action) => {
      state.selectedKelas = action.payload;
      // Clear dependent selections
      state.selectedMataPelajaran = null;
    },
    setSelectedMataPelajaran: (state, action) => {
      state.selectedMataPelajaran = action.payload;
    },
    clearSelections: (state) => {
      state.selectedJenjang = null;
      state.selectedKelas = null;
      state.selectedMataPelajaran = null;
    },
    
    // Cache actions
    setCachedKelas: (state, action) => {
      const { jenjangId, data } = action.payload;
      state.cachedKelas[jenjangId] = {
        data,
        timestamp: Date.now(),
      };
    },
    setCachedMataPelajaran: (state, action) => {
      const { kelasId, data } = action.payload;
      state.cachedMataPelajaran[kelasId] = {
        data,
        timestamp: Date.now(),
      };
    },
    setCachedMataPelajaranStats: (state, action) => {
      const { mataPelajaranId, kelasId, data } = action.payload;
      const key = `${mataPelajaranId}_${kelasId}`;
      state.cachedMataPelajaranStats[key] = {
        data,
        timestamp: Date.now(),
      };
    },
    clearExpiredCache: (state) => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      // Clear expired kelas cache
      Object.keys(state.cachedKelas).forEach(key => {
        if (now - state.cachedKelas[key].timestamp > maxAge) {
          delete state.cachedKelas[key];
        }
      });
      
      // Clear expired mata pelajaran cache
      Object.keys(state.cachedMataPelajaran).forEach(key => {
        if (now - state.cachedMataPelajaran[key].timestamp > maxAge) {
          delete state.cachedMataPelajaran[key];
        }
      });
      
      // Clear expired stats cache
      Object.keys(state.cachedMataPelajaranStats).forEach(key => {
        if (now - state.cachedMataPelajaranStats[key].timestamp > maxAge) {
          delete state.cachedMataPelajaranStats[key];
        }
      });
    },
    clearAllCache: (state) => {
      state.cachedKelas = {};
      state.cachedMataPelajaran = {};
      state.cachedMataPelajaranStats = {};
    },
    
    // UI actions
    setShowBreadcrumb: (state, action) => {
      state.showBreadcrumb = action.payload;
    },
    setBreadcrumbCompact: (state, action) => {
      state.breadcrumbCompact = action.payload;
    },
    
    // Search and filter actions
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        jenjang: null,
        kelas: null,
        kategori: null,
        status: 'active',
      };
      state.searchQuery = '';
    },
    
    // Statistics actions
    setHierarchyStats: (state, action) => {
      state.hierarchyStats = action.payload;
    },
    updateMateriCount: (state, action) => {
      const { mataPelajaranId, kelasId, count } = action.payload;
      
      // Update in struktur if exists
      if (state.struktur) {
        state.struktur.forEach(jenjang => {
          jenjang.kelas?.forEach(kelas => {
            if (kelas.id_kelas === kelasId) {
              kelas.mata_pelajaran?.forEach(mataPelajaran => {
                if (mataPelajaran.id_mata_pelajaran === mataPelajaranId) {
                  mataPelajaran.materi_count = count;
                }
              });
            }
          });
        });
      }
      
      // Update in cached mata pelajaran if exists
      const cachedData = state.cachedMataPelajaran[kelasId];
      if (cachedData) {
        cachedData.data.forEach(mataPelajaran => {
          if (mataPelajaran.id_mata_pelajaran === mataPelajaranId) {
            mataPelajaran.materi_count = count;
          }
        });
      }
      
      // Update total materi count
      state.hierarchyStats.total_materi += count;
    },
    
    // Loading states
    setLoadingState: (state, action) => {
      const { component, loading } = action.payload;
      state.loadingStates[component] = loading;
    },
    setAllLoading: (state, action) => {
      const loading = action.payload;
      Object.keys(state.loadingStates).forEach(key => {
        state.loadingStates[key] = loading;
      });
    },
    
    // Reset actions
    resetHierarchy: (state) => {
      state.currentPath = [];
      state.selectedJenjang = null;
      state.selectedKelas = null;
      state.selectedMataPelajaran = null;
      state.searchQuery = '';
      state.filters = {
        jenjang: null,
        kelas: null,
        kategori: null,
        status: 'active',
      };
    },
    resetState: (state) => {
      return {
        ...state,
        currentPath: [],
        navigationHistory: [],
        selectedJenjang: null,
        selectedKelas: null,
        selectedMataPelajaran: null,
        searchQuery: '',
        filters: {
          jenjang: null,
          kelas: null,
          kategori: null,
          status: 'active',
        },
        strukturError: null,
        loadingStates: {
          jenjang: false,
          kelas: false,
          mataPelajaran: false,
          stats: false,
        },
      };
    },
  },
});

// Action creators
export const {
  setCurrentPath,
  pushToPath,
  popFromPath,
  navigateToLevel,
  addToHistory,
  clearHistory,
  setStruktur,
  setStrukturLoading,
  setStrukturError,
  setSelectedJenjang,
  setSelectedKelas,
  setSelectedMataPelajaran,
  clearSelections,
  setCachedKelas,
  setCachedMataPelajaran,
  setCachedMataPelajaranStats,
  clearExpiredCache,
  clearAllCache,
  setShowBreadcrumb,
  setBreadcrumbCompact,
  setSearchQuery,
  setFilters,
  resetFilters,
  setHierarchyStats,
  updateMateriCount,
  setLoadingState,
  setAllLoading,
  resetHierarchy,
  resetState,
} = kurikulumHierarchySlice.actions;

// Selectors
export const selectCurrentPath = (state) => state.kurikulumHierarchy.currentPath;
export const selectNavigationHistory = (state) => state.kurikulumHierarchy.navigationHistory;
export const selectStruktur = (state) => state.kurikulumHierarchy.struktur;
export const selectStrukturLoading = (state) => state.kurikulumHierarchy.strukturLoading;
export const selectStrukturError = (state) => state.kurikulumHierarchy.strukturError;

export const selectCurrentSelections = (state) => ({
  jenjang: state.kurikulumHierarchy.selectedJenjang,
  kelas: state.kurikulumHierarchy.selectedKelas,
  mataPelajaran: state.kurikulumHierarchy.selectedMataPelajaran,
});

export const selectCachedData = (state) => ({
  kelas: state.kurikulumHierarchy.cachedKelas,
  mataPelajaran: state.kurikulumHierarchy.cachedMataPelajaran,
  stats: state.kurikulumHierarchy.cachedMataPelajaranStats,
});

export const selectHierarchyUI = (state) => ({
  showBreadcrumb: state.kurikulumHierarchy.showBreadcrumb,
  breadcrumbCompact: state.kurikulumHierarchy.breadcrumbCompact,
  searchQuery: state.kurikulumHierarchy.searchQuery,
  filters: state.kurikulumHierarchy.filters,
});

export const selectHierarchyStats = (state) => state.kurikulumHierarchy.hierarchyStats;
export const selectLoadingStates = (state) => state.kurikulumHierarchy.loadingStates;

// Complex selectors
export const selectBreadcrumbPath = (state) => {
  const { currentPath, selectedJenjang, selectedKelas, selectedMataPelajaran } = state.kurikulumHierarchy;
  
  const path = [
    { name: 'Kurikulum', screen: 'KurikulumHome', level: 0 }
  ];
  
  if (selectedJenjang) {
    path.push({
      name: selectedJenjang.nama_jenjang,
      screen: 'JenjangSelection',
      level: 1,
      data: selectedJenjang
    });
  }
  
  if (selectedKelas) {
    path.push({
      name: selectedKelas.nama_kelas,
      screen: 'KelasSelection',
      level: 2,
      data: selectedKelas
    });
  }
  
  if (selectedMataPelajaran) {
    path.push({
      name: selectedMataPelajaran.nama_mata_pelajaran,
      screen: 'MataPelajaranList',
      level: 3,
      data: selectedMataPelajaran
    });
  }
  
  return path;
};

export const selectCachedKelas = (state, jenjangId) => {
  const cached = state.kurikulumHierarchy.cachedKelas[jenjangId];
  if (!cached) return null;
  
  // Check if cache is still valid (5 minutes)
  const isValid = Date.now() - cached.timestamp < 5 * 60 * 1000;
  return isValid ? cached.data : null;
};

export const selectCachedMataPelajaran = (state, kelasId) => {
  const cached = state.kurikulumHierarchy.cachedMataPelajaran[kelasId];
  if (!cached) return null;
  
  // Check if cache is still valid (5 minutes)
  const isValid = Date.now() - cached.timestamp < 5 * 60 * 1000;
  return isValid ? cached.data : null;
};

export const selectNavigationLevel = (state) => {
  const { selectedJenjang, selectedKelas, selectedMataPelajaran } = state.kurikulumHierarchy;
  
  if (selectedMataPelajaran) return 3;
  if (selectedKelas) return 2;
  if (selectedJenjang) return 1;
  return 0;
};

export const selectCanNavigateBack = (state) => {
  return state.kurikulumHierarchy.currentPath.length > 0;
};

export const selectFilteredStruktur = (state) => {
  const { struktur, filters, searchQuery } = state.kurikulumHierarchy;
  
  if (!struktur) return null;
  
  let filtered = [...struktur];
  
  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(jenjang => 
      jenjang.nama_jenjang?.toLowerCase().includes(query) ||
      jenjang.kode_jenjang?.toLowerCase().includes(query)
    );
  }
  
  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(jenjang => 
      filters.status === 'active' ? jenjang.is_active : !jenjang.is_active
    );
  }
  
  return filtered;
};

export default kurikulumHierarchySlice.reducer;