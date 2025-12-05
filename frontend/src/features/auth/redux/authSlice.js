import { createSlice } from '@reduxjs/toolkit';

/**
 * Initial state for auth slice
 */
const initialState = {
  user: null,                 // User info fetched from IdP userinfo
  token: null,                // Access token from IdP
  isAuthenticated: false,     // Authentication status
  userLevel: null,            // Local role (from bimbel API)
  roles: [],                  // Available roles (multi-role)
  currentRole: null,          // Currently selected role
  profile: null,              // Additional profile data from tenant API
  sso: null,                  // Raw payload from IdP userinfo
  loading: false,             // Loading state
  initializing: true,         // App initialization state
  error: null,                // Error message if any
  fieldErrors: null           // Field-level validation errors
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
      state.fieldErrors = null;
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
      state.fieldErrors = null;
    },

    loginSuccess: (state, action) => {
      const payloadUser = action.payload.user || null;
      const availableRoles = action.payload.roles || [];
      const currentRole =
        action.payload.currentRole ||
        (availableRoles.length === 1 ? availableRoles[0] : null);
      const resolvedUserLevel = currentRole?.slug
        ? currentRole.slug
        : availableRoles.length > 1
          ? null
          : payloadUser?.level ?? null;

      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = payloadUser;
      state.roles = availableRoles;
      state.currentRole = currentRole;
      state.userLevel = resolvedUserLevel;
      state.profile =
        action.payload.profile ?? payloadUser?.profile ?? null;
      state.sso = action.payload.sso ?? action.payload.sso_profile ?? null;
      state.fieldErrors = null;
      state.error = null;
    },

    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'Email atau kata sandi tidak sesuai.';
      state.fieldErrors = action.payload?.fieldErrors || null;
      state.user = null;
      state.userLevel = null;
      state.roles = [];
      state.currentRole = null;
      state.sso = null;
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
      const payloadUser = action.payload?.user || null;
      state.loading = false;
      state.isAuthenticated = true;
      state.user = payloadUser;
      const availableRoles = action.payload?.roles || [];
      const currentRole =
        action.payload?.currentRole ||
        (availableRoles.length === 1 ? availableRoles[0] : null);
      const resolvedUserLevel = currentRole?.slug
        ? currentRole.slug
        : availableRoles.length > 1
          ? null
          : payloadUser?.level ?? null;

      state.roles = availableRoles;
      state.currentRole = currentRole;
      state.userLevel = resolvedUserLevel;
      state.profile =
        action.payload?.profile ??
        action.payload?.sso ??
        action.payload?.sso_profile ??
        payloadUser?.profile ??
        null;
      state.error = null;
      state.fieldErrors = null;
      if (action.payload?.sso || action.payload?.sso_profile) {
        state.sso = action.payload.sso ?? action.payload.sso_profile;
      }
    },
    
    fetchUserFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.error = action.payload?.message || 'Gagal mengambil data pengguna';
      state.user = null;
      state.userLevel = null;
      state.roles = [];
      state.currentRole = null;
      state.profile = null;
      state.token = null;
      state.sso = null;
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
    },

    setCurrentRole: (state, action) => {
      const role = action.payload || null;
      state.currentRole = role;
      state.userLevel = role?.slug ?? null;
    },
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
  initializeFailure,
  setCurrentRole
} = authSlice.actions;

// Export selectors
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsInitializing = (state) => state.auth.initializing;
export const selectAuthToken = (state) => state.auth.token;
export const selectUserLevel = (state) => state.auth.userLevel;
export const selectAvailableRoles = (state) => state.auth.roles;
export const selectCurrentRole = (state) => state.auth.currentRole;
export const selectUser = (state) => state.auth.user;
export const selectUserProfile = (state) => state.auth.profile;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthFieldErrors = (state) => state.auth.fieldErrors;

// Export reducer
export default authSlice.reducer;
