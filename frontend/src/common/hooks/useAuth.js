import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectIsAuthenticated, 
  selectUserLevel, 
  selectUser,
  selectUserProfile,
  selectAuthLoading,
  selectAuthError,
  selectAuthFieldErrors,
  selectIsInitializing,
  selectAvailableRoles,
  selectCurrentRole,
  resetAuthError
} from '../../features/auth/redux/authSlice';
import { 
  loginUser, 
  logoutUser, 
  fetchCurrentUser, 
  initializeAuth,
  setActiveRole
} from '../../features/auth/redux/authThunks';

/**
 * Custom hook for authentication management
 * Provides authentication state and actions to components
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  
  // Select auth state from Redux store
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userLevel = useSelector(selectUserLevel);
  const user = useSelector(selectUser);
  const profile = useSelector(selectUserProfile);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const fieldErrors = useSelector(selectAuthFieldErrors);
  const initializing = useSelector(selectIsInitializing);
  const roles = useSelector(selectAvailableRoles);
  const currentRole = useSelector(selectCurrentRole);

  // Initialize auth on first render
  const initialize = useCallback(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      return await dispatch(loginUser(credentials));
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const result = await dispatch(logoutUser());
      return result ?? { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: error?.message || 'Gagal logout. Silakan coba lagi.',
      };
    }
  }, [dispatch]);

  // Refresh user data
  const refreshUser = useCallback(() => {
    if (isAuthenticated) {
      return dispatch(fetchCurrentUser());
    }
    return Promise.resolve();
  }, [dispatch, isAuthenticated]);

  const selectRole = useCallback(async (role) => {
    return dispatch(setActiveRole(role));
  }, [dispatch]);

  // Clear any auth errors
  const clearError = useCallback(() => {
    dispatch(resetAuthError());
  }, [dispatch]);

  return {
    // Auth state
    isAuthenticated,
    userLevel,
    user,
    profile,
    loading,
    error,
    fieldErrors,
    initializing,
    roles,
    currentRole,
    
    // Auth actions
    login,
    logout,
    refreshUser,
    selectRole,
    clearError,
    initialize
  };
};
