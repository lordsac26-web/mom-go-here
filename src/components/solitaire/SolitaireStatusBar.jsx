import { useState, useEffect, useRef } from "react";

/**
 * Displays move count and elapsed timer during Solitaire gameplay.
 */
export default function SolitaireStatusBar({ moves, gameStartTime, gameOver }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (gameOver) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [gameStartTime, gameOver]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="flex items-center justify-center gap-4 text-sm font-bold text-green-300 mb-2">
      <span>Moves: {moves}</span>
      <span>⏱ {mins}:{secs.toString().padStart(2, "0")}</span>
    </div>
  );
}