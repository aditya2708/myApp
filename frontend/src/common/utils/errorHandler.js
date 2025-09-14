/**
 * Comprehensive Error handling utilities for Kurikulum System
 * Enhanced for Phase 3 - Admin Shelter with Kelas Gabungan support
 */

import { Alert } from 'react-native';

/**
 * Extract error message from various error response structures
 * @param {any} error - Error object or string
 * @returns {string} - Clean error message
 */
export const extractErrorMessage = (error) => {
  // Ensure we're working with a consistent type
  if (typeof error === 'string') {
    return error;
  }

  // Handle null/undefined gracefully
  if (!error) {
    return 'Terjadi kesalahan yang tidak diketahui';
  }

  // Try different error response structures
  const errorPaths = [
    error.message,
    error.data?.message,
    error.response?.data?.message,
    error.error?.message
  ];

  for (const path of errorPaths) {
    if (typeof path === 'string' && path.trim().length > 0) {
      return path;
    }
  }

  // Fallback to generic message
  return 'Terjadi kesalahan yang tidak diketahui';
};

/**
 * Extract validation errors from error response
 * @param {any} error - Error object
 * @returns {object|null} - Validation errors object or null
 */
export const extractValidationErrors = (error) => {
  // Handle null/undefined gracefully
  if (!error || typeof error !== 'object') {
    return null;
  }

  // Try different validation error structures
  const validationPaths = [
    error.errors,
    error.data?.errors,
    error.response?.data?.errors,
    error.error?.errors
  ];

  for (const path of validationPaths) {
    if (path && typeof path === 'object') {
      return path;
    }
  }

  return null;
};

/**
 * Format validation errors for display in Alert
 * @param {object} errors - Validation errors object
 * @returns {string|null} - Formatted error string or null
 */
export const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') {
    return null;
  }

  const errorMessages = [];
  
  Object.keys(errors).forEach(field => {
    const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
    
    fieldErrors.forEach(message => {
      if (typeof message === 'string' && message.trim().length > 0) {
        errorMessages.push(`• ${message}`);
      }
    });
  });

  return errorMessages.length > 0 ? errorMessages.join('\n') : null;
};

/**
 * Check if error response indicates a validation error
 * @param {any} error - Error object
 * @returns {boolean} - True if validation error
 */
export const isValidationError = (error) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  // Check for 422 status code (validation error)
  const statusPaths = [
    error.status,
    error.response?.status,
    error.data?.status
  ];

  for (const status of statusPaths) {
    if (status === 422) {
      return true;
    }
  }

  // Check for validation errors object
  return extractValidationErrors(error) !== null;
};

/**
 * Get error type for better error handling
 * @param {any} error - Error object
 * @returns {string} - Error type: 'validation', 'network', 'server', 'unknown'
 */
export const getErrorType = (error) => {
  if (!error) {
    return 'unknown';
  }

  // Check for validation errors
  if (isValidationError(error)) {
    return 'validation';
  }

  // Check for network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return 'network';
  }

  // Check for server errors
  const statusPaths = [
    error.status,
    error.response?.status,
    error.data?.status
  ];

  for (const status of statusPaths) {
    if (status >= 500) {
      return 'server';
    }
  }

  return 'unknown';
};

/**
 * Create a standardized error object for Redux state
 * @param {any} error - Raw error from API call
 * @returns {object} - Standardized error object
 */
export const createStandardError = (error) => {
  return {
    message: extractErrorMessage(error),
    validationErrors: extractValidationErrors(error),
    type: getErrorType(error),
    originalError: error
  };
};

// =================================
// ENHANCED ERROR HANDLING FOR PHASE 3
// =================================

// Enhanced error types for comprehensive handling
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  DATA_ERROR: 'DATA_ERROR',
  OFFLINE_ERROR: 'OFFLINE_ERROR',
  KELAS_GABUNGAN_ERROR: 'KELAS_GABUNGAN_ERROR',
  KURIKULUM_ERROR: 'KURIKULUM_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK_ERROR]: {
    title: 'Koneksi Bermasalah',
    message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
    action: 'Coba Lagi'
  },
  [ERROR_TYPES.API_ERROR]: {
    title: 'Server Error',
    message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
    action: 'Coba Lagi'
  },
  [ERROR_TYPES.VALIDATION_ERROR]: {
    title: 'Data Tidak Valid',
    message: 'Mohon periksa kembali data yang Anda masukkan.',
    action: 'Perbaiki'
  },
  [ERROR_TYPES.AUTHENTICATION_ERROR]: {
    title: 'Sesi Berakhir',
    message: 'Sesi Anda telah berakhir. Silakan login kembali.',
    action: 'Login'
  },
  [ERROR_TYPES.PERMISSION_ERROR]: {
    title: 'Akses Ditolak',
    message: 'Anda tidak memiliki izin untuk melakukan aksi ini.',
    action: 'OK'
  },
  [ERROR_TYPES.KELAS_GABUNGAN_ERROR]: {
    title: 'Kelas Gabungan Error',
    message: 'Terjadi masalah dengan kombinasi kelas yang dipilih.',
    action: 'Perbaiki'
  },
  [ERROR_TYPES.KURIKULUM_ERROR]: {
    title: 'Kurikulum Error',
    message: 'Terjadi masalah dengan kurikulum yang dipilih.',
    action: 'Coba Lagi'
  }
};

/**
 * Enhanced API error parser with comprehensive error type detection
 */
export const parseEnhancedApiError = (error) => {
  // Network/Connection errors
  if (!error.response) {
    return {
      type: ERROR_TYPES.NETWORK_ERROR,
      code: 'NETWORK_UNREACHABLE',
      message: 'Tidak dapat terhubung ke server',
      details: error.message
    };
  }

  const { status, data } = error.response;

  // Parse based on HTTP status codes
  switch (status) {
    case 400:
      return {
        type: ERROR_TYPES.VALIDATION_ERROR,
        code: 'BAD_REQUEST',
        message: data?.message || 'Request tidak valid',
        details: data?.errors || {}
      };

    case 401:
      return {
        type: ERROR_TYPES.AUTHENTICATION_ERROR,
        code: 'UNAUTHORIZED',
        message: 'Sesi berakhir, silakan login kembali',
        details: data?.message
      };

    case 403:
      return {
        type: ERROR_TYPES.PERMISSION_ERROR,
        code: 'FORBIDDEN',
        message: data?.message || 'Akses ditolak',
        details: data?.details
      };

    case 404:
      return {
        type: ERROR_TYPES.DATA_ERROR,
        code: 'NOT_FOUND',
        message: data?.message || 'Data tidak ditemukan',
        details: data?.details
      };

    case 422:
      return {
        type: ERROR_TYPES.VALIDATION_ERROR,
        code: 'VALIDATION_ERROR',
        message: data?.message || 'Data tidak valid',
        details: data?.errors || {}
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: ERROR_TYPES.API_ERROR,
        code: 'SERVER_ERROR',
        message: 'Server sedang bermasalah. Silakan coba lagi.',
        details: data?.message
      };

    default:
      return {
        type: ERROR_TYPES.UNKNOWN_ERROR,
        code: 'UNKNOWN_HTTP_ERROR',
        message: data?.message || 'Terjadi kesalahan yang tidak diketahui',
        details: { status, data }
      };
  }
};

/**
 * Enhanced error handler with user-friendly alerts and actions
 */
export const handleEnhancedError = (error, options = {}) => {
  const {
    showAlert = true,
    customMessage = null,
    onRetry = null,
    onDismiss = null,
    context = 'general'
  } = options;

  const parsedError = parseEnhancedApiError(error);
  const errorConfig = ERROR_MESSAGES[parsedError.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR];
  
  const errorInfo = {
    ...parsedError,
    userMessage: customMessage || parsedError.message || errorConfig.message,
    title: errorConfig.title,
    action: errorConfig.action,
    context
  };

  // Log error for debugging
  console.error(`[${context}] Enhanced Error:`, {
    type: parsedError.type,
    code: parsedError.code,
    message: parsedError.message,
    details: parsedError.details
  });

  // Show user-friendly alert
  if (showAlert) {
    showEnhancedErrorAlert(errorInfo, onRetry, onDismiss);
  }

  return errorInfo;
};

/**
 * Show enhanced error alert with smart action buttons
 */
export const showEnhancedErrorAlert = (errorInfo, onRetry = null, onDismiss = null) => {
  const buttons = [];

  // Add retry button for retryable errors
  if (onRetry && ![ERROR_TYPES.PERMISSION_ERROR, ERROR_TYPES.VALIDATION_ERROR].includes(errorInfo.type)) {
    buttons.push({
      text: errorInfo.action,
      onPress: onRetry
    });
  }

  // Add dismiss button
  buttons.push({
    text: onRetry ? 'Batal' : 'OK',
    style: onRetry ? 'cancel' : 'default',
    onPress: onDismiss || (() => {})
  });

  Alert.alert(
    errorInfo.title,
    errorInfo.userMessage,
    buttons
  );
};

/**
 * Kurikulum-specific error handlers for Phase 3
 */
export const handleKurikulumError = (error, operation) => {
  const context = `kurikulum_${operation}`;
  
  const customMessages = {
    browse: 'Gagal memuat daftar kurikulum',
    assign: 'Gagal menerapkan kurikulum ke kelompok',
    progress: 'Gagal memuat data progress kurikulum',
    reporting: 'Gagal generate laporan kurikulum',
    search: 'Gagal mencari kurikulum',
    detail: 'Gagal memuat detail kurikulum'
  };

  return handleEnhancedError(error, {
    context,
    customMessage: customMessages[operation]
  });
};

export const handleKelompokError = (error, operation) => {
  const context = `kelompok_${operation}`;
  
  const customMessages = {
    create: 'Gagal membuat kelompok baru',
    update: 'Gagal mengupdate kelompok',
    delete: 'Gagal menghapus kelompok',
    fetch: 'Gagal memuat data kelompok',
    assign_kurikulum: 'Gagal assign kurikulum ke kelompok',
    progress: 'Gagal memuat progress kelompok'
  };

  return handleEnhancedError(error, {
    context,
    customMessage: customMessages[operation]
  });
};

/**
 * Kelas Gabungan specific validations and error handling
 */
export const KELAS_GABUNGAN_ERRORS = {
  INVALID_COMBINATION: 'Kombinasi kelas tidak valid. Maksimal 2 jenjang dengan gap maksimal 3 level.',
  COMPATIBILITY_LOW: 'Kompatibilitas materi terlalu rendah untuk kombinasi kelas ini.',
  MISSING_MATERIALS: 'Tidak cukup materi tersedia untuk kombinasi kelas ini.',
  TUTOR_UNAVAILABLE: 'Tidak ada tutor yang tersedia untuk kombinasi kelas ini.',
  EMPTY_SELECTION: 'Minimal satu kelas harus dipilih',
  DUPLICATE_SELECTION: 'Kelas tidak boleh duplikat'
};

export const validateKelasGabungan = (kelasGabungan) => {
  const errors = [];
  
  if (!kelasGabungan || kelasGabungan.length === 0) {
    errors.push(KELAS_GABUNGAN_ERRORS.EMPTY_SELECTION);
    return errors;
  }
  
  // Check for duplicates
  const kelasSeen = new Set();
  for (const kelas of kelasGabungan) {
    const kelasKey = `${kelas.jenjang}-${kelas.kelas}`;
    if (kelasSeen.has(kelasKey)) {
      errors.push(KELAS_GABUNGAN_ERRORS.DUPLICATE_SELECTION);
      break;
    }
    kelasSeen.add(kelasKey);
  }
  
  // Check jenjang limit (max 2)
  const uniqueJenjang = [...new Set(kelasGabungan.map(k => k.jenjang))];
  if (uniqueJenjang.length > 2) {
    errors.push(KELAS_GABUNGAN_ERRORS.INVALID_COMBINATION);
  }
  
  return errors;
};

/**
 * Enhanced form validation error handler
 */
export const handleFormValidationError = (error, formFields = {}) => {
  const parsedError = parseEnhancedApiError(error);
  
  if (parsedError.type === ERROR_TYPES.VALIDATION_ERROR) {
    const fieldErrors = {};
    
    if (parsedError.details && typeof parsedError.details === 'object') {
      Object.keys(parsedError.details).forEach(field => {
        const errorMessages = parsedError.details[field];
        fieldErrors[field] = Array.isArray(errorMessages) 
          ? errorMessages[0] 
          : errorMessages;
      });
    }
    
    return {
      hasErrors: true,
      fieldErrors,
      generalError: parsedError.message
    };
  }
  
  return {
    hasErrors: false,
    fieldErrors: {},
    generalError: parsedError.message
  };
};

/**
 * Retry mechanism with exponential backoff for resilient operations
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry certain error types
      const parsedError = parseEnhancedApiError(error);
      if ([
        ERROR_TYPES.AUTHENTICATION_ERROR,
        ERROR_TYPES.PERMISSION_ERROR,
        ERROR_TYPES.VALIDATION_ERROR
      ].includes(parsedError.type)) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[RETRY] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Safe async operation wrapper for enhanced error handling
 */
export const safeAsyncOperation = async (operation, options = {}) => {
  const {
    retries = 1,
    onError = null,
    context = 'operation',
    showErrorAlert = true
  } = options;

  try {
    if (retries > 1) {
      return await retryWithBackoff(operation, retries);
    } else {
      return await operation();
    }
  } catch (error) {
    const errorInfo = handleEnhancedError(error, {
      showAlert: showErrorAlert && !onError,
      context
    });
    
    if (onError) {
      onError(errorInfo);
    }
    
    throw errorInfo;
  }
};