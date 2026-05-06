import { WIND_MAX_STRENGTH } from "./gameConfig";

export default function GameUI({
  score, dartsRemaining, totalPopped, totalBalloons, streak,
  endless, wind = 0,
}) {
  return (
    <div className="w-full max-w-[400px] space-y-2">
      {/* Score bar */}
      <div className="flex items-center justify-between bg-card/80 rounded-xl px-3 py-2 text-sm font-bold">
        <span className="text-primary text-lg">🏆 {score.toLocaleString()}</span>
        <span className="text-foreground">🎈 {totalPopped}{!endless && `/${totalBalloons}`}</span>
        {!endless && <span className="text-foreground">🎯 {dartsRemaining}</span>}
        {endless && <span className="text-purple-400 font-black">♾️ Endless</span>}
      </div>

      {/* Wind indicator */}
      {Math.abs(wind) > 0.005 && (
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-400">
          <span>{wind < 0 ? "←" : ""} 🌬️ Wind {wind > 0 ? "→" : ""}</span>
          <div className="w-20 h-2 bg-card rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
            <div
              className="absolute inset-y-0 bg-blue-400/60 rounded-full transition-all"
              style={{
                left: wind < 0 ? `${50 + (wind / WIND_MAX_STRENGTH) * 50}%` : "50%",
                width: `${Math.abs(wind / WIND_MAX_STRENGTH) * 50}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Streak */}
      {streak >= 2 && (
        <div className="text-center">
          <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-black">
            🔥 {streak}x Streak!{streak >= 4 ? " — Power-up earned!" : ""}
          </span>
        </div>
      )}

      {/* Power-ups are rendered on the canvas near the launcher */}
    </div>
  );
}