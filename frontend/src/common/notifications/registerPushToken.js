import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../../api/axiosConfig';
import { ADMIN_SHELTER_ENDPOINTS } from '../../constants/endpoints';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const getGcmSenderId = () => {
  const config = Constants?.expoConfig ?? Constants?.manifest;
  return config?.extra?.firebase?.gcmSenderId;
};

const ensureAndroidChannelAsync = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
};

const buildDeviceInfo = () => {
  const info = {
    platform: Platform.OS,
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    deviceYearClass: Device.deviceYearClass,
    totalMemory: Device.totalMemory,
  };

  return Object.fromEntries(
    Object.entries(info).filter(([, value]) => value !== undefined && value !== null)
  );
};

const sendTokenToBackend = async ({ token, deviceInfo }) => {
  if (!token) {
    return;
  }

  const payload = {
    fcm_token: token,
  };

  if (deviceInfo && Object.keys(deviceInfo).length > 0) {
    payload.device_info = deviceInfo;
  }

  try {
    await api.post(
      ADMIN_SHELTER_ENDPOINTS.NOTIFICATIONS.REGISTER_PUSH_TOKEN,
      payload
    );
  } catch (error) {
    const status = error?.response?.status;

    if (status === 409 || status === 422) {
      return;
    }

    throw error;
  }
};

let refreshSubscription = null;
let refreshCallback = null;

const ensureTokenRefreshListener = (onTokenRefresh) => {
  refreshCallback = onTokenRefresh;

  if (refreshSubscription) {
    return;
  }

  refreshSubscription = Notifications.addPushTokenListener(async (pushToken) => {
    const refreshedToken = pushToken?.data;

    if (!refreshedToken) {
      return;
    }

    try {
      await sendTokenToBackend({ token: refreshedToken });
    } catch (error) {
      console.error('Failed to synchronize refreshed push token with backend:', error);
    }

    if (typeof refreshCallback === 'function') {
      try {
        refreshCallback(refreshedToken);
      } catch (callbackError) {
        console.error('Push token refresh callback failed:', callbackError);
      }
    }
  });
};

export const removePushTokenRefreshListener = () => {
  if (refreshSubscription) {
    refreshSubscription.remove?.();
    refreshSubscription = null;
  }

  refreshCallback = null;
};

const registerPushToken = async ({ currentToken = null, onTokenRefresh } = {}) => {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device.');
      return {
        token: null,
        removeRefreshListener: removePushTokenRefreshListener,
      };
    }

    await ensureAndroidChannelAsync();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const permissionResponse = await Notifications.requestPermissionsAsync();
      finalStatus = permissionResponse.status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted.');
      return {
        token: null,
        removeRefreshListener: removePushTokenRefreshListener,
      };
    }

    const gcmSenderId = getGcmSenderId();

    if (!gcmSenderId) {
      console.warn('FCM sender ID is not configured.');
      return {
        token: null,
        removeRefreshListener: removePushTokenRefreshListener,
      };
    }

    const tokenResponse = await Notifications.getDevicePushTokenAsync({
      gcmSenderId,
    });
    const fcmToken = tokenResponse?.data;

    if (!fcmToken) {
      console.warn('Unable to retrieve FCM device token.');
      return {
        token: null,
        removeRefreshListener: removePushTokenRefreshListener,
      };
    }

    ensureTokenRefreshListener(onTokenRefresh);

    if (currentToken && currentToken === fcmToken) {
      return {
        token: fcmToken,
        removeRefreshListener: removePushTokenRefreshListener,
      };
    }

    const deviceInfo = buildDeviceInfo();

    await sendTokenToBackend({
      token: fcmToken,
      deviceInfo,
    });

    return {
      token: fcmToken,
      removeRefreshListener: removePushTokenRefreshListener,
    };
  } catch (error) {
    console.error('Failed to register push notification token:', error);
    throw error;
  }
};

export default registerPushToken;
