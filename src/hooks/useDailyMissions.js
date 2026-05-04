import { useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "./usePlayerXP";
import { pickRandomMissions } from "../components/missions/missionDefinitions";

/**
 * Hook to report mission progress from any game or feature.
 *
 * Usage:
 *   const { reportMissionProgress } = useDailyMissions();
 *   reportMissionProgress("play_any");                     // increment play_any
 *   reportMissionProgress("win_specific", "Checkers");     // increment win for Checkers
 *   reportMissionProgress("visit_page", "/progress");
 *
 * Batch usage (preferred — avoids dropping calls):
 *   reportMissionProgress(["win_any", "play_any"]);
 *   reportMissionProgress([
 *     { type: "win_specific", extra: "Checkers" },
 *     { type: "play_specific", extra: "Checkers" },
 *     { type: "win_any" },
 *     { type: "play_any" },
 *   ]);
 */
export function useDailyMissions() {
  const queueRef = useRef([]);
  const processingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    if (queueRef.current.length === 0) return;
    processingRef.current = true;

    // Drain all pending events into a local batch
    const batch = [...queueRef.current];
    queueRef.current = [];

    try {
      const user = await base44.auth.me();
      if (!user?.email) return;

      const today = new Date().toISOString().slice(0, 10);
      const records = await base44.entities.DailyMission.filter({ user_email: user.email, date: today });
      let record = records[0];
      if (!record) {
        // Auto-create today's missions if they don't exist yet
        const missions = pickRandomMissions(3);
        record = await base44.entities.DailyMission.create({
          user_email: user.email,
          date: today,
          missions,
          all_completed: false,
          bonus_claimed: false,
        });
      }

      let updated = false;
      let missions = record.missions.map(m => ({ ...m }));

      // Apply every event in the batch
      for (const event of batch) {
        const { type, extra } = event;

        missions = missions.map(m => {
          if (m.completed) return m;

          let match = false;

          // Direct type match
          if (m.type === type) {
            if (type === "play_specific" || type === "win_specific") {
              match = m.game === extra;
            } else if (type === "visit_page") {
              match = m.page === extra;
            } else {
              match = true;
            }
          }

          // play_any matches any play_specific mission too
          if (type === "play_specific" && m.type === "play_any") match = true;
          if (type === "win_specific" && m.type === "win_any") match = true;
          if (type === "win_any" && m.type === "win_any") match = true;
          if (type === "play_any" && m.type === "play_any") match = true;

          // Wins also count as plays
          if ((type === "win_any" || type === "win_specific") && m.type === "play_any") match = true;
          if (type === "win_specific" && m.type === "play_specific" && m.game === extra) match = true;

          // Variety: count unique games played today — each play_specific or win_specific with a unique game name counts
          if (m.type === "variety" && (type === "play_specific" || type === "win_specific" || type === "play_any")) {
            // We track variety by counting unique game names from the batch + already-counted
            // We'll handle variety in a second pass below
          }

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
      }

      // --- Variety mission handling ---
      // For variety missions, we need to count unique games played today
      // We do this by looking at all play_specific / win_specific events
      const varietyMissions = missions.filter(m => m.type === "variety" && !m.completed);
      if (varietyMissions.length > 0) {
        // Gather unique game names from this batch
        const batchGames = new Set();
        for (const event of batch) {
          if ((event.type === "play_specific" || event.type === "win_specific") && event.extra) {
            batchGames.add(event.extra);
          }
        }

        // We store the tracked unique games in localStorage for the day
        const varietyKey = `variety_games_${today}_${user.email}`;
        let existingGames;
        try {
          existingGames = new Set(JSON.parse(localStorage.getItem(varietyKey) || "[]"));
        } catch {
          existingGames = new Set();
        }

        const prevSize = existingGames.size;
        batchGames.forEach(g => existingGames.add(g));
        localStorage.setItem(varietyKey, JSON.stringify([...existingGames]));
        const newSize = existingGames.size;

        if (newSize > prevSize) {
          missions = missions.map(m => {
            if (m.type === "variety" && !m.completed) {
              const newProgress = Math.min(newSize, m.target);
              const nowCompleted = newProgress >= m.target;
              if (newProgress !== (m.progress || 0) || nowCompleted !== m.completed) {
                updated = true;
              }
              return { ...m, progress: newProgress, completed: nowCompleted };
            }
            return m;
          });
        }
      }

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
      processingRef.current = false;
      // If new events queued while we were processing, run again
      if (queueRef.current.length > 0) {
        processQueue();
      }
    }
  }, []);

  const reportMissionProgress = useCallback((typeOrBatch, extra = null) => {
    // Normalize input to array of { type, extra } objects
    if (Array.isArray(typeOrBatch)) {
      for (const item of typeOrBatch) {
        if (typeof item === "string") {
          queueRef.current.push({ type: item, extra: null });
        } else {
          queueRef.current.push({ type: item.type, extra: item.extra || null });
        }
      }
    } else {
      queueRef.current.push({ type: typeOrBatch, extra });
    }

    // Debounce: process on next microtask so rapid calls batch together
    Promise.resolve().then(processQueue);
  }, [processQueue]);

  return { reportMissionProgress };
}