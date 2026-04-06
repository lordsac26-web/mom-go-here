import { useEffect, useCallback } from "react";
import { useCamera } from "../hooks/useCamera";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, SwitchCamera, RotateCcw } from "lucide-react";

export default function CameraCapture({ open, onCapture, onClose }) {
  const {
    videoRef,
    canvasRef,
    capturedImage,
    setCapturedImage,
    takePhoto,
    requestPermission,
    stopCamera,
    hasPermission,
    loading,
    error,
  } = useCamera();

  useEffect(() => {
    if (open) {
      requestPermission();
    }
    return () => {
      stopCamera();
      setCapturedImage(null);
    };
  }, [open]);

  const handleCapture = useCallback(() => {
    const img = takePhoto();
    if (img) {
      // Keep preview showing — user can confirm or retake
    }
  }, [takePhoto]);

  const handleConfirm = useCallback(() => {
    if (!capturedImage) return;
    // Convert data URL to File for upload
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file, capturedImage);
        stopCamera();
        setCapturedImage(null);
      });
  }, [capturedImage, onCapture, stopCamera, setCapturedImage]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
  }, [setCapturedImage]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] bg-black flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
          <button onClick={() => { stopCamera(); setCapturedImage(null); onClose(); }} className="p-2 rounded-full bg-white/10">
            <X size={24} className="text-white" />
          </button>
          <span className="text-white text-lg font-bold">📷 Take a Photo</span>
          <div className="w-10" />
        </div>

        {/* Camera / Preview */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
          {loading && (
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/70 text-lg">Starting camera...</p>
            </div>
          )}

          {error && (
            <div className="text-center px-6">
              <p className="text-red-400 text-xl font-bold mb-2">Camera Unavailable</p>
              <p className="text-white/60 text-base mb-4">{error}</p>
              <button
                onClick={() => { stopCamera(); setCapturedImage(null); onClose(); }}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold"
              >
                Go Back
              </button>
            </div>
          )}

          {/* Live video feed */}
          {!capturedImage && !error && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Captured image preview */}
          {capturedImage && (
            <motion.img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
              initial={{ scale: 1.05, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="bg-black/80 px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {!capturedImage && hasPermission && !error ? (
            <div className="flex items-center justify-center">
              <motion.button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 active:bg-white/30"
                whileTap={{ scale: 0.88 }}
              >
                <div className="w-14 h-14 rounded-full bg-white" />
              </motion.button>
            </div>
          ) : capturedImage ? (
            <div className="flex items-center justify-center gap-6">
              <motion.button
                onClick={handleRetake}
                className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-lg"
                whileTap={{ scale: 0.93 }}
              >
                <RotateCcw size={20} /> Retake
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black text-lg"
                whileTap={{ scale: 0.93 }}
              >
                <Camera size={20} /> Use Photo
              </motion.button>
            </div>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}