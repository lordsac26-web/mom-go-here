/**
 * Lightweight haptic feedback via the Vibration API.
 * Falls back silently on unsupported devices.
 */
function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export default function useHaptics() {
  return {
    /** Quick light tap — card flip, button press */
    tapVibrate: () => vibrate(10),
    /** Medium double-pulse — successful match */
    successVibrate: () => vibrate([20, 40, 20]),
    /** Strong celebratory pattern — win screen */
    winVibrate: () => vibrate([30, 50, 30, 50, 60]),
  };
}