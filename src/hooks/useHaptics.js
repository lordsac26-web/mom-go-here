/**
 * Lightweight haptic feedback via the Vibration API.
 * Falls back silently on unsupported devices.
 * 
 * Exported as a plain object (not a hook) to avoid React dispatcher issues.
 */
function isMuted() {
  try {
    const stored = localStorage.getItem('momgohere-audio');
    if (stored) return JSON.parse(stored)?.state?.muteAll === true;
  } catch {}
  return false;
}

function vibrate(pattern) {
  if (isMuted()) return;
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // silently ignore
    }
  }
}

const haptics = {
  // Lightweight interactions
  tapVibrate: () => vibrate(40),
  buttonClick: () => vibrate(30),

  // Game actions
  matchVibrate: () => vibrate([30, 30, 30]),
  moveMade: () => vibrate([20, 30, 20]),
  invalidMove: () => vibrate([50, 100, 50]),
  pieceJumped: () => vibrate([40, 20, 40]),

  // Scoring milestones
  scoreHit: () => vibrate([50, 30, 50, 30, 50]),
  scoreMilestone: () => vibrate([60, 40, 60, 40, 60]),
  bonusPoints: () => vibrate([50, 50, 100]),

  // Major events
  successVibrate: () => vibrate([20, 40, 20]),
  levelComplete: () => vibrate([100, 30, 100]),
  winVibrate: () => vibrate([100, 50, 100, 50, 200]),
  lossVibrate: () => vibrate([200, 100, 200]),
};

// Export as a hook for backward compatibility with existing callers,
// but return the plain object — no React hooks called inside.
export default function useHaptics() {
  return haptics;
}