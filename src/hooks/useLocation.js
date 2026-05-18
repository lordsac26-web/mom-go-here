import * as React from "react";
const { useReducer, useCallback } = React;

/**
 * useLocation hook — Request geolocation and get user coordinates.
 * Uses useReducer instead of multiple useState calls to avoid null-dispatcher
 * crashes from the SDK's bundled React chunk.
 */

function reducer(state, action) {
  switch (action.type) {
    case "set_location": return { ...state, location: action.location, hasPermission: true };
    case "set_city": return { ...state, city: action.city };
    case "loading": return { ...state, loading: true, error: null };
    case "error": return { ...state, loading: false, error: action.error, hasPermission: false };
    case "done": return { ...state, loading: false };
    default: return state;
  }
}

export function useLocation(savedLocation) {
  const [state, dispatch] = useReducer(reducer, {
    location: savedLocation?.latitude && savedLocation?.longitude
      ? { latitude: savedLocation.latitude, longitude: savedLocation.longitude }
      : null,
    city: savedLocation?.city || null,
    hasPermission: !!(savedLocation?.latitude && savedLocation?.longitude),
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(async () => {
    dispatch({ type: "loading" });
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 3600000,
        });
      });

      const { latitude, longitude } = position.coords;
      dispatch({ type: "set_location", location: { latitude, longitude } });

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();
        const place = data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet || data.address?.county || 'Unknown';
        const stateName = data.address?.state || '';
        const cityName = stateName ? `${place}, ${stateName}` : place;
        dispatch({ type: "set_city", city: cityName });
      } catch (_) {
        // Reverse geocoding failed — coords still saved
      }
    } catch (err) {
      dispatch({ type: "error", error: err.message || 'Location permission denied' });
    } finally {
      dispatch({ type: "done" });
    }
  }, []);

  return {
    location: state.location,
    city: state.city,
    requestLocation,
    hasPermission: state.hasPermission,
    loading: state.loading,
    error: state.error,
  };
}