import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { USER_ROLES } from '../constants/config';

// Import navigation stacks
import AuthNavigator from './AuthNavigator';
import AdminPusatNavigator from './AdminPusatNavigator';
import AdminCabangNavigator from './AdminCabangNavigator';
import AdminShelterNavigator from './AdminShelterNavigator';
import DonaturNavigator from './DonaturNavigator';

// Import auth selectors and hooks
import { 
  selectIsAuthenticated, 
  selectUserLevel,
  selectIsInitializing
} from '../features/auth/redux/authSlice';
import { useAuth } from '../common/hooks/useAuth';

// Import LoadingScreen
import LoadingScreen from '../common/components/LoadingScreen';

const AppNavigator = () => {
  // Get auth related state and functions
  const { initialize } = useAuth();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userLevel = useSelector(selectUserLevel);
  const initializing = useSelector(selectIsInitializing);

  // Initialize auth state when app starts
  useEffect(() => {
    if (initialize) {
      initialize();
    }
  }, [initialize]);

  // Show loading screen while initializing
  if (initializing) {
    return <LoadingScreen message="" />;
  }

  // Render the appropriate navigator based on auth state and user role
  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        // User is not authenticated, show auth navigator
        <AuthNavigator />
      ) : (
        // User is authenticated, show role-specific navigator
        <>
          {userLevel === USER_ROLES.ADMIN_PUSAT && <AdminPusatNavigator />}
          {userLevel === USER_ROLES.ADMIN_CABANG && <AdminCabangNavigator />}
          {userLevel === USER_ROLES.ADMIN_SHELTER && <AdminShelterNavigator />}
          {userLevel === USER_ROLES.DONATUR && <DonaturNavigator />}
        </>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;