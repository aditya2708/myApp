import { useCallback, useMemo, useState } from 'react';
import { getCurrentLocation, prepareGpsDataForApi } from '../utils/gpsUtils';

const DEFAULT_TTL = 60 * 1000; // 60 seconds cache

export const useLocationCapture = ({ ttl = DEFAULT_TTL, config } = {}) => {
  const [state, setState] = useState({
    capturing: false,
    data: null,
    raw: null,
    error: null,
    lastCapturedAt: null,
  });

  const captureLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, capturing: true, error: null }));

    try {
      const location = await getCurrentLocation(config);

      if (!location.success) {
        throw new Error(location.error || 'Gagal mendapatkan lokasi.');
      }

      const gpsData = prepareGpsDataForApi(location);

      setState({
        capturing: false,
        data: gpsData,
        raw: location,
        error: null,
        lastCapturedAt: Date.now(),
      });

      return { success: true, gpsData, raw: location };
    } catch (error) {
      const message =
        error?.message || 'Tidak dapat mengambil lokasi. Periksa GPS dan coba lagi.';
      // Jangan hilangkan data lama jika ada; tetap simpan error untuk UI
      setState((prev) => ({
        capturing: false,
        data: prev.data,
        raw: prev.raw,
        error: message,
        lastCapturedAt: prev.lastCapturedAt,
      }));

      return { success: false, error: message };
    }
  }, [config]);

  const isStale = useMemo(() => {
    if (!state.data || !state.lastCapturedAt) {
      return true;
    }
    return Date.now() - state.lastCapturedAt > ttl;
  }, [state.data, state.lastCapturedAt, ttl]);

  const ensureFreshLocation = useCallback(async () => {
    if (state.data && !isStale) {
      return { success: true, gpsData: state.data, raw: state.raw };
    }

    return captureLocation();
  }, [captureLocation, isStale, state.data, state.raw]);

  const resetLocation = useCallback(() => {
    setState({
      capturing: false,
      data: null,
      raw: null,
      error: null,
      lastCapturedAt: null,
    });
  }, []);

  return {
    data: state.data,
    raw: state.raw,
    capturing: state.capturing,
    error: state.error,
    lastCapturedAt: state.lastCapturedAt,
    isStale,
    hasLocation: Boolean(state.data) && !isStale,
    captureLocation,
    ensureFreshLocation,
    resetLocation,
    ttl,
  };
};

export default useLocationCapture;
