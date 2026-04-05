import { useAudioStore } from '@/stores/audioStore';

/**
 * Lightweight haptic feedback via the Vibration API.
 * Falls back silently on unsupported devices.
 */
function vibrate(pattern, muteAll) {
  if (muteAll) return;
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('Vibration API error:', e);
    }
  }
}

export default function useHaptics() {
  const muteAll = useAudioStore((state) => state.muteAll);
  return {
    // Lightweight interactions
    tapVibrate: () => vibrate(40, muteAll),
    buttonClick: () => vibrate(30, muteAll),
    
    // Game actions
    matchVibrate: () => vibrate([30, 30, 30], muteAll),
    moveMade: () => vibrate([20, 30, 20], muteAll),
    invalidMove: () => vibrate([50, 100, 50], muteAll),
    pieceJumped: () => vibrate([40, 20, 40], muteAll),
    
    // Scoring milestones
    scoreHit: () => vibrate([50, 30, 50, 30, 50], muteAll),
    scoreMilestone: () => vibrate([60, 40, 60, 40, 60], muteAll),
    bonusPoints: () => vibrate([50, 50, 100], muteAll),
    
    // Major events
    successVibrate: () => vibrate([20, 40, 20], muteAll),
    levelComplete: () => vibrate([100, 30, 100], muteAll),
    winVibrate: () => vibrate([100, 50, 100, 50, 200], muteAll),
    lossVibrate: () => vibrate([200, 100, 200], muteAll),
  };
}