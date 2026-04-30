import { useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "./usePlayerXP";

/**
 * Hook to report mission progress from any game or feature.
 *
 * Usage:
 *   const { reportMissionProgress } = useDailyMissions();
 *   reportMissionProgress("play_any");           // increment any "play_any" mission
 *   reportMissionProgress("win_specific", "Checkers");  // increment win for Checkers
 *   reportMissionProgress("visit_page", "/progress");
 */
export function useDailyMissions() {
  const busyRef = useRef(false);

  const reportMissionProgress = useCallback(async (type, extra = null) => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const user = await base44.auth.me();
      if (!user?.email) return;

      const today = new Date().toISOString().slice(0, 10);
      const records = await base44.entities.DailyMission.filter({ user_email: user.email, date: today });
      const record = records[0];
      if (!record) return;

      let updated = false;
      const missions = record.missions.map(m => {
        if (m.completed) return m;

        let match = false;

        // Match by type
        if (m.type === type) {
          // For specific types, also check the game/page field
          if (type === "play_specific" || type === "win_specific") {
            match = m.game === extra;
          } else if (type === "visit_page") {
            match = m.page === extra;
          } else {
            match = true;
          }
        }

        // play_any matches any play_specific too
        if (type === "play_specific" && m.type === "play_any") match = true;
        if (type === "win_specific" && m.type === "win_any") match = true;
        if (type === "win_any" && m.type === "win_any") match = true;
        if (type === "play_any" && m.type === "play_any") match = true;

        // Wins also count as plays
        if ((type === "win_any" || type === "win_specific") && m.type === "play_any") match = true;
        if (type === "win_specific" && m.type === "play_specific" && m.game === extra) match = true;

        if (match) {
          const newProgress = Math.min((m.progress || 0) + 1, m.target);
          const nowCompleted = newProgress >= m.target;
          if (newProgress !== m.progress || nowCompleted !== m.completed) {
            updated = true;
          }
          return { ...m, progress: newProgress, completed: nowCompleted };
        }
        return m;
      });

      if (!updated) return;

      const allCompleted = missions.every(m => m.completed);

      // Award XP for each newly completed mission
      const newlyCompleted = missions.filter((m, i) => m.completed && !record.missions[i].completed);
      if (newlyCompleted.length > 0) {
        const totalMissionXP = newlyCompleted.reduce((sum, m) => sum + (m.xp_reward || 0), 0);
        if (totalMissionXP > 0) {
          const xpRecords = await base44.entities.PlayerXP.filter({ user_email: user.email });
          const xpRecord = xpRecords[0];
          if (xpRecord) {
            const newXP = (xpRecord.total_xp || 0) + totalMissionXP;
            const info = getLevelInfo(newXP);
            await base44.entities.PlayerXP.update(xpRecord.id, { total_xp: newXP, level: info.level });
          }
        }
      }

      await base44.entities.DailyMission.update(record.id, {
        missions,
        all_completed: allCompleted,
      });
    } catch (err) {
      console.error("Mission progress error:", err);
    } finally {
      busyRef.current = false;
    }
  }, []);

  return { reportMissionProgress };
}