import { useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "./usePlayerXP";
import { pickRandomMissions } from "../components/missions/missionDefinitions";
import syncQueue from "@/lib/syncQueue";

/**
 * Module-level queue state — avoids useRef so this hook is safe to call
 * from components that render inside the Base44 SDK's React tree (which has
 * a different dispatcher, causing "Cannot read properties of null" crashes).
 */
const _queue = [];
let _processing = false;

async function processQueue() {
  if (_processing) return;
  if (_queue.length === 0) return;
  _processing = true;

  const batch = _queue.splice(0, _queue.length);

  try {
    const user = await base44.auth.me();
    if (!user?.email) return;

    const today = new Date().toISOString().slice(0, 10);
    const records = await base44.entities.DailyMission.filter({ user_email: user.email, date: today });
    let record = records[0];
    if (!record) {
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

    for (const event of batch) {
      const { type, extra } = event;

      missions = missions.map(m => {
        if (m.completed) return m;

        let match = false;

        if (m.type === type) {
          if (type === "play_specific" || type === "win_specific") {
            match = m.game === extra;
          } else if (type === "visit_page") {
            match = m.page === extra;
          } else {
            match = true;
          }
        }

        if (type === "play_specific" && m.type === "play_any") match = true;
        if (type === "win_specific" && m.type === "win_any") match = true;
        if (type === "win_any" && m.type === "win_any") match = true;
        if (type === "play_any" && m.type === "play_any") match = true;
        if ((type === "win_any" || type === "win_specific") && m.type === "play_any") match = true;
        if (type === "win_specific" && m.type === "play_specific" && m.game === extra) match = true;

        if (match) {
          const newProgress = Math.min((m.progress || 0) + 1, m.target);
          const nowCompleted = newProgress >= m.target;
          if (newProgress !== m.progress || nowCompleted !== m.completed) updated = true;
          return { ...m, progress: newProgress, completed: nowCompleted };
        }
        return m;
      });
    }

    // Variety mission handling
    const varietyMissions = missions.filter(m => m.type === "variety" && !m.completed);
    if (varietyMissions.length > 0) {
      const batchGames = new Set();
      for (const event of batch) {
        if ((event.type === "play_specific" || event.type === "win_specific") && event.extra) {
          batchGames.add(event.extra);
        }
      }

      const varietyKey = `variety_games_${new Date().toISOString().slice(0, 10)}_${(await base44.auth.me()).email}`;
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
            if (newProgress !== (m.progress || 0) || nowCompleted !== m.completed) updated = true;
            return { ...m, progress: newProgress, completed: nowCompleted };
          }
          return m;
        });
      }
    }

    if (!updated) return;

    const allCompleted = missions.every(m => m.completed);

    const newlyCompleted = missions.filter((m, i) => m.completed && !record.missions[i].completed);
    if (newlyCompleted.length > 0) {
      const totalMissionXP = newlyCompleted.reduce((sum, m) => sum + (m.xp_reward || 0), 0);
      if (totalMissionXP > 0) {
        const xpRecords = await base44.entities.PlayerXP.filter({ user_email: user.email });
        const xpRecord = xpRecords[0];
        if (xpRecord) {
          const newXP = (xpRecord.total_xp || 0) + totalMissionXP;
          const info = getLevelInfo(newXP);
          await syncQueue.safeUpdate("PlayerXP", xpRecord.id, { total_xp: newXP, level: info.level });
        }
      }
    }

    await syncQueue.safeUpdate("DailyMission", record.id, { missions, all_completed: allCompleted });
  } catch (err) {
    console.error("Mission progress error:", err);
  } finally {
    _processing = false;
    if (_queue.length > 0) processQueue();
  }
}

/**
 * Hook to report mission progress from any game or feature.
 *
 * Usage:
 *   const { reportMissionProgress } = useDailyMissions();
 *   reportMissionProgress("play_any");
 *   reportMissionProgress("win_specific", "Checkers");
 *   reportMissionProgress(["win_any", "play_any"]);
 */
export function useDailyMissions() {
  const reportMissionProgress = useCallback((typeOrBatch, extra = null) => {
    if (Array.isArray(typeOrBatch)) {
      for (const item of typeOrBatch) {
        if (typeof item === "string") {
          _queue.push({ type: item, extra: null });
        } else {
          _queue.push({ type: item.type, extra: item.extra || null });
        }
      }
    } else {
      _queue.push({ type: typeOrBatch, extra });
    }

    Promise.resolve().then(processQueue);
  }, []);

  return { reportMissionProgress };
}