import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

const useLocation = (config = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    autoRequest = false,
    onLocationChange = null,
    onError = null
  } = config;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);

  // Request location permissions
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        const errorMsg = 'Izin lokasi diperlukan untuk kehadiran GPS';
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMsg = 'Gagal meminta izin lokasi';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return false;
    }
  }, [onError]);

  // Check if location services are enabled
  const checkLocationServices = useCallback(async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Layanan Lokasi Dinonaktifkan',
          'Silakan aktifkan layanan lokasi untuk menggunakan fitur kehadiran GPS',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error memeriksa layanan lokasi:', err);
      return false;
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (options = {}) => {
    const finalOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
      ...options
    };

    setLoading(true);
    setError(null);

    try {
      // Check permissions first
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          setLoading(false);
          return null;
        }
      }

      // Check if location services are enabled
      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        setLoading(false);
        return null;
      }

      const locationResult = await Location.getCurrentPositionAsync(finalOptions);
      
      const formattedLocation = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy,
        altitude: locationResult.coords.altitude,
        heading: locationResult.coords.heading,
        speed: locationResult.coords.speed,
        timestamp: locationResult.timestamp
      };

      setLocation(formattedLocation);
      if (onLocationChange) onLocationChange(formattedLocation);
      
      setLoading(false);
      return formattedLocation;
    } catch (err) {
      let errorMsg = 'Gagal mendapatkan lokasi';
      
      if (err.code === 'E_LOCATION_TIMEOUT') {
        errorMsg = 'Permintaan lokasi habis waktu. Silakan coba lagi.';
      } else if (err.code === 'E_LOCATION_UNAVAILABLE') {
        errorMsg = 'Location services are unavailable';
      } else if (err.code === 'E_LOCATION_SERVICES_DISABLED') {
        errorMsg = 'Location services are disabled';
      }

      setError(errorMsg);
      if (onError) onError(errorMsg);
      setLoading(false);
      return null;
    }
  }, [
    enableHighAccuracy,
    timeout,
    maximumAge,
    permissionStatus,
    requestPermissions,
    checkLocationServices,
    onLocationChange,
    onError
  ]);

  // Watch location changes (for real-time tracking)
  const watchLocation = useCallback(async (options = {}) => {
    const finalOptions = {
      enableHighAccuracy,
      timeInterval: 5000,
      distanceInterval: 10,
      ...options
    };

    try {
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;
      }

      const subscription = await Location.watchPositionAsync(
        finalOptions,
        (locationResult) => {
          const formattedLocation = {
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
            accuracy: locationResult.coords.accuracy,
            altitude: locationResult.coords.altitude,
            heading: locationResult.coords.heading,
            speed: locationResult.coords.speed,
            timestamp: locationResult.timestamp
          };

          setLocation(formattedLocation);
          if (onLocationChange) onLocationChange(formattedLocation);
        }
      );

      return subscription;
    } catch (err) {
      const errorMsg = 'Gagal memantau lokasi';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return null;
    }
  }, [
    enableHighAccuracy,
    permissionStatus,
    requestPermissions,
    onLocationChange,
    onError
  ]);

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Validate location accuracy
  const isLocationAccurate = useCallback((locationData, maxAccuracy = 50) => {
    return locationData && locationData.accuracy <= maxAccuracy;
  }, []);

  // Validate if location is within allowed radius
  const isWithinRadius = useCallback((
    currentLocation,
    targetLocation,
    maxDistance
  ) => {
    if (!currentLocation || !targetLocation) return false;
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );
    
    return {
      valid: distance <= maxDistance,
      distance: Math.round(distance),
      maxDistance
    };
  }, [calculateDistance]);

  // Format coordinates for display
  const formatCoordinates = useCallback((lat, lon, precision = 6) => {
    return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
  }, []);

  // Clear location data
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  // Initialize permissions on mount if autoRequest is true
  useEffect(() => {
    if (autoRequest) {
      requestPermissions();
    }
  }, [autoRequest, requestPermissions]);

  return {
    // State
    location,
    loading,
    error,
    permissionStatus,
    
    // Methods
    getCurrentLocation,
    watchLocation,
    requestPermissions,
    checkLocationServices,
    calculateDistance,
    isLocationAccurate,
    isWithinRadius,
    formatCoordinates,
    clearLocation,
    
    // Helper properties
    hasLocation: !!location,
    hasPermission: permissionStatus === 'granted',
    coordinates: location ? {
      latitude: location.latitude,
      longitude: location.longitude
    } : null
  };
};

export default useLocation;