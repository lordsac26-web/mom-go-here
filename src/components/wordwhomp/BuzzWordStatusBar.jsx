import { useState, useEffect, useRef } from "react";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BuzzWordStatusBar({
  score, foundCount, totalCount, timeLeft, isRelaxed, gameStartTime, gameOver,
}) {
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

  const timerColor = !isRelaxed && timeLeft <= 15
    ? "text-red-400"
    : !isRelaxed && timeLeft <= 30
    ? "text-yellow-400"
    : "text-foreground";

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5 mb-3 py-2 px-3 rounded-2xl bg-card border border-border text-sm sm:text-base font-bold text-foreground">
      <span>⭐ {score}</span>
      <span>📝 {foundCount}/{totalCount}</span>
      {isRelaxed ? (
        <span>⏱ {formatTime(elapsed)}</span>
      ) : (
        <span className={timerColor}>
          ⏱ {formatTime(timeLeft)}
        </span>
      )}
    </div>
  );
}