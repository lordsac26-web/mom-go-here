import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCachedWeather, setCachedWeather } from "../utils/weatherCache";
import WidgetErrorState from "./WidgetErrorState";

const WMO_ICONS = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  56: "🌧️", 57: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  66: "🌧️", 67: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️",
  77: "❄️",
  80: "🌦️", 81: "🌧️", 82: "🌧️",
  85: "🌨️", 86: "🌨️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const WMO_LABELS = {
  0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Foggy",
  51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
  56: "Freezing Drizzle", 57: "Freezing Drizzle",
  61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
  66: "Freezing Rain", 67: "Freezing Rain",
  71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
  77: "Snow Grains",
  80: "Light Showers", 81: "Showers", 82: "Heavy Showers",
  85: "Snow Showers", 86: "Heavy Snow Showers",
  95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
};

function getIcon(code) {
  return WMO_ICONS[code] || "🌡️";
}

function getLabel(code) {
  return WMO_LABELS[code] || "Unknown";
}

function getDayLabel(dateStr, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeatherWidget({ latitude, longitude, city, refreshKey }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!latitude || !longitude) {
      setLoading(false);
      return;
    }
    fetchWeather();
  }, [latitude, longitude, refreshKey]);

  async function fetchWeather() {
    setError(false);
    // Check cache first
    const cached = await getCachedWeather(latitude, longitude);
    if (cached && !refreshKey) {
      setWeather(cached);
      setLoading(false);
      return;
    }
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&forecast_days=3&timezone=auto`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCachedWeather(latitude, longitude, data);
        setWeather(data);
      } else {
        if (cached) { setWeather(cached); }
        else { setError(true); }
      }
    } catch {
      // Network error — use stale cache
      const stale = await getCachedWeather(latitude, longitude);
      if (stale) { setWeather(stale); }
      else { setError(true); }
    }
    setLoading(false);
  }

  if (!latitude || !longitude) {
    return (
      <Link to="/settings" className="block bg-card border border-border rounded-2xl px-4 py-4 mb-4 shadow text-center">
        <p className="text-lg font-bold text-foreground">🌤️ Weather</p>
        <p className="text-muted-foreground text-base">Enable location in Settings to see your weather!</p>
      </Link>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3 mb-4 text-center animate-pulse">
        <p className="text-muted-foreground text-sm">🌤️ Loading weather...</p>
      </div>
    );
  }

  if (error && !weather) return <WidgetErrorState message="Couldn't load weather" emoji="🌤️" onRetry={fetchWeather} />;
  if (!weather) return null;

  const current = weather.current;
  const daily = weather.daily;

  return (
    <div className="bg-card border border-border rounded-2xl mb-4 shadow overflow-hidden">
      {/* Current Weather */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <span className="text-4xl">{getIcon(current.weather_code)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-black text-foreground">{Math.round(current.temperature_2m)}°F</p>
          <p className="text-sm text-muted-foreground truncate">
            {getLabel(current.weather_code)}{city ? ` · ${city}` : ""}
          </p>
        </div>
      </div>

      {/* 3-Day Forecast */}
      <div className="grid grid-cols-3 divide-x divide-border">
        {daily.time.map((date, i) => (
          <div key={date} className="flex flex-col items-center py-3 px-2">
            <p className="text-xs font-bold text-muted-foreground mb-1">{getDayLabel(date, i)}</p>
            <span className="text-2xl">{getIcon(daily.weather_code[i])}</span>
            <p className="text-sm font-bold text-foreground mt-1">
              {Math.round(daily.temperature_2m_max[i])}°
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round(daily.temperature_2m_min[i])}°
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}