import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Call this hook inside any game page to auto-track playtime
export function useGameTimer() {
  const { user } = useAuth();
  const startRef = useRef(Date.now());
  const userRef = useRef(user);

  // Keep user ref fresh without re-running the effect
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    startRef.current = Date.now();

    async function saveProgress() {
      const u = userRef.current;
      if (!u) return;
      const elapsed = (Date.now() - startRef.current) / 1000 / 60;
      if (elapsed < 0.1) return;

      // Skip if offline — DailyProgress is "best-effort" tracking
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

    return () => { saveProgress(); };
  }, []); // run once per mount — saves on unmount
}