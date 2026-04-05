import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Call this hook inside any game page to auto-track playtime
export function useGameTimer() {
  const { user } = useAuth();
  const startRef = useRef(Date.now());
  const savedRef = useRef(0);

  useEffect(() => {
    if (!user) return;

    async function saveProgress() {
      const elapsed = (Date.now() - startRef.current) / 1000 / 60; // minutes
      const total = savedRef.current + elapsed;
      if (total < 0.1) return;

      const today = new Date().toDateString();
      const existing = await base44.entities.DailyProgress.filter({ user_email: user.email, date: today });
      if (existing[0]) {
        await base44.entities.DailyProgress.update(existing[0].id, {
          minutes_played: (existing[0].minutes_played || 0) + elapsed
        });
      } else {
        await base44.entities.DailyProgress.create({
          user_email: user.email,
          date: today,
          minutes_played: elapsed
        });
      }
    }

    return () => { saveProgress(); };
  }, [user]);
}