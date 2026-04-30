import { useState, useEffect, useRef } from "react";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WordSearchStatusBar({ foundCount, totalCount, gameStartTime, gameOver, theme }) {
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

  return (
    <div
      className="flex items-center justify-center gap-6 mx-2 mb-3 py-2 px-4 rounded-2xl text-base font-bold"
      style={{ background: theme?.cell || "hsl(220,35%,15%)", color: theme?.cellText || "#fff" }}
    >
      <span>🔤 {foundCount} / {totalCount}</span>
      <span>⏱ {formatTime(elapsed)}</span>
    </div>
  );
}