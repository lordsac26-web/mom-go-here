import { useState, useEffect, useRef } from "react";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SudokuStatusBar({ moves, errorCount, gameStartTime, gameOver, difficulty }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!gameStartTime || gameOver) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setElapsed(Math.floor((Date.now() - gameStartTime) / 1000));
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [gameStartTime, gameOver]);

  const diffLabel = { easy: "😊 Easy", medium: "🧩 Medium", hard: "🧠 Hard" }[difficulty] || "";

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 mx-2 mb-3 py-2 px-4 rounded-2xl bg-card border border-border text-sm sm:text-base font-bold text-foreground">
      <span>{diffLabel}</span>
      <span>✏️ {moves}</span>
      {errorCount > 0 && <span className="text-red-400">❌ {errorCount}</span>}
      <span>⏱ {formatTime(elapsed)}</span>
    </div>
  );
}