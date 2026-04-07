import { useCallback } from "react";
import { useGameActivityStore } from "@/stores/gameActivityStore";

/**
 * Hook for games to report wins/losses to the activity monitor.
 * Usage:
 *   const { reportWin, reportLoss } = useGameActivity();
 *   // When player wins:  reportWin("Solitaire")
 *   // When player loses: reportLoss()
 */
export function useGameActivity() {
  const recordWin = useGameActivityStore((s) => s.recordWin);
  const recordLoss = useGameActivityStore((s) => s.recordLoss);

  const reportWin = useCallback((gameName) => {
    recordWin(gameName || "Game");
  }, [recordWin]);

  const reportLoss = useCallback(() => {
    recordLoss();
  }, [recordLoss]);

  return { reportWin, reportLoss };
}