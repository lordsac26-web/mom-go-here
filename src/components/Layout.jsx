import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Gamepad2, Settings, Star, BarChart2, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import AIChatBot from "./AIChatBot";
import PersistentAudioStream from "./PersistentAudioStream";

import MiniMusicPlayer from "./MiniMusicPlayer";
import HeaderSoundControls from "./HeaderSoundControls";

const NAV_ITEMS = [
  { to: "/", label: "🏠 Home", icon: Home },
  { to: "/games", label: "🎮 Games", icon: Gamepad2 },
  { to: "/daily", label: "⭐ Daily", icon: Star },
  { to: "/memories", label: "📔 Memories", icon: BookOpen },
  { to: "/progress", label: "📊 Progress", icon: BarChart2 },
  { to: "/settings", label: "⚙️ Settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col relative">


      {/* Persistent audio stream */}
      <PersistentAudioStream />

      {/* Top Nav — clean header with logo + music player */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/69d2319af097365cbf91e620/7fb42bc6a_momgohere.png" alt="Mom, Go Here" className="w-9 h-9 rounded-lg" />
            <span className="text-2xl font-black text-primary">Mom, Go Here</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <HeaderSoundControls />
            <MiniMusicPlayer />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-auto bg-transparent">
        <Outlet />
      </main>

      {/* AI Chat Bot */}
      <AIChatBot />

      {/* Bottom Nav Bar */}
      <nav className="bg-card border-t border-border sticky bottom-0 z-50 shadow-lg pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                location.pathname === item.to
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <span className="text-3xl">{item.label.split(" ")[0]}</span>
              <span className="text-sm font-bold">{item.label.split(" ").slice(1).join(" ")}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}