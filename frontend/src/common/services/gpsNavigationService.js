import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { getCurrentLocation, validateLocationDistance } from '../utils/gpsUtils';

export class GPSNavigationService {
  static async checkGPSRequirementForActivity(activityId, activityType, shelterGpsConfig) {
    try {
      // Check if GPS is required for this activity
      const isGpsRequired = this.isGpsRequiredForActivity(activityType, shelterGpsConfig);

      if (!isGpsRequired) {
        return { allowed: true, reason: 'GPS tidak diperlukan' };
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
          // Allow navigation but flag for review when jarak di luar radius
          return {
            allowed: true,
            reason: locationValidation.reason,
            gpsStatus,
            locationValidation,
            requiresGps: true,
            flagged: true,
            flagType: 'distance_outside_radius'
          };
        }

        return {
          allowed: true,
          reason: 'GPS siap dan lokasi tervalidasi',
          locationValidation
        };
      }

      // GPS enabled but no shelter coordinates to validate against
      return { allowed: true, reason: 'GPS siap' };

    } catch (error) {
      console.error('GPS check error:', error.message);

      // On error, allow navigation but log the issue
      return {
        allowed: true,
        reason: 'Pemeriksaan GPS gagal, navigasi tetap diperbolehkan',
        error: error.message
      };
    }
  }

  static isGpsRequiredForActivity(activityType, shelterGpsConfig) {
    // GPS hanya wajib jika shelter memang mensyaratkan
    return !!shelterGpsConfig?.require_gps;
  }

  static getGpsRequirementReason(activityType, shelterGpsConfig) {
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
      return 'GPS tidak aktif. Silakan aktifkan GPS di pengaturan perangkat.';
    }
    if (!gpsStatus.permissionGranted) {
      return 'Izin lokasi diperlukan. Silakan berikan izin lokasi untuk aplikasi.';
    }
    return 'GPS tidak tersedia.';
  }

  static showGPSRequiredModal(
    reason,
    gpsStatus,
    onRetry,
    onCancel,
    locationValidation = null,
    onContinue = null
  ) {
    const title = 'GPS Diperlukan';
    
    let message = `${reason}\n\nAnda dapat mencoba ulang atau melanjutkan tanpa validasi. Jika tetap lanjut, data akan ditandai untuk review.`;
    message += '\n\nTips:\n- Pastikan GPS aktif\n- Beri izin lokasi untuk aplikasi\n- Tunggu beberapa detik jika akurasi rendah';
    
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
          text: 'Lanjutkan',
          onPress: () => {
            if (onContinue) onContinue();
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
          reason: 'Gagal mendapatkan lokasi saat ini: ' + (currentLocation.error || 'kesalahan tidak diketahui'),
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
          error: 'Koordinat shelter tidak valid'
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
