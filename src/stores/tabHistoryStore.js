import { create } from "zustand";

/**
 * Tab History Store
 *
 * Remembers the last URL visited within each of the 6 main bottom tabs.
 * When a tab is clicked:
 *   - If it's a different tab → navigate to lastVisited[tab] (or root)
 *   - If it's the already-active tab → reset to tab root
 */

const TAB_ROOTS = ["/", "/games", "/daily", "/memories", "/progress", "/settings"];

export const useTabHistoryStore = create((set, get) => ({
  // Map of tab root → last visited path within that tab
  lastVisited: {
    "/": "/",
    "/games": "/games",
    "/daily": "/daily",
    "/memories": "/memories",
    "/progress": "/progress",
    "/settings": "/settings",
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
 * - /rankings, /achievements, /contacts, /scripture, /daily-challenge, /onboarding → / (Home tab)
 * - Unknown → null
 */
export function getTabForPath(pathname) {
  // Exact root match first
  if (TAB_ROOTS.includes(pathname)) return pathname;

  // /games sub-routes
  if (pathname.startsWith("/games/")) return "/games";

  // Sub-pages under Home
  const homeSubPages = ["/rankings", "/achievements", "/contacts", "/scripture", "/daily-challenge", "/onboarding", "/shop", "/gallery"];
  if (homeSubPages.some(p => pathname === p || pathname.startsWith(p + "/"))) return "/";

  return null;
}

export { TAB_ROOTS };