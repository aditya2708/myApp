import { createSlice } from '@reduxjs/toolkit';

/**
 * Initial state for auth slice
 */
const initialState = {
  user: null,                 // User basic information
  token: null,                // Authentication token
  isAuthenticated: false,     // Authentication status
  userLevel: null,            // User role (admin_pusat, admin_cabang, admin_shelter, donatur)
  profile: null,              // User profile data based on role
  loading: false,             // Loading state
  initializing: true,         // App initialization state
  error: null                 // Error message if any
};

/**
 * Auth slice with reducers and extra reducers for async thunks
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reset error state
    resetAuthError: (state) => {
      state.error = null;
    },
    
    // Manually set auth token (for restoring from storage)
    setAuthToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    
    // Set initialization complete
    setInitializationComplete: (state) => {
      state.initializing = false;
    },

    // Login actions
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = {
        id: action.payload.user.id,
        email: action.payload.user.email,
        level: action.payload.user.level
      };
      state.userLevel = action.payload.user.level;
      state.profile = action.payload.user.profile;
    },
    
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'Login failed. Please check your credentials.';
    },

    // Logout actions
    logoutStart: (state) => {
      state.loading = true;
    },
    
    logoutSuccess: (state) => {
      return {
        ...initialState,
        initializing: false
      };
    },
    
    logoutFailure: (state) => {
      return {
        ...initialState,
        initializing: false
      };
    },

    // Current user fetch actions
    fetchUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    
    fetchUserSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = {
        id: action.payload.user.id,
        email: action.payload.user.email,
        level: action.payload.user.level
      };
      state.userLevel = action.payload.user.level;
      state.profile = action.payload.user.profile;
    },
    
    fetchUserFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.error = action.payload?.message || 'Failed to fetch user data';
      state.user = null;
      state.userLevel = null;
      state.profile = null;
      state.token = null;
    },

    // Initialize auth action
    initializeStart: (state) => {
      state.initializing = true;
    },
    
    initializeSuccess: (state) => {
      state.initializing = false;
    },
    
    initializeFailure: (state) => {
      state.initializing = false;
    }
  }
});

// Export actions
export const { 
  resetAuthError, 
  setAuthToken, 
  setInitializationComplete,
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
} = authSlice.actions;

// Export selectors
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsInitializing = (state) => state.auth.initializing;
export const selectAuthToken = (state) => state.auth.token;
export const selectUserLevel = (state) => state.auth.userLevel;
export const selectUser = (state) => state.auth.user;
export const selectUserProfile = (state) => state.auth.profile;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

// Export reducer
export default authSlice.reducer;