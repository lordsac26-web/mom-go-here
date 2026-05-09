import { useRef, useEffect, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Gamepad2, Settings, Star, BarChart2, BookOpen, ChevronLeft } from "lucide-react";
import { useTabHistoryStore, TAB_ROOTS, getTabForPath } from "../stores/tabHistoryStore";
import { useAuth } from "@/lib/AuthContext";
import AIChatBot from "./AIChatBot";
import GameActivityMonitor from "./GameActivityMonitor";
import PersistentAudioStream from "./PersistentAudioStream";
import useHaptics from "../hooks/useHaptics";

import MiniMusicPlayer from "./MiniMusicPlayer";
import HeaderSoundControls from "./HeaderSoundControls";
import AchievementUnlockToast from "./AchievementUnlockToast";
import MajorAchievementModal from "./achievements/MajorAchievementModal";
import { useAchievementToastStore } from "@/stores/achievementToastStore";
import OfflineBanner from "./OfflineBanner";
import useSyncQueue from "../hooks/useSyncQueue";

const NAV_ITEMS = [
  { to: "/", label: "🏠 Home", icon: Home },
  { to: "/games", label: "🎮 Games", icon: Gamepad2 },
  { to: "/daily", label: "⭐ Daily", icon: Star },
  { to: "/memories", label: "📔 Memories", icon: BookOpen },
  { to: "/progress", label: "📊 Progress", icon: BarChart2 },
  { to: "/settings", label: "⚙️ Settings", icon: Settings },
];



// Tabs whose scroll position we preserve
const SCROLL_TABS = ["/", "/games", "/daily", "/memories", "/progress", "/settings"];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tapVibrate } = useHaptics();
  const mainRef = useRef(null);
  const scrollMap = useRef({});

  // Tab history management
  const { recordVisit, getTabTarget, activeTab } = useTabHistoryStore();

  // Record every navigation
  useEffect(() => {
    recordVisit(location.pathname);
  }, [location.pathname, recordVisit]);

  // Whether current page is a sub-page (not a tab root)
  const isSubPage = !TAB_ROOTS.includes(location.pathname);
  const currentTab = getTabForPath(location.pathname);

  const handleTabClick = useCallback((e, tabRoot) => {
    e.preventDefault();
    tapVibrate();
    const target = getTabTarget(tabRoot);
    navigate(target);
  }, [getTabTarget, navigate, tapVibrate]);

  // Save scroll position when leaving a main tab
  useEffect(() => {
    const mainEl = mainRef.current;
    return () => {
      if (mainEl && TAB_ROOTS.includes(location.pathname)) {
        scrollMap.current[location.pathname] = mainEl.scrollTop;
      }
    };
  }, [location.pathname]);

  // Restore scroll position when arriving at a main tab
  useEffect(() => {
    const mainEl = mainRef.current;
    if (mainEl && TAB_ROOTS.includes(location.pathname)) {
      mainEl.scrollTop = scrollMap.current[location.pathname] || 0;
    }
  }, [location.pathname]);

  const achievementBadge = useAchievementToastStore((s) => s.badge);

  // Wire up background sync queue — flushes pending offline operations when reconnected
  useSyncQueue();

  return (
    <div className="min-h-screen bg-background flex flex-col relative">


      {/* Offline indicator */}
      <OfflineBanner />

      {/* Persistent audio stream */}
      <PersistentAudioStream />

      {/* Top Nav — clean header with logo + music player */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-lg nav-no-select">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            {isSubPage && (
              <button
                onClick={() => navigate(currentTab || "/")}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-secondary active:scale-95 transition-transform"
                aria-label="Go back"
              >
                <ChevronLeft size={22} className="text-foreground" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 min-h-[44px]">
              <img src="https://media.base44.com/images/public/69d2319af097365cbf91e620/7fb42bc6a_momgohere.png" alt="Mom, Go Here" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg" loading="eager" width="36" height="36" />
              <span className="text-xl sm:text-2xl font-black text-primary">Mom, Go Here</span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <HeaderSoundControls />
            <MiniMusicPlayer />
          </div>
        </div>
      </header>

      {/* Page Content — preserve scroll per tab */}
      <main ref={mainRef} className="flex-1 overflow-auto bg-transparent">
        <div className="max-w-4xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Game Activity Monitor (invisible) */}
      <GameActivityMonitor />

      {/* Achievement Toast */}
      <AchievementUnlockToast achievement={achievementBadge} />

      {/* Major Achievement Full-Screen Celebration */}
      <MajorAchievementModal />

      {/* AI Chat Bot */}
      <AIChatBot />

      {/* Bottom Nav Bar */}
      <nav className="bg-card border-t border-border sticky bottom-0 z-50 shadow-lg pb-[env(safe-area-inset-bottom)] nav-no-select">
        <div className="flex justify-around items-center py-1 sm:py-1.5 max-w-4xl mx-auto">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.to}
              href={item.to}
              onClick={(e) => handleTabClick(e, item.to)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] px-2 sm:px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === item.to
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <span className="text-2xl sm:text-3xl leading-none">{item.label.split(" ")[0]}</span>
              <span className="text-xs sm:text-sm font-bold leading-tight">{item.label.split(" ").slice(1).join(" ")}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}