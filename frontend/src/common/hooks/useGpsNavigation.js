import { useState, useCallback } from 'react';
import { GPSNavigationService } from '../services/gpsNavigationService';

export const useGpsNavigation = () => {
  const [isCheckingGps, setIsCheckingGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const checkGpsAndNavigate = useCallback(async (navigationCallback, activityId, activityType, shelterGpsConfig) => {
    try {
      setIsCheckingGps(true);
      setGpsError(null);

      // Check GPS requirement for this activity
      const gpsCheck = await GPSNavigationService.checkGPSRequirementForActivity(
        activityId,
        activityType,
        shelterGpsConfig
      );

      if (gpsCheck.allowed) {
        // GPS check passed or hanya peringatan jarak; tetap lanjut
        if (gpsCheck.flagged) {
          console.warn('GPS check flagged:', gpsCheck.reason);
          setGpsError(gpsCheck);
        }
        if (navigationCallback) {
          navigationCallback();
        }
        return;
      }

      // GPS check failed karena izin/perangkat, tampilkan modal
      setGpsError(gpsCheck);
      showGpsRequiredModal(gpsCheck, navigationCallback, activityId, activityType, shelterGpsConfig);

    } catch (error) {
      console.error('GPS navigation check error:', error.message);
      
      setGpsError({ 
        allowed: false, 
        reason: 'GPS check error: ' + error.message,
        error: error.message 
      });
      
      // On error, still allow navigation but log the issue
      if (navigationCallback) {
        navigationCallback();
      }
    } finally {
      setIsCheckingGps(false);
    }
  }, []);

  const showGpsRequiredModal = useCallback((gpsCheck, navigationCallback, activityId, activityType, shelterGpsConfig) => {
    const onRetry = async () => {
      // Try to request permission if it's a permission issue
      if (!gpsCheck.gpsStatus?.permissionGranted) {
        const permissionResult = await GPSNavigationService.requestGPSPermissionIfNeeded();
      }
      
      // Retry the entire check
      await checkGpsAndNavigate(navigationCallback, activityId, activityType, shelterGpsConfig);
    };

    const onCancel = () => {
      setGpsError(null);
    };

    GPSNavigationService.showGPSRequiredModal(
      gpsCheck.reason,
      gpsCheck.gpsStatus,
      onRetry,
      onCancel,
      gpsCheck.locationValidation,
      () => {
        setGpsError(null);
        if (navigationCallback) {
          navigationCallback();
        }
      }
    );
  }, [checkGpsAndNavigate]);

  const clearGpsError = useCallback(() => {
    setGpsError(null);
  }, []);

  return {
    checkGpsAndNavigate,
    isCheckingGps,
    gpsError,
    clearGpsError
  };
};

export default useGpsNavigation;
