import { useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * XP & Level System
 *
 * XP awards:
 *   Win  = 50 XP
 *   Loss = 10 XP (participation)
 *
 * Level thresholds (cumulative XP required):
 *   Level 1: 0       — Beginner
 *   Level 2: 100     — Rookie
 *   Level 3: 300     — Player
 *   Level 4: 600     — Skilled
 *   Level 5: 1000    — Expert
 *   Level 6: 1500    — Veteran
 *   Level 7: 2200    — Master
 *   Level 8: 3000    — Champion
 *   Level 9: 4000    — Legend
 *   Level 10: 5500   — Grand Master
 */

const XP_WIN = 50;
const XP_LOSS = 10;

export const LEVEL_TABLE = [
  { level: 1,  xp: 0,    title: "Beginner",     emoji: "🌱" },
  { level: 2,  xp: 100,  title: "Rookie",       emoji: "🌿" },
  { level: 3,  xp: 300,  title: "Player",       emoji: "⭐" },
  { level: 4,  xp: 600,  title: "Skilled",      emoji: "🔥" },
  { level: 5,  xp: 1000, title: "Expert",       emoji: "💎" },
  { level: 6,  xp: 1500, title: "Veteran",      emoji: "🛡️" },
  { level: 7,  xp: 2200, title: "Master",       emoji: "👑" },
  { level: 8,  xp: 3000, title: "Champion",     emoji: "🏆" },
  { level: 9,  xp: 4000, title: "Legend",        emoji: "🌟" },
  { level: 10, xp: 5500, title: "Grand Master",  emoji: "💫" },
];

export function getLevelInfo(totalXP) {
  let current = LEVEL_TABLE[0];
  for (const entry of LEVEL_TABLE) {
    if (totalXP >= entry.xp) current = entry;
    else break;
  }
  const nextIdx = LEVEL_TABLE.findIndex(e => e.level === current.level + 1);
  const next = nextIdx >= 0 ? LEVEL_TABLE[nextIdx] : null;

  const xpIntoLevel = totalXP - current.xp;
  const xpForNextLevel = next ? next.xp - current.xp : 0;
  const progress = next ? Math.min(xpIntoLevel / xpForNextLevel, 1) : 1;

  return { ...current, totalXP, xpIntoLevel, xpForNextLevel, progress, next };
}

/**
 * Hook to award XP. Call awardXP("win") or awardXP("loss").
 * Handles fetching/creating the PlayerXP record and updating it.
 */
export function usePlayerXP() {
  const busyRef = useRef(false);

  const awardXP = useCallback(async (outcome) => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const user = await base44.auth.me();
      if (!user?.email) return;

      const xpAmount = outcome === "win" ? XP_WIN : XP_LOSS;

      const records = await base44.entities.PlayerXP.filter({ user_email: user.email });
      let record = records[0];

      if (!record) {
        record = await base44.entities.PlayerXP.create({
          user_email: user.email,
          total_xp: xpAmount,
          level: 1,
        });
      } else {
        const newXP = (record.total_xp || 0) + xpAmount;
        const info = getLevelInfo(newXP);
        await base44.entities.PlayerXP.update(record.id, {
          total_xp: newXP,
          level: info.level,
        });
      }
    } catch (err) {
      console.error("Failed to award XP:", err);
    } finally {
      busyRef.current = false;
    }
  }, []);

  return { awardXP };
}