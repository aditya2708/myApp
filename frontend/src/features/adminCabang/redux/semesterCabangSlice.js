import { createSlice } from '@reduxjs/toolkit';

/**
 * Semester Cabang slice for Admin Cabang
 * Manages semester CRUD operations and state for cabang-level semesters
 */
const semesterCabangSlice = createSlice({
  name: 'semesterCabang',
  initialState: {
    // List data
    list: [],
    pagination: {
      currentPage: 1,
      lastPage: 1,
      perPage: 20,
      total: 0
    },
    
    // Current item
    currentItem: null,
    activeSemester: null,
    
    // Filters
    filters: {
      search: '',
      status: 'all',
      tahun_ajaran: '',
      periode: 'all'
    },
    
    // Form state
    form: {
      data: {
        nama_semester: '',
        tahun_ajaran: '',
        periode: 'ganjil',
        tanggal_mulai: '',
        tanggal_selesai: '',
        kurikulum_id: '',
        status: 'draft',
        type: 'cabang'
      },
      errors: {},
      touched: {},
      isDirty: false
    },
    
    // Statistics
    statistics: {
      total: 0,
      active: 0,
      draft: 0,
      completed: 0,
      archived: 0
    },
    
    // Loading states
    loading: {
      list: false,
      item: false,
      active: false,
      statistics: false,
      create: false,
      update: false,
      delete: false,
      setActive: false
    },
    
    // Error states
    error: {
      list: null,
      item: null,
      active: null,
      statistics: null,
      create: null,
      update: null,
      delete: null,
      setActive: null
    },
    
    // Operation success flags
    success: {
      create: false,
      update: false,
      delete: false,
      setActive: false
    }
  },
  reducers: {
    // List actions
    setListLoading: (state, action) => {
      state.loading.list = action.payload;
      if (action.payload) {
        state.error.list = null;
      }
    },
    
    setListSuccess: (state, action) => {
      state.loading.list = false;
      state.list = action.payload.data || [];
      state.pagination = {
        currentPage: action.payload.current_page || 1,
        lastPage: action.payload.last_page || 1,
        perPage: action.payload.per_page || 20,
        total: action.payload.total || 0
      };
      state.error.list = null;
    },
    
    setListError: (state, action) => {
      state.loading.list = false;
      state.error.list = action.payload;
    },
    
    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.filters = {
        search: '',
        status: 'all',
        tahun_ajaran: '',
        periode: 'all'
      };
    },
    
    // Current item actions
    setItemLoading: (state, action) => {
      state.loading.item = action.payload;
      if (action.payload) {
        state.error.item = null;
      }
    },
    
    setItemSuccess: (state, action) => {
      state.loading.item = false;
      state.currentItem = action.payload;
      state.error.item = null;
    },
    
    setItemError: (state, action) => {
      state.loading.item = false;
      state.error.item = action.payload;
    },
    
    clearCurrentItem: (state) => {
      state.currentItem = null;
    },
    
    // Active semester actions
    setActiveLoading: (state, action) => {
      state.loading.active = action.payload;
      if (action.payload) {
        state.error.active = null;
      }
    },
    
    setActiveSuccess: (state, action) => {
      state.loading.active = false;
      state.activeSemester = action.payload;
      state.error.active = null;
    },
    
    setActiveError: (state, action) => {
      state.loading.active = false;
      state.error.active = action.payload;
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
    
    // Form actions
    setFormData: (state, action) => {
      state.form.data = { ...state.form.data, ...action.payload };
      state.form.isDirty = true;
    },
    
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.form.data[field] = value;
      state.form.isDirty = true;
      
      // Clear error for this field
      if (state.form.errors[field]) {
        delete state.form.errors[field];
      }
      
      // Mark as touched
      state.form.touched[field] = true;
      
      // Auto-generate nama_semester when periode or tahun_ajaran changes
      if (field === 'periode' || field === 'tahun_ajaran') {
        const { periode, tahun_ajaran } = state.form.data;
        if (periode && tahun_ajaran) {
          const periodeText = periode === 'ganjil' ? 'Ganjil' : 'Genap';
          state.form.data.nama_semester = `Semester ${periodeText} ${tahun_ajaran}`;
        }
      }
    },
    
    setFormErrors: (state, action) => {
      state.form.errors = action.payload;
    },
    
    clearFormErrors: (state) => {
      state.form.errors = {};
    },
    
    resetForm: (state) => {
      state.form = {
        data: {
          nama_semester: '',
          tahun_ajaran: '',
          periode: 'ganjil',
          tanggal_mulai: '',
          tanggal_selesai: '',
          kurikulum_id: '',
          status: 'draft',
          type: 'cabang'
        },
        errors: {},
        touched: {},
        isDirty: false
      };
    },
    
    // Load form with existing data
    loadFormData: (state, action) => {
      state.form.data = { ...state.form.data, ...action.payload };
      state.form.isDirty = false;
      state.form.errors = {};
      state.form.touched = {};
    },
    
    // CRUD operations
    setCreateLoading: (state, action) => {
      state.loading.create = action.payload;
      if (action.payload) {
        state.error.create = null;
        state.success.create = false;
      }
    },
    
    setCreateSuccess: (state, action) => {
      state.loading.create = false;
      state.success.create = true;
      state.error.create = null;
      
      // Add new item to list
      if (action.payload) {
        state.list.unshift(action.payload);
        state.pagination.total += 1;
      }
    },
    
    setCreateError: (state, action) => {
      state.loading.create = false;
      state.success.create = false;
      state.error.create = action.payload;
    },
    
    setUpdateLoading: (state, action) => {
      state.loading.update = action.payload;
      if (action.payload) {
        state.error.update = null;
        state.success.update = false;
      }
    },
    
    setUpdateSuccess: (state, action) => {
      state.loading.update = false;
      state.success.update = true;
      state.error.update = null;
      
      // Update item in list
      if (action.payload) {
        const index = state.list.findIndex(item => item.id_semester === action.payload.id_semester);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.currentItem = action.payload;
      }
    },
    
    setUpdateError: (state, action) => {
      state.loading.update = false;
      state.success.update = false;
      state.error.update = action.payload;
    },
    
    setDeleteLoading: (state, action) => {
      state.loading.delete = action.payload;
      if (action.payload) {
        state.error.delete = null;
        state.success.delete = false;
      }
    },
    
    setDeleteSuccess: (state, action) => {
      state.loading.delete = false;
      state.success.delete = true;
      state.error.delete = null;
      
      // Remove item from list
      const itemId = action.payload;
      state.list = state.list.filter(item => item.id_semester !== itemId);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
      
      // Clear current item if it was deleted
      if (state.currentItem && state.currentItem.id_semester === itemId) {
        state.currentItem = null;
      }
    },
    
    setDeleteError: (state, action) => {
      state.loading.delete = false;
      state.success.delete = false;
      state.error.delete = action.payload;
    },
    
    // Set active semester
    setActiveLoading: (state, action) => {
      state.loading.setActive = action.payload;
      if (action.payload) {
        state.error.setActive = null;
        state.success.setActive = false;
      }
    },
    
    setActiveOperationSuccess: (state, action) => {
      state.loading.setActive = false;
      state.success.setActive = true;
      state.error.setActive = null;
      
      // Update active semester
      if (action.payload) {
        state.activeSemester = action.payload;
        
        // Update status in list
        state.list.forEach(item => {
          if (item.id_semester === action.payload.id_semester) {
            item.status = 'active';
          } else if (item.status === 'active') {
            item.status = 'completed';
          }
        });
      }
    },
    
    setActiveOperationError: (state, action) => {
      state.loading.setActive = false;
      state.success.setActive = false;
      state.error.setActive = action.payload;
    },
    
    // Clear success flags
    clearSuccess: (state) => {
      state.success = {
        create: false,
        update: false,
        delete: false,
        setActive: false
      };
    },
    
    // Clear all data
    clearSemesterData: (state) => {
      return {
        ...state,
        list: [],
        pagination: {
          currentPage: 1,
          lastPage: 1,
          perPage: 20,
          total: 0
        },
        currentItem: null,
        activeSemester: null,
        statistics: {
          total: 0,
          active: 0,
          draft: 0,
          completed: 0,
          archived: 0
        },
        loading: {
          list: false,
          item: false,
          active: false,
          statistics: false,
          create: false,
          update: false,
          delete: false,
          setActive: false
        },
        error: {
          list: null,
          item: null,
          active: null,
          statistics: null,
          create: null,
          update: null,
          delete: null,
          setActive: null
        },
        success: {
          create: false,
          update: false,
          delete: false,
          setActive: false
        }
      };
    }
  }
});

export const {
  setListLoading,
  setListSuccess,
  setListError,
  setFilters,
  resetFilters,
  setItemLoading,
  setItemSuccess,
  setItemError,
  clearCurrentItem,
  setActiveLoading,
  setActiveSuccess,
  setActiveError,
  setStatisticsLoading,
  setStatisticsSuccess,
  setStatisticsError,
  setFormData,
  setFormField,
  setFormErrors,
  clearFormErrors,
  resetForm,
  loadFormData,
  setCreateLoading,
  setCreateSuccess,
  setCreateError,
  setUpdateLoading,
  setUpdateSuccess,
  setUpdateError,
  setDeleteLoading,
  setDeleteSuccess,
  setDeleteError,
  setActiveOperationSuccess,
  setActiveOperationError,
  clearSuccess,
  clearSemesterData
} = semesterCabangSlice.actions;

// Selectors
export const selectSemesterList = (state) => state.semesterCabang.list;
export const selectSemesterPagination = (state) => state.semesterCabang.pagination;
export const selectCurrentSemester = (state) => state.semesterCabang.currentItem;
export const selectActiveSemester = (state) => state.semesterCabang.activeSemester;
export const selectSemesterFilters = (state) => state.semesterCabang.filters;
export const selectSemesterForm = (state) => state.semesterCabang.form;
export const selectSemesterStatistics = (state) => state.semesterCabang.statistics;
export const selectSemesterLoading = (state) => state.semesterCabang.loading;
export const selectSemesterError = (state) => state.semesterCabang.error;
export const selectSemesterSuccess = (state) => state.semesterCabang.success;

// Complex selectors
export const selectFilteredSemesters = (state) => {
  const { list, filters } = state.semesterCabang;
  let filtered = [...list];
  
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === filters.status);
  }
  
  if (filters.periode && filters.periode !== 'all') {
    filtered = filtered.filter(item => item.periode === filters.periode);
  }
  
  if (filters.tahun_ajaran) {
    filtered = filtered.filter(item => item.tahun_ajaran.includes(filters.tahun_ajaran));
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.nama_semester.toLowerCase().includes(search) ||
      item.tahun_ajaran.toLowerCase().includes(search)
    );
  }
  
  return filtered;
};

export const selectSemestersByStatus = (state) => {
  const list = state.semesterCabang.list;
  return {
    active: list.filter(item => item.status === 'active'),
    draft: list.filter(item => item.status === 'draft'),
    completed: list.filter(item => item.status === 'completed'),
    archived: list.filter(item => item.status === 'archived')
  };
};

export const selectTahunAjaranOptions = (state) => {
  const list = state.semesterCabang.list;
  const tahunSet = new Set();
  
  list.forEach(semester => {
    if (semester.tahun_ajaran) {
      tahunSet.add(semester.tahun_ajaran);
    }
  });
  
  return Array.from(tahunSet).sort().reverse();
};

export const selectFormValidation = (state) => {
  const { data, errors } = state.semesterCabang.form;
  const requiredFields = ['nama_semester', 'tahun_ajaran', 'periode', 'tanggal_mulai', 'tanggal_selesai'];
  
  const missingRequired = requiredFields.filter(field => !data[field]);
  const hasErrors = Object.keys(errors).length > 0;
  
  // Additional validation
  const dateError = data.tanggal_mulai && data.tanggal_selesai && 
                    new Date(data.tanggal_selesai) <= new Date(data.tanggal_mulai);
  
  return {
    isValid: missingRequired.length === 0 && !hasErrors && !dateError,
    missingRequired,
    hasErrors,
    dateError,
    errors
  };
};

export default semesterCabangSlice.reducer;