import { useCallback, useRef } from "react";
import { useGameActivityStore } from "@/stores/gameActivityStore";
import { usePlayerXP } from "./usePlayerXP";
import { useAchievements } from "./useAchievements";
import { useAchievementToastStore } from "@/stores/achievementToastStore";

export function useGameActivity() {
  const recordWin = useGameActivityStore((s) => s.recordWin);
  const recordLoss = useGameActivityStore((s) => s.recordLoss);
  // Read streak directly from store at call time to avoid stale closure
  const getStreak = useCallback(() => useGameActivityStore.getState().currentStreak, []);

  const { awardXP } = usePlayerXP();
  const showBadge = useAchievementToastStore((s) => s.showBadge);
  const { checkAchievements } = useAchievements((badge) => showBadge(badge));

  // Guard against double-fire within the same event
  const busyRef = useRef(false);

  const reportWin = useCallback((gameName) => {
    if (busyRef.current) return;
    busyRef.current = true;
    recordWin(gameName || "Game");
    awardXP("win");
    // Read streak at call-time, not at render-time
    setTimeout(() => {
      checkAchievements(getStreak());
      busyRef.current = false;
    }, 1500);
  }, [recordWin, awardXP, checkAchievements, getStreak]);

  const reportLoss = useCallback((gameName) => {
    if (busyRef.current) return;
    busyRef.current = true;
    recordLoss();
    awardXP("loss");
    setTimeout(() => {
      checkAchievements(0);
      busyRef.current = false;
    }, 1500);
  }, [recordLoss, awardXP, checkAchievements]);

  return { reportWin, reportLoss };
}