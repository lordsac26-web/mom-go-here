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
      // silently ignore
    }
  }
}

// Read muteAll at call time from Zustand store directly (avoids hook dispatcher issues)
function getMuteAll() {
  return useAudioStore.getState().muteAll;
}

export default function useHaptics() {
  return {
    // Lightweight interactions
    tapVibrate: () => vibrate(40, getMuteAll()),
    buttonClick: () => vibrate(30, getMuteAll()),

    // Game actions
    matchVibrate: () => vibrate([30, 30, 30], getMuteAll()),
    moveMade: () => vibrate([20, 30, 20], getMuteAll()),
    invalidMove: () => vibrate([50, 100, 50], getMuteAll()),
    pieceJumped: () => vibrate([40, 20, 40], getMuteAll()),

    // Scoring milestones
    scoreHit: () => vibrate([50, 30, 50, 30, 50], getMuteAll()),
    scoreMilestone: () => vibrate([60, 40, 60, 40, 60], getMuteAll()),
    bonusPoints: () => vibrate([50, 50, 100], getMuteAll()),

    // Major events
    successVibrate: () => vibrate([20, 40, 20], getMuteAll()),
    levelComplete: () => vibrate([100, 30, 100], getMuteAll()),
    winVibrate: () => vibrate([100, 50, 100, 50, 200], getMuteAll()),
    lossVibrate: () => vibrate([200, 100, 200], getMuteAll()),
  };
}