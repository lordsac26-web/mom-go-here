const CACHE_KEY = "weather_cache";
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

export function getCachedWeather(lat, lon) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.lat !== lat || cached.lon !== lon) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

export function setCachedWeather(lat, lon, data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      lat, lon, data, timestamp: Date.now(),
    }));
  } catch {}
}