import { useCallback } from "react";
import { base44 } from "@/api/base44Client";
import syncQueue from "@/lib/syncQueue";

/**
 * XP & Level System (25 levels, exponential curve)
 *
 * XP awards:
 *   Win  = 50 XP
 *   Loss = 10 XP (participation)
 */

const XP_WIN = 50;
const XP_LOSS = 10;

// Module-level busy flag — no useRef needed
let _busy = false;

export const LEVEL_TABLE = [
  { level: 1,  xp: 0,       title: "Beginner",        emoji: "🌱" },
  { level: 2,  xp: 100,     title: "Newcomer",        emoji: "🌿" },
  { level: 3,  xp: 250,     title: "Rookie",          emoji: "🍃" },
  { level: 4,  xp: 500,     title: "Apprentice",      emoji: "⭐" },
  { level: 5,  xp: 850,     title: "Player",          emoji: "🎯" },
  { level: 6,  xp: 1300,    title: "Skilled",         emoji: "🔥" },
  { level: 7,  xp: 1900,    title: "Competitor",      emoji: "⚡" },
  { level: 8,  xp: 2700,    title: "Expert",          emoji: "💎" },
  { level: 9,  xp: 3700,    title: "Veteran",         emoji: "🛡️" },
  { level: 10, xp: 5000,    title: "Elite",           emoji: "🎖️" },
  { level: 11, xp: 6600,    title: "Master",          emoji: "👑" },
  { level: 12, xp: 8500,    title: "Champion",        emoji: "🏆" },
  { level: 13, xp: 10800,   title: "Hero",            emoji: "🦅" },
  { level: 14, xp: 13500,   title: "Ace",             emoji: "🃏" },
  { level: 15, xp: 16800,   title: "Virtuoso",        emoji: "🎵" },
  { level: 16, xp: 20500,   title: "Legend",          emoji: "🌟" },
  { level: 17, xp: 25000,   title: "Mythic",          emoji: "🐉" },
  { level: 18, xp: 30500,   title: "Titan",           emoji: "🗿" },
  { level: 19, xp: 37000,   title: "Overlord",        emoji: "👁️" },
  { level: 20, xp: 45000,   title: "Immortal",        emoji: "🔮" },
  { level: 21, xp: 55000,   title: "Ascendant",       emoji: "✨" },
  { level: 22, xp: 67000,   title: "Celestial",       emoji: "🌌" },
  { level: 23, xp: 82000,   title: "Transcendent",    emoji: "💠" },
  { level: 24, xp: 100000,  title: "Eternal",         emoji: "♾️" },
  { level: 25, xp: 125000,  title: "Grand Master",    emoji: "💫" },
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

export function usePlayerXP() {
  const awardXP = useCallback(async (outcome) => {
    if (_busy) return;
    _busy = true;

    const xpAmount = outcome === "win" ? XP_WIN : XP_LOSS;

    try {
      const user = await base44.auth.me();
      if (!user?.email) return;

      const records = await base44.entities.PlayerXP.filter({ user_email: user.email });
      const record = records[0];

      if (!record) {
        await syncQueue.safeCreate("PlayerXP", {
          user_email: user.email,
          total_xp: xpAmount,
          level: 1,
        });
      } else {
        const newXP = (record.total_xp || 0) + xpAmount;
        const info = getLevelInfo(newXP);
        await syncQueue.safeUpdate("PlayerXP", record.id, {
          total_xp: newXP,
          level: info.level,
        });
      }
    } catch (err) {
      if (navigator.onLine) {
        console.error("Failed to award XP:", err);
      }
    } finally {
      _busy = false;
    }
  }, []);

  return { awardXP };
}