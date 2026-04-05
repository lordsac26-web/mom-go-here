import { useState, useCallback } from 'react';

/**
 * useLocation hook — Request geolocation and get user coordinates
 * Returns: { location, requestLocation, hasPermission, loading, error, city }
 */
export function useLocation(savedLocation) {
  const [location, setLocation] = useState(
    savedLocation?.latitude && savedLocation?.longitude
      ? { latitude: savedLocation.latitude, longitude: savedLocation.longitude }
      : null
  );
  const [city, setCity] = useState(savedLocation?.city || null);
  const [hasPermission, setHasPermission] = useState(
    !!(savedLocation?.latitude && savedLocation?.longitude)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 3600000, // Cache 1 hour
        });
      });

      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });
      setHasPermission(true);

      // Try to reverse geocode to get city name
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();
        const cityName = data.address?.city || data.address?.town || data.address?.county || 'Unknown';
        setCity(cityName);
      } catch (e) {
        // Reverse geocoding failed, just use coordinates
      }
    } catch (err) {
      setError(err.message || 'Location permission denied');
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location,
    city,
    requestLocation,
    hasPermission,
    loading,
    error,
  };
}