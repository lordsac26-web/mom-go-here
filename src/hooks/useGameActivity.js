import { useCallback } from "react";
import { useGameActivityStore } from "@/stores/gameActivityStore";
import { usePlayerXP } from "./usePlayerXP";
import { useAchievements } from "./useAchievements";
import { useAchievementToastStore } from "@/stores/achievementToastStore";

export function useGameActivity() {
  const recordWin = useGameActivityStore((s) => s.recordWin);
  const recordLoss = useGameActivityStore((s) => s.recordLoss);
  const currentStreak = useGameActivityStore((s) => s.currentStreak);

  const { awardXP } = usePlayerXP();
  const showBadge = useAchievementToastStore((s) => s.showBadge);
  const { checkAchievements } = useAchievements((badge) => showBadge(badge));

  const reportWin = useCallback((gameName) => {
    recordWin(gameName || "Game");
    awardXP("win");
    setTimeout(() => checkAchievements(currentStreak + 1), 1500);
  }, [recordWin, awardXP, checkAchievements, currentStreak, showBadge]);

  const reportLoss = useCallback(() => {
    recordLoss();
    awardXP("loss");
    setTimeout(() => checkAchievements(0), 1500);
  }, [recordLoss, awardXP, checkAchievements, showBadge]);

  return { reportWin, reportLoss };
}