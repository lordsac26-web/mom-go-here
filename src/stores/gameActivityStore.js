import { create } from 'zustand';

/**
 * Tracks game activity for the AI chatbot to react to.
 * - Win streaks trigger congratulatory notifications
 * - Extended play time triggers hydration/movement reminders
 */

const STREAK_THRESHOLDS = [3, 5, 7, 10];
const PLAY_TIME_REMINDER_MINUTES = 30; // remind every 30 min of continuous play

const STREAK_MESSAGES = [
  "🔥 Wow, you're on a {streak}-win streak! You're on fire today! Keep it up, superstar! 🌟",
  "🎉 {streak} wins in a row — amazing! You've really got the touch today!",
  "⭐ Incredible! {streak} straight wins! I'm so proud of you! 🏆",
  "💪 {streak} victories and counting! You're unstoppable! 🎊",
];

const WELLNESS_MESSAGES = [
  "💧 Hey friend! You've been playing for a while — how about a nice glass of water? Staying hydrated keeps that sharp mind going! 🧠",
  "🍎 Time for a little break! Maybe grab a healthy snack — you've earned it after all that fun! 😊",
  "🚶 You've been gaming for a bit — how about standing up and stretching? A quick walk around the room does wonders! 💪",
  "☀️ Just a gentle reminder to take a breather! Rest your eyes, have some water, and maybe step outside for a minute. You deserve it! 🌸",
];

export const useGameActivityStore = create((set, get) => ({
  // State
  currentStreak: 0,
  sessionStartTime: null,
  totalSessionMinutes: 0,
  lastReminderMinute: 0,
  pendingMessages: [],
  unreadCount: 0,

  // Start a play session (called when entering a game)
  startSession: () => {
    const state = get();
    if (!state.sessionStartTime) {
      set({ sessionStartTime: Date.now() });
    }
  },

  // Record a game win
  recordWin: (gameName) => {
    const state = get();
    const newStreak = state.currentStreak + 1;
    const updates = { currentStreak: newStreak };

    // Check if we hit a streak threshold
    if (STREAK_THRESHOLDS.includes(newStreak)) {
      const template = STREAK_MESSAGES[Math.floor(Math.random() * STREAK_MESSAGES.length)];
      const msg = template.replace('{streak}', newStreak);
      updates.pendingMessages = [...state.pendingMessages, { type: 'streak', text: msg, timestamp: Date.now() }];
      updates.unreadCount = state.unreadCount + 1;
    }

    set(updates);
  },

  // Record a game loss (resets streak)
  recordLoss: () => {
    set({ currentStreak: 0 });
  },

  // Check play time and add wellness reminders
  checkPlayTime: () => {
    const state = get();
    if (!state.sessionStartTime) return;

    const minutesPlayed = Math.floor((Date.now() - state.sessionStartTime) / 60000);
    const reminderInterval = PLAY_TIME_REMINDER_MINUTES;

    // Check if we've crossed a new reminder threshold
    if (minutesPlayed >= reminderInterval && minutesPlayed - state.lastReminderMinute >= reminderInterval) {
      const msg = WELLNESS_MESSAGES[Math.floor(Math.random() * WELLNESS_MESSAGES.length)];
      set({
        lastReminderMinute: minutesPlayed,
        totalSessionMinutes: minutesPlayed,
        pendingMessages: [...get().pendingMessages, { type: 'wellness', text: msg, timestamp: Date.now() }],
        unreadCount: get().unreadCount + 1,
      });
    } else {
      set({ totalSessionMinutes: minutesPlayed });
    }
  },

  // Consume all pending messages (when chat opens)
  consumeMessages: () => {
    const msgs = get().pendingMessages;
    set({ pendingMessages: [], unreadCount: 0 });
    return msgs;
  },

  // Clear unread count (when chat is already open)
  clearUnread: () => set({ unreadCount: 0 }),

  // Reset session (e.g. on logout)
  resetSession: () => set({
    currentStreak: 0,
    sessionStartTime: null,
    totalSessionMinutes: 0,
    lastReminderMinute: 0,
    pendingMessages: [],
    unreadCount: 0,
  }),
}));