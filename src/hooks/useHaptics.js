import { useAudioStore } from '@/stores/audioStore';

/**
 * Lightweight haptic feedback via the Vibration API.
 * Falls back silently on unsupported devices.
 */
function vibrate(pattern, muteAll) {
  if (muteAll) return;
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export default function useHaptics() {
  const muteAll = useAudioStore((state) => state.muteAll);
  return {
    /** Quick light tap — card flip, button press */
    tapVibrate: () => vibrate(10, muteAll),
    /** Medium double-pulse — successful match */
    successVibrate: () => vibrate([20, 40, 20], muteAll),
    /** Strong celebratory pattern — win screen */
    winVibrate: () => vibrate([30, 50, 30, 50, 60], muteAll),
  };
}