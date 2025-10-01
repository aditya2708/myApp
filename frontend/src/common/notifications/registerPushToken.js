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

const getProjectId = () => {
  const easProjectId = Constants?.expoConfig?.extra?.eas?.projectId;
  if (easProjectId) {
    return easProjectId;
  }

  return Constants?.easConfig?.projectId;
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

const registerPushToken = async (currentToken = null) => {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device.');
      return null;
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
      return null;
    }

    const projectId = getProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const expoPushToken = tokenResponse?.data;

    if (!expoPushToken) {
      console.warn('Unable to retrieve Expo push token.');
      return null;
    }

    if (currentToken && currentToken === expoPushToken) {
      return expoPushToken;
    }

    await api.post(
      ADMIN_SHELTER_ENDPOINTS.NOTIFICATIONS.REGISTER_PUSH_TOKEN,
      { token: expoPushToken }
    );

    return expoPushToken;
  } catch (error) {
    console.error('Failed to register push notification token:', error);
    throw error;
  }
};

export default registerPushToken;
