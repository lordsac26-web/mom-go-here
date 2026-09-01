import { create } from "zustand";

/**
 * Tab History Store
 *
 * Remembers the last URL visited within each of the 4 main bottom tabs.
 * When a tab is clicked:
 *   - If it's a different tab → navigate to lastVisited[tab] (or root)
 *   - If it's the already-active tab → reset to tab root
 */

const TAB_ROOTS = ["/", "/games", "/daily", "/profile"];

export const useTabHistoryStore = create((set, get) => ({
  // Map of tab root → last visited path within that tab
  lastVisited: {
    "/": "/",
    "/games": "/games",
    "/daily": "/daily",
    "/profile": "/profile",
  },

  // Track which tab is currently active
  activeTab: "/",

  // Call this on every location change to record the path
  recordVisit: (pathname) => {
    // Find which tab this path belongs to
    const tab = getTabForPath(pathname);
    if (!tab) return; // sub-page outside tab system — don't track

    set((state) => ({
      lastVisited: { ...state.lastVisited, [tab]: pathname },
      activeTab: tab,
    }));
  },

  // Get the target path when a tab is clicked
  getTabTarget: (tabRoot) => {
    const state = get();
    const isActive = state.activeTab === tabRoot;
    if (isActive) return tabRoot; // reset to root
    return state.lastVisited[tabRoot] || tabRoot;
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
}));

/**
 * Given a pathname, determine which tab "owns" it.
 * - Exact match on a root → that tab
 * - /games/* → /games tab
 * - Supporting pages map to Games, Daily, Profile, or Home
 * - Unknown → null
 */
export function getTabForPath(pathname) {
  // Exact root match first
  if (TAB_ROOTS.includes(pathname)) return pathname;

  if (pathname.startsWith("/games/") || ["/rankings", "/shop", "/gallery"].includes(pathname)) return "/games";
  if (["/scripture", "/daily-challenge"].includes(pathname)) return "/daily";
  if (["/memories", "/progress", "/settings", "/contacts", "/achievements"].includes(pathname)) return "/profile";
  if (pathname === "/onboarding") return "/";

  return null;
}

export { TAB_ROOTS };