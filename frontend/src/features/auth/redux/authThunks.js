import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import { storeToken, getToken, removeToken, storeUser, removeUser } from '../../../common/utils/storageHelpers';
import { 
  setAuthToken, 
  loginStart, 
  loginSuccess, 
  loginFailure,
  logoutStart,
  logoutSuccess,
  logoutFailure,
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  initializeStart,
  initializeSuccess,
  initializeFailure
} from './authSlice';

/**
 * Initialize authentication state
 * Checks for existing token and fetches user data if token exists
 */
export const initializeAuth = () => async (dispatch) => {
  try {
    dispatch(initializeStart());

    // Check if token exists in storage
    const token = await getToken();
    
    if (token) {
      // If token exists, set it in the state
      dispatch(setAuthToken(token));
      
      // Try to fetch current user with the token
      try {
        dispatch(fetchUserStart());
        const response = await authApi.getCurrentUser();
        dispatch(fetchUserSuccess(response.data));
      } catch (error) {
        // If fetching user fails, token might be invalid
        await removeToken();
        await removeUser();
        dispatch(setAuthToken(null));
        dispatch(fetchUserFailure({ message: 'Sesi berakhir. Silakan masuk kembali.' }));
      }
    }
    
    // Mark initialization as complete
    dispatch(initializeSuccess());
  } catch (error) {
    console.error('Error initializing auth:', error);
    dispatch(initializeFailure());
  }
};

/**
 * Login user
 * Send login credentials and store token if successful
 */
export const loginUser = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());
    
    const response = await authApi.login(credentials);
    const data = response.data;
    
    // Store token and user data in async storage
    await storeToken(data.token);
    await storeUser(data.user);
    
    dispatch(loginSuccess(data));
    return data;
  } catch (error) {
    // Extract error message for better UX
    const fieldErrors = error.response?.data?.errors;
    const rawMessage = error.response?.data?.message || error.message || 'Email atau kata sandi tidak sesuai';

    const fallbackFieldMessage = fieldErrors && typeof fieldErrors === 'object'
      ? Object.values(fieldErrors).flat().join(', ')
      : null;

    const message = typeof rawMessage === 'string'
      ? rawMessage
      : fallbackFieldMessage || 'Email atau kata sandi tidak sesuai';

    const formattedError = {
      message,
      fieldErrors: fieldErrors || null
    };

    dispatch(loginFailure(formattedError));
    throw formattedError;
  }
};

/**
 * Logout user
 * Clear token and user data
 */
export const logoutUser = () => async (dispatch) => {
  try {
    dispatch(logoutStart());
    
    // Try to call logout API
    await authApi.logout();
    
    // Always clear local storage regardless of API success
    await removeToken();
    await removeUser();
    
    dispatch(logoutSuccess());
    return true;
  } catch (error) {
    console.error('Logout API error:', error);
    
    // Even if API call fails, clear local storage
    await removeToken();
    await removeUser();
    
    dispatch(logoutFailure());
    return true; // Return success anyway since we cleared local data
  }
};

/**
 * Fetch current user data
 * Get user profile based on stored token
 */
export const fetchCurrentUser = () => async (dispatch) => {
  try {
    dispatch(fetchUserStart());
    
    const response = await authApi.getCurrentUser();
    
    // Update stored user data
    await storeUser(response.data.user);
    
    dispatch(fetchUserSuccess(response.data));
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    
    const errorMsg = error.response?.data?.message || 'Gagal mengambil data pengguna';
    dispatch(fetchUserFailure({ message: errorMsg }));
    throw error;
  }
};