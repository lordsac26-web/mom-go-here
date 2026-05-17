import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Module-level refs to avoid useRef (which crashes in the Base44 SDK React context)
let _startTime = Date.now();
let _currentUser = null;

// Call this hook inside any game page to auto-track playtime
export function useGameTimer() {
  // Get user directly from auth instead of via useAuth hook
  useEffect(() => {
    _startTime = Date.now();

    // Fetch user once on mount
    base44.auth.me().then(u => { _currentUser = u; }).catch(() => {});

    return () => {
      async function saveProgress() {
        const u = _currentUser;
        if (!u?.email) return;
        const elapsed = (Date.now() - _startTime) / 1000 / 60;
        if (elapsed < 0.1) return;
        if (!navigator.onLine) return;

        try {
          const today = new Date().toDateString();
          const existing = await base44.entities.DailyProgress.filter({ user_email: u.email, date: today });
          if (existing[0]) {
            await base44.entities.DailyProgress.update(existing[0].id, {
              minutes_played: (existing[0].minutes_played || 0) + elapsed
            });
          } else {
            await base44.entities.DailyProgress.create({
              user_email: u.email,
              date: today,
              minutes_played: elapsed
            });
          }
        } catch (err) {
          console.warn("DailyProgress save failed:", err);
        }
      }

      saveProgress();
    };
  }, []);
}