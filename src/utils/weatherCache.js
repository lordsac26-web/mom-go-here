import offlineCache from "../lib/offlineCache";

const CACHE_KEY = "weather_cache";
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

export async function getCachedWeather(lat, lon) {
  try {
    const cached = await offlineCache.get(offlineCache.STORES.generic, CACHE_KEY);
    if (!cached) return null;
    if (cached.lat !== lat || cached.lon !== lon) return null;
    // When offline, ignore TTL so we always show something
    if (navigator.onLine && Date.now() - cached.timestamp > CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

export async function setCachedWeather(lat, lon, data) {
  offlineCache.set(offlineCache.STORES.generic, CACHE_KEY, {
    lat, lon, data, timestamp: Date.now(),
  });
}