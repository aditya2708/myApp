import * as Location from 'expo-location';
import { Alert } from 'react-native';

/**
 * GPS Utilities for attendance location tracking
 */

/**
 * GPS permission status constants
 */
export const GPS_PERMISSION_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
  RESTRICTED: 'restricted'
};

/**
 * GPS accuracy levels
 */
export const GPS_ACCURACY = {
  LOWEST: Location.Accuracy.Lowest,
  LOW: Location.Accuracy.Low,
  BALANCED: Location.Accuracy.Balanced,
  HIGH: Location.Accuracy.High,
  HIGHEST: Location.Accuracy.Highest,
  BEST_FOR_NAVIGATION: Location.Accuracy.BestForNavigation
};

/**
 * Default GPS configuration for attendance
 */
export const DEFAULT_GPS_CONFIG = {
  accuracy: GPS_ACCURACY.HIGH,
  timeout: 15000, // 15 seconds
  maximumAge: 60000, // 1 minute
  distanceInterval: 1, // meters
  timeInterval: 1000 // 1 second
};

/**
 * Check if GPS location services are enabled
 * @returns {Promise<boolean>} - Whether location services are enabled
 */
export const isLocationServicesEnabled = async () => {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    return enabled;
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

/**
 * Request location permissions
 * @returns {Promise<Object>} - Permission status and grant result
 */
export const requestLocationPermissions = async () => {
  try {
    // Check current permission status
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return {
        granted: true,
        status: existingStatus,
        canAskAgain: true
      };
    }

    // Request permission if not granted
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    
    return {
      granted: status === 'granted',
      status,
      canAskAgain
    };
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return {
      granted: false,
      status: 'error',
      canAskAgain: false,
      error: error.message
    };
  }
};

/**
 * Get current GPS location
 * @param {Object} config - GPS configuration options
 * @returns {Promise<Object>} - Location data or error
 */
export const getCurrentLocation = async (config = DEFAULT_GPS_CONFIG) => {
  try {
    // Check if location services are enabled
    const servicesEnabled = await isLocationServicesEnabled();
    if (!servicesEnabled) {
      throw new Error('Location services are disabled. Please enable GPS in your device settings.');
    }

    // Check/request permissions
    const permissionResult = await requestLocationPermissions();
    if (!permissionResult.granted) {
      throw new Error('Location permission denied. GPS access is required for attendance.');
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: config.accuracy,
      timeout: config.timeout,
      maximumAge: config.maximumAge
    });

    // Format the response
    const locationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      altitudeAccuracy: location.coords.altitudeAccuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
      timestamp: new Date(location.timestamp).toISOString(),
      success: true
    };

    return locationData;
  } catch (error) {
    console.error('Error getting current location:', error);
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude  
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} - Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // in metres
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Validate if current location is within allowed distance from activity location
 * @param {Object} currentLocation - Current GPS coordinates {latitude, longitude}
 * @param {Object} activityLocation - Activity GPS coordinates {latitude, longitude}
 * @param {number} maxDistance - Maximum allowed distance in meters
 * @returns {Object} - Validation result
 */
export const validateLocationDistance = (currentLocation, activityLocation, maxDistance = 50) => {
  if (!currentLocation.latitude || !currentLocation.longitude) {
    return {
      valid: false,
      reason: 'Current location coordinates are missing'
    };
  }

  if (!activityLocation.latitude || !activityLocation.longitude) {
    return {
      valid: false,
      reason: 'Activity location coordinates are missing'
    };
  }

  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    activityLocation.latitude,
    activityLocation.longitude
  );

  const valid = distance <= maxDistance;

  return {
    valid,
    distance,
    maxDistance,
    reason: valid ? 'Location is within allowed range' : `Location is ${distance}m away, maximum allowed is ${maxDistance}m`
  };
};

/**
 * Format GPS coordinates for display
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} precision - Number of decimal places
 * @returns {string} - Formatted coordinate string
 */
export const formatCoordinates = (latitude, longitude, precision = 6) => {
  if (!latitude || !longitude) return 'Coordinates not available';
  
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
};

/**
 * Get human-readable accuracy description
 * @param {number} accuracy - Accuracy in meters
 * @returns {string} - Accuracy description
 */
export const getAccuracyDescription = (accuracy) => {
  if (!accuracy) return 'Unknown accuracy';
  
  if (accuracy <= 5) return 'Excellent accuracy';
  if (accuracy <= 10) return 'Good accuracy';
  if (accuracy <= 20) return 'Fair accuracy';
  if (accuracy <= 50) return 'Poor accuracy';
  return 'Very poor accuracy';
};

/**
 * Show GPS permission alert with settings option
 * @param {Function} onCancel - Callback when user cancels
 * @param {Function} onRetry - Callback when user wants to retry
 */
export const showGpsPermissionAlert = (onCancel, onRetry) => {
  Alert.alert(
    'GPS Permission Required',
    'This app needs GPS access to record attendance location. Please enable location permissions in your device settings.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: 'Retry',
        onPress: onRetry
      },
      {
        text: 'Settings',
        onPress: async () => {
          try {
            await Location.requestForegroundPermissionsAsync();
          } catch (error) {
            console.error('Error opening settings:', error);
          }
        }
      }
    ]
  );
};

/**
 * Show GPS services disabled alert
 * @param {Function} onCancel - Callback when user cancels
 * @param {Function} onRetry - Callback when user wants to retry
 */
export const showGpsDisabledAlert = (onCancel, onRetry) => {
  Alert.alert(
    'GPS Services Disabled',
    'Location services are turned off. Please enable GPS in your device settings to record attendance.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: 'Retry',
        onPress: onRetry
      }
    ]
  );
};

/**
 * Prepare GPS data for API submission
 * @param {Object} locationData - Location data from getCurrentLocation
 * @param {Object} validationResult - Result from validateLocationDistance (optional)
 * @returns {Object} - Formatted GPS data for API
 */
export const prepareGpsDataForApi = (locationData, validationResult = null) => {
  if (!locationData.success) {
    return {
      gps_error: locationData.error,
      gps_error_code: locationData.errorCode
    };
  }

  const gpsData = {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    gps_accuracy: locationData.accuracy,
    gps_recorded_at: locationData.timestamp
  };

  // Add validation data if provided
  if (validationResult) {
    gpsData.distance_from_activity = validationResult.distance;
    gpsData.gps_valid = validationResult.valid;
    gpsData.gps_validation_notes = validationResult.reason;
  }

  return gpsData;
};