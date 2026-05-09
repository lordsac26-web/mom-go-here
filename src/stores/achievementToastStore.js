import { create } from "zustand";

// Track which achievement keys have already been toasted this session
const toastedKeys = new Set();
const majorShownKeys = new Set();

export const useAchievementToastStore = create((set) => ({
  badge: null,
  majorBadge: null,
  showBadge: (badge) => {
    if (!badge?.key || toastedKeys.has(badge.key)) return;
    toastedKeys.add(badge.key);
    set({ badge: { ...badge, _ts: Date.now() } });
  },
  clearBadge: () => set({ badge: null }),
  showMajorBadge: (badge) => {
    if (!badge?.key || majorShownKeys.has(badge.key)) return;
    majorShownKeys.add(badge.key);
    set({ majorBadge: { ...badge, _ts: Date.now() } });
  },
  clearMajorBadge: () => set({ majorBadge: null }),
}));