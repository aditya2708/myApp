import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_REFRESH_TOKEN_KEY,
  STORAGE_TOKEN_KEY,
  STORAGE_USER_KEY,
  STORAGE_CURRENT_ROLE_KEY
} from '../../constants/config';

/**
 * Store auth token in AsyncStorage
 * @param {string} token - The authentication token
 * @returns {Promise<boolean>} - Success status
 */
export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
};

/**
 * Retrieve auth token from AsyncStorage
 * @returns {Promise<string|null>} - The token or null if not found
 */
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Remove auth token from AsyncStorage
 * @returns {Promise<boolean>} - Success status
 */
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

export const storeRefreshToken = async (token) => {
  try {
    await AsyncStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error storing refresh token:', error);
    return false;
  }
};

export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const removeRefreshToken = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error removing refresh token:', error);
    return false;
  }
};

/**
 * Store user data in AsyncStorage
 * @param {Object} user - User data object
 * @returns {Promise<boolean>} - Success status
 */
export const storeUser = async (user) => {
  try {
    const jsonValue = JSON.stringify(user);
    await AsyncStorage.setItem(STORAGE_USER_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

/**
 * Retrieve user data from AsyncStorage
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const getUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_USER_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Remove user data from AsyncStorage
 * @returns {Promise<boolean>} - Success status
 */
export const removeUser = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_USER_KEY);
    return true;
  } catch (error) {
    console.error('Error removing user data:', error);
    return false;
  }
};

/**
 * Clear all auth related data from AsyncStorage
 * @returns {Promise<boolean>} - Success status
 */
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_TOKEN_KEY,
      STORAGE_USER_KEY,
      STORAGE_REFRESH_TOKEN_KEY,
      STORAGE_CURRENT_ROLE_KEY
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

/**
 * Store any data with a key
 * @param {string} key - Storage key
 * @param {any} value - Data to store
 * @returns {Promise<boolean>} - Success status
 */
export const storeData = async (key, value) => {
  try {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
    return false;
  }
};

/**
 * Get data for a key
 * @param {string} key - Storage key
 * @returns {Promise<any|null>} - Retrieved data or null
 */
export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value);
    } catch (e) {
      // If it's not JSON, return as string
      return value;
    }
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
};

/**
 * Remove data for a key
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} - Success status
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    return false;
  }
};

export const storeCurrentRole = async (role) => {
  try {
    if (!role) {
      await AsyncStorage.removeItem(STORAGE_CURRENT_ROLE_KEY);
      return true;
    }
    const normalized = {
      slug: role.slug,
      name: role.name || role.slug,
      scope_type: role.scope_type ?? null,
      scope_id: role.scope_id ?? null,
    };
    await AsyncStorage.setItem(STORAGE_CURRENT_ROLE_KEY, JSON.stringify(normalized));
    return true;
  } catch (error) {
    console.error('Error storing current role:', error);
    return false;
  }
};

export const getCurrentRole = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_CURRENT_ROLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error getting current role:', error);
    return null;
  }
};

export const removeCurrentRole = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_CURRENT_ROLE_KEY);
    return true;
  } catch (error) {
    console.error('Error removing current role:', error);
    return false;
  }
};
