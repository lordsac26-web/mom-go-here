import { create } from "zustand";

export const useAchievementToastStore = create((set) => ({
  badge: null,
  showBadge: (badge) => set({ badge }),
  clearBadge: () => set({ badge: null }),
}));