import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

export default function PermissionsPanel({ onLocationChange, savedLocation }) {
  const { requestLocation, hasPermission: hasLocationPerm, loading: locLoading, error: locError, city, location } = useLocation(savedLocation);

  // When location or city changes, propagate up
  useEffect(() => {
    if (location && city) {
      onLocationChange?.({ latitude: location.latitude, longitude: location.longitude, city });
    }
  }, [location, city]);

  async function handleLocation() {
    await requestLocation();
  }



  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-4">
      <h2 className="text-3xl font-black text-primary">📍 Permissions & Privacy</h2>
      <p className="text-muted-foreground text-lg">Grant access to enhance your experience</p>

      {/* Location */}
      <div className="bg-secondary rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-foreground flex items-center gap-2">
              <MapPin size={20} /> Your Location
            </p>
            <p className="text-sm text-muted-foreground">Used for history facts, news, and chat context</p>
          </div>
          <button
            onClick={handleLocation}
            disabled={locLoading || hasLocationPerm}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
              hasLocationPerm
                ? 'bg-green-600 text-white'
                : 'bg-primary text-primary-foreground'
            } disabled:opacity-50`}
          >
            {locLoading ? '⏳...' : hasLocationPerm ? '✅ Granted' : 'Allow'}
          </button>
        </div>
        {hasLocationPerm && city && (
          <p className="text-sm text-green-500 font-semibold">📍 Location: {city}</p>
        )}
        {locError && <p className="text-sm text-red-500">{locError}</p>}
      </div>

    </div>
  );
}