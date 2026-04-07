import { useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ACHIEVEMENTS from "../components/achievementDefinitions";

/**
 * Hook to check and unlock achievements after each game event.
 * Gathers player stats from GameScore + PlayerXP + current streak,
 * then checks each achievement definition.
 *
 * Returns: { checkAchievements(currentStreak) } — call after win/loss
 * The `onUnlock` callback in the store is used to show toasts.
 */

// We keep a module-level set so we don't re-check already-earned within one session
let sessionEarnedKeys = new Set();
let lastEmail = null;

export function useAchievements(onUnlock) {
  const busyRef = useRef(false);

  const checkAchievements = useCallback(async (currentStreak) => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const user = await base44.auth.me();
      if (!user?.email) return;

      // Reset session cache if user changed
      if (lastEmail !== user.email) {
        sessionEarnedKeys = new Set();
        lastEmail = user.email;
      }

      // Gather stats in parallel
      const [scores, xpRecords, existingAchievements] = await Promise.all([
        base44.entities.GameScore.filter({ user_email: user.email }),
        base44.entities.PlayerXP.filter({ user_email: user.email }),
        base44.entities.Achievement.filter({ user_email: user.email }),
      ]);

      const earnedKeys = new Set(existingAchievements.map(a => a.achievement_key));
      // Also add to session cache
      earnedKeys.forEach(k => sessionEarnedKeys.add(k));

      const totalGames = scores.length;
      const totalWins = scores.filter(s => s.completed).length;
      const xpRecord = xpRecords[0];
      const totalXP = xpRecord?.total_xp || 0;
      const level = xpRecord?.level || 1;
      const distinctGames = new Set(scores.map(s => s.game_name)).size;

      // Best streak: use the max of the currentStreak from zustand and any historical best
      // We track bestStreak from the EngagementStreak or just the current session
      const bestStreak = Math.max(currentStreak || 0, 0);

      const stats = { totalGames, totalWins, winStreak: currentStreak || 0, bestStreak, level, totalXP, distinctGames };

      // Check each achievement
      const newlyUnlocked = [];
      for (const ach of ACHIEVEMENTS) {
        if (earnedKeys.has(ach.key) || sessionEarnedKeys.has(ach.key)) continue;
        if (ach.check(stats)) {
          newlyUnlocked.push(ach);
          sessionEarnedKeys.add(ach.key);
        }
      }

      // Persist newly unlocked
      if (newlyUnlocked.length > 0) {
        const records = newlyUnlocked.map(a => ({
          user_email: user.email,
          achievement_key: a.key,
          title: a.title,
          description: a.description,
          emoji: a.emoji,
          earned_date: new Date().toISOString(),
        }));
        await base44.entities.Achievement.bulkCreate(records);

        // Fire unlock callback for each
        newlyUnlocked.forEach(a => {
          if (onUnlock) onUnlock(a);
        });
      }
    } catch (err) {
      console.error("Achievement check failed:", err);
    } finally {
      busyRef.current = false;
    }
  }, [onUnlock]);

  return { checkAchievements };
}