import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { USER_ROLES } from '../constants/config';

// Import navigation stacks
import AuthNavigator from './AuthNavigator';
import AdminPusatNavigator from './AdminPusatNavigator';
import AdminCabangNavigator from './AdminCabangNavigator';
import AdminShelterNavigator from './AdminShelterNavigator';
import DonaturNavigator from './DonaturNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';

// Import auth selectors and hooks
import {
  selectIsAuthenticated,
  selectUserLevel,
  selectIsInitializing,
  selectAvailableRoles,
  selectCurrentRole
} from '../features/auth/redux/authSlice';
import { useAuth } from '../common/hooks/useAuth';
import PendingRoleScreen from '../features/auth/components/PendingRoleScreen';
import RolePickerScreen from '../features/auth/screens/RolePickerScreen';
import { loadQuickFlowFromStorage, selectQuickFlowHydrated } from '../features/adminShelter/redux/quickFlowSlice';

// Import LoadingScreen
import LoadingScreen from '../common/components/LoadingScreen';

const AppNavigator = () => {
  const dispatch = useDispatch();
  // Get auth related state and functions
  const { initialize, refreshUser, logout } = useAuth();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userLevel = useSelector(selectUserLevel);
  const roles = useSelector(selectAvailableRoles);
  const currentRole = useSelector(selectCurrentRole);
  const initializing = useSelector(selectIsInitializing);
  const quickFlowHydrated = useSelector(selectQuickFlowHydrated);

  // Initialize auth state when app starts
  useEffect(() => {
    if (initialize) {
      initialize();
    }
  }, [initialize]);

  useEffect(() => {
    if (!quickFlowHydrated) {
      dispatch(loadQuickFlowFromStorage());
    }
  }, [dispatch, quickFlowHydrated]);

  // Show loading screen while initializing
  if (initializing) {
    return <LoadingScreen message="" />;
  }

  // Render the appropriate navigator based on auth state and user role
  const renderRoleNavigator = () => {
    const roleSlug = currentRole?.slug || userLevel;

    if (!roleSlug && Array.isArray(roles) && roles.length > 1) {
      return (
        <RolePickerScreen
          roles={roles}
          onLogout={logout}
          onRefresh={refreshUser}
        />
      );
    }

    switch (roleSlug) {
      case USER_ROLES.SUPER_ADMIN:
        return <SuperAdminNavigator />;
      case USER_ROLES.ADMIN_PUSAT:
        return <AdminPusatNavigator />;
      case USER_ROLES.ADMIN_CABANG:
        return <AdminCabangNavigator />;
      case USER_ROLES.ADMIN_SHELTER:
        return <AdminShelterNavigator />;
      case USER_ROLES.DONATUR:
        return <DonaturNavigator />;
      default:
        return (
          <PendingRoleScreen
            onRefresh={refreshUser}
            onLogout={logout}
            message="Akun Anda valid. Pilih atau tunggu peran lokal agar dapat melanjutkan."
          />
        );
    }
  };

  return (
    <NavigationContainer>
      {!isAuthenticated ? <AuthNavigator /> : renderRoleNavigator()}
    </NavigationContainer>
  );
};

export default AppNavigator;
