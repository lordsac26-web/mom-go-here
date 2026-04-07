import { useCallback } from "react";
import { useGameActivityStore } from "@/stores/gameActivityStore";
import { usePlayerXP } from "./usePlayerXP";

export function useGameActivity() {
  const recordWin = useGameActivityStore((s) => s.recordWin);
  const recordLoss = useGameActivityStore((s) => s.recordLoss);

  const { awardXP } = usePlayerXP();

  const reportWin = useCallback((gameName) => {
    recordWin(gameName || "Game");
    awardXP("win");
  }, [recordWin, awardXP]);

  const reportLoss = useCallback(() => {
    recordLoss();
    awardXP("loss");
  }, [recordLoss, awardXP]);

  return { reportWin, reportLoss };
}