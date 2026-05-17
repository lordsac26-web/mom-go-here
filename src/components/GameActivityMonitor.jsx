import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useGameActivityStore } from "@/stores/gameActivityStore";

const GAME_PATHS = [
  "/games/memory", "/games/tictactoe", "/games/yahtzee",
  "/games/wordsearch", "/games/sudoku", "/games/checkers",
  "/games/mahjong", "/games/solitaire", "/games/artstudio",
  "/games/buzzword", "/games/slots", "/games/dartpop",
];

/**
 * Invisible monitor — uses getState() instead of hook selectors to
 * avoid duplicate-React / null-dispatcher crashes.
 *
 * Fix #12: resets sessionStartTime when leaving a game page so
 * wellness-reminder timing is accurate per game session.
 */
export default function GameActivityMonitor() {
  const location = useLocation();
  const intervalRef = useRef(null);

  const isOnGamePage = GAME_PATHS.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (isOnGamePage) {
      // Reset so each game session gets its own timer
      useGameActivityStore.getState().resetSession();
      useGameActivityStore.getState().startSession();

      intervalRef.current = setInterval(() => {
        useGameActivityStore.getState().checkPlayTime();
      }, 60000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset session timer when leaving any game page
      if (isOnGamePage) {
        useGameActivityStore.getState().resetSession();
      }
    };
  }, [isOnGamePage]);

  return null;
}