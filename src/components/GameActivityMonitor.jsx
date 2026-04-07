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
 * Invisible component that monitors game activity.
 * - Starts a session timer when user is on a game page
 * - Periodically checks play time for wellness reminders
 */
export default function GameActivityMonitor() {
  const location = useLocation();
  const intervalRef = useRef(null);
  const startSession = useGameActivityStore((s) => s.startSession);
  const checkPlayTime = useGameActivityStore((s) => s.checkPlayTime);

  const isOnGamePage = GAME_PATHS.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (isOnGamePage) {
      startSession();
      // Check play time every 60 seconds
      intervalRef.current = setInterval(() => {
        checkPlayTime();
      }, 60000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnGamePage, startSession, checkPlayTime]);

  return null; // invisible
}