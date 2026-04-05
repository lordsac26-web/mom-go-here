import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Home, Gamepad2, Settings, Menu, X, Star, BarChart2, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import AIChatBot from "./AIChatBot";
import AmbientMusicPlayer from "./AmbientMusicPlayer";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const menuRef = useRef(null);
  const menuItemsRef = useRef([]);

  const navItems = [
    { to: "/", label: "🏠 Home", icon: Home },
    { to: "/games", label: "🎮 Games", icon: Gamepad2 },
    { to: "/daily", label: "⭐ Daily", icon: Star },
    { to: "/memories", label: "📔 Memories", icon: BookOpen },
    { to: "/progress", label: "📊 Progress", icon: BarChart2 },
    { to: "/settings", label: "⚙️ Settings", icon: Settings },
  ];

  // GSAP Scroll Reveal Animation
  useEffect(() => {
    if (menuOpen && menuRef.current && menuItemsRef.current.length > 0) {
      // Kill any existing animations
      gsap.killTweensOf(menuItemsRef.current);
      
      // Animate menu items with staggered entrance
      gsap.fromTo(
        menuItemsRef.current,
        {
          opacity: 0,
          y: -20,
          x: -30,
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
        }
      );
    }
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient Music */}
      <AmbientMusicPlayer />

      {/* Top Nav */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl">🌸</span>
            <span className="text-2xl font-black text-primary">Mom, Go Here</span>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-primary text-primary-foreground rounded-xl p-3 shadow-lg"
            aria-label="Menu"
          >
            {menuOpen ? <X size={32} /> : <Menu size={32} />}
          </button>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div ref={menuRef} className="bg-card border-t border-border shadow-xl">
            {navItems.map((item, idx) => (
              <Link
                key={item.to}
                ref={(el) => {
                  if (el) menuItemsRef.current[idx] = el;
                }}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-4 px-6 py-5 text-2xl font-bold border-b border-border transition-colors ${
                  location.pathname === item.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <div
                ref={(el) => {
                  if (el) menuItemsRef.current[navItems.length] = el;
                }}
                className="px-6 py-4 text-muted-foreground text-lg border-t border-border"
              >
                👤 {user.full_name || user.email}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* AI Chat Bot */}
      <AIChatBot />

      {/* Bottom Nav Bar */}
      <nav className="bg-card border-t border-border sticky bottom-0 z-50 shadow-lg pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
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