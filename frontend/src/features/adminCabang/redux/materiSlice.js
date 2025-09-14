import { createSlice } from '@reduxjs/toolkit';

/**
 * Materi slice for Admin Cabang
 * Manages CRUD operations and state for learning materials
 */
const materiSlice = createSlice({
  name: 'materi',
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
    
    // Filters
    filters: {
      mata_pelajaran: null,
      kelas: null,
      search: '',
      status: 'all'
    },
    
    // Form state
    form: {
      data: {
        id_mata_pelajaran: '',
        id_kelas: '',
        nama_materi: '',
        deskripsi: '',
        tujuan_pembelajaran: '',
        durasi_menit: '',
        tingkat_kesulitan: 'sedang',
        status: 'draft',
        file: null,
        urutan: ''
      },
      errors: {},
      touched: {},
      isDirty: false
    },
    
    // Upload state
    upload: {
      progress: 0,
      uploading: false,
      error: null
    },
    
    // Loading states
    loading: {
      list: false,
      item: false,
      create: false,
      update: false,
      delete: false,
      reorder: false
    },
    
    // Error states
    error: {
      list: null,
      item: null,
      create: null,
      update: null,
      delete: null,
      reorder: null
    },
    
    // Operation success flags
    success: {
      create: false,
      update: false,
      delete: false,
      reorder: false
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
        mata_pelajaran: null,
        kelas: null,
        search: '',
        status: 'all'
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
          id_mata_pelajaran: '',
          id_kelas: '',
          nama_materi: '',
          deskripsi: '',
          tujuan_pembelajaran: '',
          durasi_menit: '',
          tingkat_kesulitan: 'sedang',
          status: 'draft',
          file: null,
          urutan: ''
        },
        errors: {},
        touched: {},
        isDirty: false
      };
    },
    
    // Upload actions
    setUploadProgress: (state, action) => {
      state.upload.progress = action.payload;
    },
    
    setUploadStart: (state) => {
      state.upload.uploading = true;
      state.upload.progress = 0;
      state.upload.error = null;
    },
    
    setUploadSuccess: (state) => {
      state.upload.uploading = false;
      state.upload.progress = 100;
      state.upload.error = null;
    },
    
    setUploadError: (state, action) => {
      state.upload.uploading = false;
      state.upload.progress = 0;
      state.upload.error = action.payload;
    },
    
    resetUpload: (state) => {
      state.upload = {
        progress: 0,
        uploading: false,
        error: null
      };
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
        const index = state.list.findIndex(item => item.id_materi === action.payload.id_materi);
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
      state.list = state.list.filter(item => item.id_materi !== itemId);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
    },
    
    setDeleteError: (state, action) => {
      state.loading.delete = false;
      state.success.delete = false;
      state.error.delete = action.payload;
    },
    
    // Reorder actions
    setReorderLoading: (state, action) => {
      state.loading.reorder = action.payload;
      if (action.payload) {
        state.error.reorder = null;
        state.success.reorder = false;
      }
    },
    
    setReorderSuccess: (state, action) => {
      state.loading.reorder = false;
      state.success.reorder = true;
      state.error.reorder = null;
      
      // Update order in list
      if (action.payload) {
        const orderedIds = action.payload;
        state.list.sort((a, b) => {
          const aIndex = orderedIds.indexOf(a.id_materi);
          const bIndex = orderedIds.indexOf(b.id_materi);
          return aIndex - bIndex;
        });
        
        // Update urutan values
        state.list.forEach((item, index) => {
          item.urutan = index + 1;
        });
      }
    },
    
    setReorderError: (state, action) => {
      state.loading.reorder = false;
      state.success.reorder = false;
      state.error.reorder = action.payload;
    },
    
    // Optimistic reorder (for drag & drop)
    reorderOptimistic: (state, action) => {
      const { oldIndex, newIndex } = action.payload;
      const item = state.list[oldIndex];
      state.list.splice(oldIndex, 1);
      state.list.splice(newIndex, 0, item);
      
      // Update urutan values
      state.list.forEach((item, index) => {
        item.urutan = index + 1;
      });
    },
    
    // Clear success flags
    clearSuccess: (state) => {
      state.success = {
        create: false,
        update: false,
        delete: false,
        reorder: false
      };
    },
    
    // Clear all data
    clearMateriData: (state) => {
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
        loading: {
          list: false,
          item: false,
          create: false,
          update: false,
          delete: false,
          reorder: false
        },
        error: {
          list: null,
          item: null,
          create: null,
          update: null,
          delete: null,
          reorder: null
        },
        success: {
          create: false,
          update: false,
          delete: false,
          reorder: false
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
  setFormData,
  setFormField,
  setFormErrors,
  clearFormErrors,
  resetForm,
  setUploadProgress,
  setUploadStart,
  setUploadSuccess,
  setUploadError,
  resetUpload,
  setCreateLoading,
  setCreateSuccess,
  setCreateError,
  setUpdateLoading,
  setUpdateSuccess,
  setUpdateError,
  setDeleteLoading,
  setDeleteSuccess,
  setDeleteError,
  setReorderLoading,
  setReorderSuccess,
  setReorderError,
  reorderOptimistic,
  clearSuccess,
  clearMateriData
} = materiSlice.actions;

// Selectors
export const selectMateriList = (state) => state.materi.list;
export const selectMateriPagination = (state) => state.materi.pagination;
export const selectCurrentMateri = (state) => state.materi.currentItem;
export const selectMateriFilters = (state) => state.materi.filters;
export const selectMateriForm = (state) => state.materi.form;
export const selectMateriUpload = (state) => state.materi.upload;
export const selectMateriLoading = (state) => state.materi.loading;
export const selectMateriError = (state) => state.materi.error;
export const selectMateriSuccess = (state) => state.materi.success;

// Complex selectors
export const selectFilteredMateri = (state) => {
  const { list, filters } = state.materi;
  let filtered = [...list];
  
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === filters.status);
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.nama_materi.toLowerCase().includes(search) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(search))
    );
  }
  
  return filtered;
};

export const selectMateriByUrutan = (state) => {
  return [...state.materi.list].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
};

export const selectFormValidation = (state) => {
  const { data, errors } = state.materi.form;
  const requiredFields = ['id_mata_pelajaran', 'id_kelas', 'nama_materi'];
  
  const missingRequired = requiredFields.filter(field => !data[field]);
  const hasErrors = Object.keys(errors).length > 0;
  
  return {
    isValid: missingRequired.length === 0 && !hasErrors,
    missingRequired,
    hasErrors,
    errors
  };
};

export default materiSlice.reducer;