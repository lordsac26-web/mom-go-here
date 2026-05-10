import { base44 } from "@/api/base44Client";
import syncQueue from "@/lib/syncQueue";

/**
 * Centralized GameScore writer.
 *
 * - Always attaches `display_name` (UserProfile > User.full_name > email prefix)
 *   so Hall of Fame and leaderboards can rank by friendly name.
 * - Routes through the offline syncQueue so scores are never lost.
 *
 * Usage:
 *   import { saveGameScore } from "@/lib/scoreSaver";
 *   await saveGameScore({
 *     game_name: "Yahtzee",
 *     score: 320,
 *     duration_seconds: 240,
 *     difficulty: "normal",
 *     completed: true,
 *   });
 */

let cachedDisplayName = null;
let cachedEmail = null;

async function resolveDisplayName(user) {
  if (!user?.email) return "";
  if (cachedEmail === user.email && cachedDisplayName) return cachedDisplayName;

  let name = "";
  try {
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    name = (profiles[0]?.display_name || "").trim();
  } catch { /* ignore */ }

  if (!name) name = (user.full_name || "").trim();
  if (!name) name = user.email.split("@")[0];

  cachedEmail = user.email;
  cachedDisplayName = name;
  return name;
}

export async function saveGameScore(payload) {
  try {
    const user = await base44.auth.me();
    if (!user?.email) return null;

    const display_name = await resolveDisplayName(user);

    const record = {
      user_email: user.email,
      display_name,
      game_name: payload.game_name,
      score: typeof payload.score === "number" ? payload.score : 0,
      duration_seconds: payload.duration_seconds ?? 0,
      difficulty: payload.difficulty ?? "",
      completed: !!payload.completed,
    };

    return await syncQueue.safeCreate("GameScore", record);
  } catch (err) {
    console.error("saveGameScore failed:", err);
    return null;
  }
}

// Allow the user's display name to be invalidated (e.g. after profile edit)
export function invalidateDisplayNameCache() {
  cachedDisplayName = null;
  cachedEmail = null;
}