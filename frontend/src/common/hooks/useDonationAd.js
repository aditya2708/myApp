import { useCallback, useEffect, useRef, useState } from 'react';

const DONATION_AD_ENDPOINT = 'https://home.kilauindonesia.org/api/iklandonasi';
const REQUEST_TIMEOUT = 30000;
const FALLBACK_ASPECT_RATIO = 16 / 9;

const parseAspectRatio = (ad) => {
  if (!ad) {
    return FALLBACK_ASPECT_RATIO;
  }

  const aspectRatioCandidates = [
    ad.imageAspectRatio,
    ad.image_aspect_ratio,
    ad.aspect_ratio,
    ad.ratio,
  ];

  for (const candidate of aspectRatioCandidates) {
    const value =
      typeof candidate === 'string' ? parseFloat(candidate) : candidate;

    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return FALLBACK_ASPECT_RATIO;
};

export const useDonationAd = () => {
  const [ad, setAd] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const dismissedRef = useRef(false);

  const cleanupController = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const fetchDonationAd = useCallback(async () => {
    cleanupController();

    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);

    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(DONATION_AD_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Donation ads response:', result);

      const ads = Array.isArray(result?.data) ? result.data : [];
      console.log('Donation ads data:', ads);

      const activeAd = ads.find((item) => item?.status === '1');
      console.log('Active donation ad:', activeAd);

      const normalizedAd =
        activeAd != null
          ? { ...activeAd, imageAspectRatio: parseAspectRatio(activeAd) }
          : null;

      setAd(normalizedAd);
      setVisible(Boolean(normalizedAd) && !dismissedRef.current);
      setError(null);
    } catch (err) {
      if (err?.name === 'AbortError') {
        console.log('Donation ads request aborted.');
      } else {
        console.error('Donation ads request failed:', err);
        try {
          const errorResponse = await err.response?.text?.();
          if (errorResponse) {
            console.log('Error response:', errorResponse);
          }
        } catch (parseError) {
          console.error('Failed to parse donation ads error response:', parseError);
        }
        setError(err?.message || 'Failed to load donation advertisement.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      setIsLoading(false);
    }
  }, [cleanupController]);

  useEffect(() => {
    fetchDonationAd();

    return () => {
      cleanupController();
    };
  }, [cleanupController, fetchDonationAd]);

  const showAd = useCallback(() => {
    dismissedRef.current = false;
    setVisible((currentVisible) => currentVisible || Boolean(ad));
  }, [ad]);

  const dismissAd = useCallback(() => {
    dismissedRef.current = true;
    setVisible(false);
  }, []);

  const markActionTaken = useCallback(() => {
    dismissedRef.current = true;
    setVisible(false);
  }, []);

  const refreshAd = useCallback(() => {
    return fetchDonationAd();
  }, [fetchDonationAd]);

  return {
    ad,
    visible,
    isLoading,
    error,
    showAd,
    dismissAd,
    markActionTaken,
    refreshAd,
  };
};

export default useDonationAd;
