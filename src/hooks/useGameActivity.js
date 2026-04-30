import { useCallback, useRef } from "react";
import { useGameActivityStore } from "@/stores/gameActivityStore";
import { usePlayerXP } from "./usePlayerXP";
import { useAchievements } from "./useAchievements";
import { useAchievementToastStore } from "@/stores/achievementToastStore";
import { useDailyMissions } from "./useDailyMissions";

export function useGameActivity() {
  const recordWin = useGameActivityStore((s) => s.recordWin);
  const recordLoss = useGameActivityStore((s) => s.recordLoss);
  // Read streak directly from store at call time to avoid stale closure
  const getStreak = useCallback(() => useGameActivityStore.getState().currentStreak, []);

  const { awardXP } = usePlayerXP();
  const showBadge = useAchievementToastStore((s) => s.showBadge);
  const { checkAchievements } = useAchievements((badge) => showBadge(badge));
  const { reportMissionProgress } = useDailyMissions();

  // Guard against double-fire within the same event
  const busyRef = useRef(false);

  const reportWin = useCallback((gameName) => {
    if (busyRef.current) return;
    busyRef.current = true;
    recordWin(gameName || "Game");
    awardXP("win");
    // Report to daily missions
    reportMissionProgress("win_any");
    reportMissionProgress("play_any");
    if (gameName) {
      reportMissionProgress("win_specific", gameName);
      reportMissionProgress("play_specific", gameName);
    }
    // Read streak at call-time, not at render-time
    setTimeout(() => {
      checkAchievements(getStreak());
      busyRef.current = false;
    }, 1500);
  }, [recordWin, awardXP, checkAchievements, getStreak, reportMissionProgress]);

  const reportLoss = useCallback((gameName) => {
    if (busyRef.current) return;
    busyRef.current = true;
    recordLoss();
    awardXP("loss");
    // Losses still count as "play"
    reportMissionProgress("play_any");
    if (gameName) reportMissionProgress("play_specific", gameName);
    setTimeout(() => {
      checkAchievements(0);
      busyRef.current = false;
    }, 1500);
  }, [recordLoss, awardXP, checkAchievements, reportMissionProgress]);

  return { reportWin, reportLoss };
}