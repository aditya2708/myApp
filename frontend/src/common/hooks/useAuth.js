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
  resetAuthError
} from '../../features/auth/redux/authSlice';
import { 
  loginUser, 
  logoutUser, 
  fetchCurrentUser, 
  initializeAuth 
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
      return await dispatch(logoutUser());
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, we clear the local state
      return true;
    }
  }, [dispatch]);

  // Refresh user data
  const refreshUser = useCallback(() => {
    if (isAuthenticated) {
      return dispatch(fetchCurrentUser());
    }
    return Promise.resolve();
  }, [dispatch, isAuthenticated]);

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
    
    // Auth actions
    login,
    logout,
    refreshUser,
    clearError,
    initialize
  };
};