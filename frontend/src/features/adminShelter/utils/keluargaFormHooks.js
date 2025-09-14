import { useReducer, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { adminShelterKeluargaApi } from '../api/adminShelterKeluargaApi';
import { 
  STEPS, 
  getInitialFormData, 
  validateStep,
  validateNIK,
  validateRequired,
  validateDate,
  formatDateForSubmission 
} from '../utils/keluargaFormUtils';

// Form Actions
const FORM_ACTIONS = {
  SET_FIELD: 'SET_FIELD',
  SET_FORM_DATA: 'SET_FORM_DATA',
  RESET_FORM: 'RESET_FORM',
};

// Form Reducer
const formReducer = (state, action) => {
  switch (action.type) {
    case FORM_ACTIONS.SET_FIELD:
      return { ...state, [action.field]: action.value };
    case FORM_ACTIONS.SET_FORM_DATA:
      return { ...state, ...action.data };
    case FORM_ACTIONS.RESET_FORM:
      return getInitialFormData();
    default:
      return state;
  }
};

// Main Form Hook
export const useKeluargaForm = (existingKeluarga = null, isEditMode = false) => {
  const [formData, dispatch] = useReducer(formReducer, getInitialFormData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const setField = useCallback((field, value) => {
    dispatch({ type: FORM_ACTIONS.SET_FIELD, field, value });
    
    // Auto-clear death data when status changes
    if (field === 'status_ortu') {
      const isFatherDeceased = value === 'yatim' || value === 'yatim piatu';
      const isMotherDeceased = value === 'piatu' || value === 'yatim piatu';
      
      if (!isFatherDeceased) {
        dispatch({ type: FORM_ACTIONS.SET_FIELD, field: 'tanggal_kematian_ayah', value: '' });
        dispatch({ type: FORM_ACTIONS.SET_FIELD, field: 'penyebab_kematian_ayah', value: '' });
      }
      
      if (!isMotherDeceased) {
        dispatch({ type: FORM_ACTIONS.SET_FIELD, field: 'tanggal_kematian_ibu', value: '' });
        dispatch({ type: FORM_ACTIONS.SET_FIELD, field: 'penyebab_kematian_ibu', value: '' });
      }
    }
  }, []);

  const setFormData = useCallback((data) => {
    dispatch({ type: FORM_ACTIONS.SET_FORM_DATA, data });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: FORM_ACTIONS.RESET_FORM });
  }, []);

  return {
    formData,
    setField,
    setFormData,
    resetForm,
    loading,
    setLoading,
    error,
    setError,
  };
};

// Step Validation Hook
export const useStepValidation = (formData) => {
  const [stepsValid, setStepsValid] = useState({
    [STEPS.FAMILY]: false,
    [STEPS.PARENTS]: false,
    [STEPS.GUARDIAN]: false,
    [STEPS.CHILD]: false,
    [STEPS.EDUCATION]: false,
    [STEPS.SURVEY_BASIC]: false,
    [STEPS.SURVEY_FINANCIAL]: false,
    [STEPS.SURVEY_ASSETS]: false,
    [STEPS.SURVEY_HEALTH]: false,
    [STEPS.SURVEY_RELIGIOUS]: false,
    [STEPS.REVIEW]: true,
  });

  const updateStepValidity = useCallback((step, isValid) => {
    setStepsValid(prev => ({ ...prev, [step]: isValid }));
  }, []);

  const validateStepData = useCallback((step) => {
    return validateStep(step, formData);
  }, [formData]);

  const isStepAccessible = useCallback((targetStep) => {
    if (targetStep === STEPS.GUARDIAN && formData.status_ortu !== 'yatim piatu') {
      return false;
    }
    
    for (let i = 0; i < targetStep; i++) {
      if (i === STEPS.GUARDIAN && formData.status_ortu !== 'yatim piatu') {
        continue;
      }
      if (!stepsValid[i]) {
        return false;
      }
    }
    
    return true;
  }, [formData.status_ortu, stepsValid]);

  return {
    stepsValid,
    updateStepValidity,
    validateStepData,
    isStepAccessible,
  };
};

// Step Navigation Hook
export const useStepNavigation = (formData, stepsValid, validateStepData, updateStepValidity) => {
  const [currentStep, setCurrentStep] = useState(STEPS.FAMILY);

  const goToNextStep = useCallback(() => {
    const isCurrentStepValid = validateStepData(currentStep);
    updateStepValidity(currentStep, isCurrentStepValid);
    
    if (isCurrentStepValid) {
      let nextStep = currentStep + 1;
      
      if (currentStep === STEPS.PARENTS && formData.status_ortu !== 'yatim piatu') {
        nextStep = STEPS.CHILD;
      }
      
      setCurrentStep(nextStep);
    } else {
      Alert.alert(
        'Kesalahan Validasi',
        'Mohon lengkapi semua kolom yang wajib diisi sebelum melanjutkan.'
      );
    }
  }, [currentStep, formData.status_ortu, validateStepData, updateStepValidity]);

  const goToPreviousStep = useCallback(() => {
    let prevStep = currentStep - 1;
    
    if (currentStep === STEPS.GUARDIAN) {
      prevStep = STEPS.PARENTS;
    } else if (currentStep === STEPS.CHILD && formData.status_ortu !== 'yatim piatu') {
      prevStep = STEPS.PARENTS;
    }
    
    setCurrentStep(Math.max(0, prevStep));
  }, [currentStep, formData.status_ortu]);

  const goToStep = useCallback((step) => {
    if (step === STEPS.GUARDIAN && formData.status_ortu !== 'yatim piatu') {
      return false;
    }
    
    for (let i = 0; i < step; i++) {
      if (i === STEPS.GUARDIAN && formData.status_ortu !== 'yatim piatu') {
        continue;
      }
      if (!stepsValid[i]) {
        return false;
      }
    }
    
    setCurrentStep(step);
    return true;
  }, [formData.status_ortu, stepsValid]);

  return {
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
};

// Field Validation Hook
export const useFieldValidation = () => {
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = useCallback((fieldName, value, rules = {}) => {
    let error = null;

    if (rules.required) {
      error = validateRequired(value, rules.label || fieldName);
    }

    if (!error && rules.nik) {
      error = validateNIK(value);
    }

    if (!error && rules.date) {
      error = validateDate(value, rules.label || fieldName);
    }

    if (!error && rules.custom) {
      error = rules.custom(value);
    }

    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    return !error;
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasErrors = useCallback(() => {
    return Object.values(fieldErrors).some(error => error !== null);
  }, [fieldErrors]);

  return {
    fieldErrors,
    validateField,
    clearFieldError,
    clearAllErrors,
    hasErrors,
  };
};

// Form Submission Hook
export const useFormSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const prepareFormData = useCallback((data) => {
    const formDataObj = new FormData();
    
    // Add default regional values
    const dataWithDefaults = {
      ...data,
      id_prov_ayah: data.id_prov_ayah || '1',
      id_kab_ayah: data.id_kab_ayah || '1',
      id_kec_ayah: data.id_kec_ayah || '1',
      id_kel_ayah: data.id_kel_ayah || '1',
      id_prov_ibu: data.id_prov_ibu || '1',
      id_kab_ibu: data.id_kab_ibu || '1',
      id_kec_ibu: data.id_kec_ibu || '1',
      id_kel_ibu: data.id_kel_ibu || '1',
    };
    
    Object.entries(dataWithDefaults).forEach(([key, value]) => {
      if (key === '_stepValidation' || (key === 'foto' && !value)) {
        return;
      }
      
      if (key === 'foto' && value) {
        const filename = value.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formDataObj.append('foto', {
          uri: value.uri,
          type,
          name: filename,
        });
      } else if (value !== null && value !== undefined) {
        if (key.includes('tanggal_') && value) {
          const formattedDate = formatDateForSubmission(value);
          formDataObj.append(key, formattedDate);
        } else {
          formDataObj.append(key, value.toString());
        }
      }
    });
    
    return formDataObj;
  }, []);

  const submitForm = useCallback(async (formData, isEditMode, existingKeluargaId) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const formDataObj = prepareFormData(formData);
      let response;
      
      if (isEditMode) {
        response = await adminShelterKeluargaApi.updateKeluarga(
          existingKeluargaId,
          formDataObj
        );
      } else {
        response = await adminShelterKeluargaApi.createKeluarga(formDataObj);
      }
      
      if (response.data.success) {
        return {
          success: true,
          message: isEditMode
            ? 'Informasi Keluarga Berhasil Diupdate'
            : 'Keluarga Berhasil Ditambahkan',
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.message || 'Gagal Menyimpan Informasi Keluarga');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      
      let errorMessage = 'Gagal Menyimpan Informasi Keluarga';
      
      if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors || {};
        const errorMessages = Object.entries(validationErrors)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('\n');
        
        errorMessage = `Validation error:\n${errorMessages || err.response?.data?.message}`;
      } else {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      
      setSubmitError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setSubmitting(false);
    }
  }, [prepareFormData]);

  return {
    submitting,
    submitError,
    submitForm,
    setSubmitError,
  };
};

// Enhanced Family Form Hook (combines all hooks)
export const useEnhancedKeluargaForm = (existingKeluarga = null, isEditMode = false) => {
  const formHook = useKeluargaForm(existingKeluarga, isEditMode);
  const validationHook = useStepValidation(formHook.formData);
  const navigationHook = useStepNavigation(
    formHook.formData,
    validationHook.stepsValid,
    validationHook.validateStepData,
    validationHook.updateStepValidity
  );
  const fieldValidationHook = useFieldValidation();
  const submissionHook = useFormSubmission();

  // Enhanced field change handler
  const handleFieldChange = useCallback((field, value) => {
    formHook.setField(field, value);
    fieldValidationHook.clearFieldError(field);
  }, [formHook.setField, fieldValidationHook.clearFieldError]);

  // Enhanced form submission
  const handleSubmit = useCallback(async () => {
    const result = await submissionHook.submitForm(
      formHook.formData,
      isEditMode,
      existingKeluarga?.id_keluarga
    );
    
    if (result.success) {
      Alert.alert(
        'Berhasil',
        result.message,
        [{ text: 'OK', onPress: () => {} }]
      );
    } else {
      formHook.setError(result.message);
    }
    
    return result;
  }, [
    submissionHook.submitForm,
    formHook.formData,
    formHook.setError,
    isEditMode,
    existingKeluarga?.id_keluarga,
  ]);

  return {
    // Form data and handlers
    formData: formHook.formData,
    setField: handleFieldChange,
    setFormData: formHook.setFormData,
    resetForm: formHook.resetForm,
    
    // Loading and error states
    loading: formHook.loading,
    setLoading: formHook.setLoading,
    error: formHook.error,
    setError: formHook.setError,
    
    // Step validation
    stepsValid: validationHook.stepsValid,
    updateStepValidity: validationHook.updateStepValidity,
    validateStepData: validationHook.validateStepData,
    isStepAccessible: validationHook.isStepAccessible,
    
    // Step navigation
    currentStep: navigationHook.currentStep,
    setCurrentStep: navigationHook.setCurrentStep,
    goToNextStep: navigationHook.goToNextStep,
    goToPreviousStep: navigationHook.goToPreviousStep,
    goToStep: navigationHook.goToStep,
    
    // Field validation
    fieldErrors: fieldValidationHook.fieldErrors,
    validateField: fieldValidationHook.validateField,
    clearFieldError: fieldValidationHook.clearFieldError,
    clearAllErrors: fieldValidationHook.clearAllErrors,
    hasFieldErrors: fieldValidationHook.hasErrors,
    
    // Form submission
    submitting: submissionHook.submitting,
    submitError: submissionHook.submitError,
    handleSubmit,
    setSubmitError: submissionHook.setSubmitError,
  };
};