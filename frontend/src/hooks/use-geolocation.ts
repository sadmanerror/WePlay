'use client';

import { useState, useEffect, useCallback } from 'react';
import { LatLng } from '../types';

export const useGeolocation = () => {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestGeolocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    requestGeolocation();
  }, [requestGeolocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      requestGeolocation();
    }, 0);
    return () => clearTimeout(timer);
  }, [requestGeolocation]);

  return { position, error, loading, retry };
};
