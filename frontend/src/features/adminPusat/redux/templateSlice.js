import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { templateApi } from '../api/templateApi';

// ==================== ASYNC THUNKS ====================

/**
 * Fetch templates dengan filters & pagination
 */
export const fetchTemplates = createAsyncThunk(
  'template/fetchTemplates',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await templateApi.getTemplates(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates');
    }
  }
);

/**
 * Fetch templates by mata pelajaran & kelas
 */
export const fetchTemplatesByMapel = createAsyncThunk(
  'template/fetchTemplatesByMapel',
  async ({ mataPelajaranId, kelasId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await templateApi.getTemplatesByMapel(mataPelajaranId, kelasId, params);
      return { 
        mataPelajaranId, 
        kelasId, 
        data: response.data,
        params 
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates by mapel');
    }
  }
);

/**
 * Fetch template detail
 */
export const fetchTemplateDetail = createAsyncThunk(
  'template/fetchTemplateDetail',
  async (templateId, { rejectWithValue }) => {
    try {
      const response = await templateApi.getTemplate(templateId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch template detail');
    }
  }
);

/**
 * Create new template
 */
export const createTemplate = createAsyncThunk(
  'template/createTemplate',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await templateApi.createTemplate(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create template');
    }
  }
);

/**
 * Update template
 */
export const updateTemplate = createAsyncThunk(
  'template/updateTemplate',
  async ({ templateId, formData }, { rejectWithValue }) => {
    try {
      const response = await templateApi.updateTemplate(templateId, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update template');
    }
  }
);

/**
 * Delete template
 */
export const deleteTemplate = createAsyncThunk(
  'template/deleteTemplate',
  async (templateId, { rejectWithValue }) => {
    try {
      await templateApi.deleteTemplate(templateId);
      return templateId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete template');
    }
  }
);

/**
 * Activate template
 */
export const activateTemplate = createAsyncThunk(
  'template/activateTemplate',
  async (templateId, { rejectWithValue }) => {
    try {
      const response = await templateApi.activateTemplate(templateId);
      return { templateId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate template');
    }
  }
);

/**
 * Deactivate template
 */
export const deactivateTemplate = createAsyncThunk(
  'template/deactivateTemplate',
  async (templateId, { rejectWithValue }) => {
    try {
      const response = await templateApi.deactivateTemplate(templateId);
      return { templateId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate template');
    }
  }
);

/**
 * Duplicate template
 */
export const duplicateTemplate = createAsyncThunk(
  'template/duplicateTemplate',
  async ({ templateId, duplicateData }, { rejectWithValue }) => {
    try {
      const response = await templateApi.duplicateTemplate(templateId, duplicateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to duplicate template');
    }
  }
);

/**
 * Bulk activate templates
 */
export const bulkActivateTemplates = createAsyncThunk(
  'template/bulkActivateTemplates',
  async (templateIds, { dispatch, rejectWithValue }) => {
    try {
      const results = await Promise.allSettled(
        templateIds.map(id => templateApi.activateTemplate(id))
      );
      
      const successful = [];
      const failed = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(templateIds[index]);
        } else {
          failed.push({ id: templateIds[index], error: result.reason });
        }
      });
      
      return { successful, failed };
    } catch (error) {
      return rejectWithValue('Failed to bulk activate templates');
    }
  }
);

/**
 * Bulk deactivate templates
 */
export const bulkDeactivateTemplates = createAsyncThunk(
  'template/bulkDeactivateTemplates',
  async (templateIds, { dispatch, rejectWithValue }) => {
    try {
      const results = await Promise.allSettled(
        templateIds.map(id => templateApi.deactivateTemplate(id))
      );
      
      const successful = [];
      const failed = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(templateIds[index]);
        } else {
          failed.push({ id: templateIds[index], error: result.reason });
        }
      });
      
      return { successful, failed };
    } catch (error) {
      return rejectWithValue('Failed to bulk deactivate templates');
    }
  }
);

/**
 * Bulk delete templates
 */
export const bulkDeleteTemplates = createAsyncThunk(
  'template/bulkDeleteTemplates',
  async (templateIds, { dispatch, rejectWithValue }) => {
    try {
      const results = await Promise.allSettled(
        templateIds.map(id => templateApi.deleteTemplate(id))
      );
      
      const successful = [];
      const failed = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(templateIds[index]);
        } else {
          failed.push({ id: templateIds[index], error: result.reason });
        }
      });
      
      return { successful, failed };
    } catch (error) {
      return rejectWithValue('Failed to bulk delete templates');
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Templates data
  templates: [],
  templateDetail: null,
  filteredTemplates: [],
  
  // Pagination
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0
  },
  
  // Filters & sorting
  filters: {
    mata_pelajaran: null,
    kelas: null,
    search: '',
    status: 'all', // all, active, inactive
    kategori: '',
    created_by: null
  },
  
  sortBy: 'created_at', // nama_template, created_at, urutan, file_size
  sortOrder: 'desc', // asc, desc
  
  // Selection untuk bulk operations
  selectionMode: false,
  selectedTemplates: [],
  
  // Loading states
  loading: {
    fetch: false,
    create: false,
    update: false,
    delete: false,
    activate: false,
    deactivate: false,
    duplicate: false,
    bulkActivate: false,
    bulkDeactivate: false,
    bulkDelete: false,
    detail: false
  },
  
  // Error states
  error: {
    fetch: null,
    create: null,
    update: null,
    delete: null,
    activate: null,
    deactivate: null,
    duplicate: null,
    bulkActivate: null,
    bulkDeactivate: null,
    bulkDelete: null,
    detail: null
  },
  
  // Operation status tracking
  operationStatus: {
    lastCreated: null,
    lastUpdated: null,
    lastDeleted: null,
    lastActivated: null,
    lastDeactivated: null,
    lastDuplicated: null,
    bulkOperationResults: null
  },
  
  // Form state
  formMode: null, // create, edit, duplicate
  formData: {
    id_mata_pelajaran: '',
    id_kelas: '',
    nama_template: '',
    deskripsi: '',
    kategori: '',
    urutan: 1,
    version: '1.0',
    file: null,
    metadata: {}
  },
  
  // Upload progress
  uploadProgress: 0,
  
  // Cache management
  cacheTimestamp: null,
  shouldRefresh: false
};

// ==================== SLICE ====================

const templateSlice = createSlice({
  name: 'template',
  initialState,
  reducers: {
    // ==================== FILTERS & SEARCH ====================
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.shouldRefresh = true;
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.shouldRefresh = true;
    },
    
    setSearch: (state, action) => {
      state.filters.search = action.payload;
      state.shouldRefresh = true;
    },
    
    setSortBy: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.sortBy = sortBy;
      state.sortOrder = sortOrder;
      state.shouldRefresh = true;
    },
    
    // ==================== SELECTION MANAGEMENT ====================
    toggleSelectionMode: (state) => {
      state.selectionMode = !state.selectionMode;
      if (!state.selectionMode) {
        state.selectedTemplates = [];
      }
    },
    
    selectTemplate: (state, action) => {
      const templateId = action.payload;
      if (!state.selectedTemplates.includes(templateId)) {
        state.selectedTemplates.push(templateId);
      }
    },
    
    deselectTemplate: (state, action) => {
      const templateId = action.payload;
      state.selectedTemplates = state.selectedTemplates.filter(id => id !== templateId);
    },
    
    toggleTemplateSelection: (state, action) => {
      const templateId = action.payload;
      if (state.selectedTemplates.includes(templateId)) {
        state.selectedTemplates = state.selectedTemplates.filter(id => id !== templateId);
      } else {
        state.selectedTemplates.push(templateId);
      }
    },
    
    selectAllTemplates: (state) => {
      state.selectedTemplates = state.templates.map(template => template.id_template_materi);
    },
    
    deselectAllTemplates: (state) => {
      state.selectedTemplates = [];
    },
    
    // ==================== FORM MANAGEMENT ====================
    setFormMode: (state, action) => {
      state.formMode = action.payload;
    },
    
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    
    resetFormData: (state) => {
      state.formData = initialState.formData;
      state.formMode = null;
      state.uploadProgress = 0;
    },
    
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    
    // ==================== CACHE MANAGEMENT ====================
    setCacheTimestamp: (state) => {
      state.cacheTimestamp = Date.now();
      state.shouldRefresh = false;
    },
    
    invalidateCache: (state) => {
      state.shouldRefresh = true;
      state.cacheTimestamp = null;
    },
    
    // ==================== ERROR MANAGEMENT ====================
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state.error[errorType]) {
        state.error[errorType] = null;
      }
    },
    
    clearAllErrors: (state) => {
      Object.keys(state.error).forEach(key => {
        state.error[key] = null;
      });
    },
    
    // ==================== PAGINATION ====================
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // ==================== RESET STATE ====================
    resetTemplateState: (state) => {
      return { ...initialState };
    }
  },
  
  extraReducers: (builder) => {
    builder
      // ==================== FETCH TEMPLATES ====================
      .addCase(fetchTemplates.pending, (state) => {
        state.loading.fetch = true;
        state.error.fetch = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.templates = action.payload.templates || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.cacheTimestamp = Date.now();
        state.shouldRefresh = false;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error.fetch = action.payload;
      })
      
      // ==================== FETCH TEMPLATES BY MAPEL ====================
      .addCase(fetchTemplatesByMapel.pending, (state) => {
        state.loading.fetch = true;
        state.error.fetch = null;
      })
      .addCase(fetchTemplatesByMapel.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.templates = action.payload.data.templates || [];
        state.pagination = action.payload.data.pagination || state.pagination;
        // Update filters based on request params
        state.filters.mata_pelajaran = action.payload.mataPelajaranId;
        state.filters.kelas = action.payload.kelasId;
      })
      .addCase(fetchTemplatesByMapel.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error.fetch = action.payload;
      })
      
      // ==================== FETCH TEMPLATE DETAIL ====================
      .addCase(fetchTemplateDetail.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(fetchTemplateDetail.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.templateDetail = action.payload;
      })
      .addCase(fetchTemplateDetail.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload;
      })
      
      // ==================== CREATE TEMPLATE ====================
      .addCase(createTemplate.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
        state.uploadProgress = 0;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.loading.create = false;
        state.templates.unshift(action.payload); // Add to beginning
        state.operationStatus.lastCreated = action.payload;
        state.shouldRefresh = true;
        state.uploadProgress = 100;
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload;
        state.uploadProgress = 0;
      })
      
      // ==================== UPDATE TEMPLATE ====================
      .addCase(updateTemplate.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.loading.update = false;
        const updatedTemplate = action.payload;
        const index = state.templates.findIndex(t => t.id_template_materi === updatedTemplate.id_template_materi);
        if (index !== -1) {
          state.templates[index] = updatedTemplate;
        }
        state.operationStatus.lastUpdated = updatedTemplate;
        state.shouldRefresh = true;
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
      })
      
      // ==================== DELETE TEMPLATE ====================
      .addCase(deleteTemplate.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading.delete = false;
        const templateId = action.payload;
        state.templates = state.templates.filter(t => t.id_template_materi !== templateId);
        state.selectedTemplates = state.selectedTemplates.filter(id => id !== templateId);
        state.operationStatus.lastDeleted = templateId;
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
      })
      
      // ==================== ACTIVATE TEMPLATE ====================
      .addCase(activateTemplate.pending, (state) => {
        state.loading.activate = true;
        state.error.activate = null;
      })
      .addCase(activateTemplate.fulfilled, (state, action) => {
        state.loading.activate = false;
        const { templateId } = action.payload;
        const template = state.templates.find(t => t.id_template_materi === templateId);
        if (template) {
          template.is_active = true;
        }
        state.operationStatus.lastActivated = templateId;
      })
      .addCase(activateTemplate.rejected, (state, action) => {
        state.loading.activate = false;
        state.error.activate = action.payload;
      })
      
      // ==================== DEACTIVATE TEMPLATE ====================
      .addCase(deactivateTemplate.pending, (state) => {
        state.loading.deactivate = true;
        state.error.deactivate = null;
      })
      .addCase(deactivateTemplate.fulfilled, (state, action) => {
        state.loading.deactivate = false;
        const { templateId } = action.payload;
        const template = state.templates.find(t => t.id_template_materi === templateId);
        if (template) {
          template.is_active = false;
        }
        state.operationStatus.lastDeactivated = templateId;
      })
      .addCase(deactivateTemplate.rejected, (state, action) => {
        state.loading.deactivate = false;
        state.error.deactivate = action.payload;
      })
      
      // ==================== DUPLICATE TEMPLATE ====================
      .addCase(duplicateTemplate.pending, (state) => {
        state.loading.duplicate = true;
        state.error.duplicate = null;
      })
      .addCase(duplicateTemplate.fulfilled, (state, action) => {
        state.loading.duplicate = false;
        state.templates.unshift(action.payload); // Add to beginning
        state.operationStatus.lastDuplicated = action.payload;
      })
      .addCase(duplicateTemplate.rejected, (state, action) => {
        state.loading.duplicate = false;
        state.error.duplicate = action.payload;
      })
      
      // ==================== BULK OPERATIONS ====================
      .addCase(bulkActivateTemplates.pending, (state) => {
        state.loading.bulkActivate = true;
        state.error.bulkActivate = null;
      })
      .addCase(bulkActivateTemplates.fulfilled, (state, action) => {
        state.loading.bulkActivate = false;
        const { successful } = action.payload;
        successful.forEach(templateId => {
          const template = state.templates.find(t => t.id_template_materi === templateId);
          if (template) {
            template.is_active = true;
          }
        });
        state.operationStatus.bulkOperationResults = action.payload;
        state.selectedTemplates = [];
      })
      .addCase(bulkActivateTemplates.rejected, (state, action) => {
        state.loading.bulkActivate = false;
        state.error.bulkActivate = action.payload;
      })
      
      .addCase(bulkDeactivateTemplates.pending, (state) => {
        state.loading.bulkDeactivate = true;
        state.error.bulkDeactivate = null;
      })
      .addCase(bulkDeactivateTemplates.fulfilled, (state, action) => {
        state.loading.bulkDeactivate = false;
        const { successful } = action.payload;
        successful.forEach(templateId => {
          const template = state.templates.find(t => t.id_template_materi === templateId);
          if (template) {
            template.is_active = false;
          }
        });
        state.operationStatus.bulkOperationResults = action.payload;
        state.selectedTemplates = [];
      })
      .addCase(bulkDeactivateTemplates.rejected, (state, action) => {
        state.loading.bulkDeactivate = false;
        state.error.bulkDeactivate = action.payload;
      })
      
      .addCase(bulkDeleteTemplates.pending, (state) => {
        state.loading.bulkDelete = true;
        state.error.bulkDelete = null;
      })
      .addCase(bulkDeleteTemplates.fulfilled, (state, action) => {
        state.loading.bulkDelete = false;
        const { successful } = action.payload;
        state.templates = state.templates.filter(t => !successful.includes(t.id_template_materi));
        state.operationStatus.bulkOperationResults = action.payload;
        state.selectedTemplates = [];
      })
      .addCase(bulkDeleteTemplates.rejected, (state, action) => {
        state.loading.bulkDelete = false;
        state.error.bulkDelete = action.payload;
      });
  }
});

// ==================== ACTIONS & SELECTORS ====================

export const {
  setFilters,
  clearFilters,
  setSearch,
  setSortBy,
  toggleSelectionMode,
  selectTemplate,
  deselectTemplate,
  toggleTemplateSelection,
  selectAllTemplates,
  deselectAllTemplates,
  setFormMode,
  setFormData,
  resetFormData,
  setUploadProgress,
  setCacheTimestamp,
  invalidateCache,
  clearError,
  clearAllErrors,
  setPagination,
  resetTemplateState
} = templateSlice.actions;

// Selectors
export const selectTemplates = (state) => state.template.templates;
export const selectTemplateDetail = (state) => state.template.templateDetail;
export const selectTemplateFilters = (state) => state.template.filters;
export const selectTemplatePagination = (state) => state.template.pagination;
export const selectTemplateSorting = (state) => ({ sortBy: state.template.sortBy, sortOrder: state.template.sortOrder });
export const selectTemplateLoading = (state) => state.template.loading;
export const selectTemplateError = (state) => state.template.error;
export const selectSelectedTemplates = (state) => state.template.selectedTemplates;
export const selectSelectionMode = (state) => state.template.selectionMode;
export const selectFormData = (state) => state.template.formData;
export const selectFormMode = (state) => state.template.formMode;
export const selectUploadProgress = (state) => state.template.uploadProgress;
export const selectOperationStatus = (state) => state.template.operationStatus;
export const selectCacheStatus = (state) => ({
  timestamp: state.template.cacheTimestamp,
  shouldRefresh: state.template.shouldRefresh
});

export default templateSlice.reducer;