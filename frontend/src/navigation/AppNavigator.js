import React, { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
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
  selectIsInitializing,
  selectPushToken,
  setPushToken
} from '../features/auth/redux/authSlice';
import { useAuth } from '../common/hooks/useAuth';
import registerPushToken from '../common/notifications/registerPushToken';
import { useNotifications } from '../common/hooks/useNotifications';

// Import LoadingScreen
import LoadingScreen from '../common/components/LoadingScreen';

const AppNavigator = () => {
  // Get auth related state and functions
  const navigationRef = useNavigationContainerRef();
  const dispatch = useDispatch();
  const { initialize } = useAuth();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userLevel = useSelector(selectUserLevel);
  const initializing = useSelector(selectIsInitializing);
  const pushToken = useSelector(selectPushToken);

  const handleNotificationResponse = useCallback(
    (response) => {
      const notificationData = response?.notification?.request?.content?.data || {};
      const targetScreen = notificationData?.screen;
      const params = notificationData?.params;

      if (targetScreen && navigationRef.isReady()) {
        navigationRef.navigate(targetScreen, params);
      }
    },
    [navigationRef]
  );

  const handleNotificationReceived = useCallback((notification) => {
    const { title, body } = notification?.request?.content || {};

    if (title || body) {
      Alert.alert(title ?? 'Notifikasi Baru', body ?? '');
    }
  }, []);

  useNotifications({
    enabled: isAuthenticated && userLevel === USER_ROLES.ADMIN_SHELTER,
    onReceive: handleNotificationReceived,
    onRespond: handleNotificationResponse,
  });

  // Initialize auth state when app starts
  useEffect(() => {
    if (initialize) {
      initialize();
    }
  }, [initialize]);

  useEffect(() => {
    const shouldRegisterToken =
      isAuthenticated && userLevel === USER_ROLES.ADMIN_SHELTER;

    if (!shouldRegisterToken) {
      return;
    }

    const syncPushToken = async () => {
      try {
        const token = await registerPushToken(pushToken);

        if (token && token !== pushToken) {
          dispatch(setPushToken(token));
        }
      } catch (error) {
        console.error('Failed to synchronize push token with backend:', error);
      }
    };

    syncPushToken();
  }, [dispatch, isAuthenticated, pushToken, userLevel]);

  // Show loading screen while initializing
  if (initializing) {
    return <LoadingScreen message="" />;
  }

  // Render the appropriate navigator based on auth state and user role
  return (
    <NavigationContainer ref={navigationRef}>
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