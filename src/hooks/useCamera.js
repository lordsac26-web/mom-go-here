import * as React from "react";
const { useRef, useState } = React;

/**
 * useCamera hook — Request camera permission and capture photos
 * Returns: { capturedImage, takPhoto, requestPermission, hasPermission, loading, error }
 */
export function useCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function requestPermission() {
    setLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
    } catch (err) {
      setError(err.message || 'Camera permission denied');
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }

  function takePhoto() {
    if (!videoRef.current || !canvasRef.current) return null;
    const ctx = canvasRef.current.getContext('2d');
    const video = videoRef.current;
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = canvasRef.current.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageData);
    return imageData;
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setHasPermission(false);
  }

  return {
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
  };
}