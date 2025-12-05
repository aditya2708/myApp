import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutSuccess, setAuthToken } from '../features/auth/redux/authSlice';
import {
  MANAGEMENT_BASE_URL,
  SSO_CLIENT_ID,
  SSO_CLIENT_SECRET,
  STORAGE_REFRESH_TOKEN_KEY,
  STORAGE_TOKEN_KEY,
} from '../constants/config';
import { removeRefreshToken, removeToken, removeUser, removeCurrentRole } from '../common/utils/storageHelpers';

let refreshPromise = null;
let dispatchRef = null;

export const bindTokenRefresherDispatch = (dispatch) => {
  dispatchRef = dispatch;
};

const clearPendingTokens = async () => {
  await Promise.all([removeToken(), removeRefreshToken(), removeUser(), removeCurrentRole()]);
  if (dispatchRef) {
    dispatchRef(logoutSuccess());
  }
};

export const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await AsyncStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      throw new Error('Refresh token missing');
    }

    if (!SSO_CLIENT_ID || !SSO_CLIENT_SECRET) {
      throw new Error('SSO client not configured');
    }

    const response = await axios.post(
      `${MANAGEMENT_BASE_URL}/oauth/token`,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SSO_CLIENT_ID,
        client_secret: SSO_CLIENT_SECRET,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token: accessToken, refresh_token: newRefreshToken } = response.data || {};

    if (!accessToken) {
      throw new Error('No access token returned from refresh');
    }

    await AsyncStorage.setItem(STORAGE_TOKEN_KEY, accessToken);

    if (newRefreshToken) {
      await AsyncStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, newRefreshToken);
    }

    if (dispatchRef) {
      dispatchRef(setAuthToken(accessToken));
    }

    return accessToken;
  })()
    .catch(async (error) => {
      await clearPendingTokens();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

export const clearAuthState = async () => {
  await clearPendingTokens();
};
