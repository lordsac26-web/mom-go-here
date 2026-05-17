import { useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ACHIEVEMENTS from "../components/achievementDefinitions";
import { isMajorAchievement } from "../components/achievements/majorAchievements";
import { useAchievementToastStore } from "@/stores/achievementToastStore";

/**
 * Hook to check and unlock achievements after each game event.
 * Uses module-level busy flag and session cache to avoid useRef
 * (which crashes in the Base44 SDK React context).
 */

// Module-level state — safe from null-dispatcher crashes
let _busy = false;
let sessionEarnedKeys = new Set();
let lastEmail = null;

export function useAchievements(onUnlock) {
  const checkAchievements = useCallback(async (currentStreak) => {
    if (_busy) return;
    _busy = true;

    try {
      const user = await base44.auth.me();
      if (!user?.email) return;

      // Reset session cache if user changed
      if (lastEmail !== user.email) {
        sessionEarnedKeys = new Set();
        lastEmail = user.email;
      }

      // Gather all stats in parallel
      const [scores, xpRecords, existingAchievements, loginRecords, spinRecords, streakRecords, solRecords] = await Promise.all([
        base44.entities.GameScore.filter({ user_email: user.email }),
        base44.entities.PlayerXP.filter({ user_email: user.email }),
        base44.entities.Achievement.filter({ user_email: user.email }),
        base44.entities.DailyLoginBonus.filter({ user_email: user.email }),
        base44.entities.DailyWheelSpin.filter({ user_email: user.email }),
        base44.entities.EngagementStreak.filter({ user_email: user.email }),
        base44.entities.SolitaireStats.filter({ user_email: user.email }),
      ]);

      const earnedKeys = new Set(existingAchievements.map(a => a.achievement_key));
      earnedKeys.forEach(k => sessionEarnedKeys.add(k));

      // ── Core stats ──
      const totalGames = scores.length;
      const totalWins = scores.filter(s => s.completed).length;
      const xpRecord = xpRecords[0];
      const totalXP = xpRecord?.total_xp || 0;
      const level = xpRecord?.level || 1;
      const distinctGames = new Set(scores.map(s => s.game_name)).size;

      const bestStreak = Math.max(currentStreak || 0, 0);

      // ── Daily login streak ──
      const loginRecord = loginRecords[0];
      const loginStreak = loginRecord?.current_streak || 0;

      // ── Daily devotional streak ──
      const streakRecord = streakRecords[0];
      const dailyStreak = streakRecord?.daily_current_streak || 0;

      // ── Wheel spins ──
      const spinRecord = spinRecords[0];
      const totalSpins = spinRecord?.total_spins || 0;

      // ── Solitaire stats ──
      const solRecord = solRecords[0];
      const solitaireWins = solRecord?.games_won || 0;

      // ── Game-specific win counts from GameScore ──
      const gameWins = {};
      const gameHighScores = {};
      for (const s of scores) {
        const gn = s.game_name || "";
        if (s.completed) {
          gameWins[gn] = (gameWins[gn] || 0) + 1;
        }
        if (typeof s.score === "number") {
          gameHighScores[gn] = Math.max(gameHighScores[gn] || 0, s.score);
        }
      }

      const checkersWins = gameWins["Checkers"] || 0;
      const dartPopBest = gameHighScores["Dart Pop Blitz"] || 0;
      const yahtzeeHigh = gameHighScores["Yahtzee"] || 0;
      const memoryWins = gameWins["Memory Match"] || 0;
      const wordSearchWins = gameWins["Word Search"] || 0;
      const buzzwordWins = gameWins["BuzzWord"] || gameWins["Buzz Word"] || 0;
      const mahjongWins = gameWins["Mahjong"] || 0;
      const slotsBigWin = gameHighScores["Slots"] || gameHighScores["Slot Machine"] || 0;

      const stats = {
        totalGames, totalWins, winStreak: currentStreak || 0, bestStreak,
        level, totalXP, distinctGames,
        loginStreak, dailyStreak, totalSpins,
        solitaireWins, checkersWins, dartPopBest, yahtzeeHigh,
        memoryWins, wordSearchWins, buzzwordWins, mahjongWins, slotsBigWin,
      };

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

        // Fire unlock callback for each + dispatch major-modal where applicable
        const showMajorBadge = useAchievementToastStore.getState().showMajorBadge;
        newlyUnlocked.forEach(a => {
          if (onUnlock) onUnlock(a);
          if (isMajorAchievement(a.key)) {
            showMajorBadge(a);
          }
        });
      }
    } catch (err) {
      console.error("Achievement check failed:", err);
    } finally {
      _busy = false;
    }
  }, [onUnlock]);

  return { checkAchievements };
}