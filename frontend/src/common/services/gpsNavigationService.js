import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { getCurrentLocation, validateLocationDistance } from '../utils/gpsUtils';

export class GPSNavigationService {
  static async checkGPSRequirementForActivity(activityId, activityType, shelterGpsConfig) {
    try {
      // Check if GPS is required for this activity
      const isGpsRequired = this.isGpsRequiredForActivity(activityType, shelterGpsConfig);

      if (!isGpsRequired) {
        return { allowed: true, reason: 'GPS not required' };
      }

      // GPS is required, check device status
      const gpsStatus = await this.checkDeviceGPSStatus();

      if (!gpsStatus.enabled || !gpsStatus.permissionGranted) {
        const blockReason = this.getBlockingReason(gpsStatus);
        return {
          allowed: false,
          reason: blockReason,
          gpsStatus,
          requiresGps: true
        };
      }

      // Device GPS is ready, now check location distance if coordinates available
      if (shelterGpsConfig?.latitude && shelterGpsConfig?.longitude) {
        const locationValidation = await this.validateUserLocation(shelterGpsConfig);
        
        if (!locationValidation.allowed) {
          return {
            allowed: false,
            reason: locationValidation.reason,
            gpsStatus,
            locationValidation,
            requiresGps: true
          };
        }

        return { 
          allowed: true, 
          reason: 'GPS ready and location validated',
          locationValidation 
        };
      }

      // GPS enabled but no shelter coordinates to validate against
      return { allowed: true, reason: 'GPS ready' };

    } catch (error) {
      console.error('GPS check error:', error.message);
      
      // On error, allow navigation but log the issue
      return { 
        allowed: true, 
        reason: 'GPS check failed, allowing navigation',
        error: error.message 
      };
    }
  }

  static isGpsRequiredForActivity(activityType, shelterGpsConfig) {
    // For Bimbel activities, GPS is required if shelter has GPS config
    if (activityType === 'Bimbel' && shelterGpsConfig) {
      return true;
    }

    // For other activities, check shelter require_gps setting
    if (shelterGpsConfig?.require_gps) {
      return true;
    }

    return false;
  }

  static getGpsRequirementReason(activityType, shelterGpsConfig) {
    if (activityType === 'Bimbel' && shelterGpsConfig) {
      return 'Aktivitas Bimbel memerlukan validasi GPS';
    }
    if (shelterGpsConfig?.require_gps) {
      return 'Shelter memerlukan validasi GPS untuk semua aktivitas';
    }
    return 'GPS tidak diperlukan';
  }

  static async checkDeviceGPSStatus() {
    try {
      // Check if location services are enabled
      const locationServicesEnabled = await Location.hasServicesEnabledAsync();

      // Check app permissions
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();

      const permissionGranted = foregroundStatus === 'granted';

      const result = {
        enabled: locationServicesEnabled,
        permissionGranted,
        permissionStatus: foregroundStatus,
        timestamp: new Date().toISOString()
      };

      return result;

    } catch (error) {
      console.error('Error checking device GPS status:', error.message);
      
      return {
        enabled: false,
        permissionGranted: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static getBlockingReason(gpsStatus) {
    if (!gpsStatus.enabled) {
      return 'GPS tidak aktif. Silakan aktifkan GPS di pengaturan device.';
    }
    if (!gpsStatus.permissionGranted) {
      return 'Izin lokasi diperlukan. Silakan berikan izin lokasi untuk aplikasi.';
    }
    return 'GPS tidak tersedia.';
  }

  static showGPSRequiredModal(reason, gpsStatus, onRetry, onCancel, locationValidation = null) {
    const title = 'GPS Diperlukan';
    
    let message = `${reason}\n\nUntuk melanjutkan, pastikan:\n- GPS aktif di pengaturan device\n- Izin lokasi diberikan untuk aplikasi\n- Akurasi GPS dalam kondisi baik`;
    
    // Add location distance info if available
    if (locationValidation && locationValidation.distance && locationValidation.maxDistance) {
      message += `\n\nInfo Lokasi:\n- Jarak saat ini: ${Math.round(locationValidation.distance)}m\n- Jarak maksimal: ${locationValidation.maxDistance}m\n- Status: ${locationValidation.distance <= locationValidation.maxDistance ? 'Dalam radius' : 'Di luar radius'}`;
    }

    Alert.alert(
      title,
      message,
      [
        {
          text: 'Batal',
          style: 'cancel',
          onPress: () => {
            if (onCancel) onCancel();
          }
        },
        {
          text: 'Coba Lagi',
          onPress: () => {
            if (onRetry) onRetry();
          }
        }
      ]
    );
  }

  static async requestGPSPermissionIfNeeded() {
    try {
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();

      if (currentStatus === 'granted') {
        return { granted: true, status: currentStatus };
      }

      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();

      return {
        granted: newStatus === 'granted',
        status: newStatus
      };

    } catch (error) {
      console.error('Error requesting GPS permission:', error.message);
      
      return {
        granted: false,
        error: error.message
      };
    }
  }

  static async validateUserLocation(shelterGpsConfig) {
    try {
      // Get current user location
      const currentLocation = await getCurrentLocation();

      if (!currentLocation.success) {
        return {
          allowed: false,
          reason: 'Gagal mendapatkan lokasi saat ini: ' + (currentLocation.error || 'Unknown error'),
          error: currentLocation.error
        };
      }

      // Prepare shelter location coordinates
      const shelterLocation = {
        latitude: parseFloat(shelterGpsConfig.latitude),
        longitude: parseFloat(shelterGpsConfig.longitude)
      };

      // Validate coordinates are valid numbers
      if (isNaN(shelterLocation.latitude) || isNaN(shelterLocation.longitude)) {
        return {
          allowed: false,
          reason: 'Koordinat shelter tidak valid',
          error: 'Invalid shelter coordinates'
        };
      }

      const maxDistance = shelterGpsConfig.max_distance_meters || 50; // Default 50 meters

      // Validate distance using gpsUtils
      const validation = validateLocationDistance(
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        shelterLocation,
        maxDistance
      );

      if (!validation.valid) {
        return {
          allowed: false,
          reason: `Anda berada ${Math.round(validation.distance)}m dari lokasi shelter. Maksimal jarak yang diizinkan ${validation.maxDistance}m.`,
          distance: validation.distance,
          maxDistance: validation.maxDistance,
          currentLocation: { 
            latitude: currentLocation.latitude, 
            longitude: currentLocation.longitude 
          },
          shelterLocation: shelterLocation
        };
      }

      // Location is valid
      return {
        allowed: true,
        reason: `Lokasi tervalidasi. Jarak Anda ${Math.round(validation.distance)}m dari shelter.`,
        distance: validation.distance,
        maxDistance: validation.maxDistance,
        currentLocation: { 
          latitude: currentLocation.latitude, 
          longitude: currentLocation.longitude 
        },
        shelterLocation: shelterLocation
      };

    } catch (error) {
      console.error('Location validation error:', error.message);
      
      // On validation error, block access for security
      return {
        allowed: false,
        reason: 'Gagal memvalidasi lokasi: ' + error.message,
        error: error.message
      };
    }
  }
}

export default GPSNavigationService;