import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_TOKEN_KEY, STORAGE_USER_KEY } from '../../constants/config';

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
    await AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_USER_KEY]);
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