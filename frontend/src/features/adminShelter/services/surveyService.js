// file: src/features/adminShelter/services/surveyService.js

import { adminShelterSurveyApi } from '../api/adminShelterSurveyApi';

/**
 * Service functions for survey management
 */

/**
 * Submit survey data
 * @param {string|number} familyId - The family ID
 * @param {Object} formData - The form data
 * @returns {Promise} - Promise that resolves to API response
 */
export const submitSurvey = async (familyId, formData) => {
  if (!familyId) {
    throw new Error('Family ID is required');
  }
  
  console.log(`Submitting survey for family ID: ${familyId}`);
  return await adminShelterSurveyApi.saveSurvey(familyId, formData);
};

/**
 * Format API error into user-friendly message
 * @param {Error} error - The error object
 * @returns {string} - Formatted error message
 */
export const formatApiError = (error) => {
  // If the error has a response, it's from the API
  if (error.response) {
    const statusCode = error.response.status;
    
    switch (statusCode) {
      case 404:
        return `Server couldn't find the family (404). Please verify the family exists and try again.`;
      case 422:
        // Validation errors from the server
        const validationErrors = error.response.data?.errors;
        let errorMessages = 'Validation failed: ';
        
        if (validationErrors && typeof validationErrors === 'object') {
          errorMessages += Object.values(validationErrors)
            .flat()
            .join(', ');
        } else {
          errorMessages += error.response.data?.message || 'Please check your form data';
        }
        
        return errorMessages;
      case 401:
        return 'Authentication error: Your session may have expired. Please login again.';
      case 403:
        return 'Permission denied: You do not have permission to create/edit surveys.';
      case 500:
      case 502:
      case 503:
        return `Server error (${statusCode}): The server encountered a problem. Please try again later.`;
      default:
        return `Request failed (${statusCode}): ${error.response.data?.message || 'Unknown error'}`;
    }
  } 
  // If the error has a request but no response, it's a network error
  else if (error.request) {
    return 'Network error: No response received from server. Please check your internet connection.';
  } 
  // Other errors
  else {
    return `Error: ${error.message}`;
  }
};

/**
 * Extract family ID from different sources
 * @param {Object} params - Route params
 * @param {Object} keluarga - Keluarga object
 * @returns {string|number|null} - The family ID or null if not found
 */
export const extractFamilyId = (params, keluarga) => {
  // Try direct ID from params
  let familyId = params?.id_keluarga;
  
  // If not found, try from keluarga object
  if (!familyId && keluarga) {
    familyId = keluarga.id_keluarga;
  }
  
  // Log what we found for debugging
  console.log('Extracted family ID:', familyId);
  
  return familyId;
};