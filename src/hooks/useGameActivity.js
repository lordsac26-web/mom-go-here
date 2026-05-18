import * as React from "react";
const { useCallback } = React;
import { useGameActivityStore } from "@/stores/gameActivityStore";
import { usePlayerXP } from "./usePlayerXP";
import { useAchievements } from "./useAchievements";
import { useAchievementToastStore } from "@/stores/achievementToastStore";
import { useDailyMissions } from "./useDailyMissions";

// Module-level guard — prevents double-fire across any render cycle
let _busy = false;

export function useGameActivity() {
  const { awardXP } = usePlayerXP();
  const { checkAchievements } = useAchievements((badge) => {
    useAchievementToastStore.getState().showBadge(badge);
  });
  const { reportMissionProgress } = useDailyMissions();

  const reportWin = useCallback((gameName) => {
    if (_busy) return;
    _busy = true;

    // All store calls via getState() — no hook selectors
    useGameActivityStore.getState().recordWin(gameName || "Game");
    awardXP("win");

    const batch = [
      { type: "win_any" },
      { type: "play_any" },
    ];
    if (gameName) {
      batch.push({ type: "win_specific", extra: gameName });
      batch.push({ type: "play_specific", extra: gameName });
    }
    reportMissionProgress(batch);

    setTimeout(() => {
      const streak = useGameActivityStore.getState().currentStreak;
      checkAchievements(streak);
      _busy = false;
    }, 1500);
  }, [awardXP, checkAchievements, reportMissionProgress]);

  const reportLoss = useCallback((gameName) => {
    if (_busy) return;
    _busy = true;

    useGameActivityStore.getState().recordLoss();
    awardXP("loss");

    const batch = [{ type: "play_any" }];
    if (gameName) batch.push({ type: "play_specific", extra: gameName });
    reportMissionProgress(batch);

    setTimeout(() => {
      checkAchievements(0);
      _busy = false;
    }, 1500);
  }, [awardXP, checkAchievements, reportMissionProgress]);

  return { reportWin, reportLoss };
}