import { useState } from 'react';
import { Camera, MapPin } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useLocation } from '@/hooks/useLocation';

export default function PermissionsPanel({ onLocationChange, onPhotoCapture }) {
  const { requestLocation, hasPermission: hasLocationPerm, loading: locLoading, error: locError, city, location } = useLocation();
  const { requestPermission: requestCamera, hasPermission: hasCameraPerm, loading: camLoading, error: camError, takePhoto, videoRef, canvasRef, stopCamera } = useCamera();
  const [showCamera, setShowCamera] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  async function handleLocation() {
    await requestLocation();
    if (location && city) {
      onLocationChange?.({ latitude: location.latitude, longitude: location.longitude, city });
    }
  }

  function handleTakePhoto() {
    const image = takePhoto();
    if (image) {
      setPhotoPreview(image);
      onPhotoCapture?.(image);
      stopCamera();
      setShowCamera(false);
    }
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

      {/* Camera */}
      <div className="bg-secondary rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-foreground flex items-center gap-2">
              <Camera size={20} /> Camera
            </p>
            <p className="text-sm text-muted-foreground">For profile photos & memories</p>
          </div>
          <button
            onClick={() => {
              if (!hasCameraPerm) {
                requestCamera().then(() => setShowCamera(true));
              } else {
                setShowCamera(!showCamera);
              }
            }}
            disabled={camLoading}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
              hasCameraPerm
                ? 'bg-green-600 text-white'
                : 'bg-primary text-primary-foreground'
            } disabled:opacity-50`}
          >
            {camLoading ? '⏳...' : hasCameraPerm ? (showCamera ? '🔴 Using' : '✅ Granted') : 'Allow'}
          </button>
        </div>
        {camError && <p className="text-sm text-red-500">{camError}</p>}

        {/* Camera Preview */}
        {showCamera && hasCameraPerm && (
          <div className="space-y-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black object-cover"
              style={{ height: 'auto', maxHeight: '400px', aspectRatio: '4/3' }}
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <button
                onClick={handleTakePhoto}
                className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg"
              >
                📸 Capture
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                className="flex-1 bg-muted text-foreground font-bold py-3 rounded-lg"
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {photoPreview && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-green-500">✅ Photo captured!</p>
            <img src={photoPreview} alt="Captured" className="w-full rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}