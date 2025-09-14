// file: src/features/adminShelter/utils/surveyValidation.js

/**
 * Utility functions for survey form validation
 */

/**
 * Validates the basic information step
 * @param {Object} formData - The form data
 * @returns {Object} - Validation result { isValid, errorMessage }
 */
export const validateBasicStep = (formData) => {
  if (!formData.pendidikan_kepala_keluarga) {
    return {
      isValid: false,
      errorMessage: 'Please select the education level of the head of family'
    };
  }
  
  if (!formData.jumlah_tanggungan) {
    return {
      isValid: false,
      errorMessage: 'Please enter the number of dependents'
    };
  }
  
  if (!formData.pekerjaan_kepala_keluarga) {
    return {
      isValid: false,
      errorMessage: 'Please select the occupation of the head of family'
    };
  }
  
  if (!formData.penghasilan) {
    return {
      isValid: false,
      errorMessage: 'Please select the monthly income range'
    };
  }
  
  
  return { isValid: true };
};

/**
 * Validates the financial step
 * @param {Object} formData - The form data
 * @returns {Object} - Validation result { isValid, errorMessage }
 */
export const validateFinancialStep = (formData) => {
  if (!formData.kepemilikan_tabungan) {
    return {
      isValid: false,
      errorMessage: 'Please indicate if the family has savings'
    };
  }
  
  if (!formData.jumlah_makan) {
    return {
      isValid: false,
      errorMessage: 'Please indicate if the family eats three meals a day'
    };
  }
  
  if (!formData.biaya_pendidikan_perbulan) {
    return {
      isValid: false,
      errorMessage: 'Please enter the monthly education cost'
    };
  }
  
  if (!formData.bantuan_lembaga_formal_lain) {
    return {
      isValid: false,
      errorMessage: 'Please indicate if the family receives support from other institutions'
    };
  }
  
  if (formData.bantuan_lembaga_formal_lain === 'Ya' && !formData.bantuan_lembaga_formal_lain_sebesar) {
    return {
      isValid: false,
      errorMessage: 'Please enter the amount of support received'
    };
  }
  
  return { isValid: true };
};

/**
 * Validates the assets step
 * @param {Object} formData - The form data
 * @returns {Object} - Validation result { isValid, errorMessage }
 */
export const validateAssetsStep = (formData) => {
  if (!formData.kepemilikan_tanah) {
    return {
      isValid: false,
      errorMessage: 'Please indicate if the family owns land'
    };
  }
  
  if (!formData.kepemilikan_rumah) {
    return {
      isValid: false,
      errorMessage: 'Please select the house ownership status'
    };
  }
  
  if (!formData.kondisi_rumah_dinding) {
    return {
      isValid: false,
      errorMessage: 'Please select the house wall material'
    };
  }
  
  if (!formData.kondisi_rumah_lantai) {
    return {
      isValid: false,
      errorMessage: 'Please select the house floor material'
    };
  }
  
  if (!formData.kepemilikan_kendaraan) {
    return {
      isValid: false,
      errorMessage: 'Please select the vehicle ownership'
    };
  }
  
  if (!formData.kepemilikan_elektronik) {
    return {
      isValid: false,
      errorMessage: 'Please select the electronics ownership'
    };
  }
  
  return { isValid: true };
};

/**
 * Validates the health step
 * @param {Object} formData - The form data
 * @returns {Object} - Validation result { isValid, errorMessage }
 */
export const validateHealthStep = (formData) => {
  if (!formData.sumber_air_bersih) {
    return {
      isValid: false,
      errorMessage: 'Please select the clean water source'
    };
  }
  
  if (!formData.jamban_limbah) {
    return {
      isValid: false,
      errorMessage: 'Please select the toilet/waste system'
    };
  }
  
  if (!formData.tempat_sampah) {
    return {
      isValid: false,
      errorMessage: 'Please select the garbage disposal method'
    };
  }
  
  if (!formData.perokok) {
    return {
      isValid: false,
      errorMessage: 'Please indicate if anyone in the family is a smoker'
    };
  }
  
  if (!formData.konsumen_miras) {
    return {
      isValid: false,
      errorMessage: 'Please indicate if anyone in the family consumes alcohol'
    };
  }
  
  if (!formData.persediaan_p3k) {
    return {
      isValid: false,
      errorMessage: 'Please indicate if the family has a first aid kit'
    };
  }
  
  if (!formData.makan_buah_sayur) {
    return {
      isValid: false,
      errorMessage: 'Please indicate if the family eats fruits and vegetables'
    };
  }
  
  return { isValid: true };
};

/**
 * Validates the religious step
 * @param {Object} formData - The form data
 * @returns {Object} - Validation result { isValid, errorMessage }
 */
export const validateReligiousStep = (formData) => {
  if (!formData.solat_lima_waktu) {
    return {
      isValid: false,
      errorMessage: 'Please select the daily prayer consistency'
    };
  }
  
  if (!formData.membaca_alquran) {
    return {
      isValid: false,
      errorMessage: 'Please select the Quran reading ability'
    };
  }
  
  if (!formData.majelis_taklim) {
    return {
      isValid: false,
      errorMessage: 'Please select the attendance at religious study'
    };
  }
  
  if (!formData.membaca_koran) {
    return {
      isValid: false,
      errorMessage: 'Please select the newspaper/news reading habit'
    };
  }
  
  if (!formData.pengurus_organisasi) {
    return {
      isValid: false,
      errorMessage: 'Please indicate if member of any organization'
    };
  }
  
  if (formData.pengurus_organisasi === 'Ya' && !formData.pengurus_organisasi_sebagai) {
    return {
      isValid: false,
      errorMessage: 'Please enter the position in organization'
    };
  }
  
  return { isValid: true };
};

/**
 * Validates the step based on the step ID
 * @param {string} stepId - The step ID
 * @param {Object} formData - The form data
 * @returns {Object} - Validation result { isValid, errorMessage }
 */
export const validateStep = (stepId, formData) => {
  switch (stepId) {
    case 'basic':
      return validateBasicStep(formData);
    case 'financial':
      return validateFinancialStep(formData);
    case 'assets':
      return validateAssetsStep(formData);
    case 'health':
      return validateHealthStep(formData);
    case 'religious':
      return validateReligiousStep(formData);
    case 'result':
      return { isValid: true }; // No required fields on result step
    default:
      return { isValid: true };
  }
};

/**
 * Validates the minimum required fields for survey submission
 * @param {Object} formData - The form data
 * @returns {Object} - Validation result { isValid, errorMessage }
 */
export const validateSubmission = (formData) => {
  if (!formData.pendidikan_kepala_keluarga || 
      !formData.jumlah_tanggungan || 
      !formData.pekerjaan_kepala_keluarga || 
      !formData.penghasilan) {
    return {
      isValid: false,
      errorMessage: 'Please complete the Basic Information section'
    };
  }
  
  // Add more critical fields if needed
  
  return { isValid: true };
};