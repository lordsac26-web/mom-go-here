import { create } from 'zustand';

/** Tracks the current game session and consecutive wins. */

export const useGameActivityStore = create((set, get) => ({
  // State
  currentStreak: 0,
  sessionStartTime: null,
  totalSessionMinutes: 0,
  lastReminderMinute: 0,

  // Start a play session (called when entering a game)
  startSession: () => {
    const state = get();
    if (!state.sessionStartTime) {
      set({ sessionStartTime: Date.now() });
    }
  },

  // Record a game win
  recordWin: () => {
    set({ currentStreak: get().currentStreak + 1 });
  },

  // Record a game loss (resets streak)
  recordLoss: () => {
    set({ currentStreak: 0 });
  },

  checkPlayTime: () => {
    const state = get();
    if (!state.sessionStartTime) return;
    set({ totalSessionMinutes: Math.floor((Date.now() - state.sessionStartTime) / 60000) });
  },

  // Reset session (e.g. on logout)
  resetSession: () => set({
    currentStreak: 0,
    sessionStartTime: null,
    totalSessionMinutes: 0,
    lastReminderMinute: 0,
  }),
}));