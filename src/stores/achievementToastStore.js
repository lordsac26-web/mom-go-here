import { create } from "zustand";

// Track which achievement keys have already been toasted this session
const toastedKeys = new Set();

export const useAchievementToastStore = create((set) => ({
  badge: null,
  showBadge: (badge) => {
    if (!badge?.key || toastedKeys.has(badge.key)) return;
    toastedKeys.add(badge.key);
    set({ badge: { ...badge, _ts: Date.now() } });
  },
  clearBadge: () => set({ badge: null }),
}));