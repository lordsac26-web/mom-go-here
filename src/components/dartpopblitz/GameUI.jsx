import { POWERUPS, WIND_MAX_STRENGTH } from "./gameConfig";

export default function GameUI({
  score, dartsRemaining, totalPopped, totalBalloons, streak,
  activePowerup, setActivePowerup, powerupInventory, setPowerupInventory,
  endless, wind = 0,
}) {
  function equipPowerup(key) {
    if (activePowerup === key) {
      setActivePowerup(null);
      setPowerupInventory(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    } else {
      if (activePowerup) {
        setPowerupInventory(prev => ({ ...prev, [activePowerup]: (prev[activePowerup] || 0) + 1 }));
      }
      if ((powerupInventory[key] || 0) > 0) {
        setPowerupInventory(prev => ({ ...prev, [key]: prev[key] - 1 }));
        setActivePowerup(key);
      }
    }
  }

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

      {/* Power-ups */}
      <div className="flex items-center justify-center gap-2">
        {Object.entries(POWERUPS).map(([key, pw]) => {
          const count = powerupInventory[key] || 0;
          const isActive = activePowerup === key;
          return (
            <button
              key={key}
              onClick={() => equipPowerup(key)}
              disabled={count <= 0 && !isActive}
              className={`relative flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all text-sm font-bold ${
                isActive
                  ? "border-primary bg-primary/20 scale-105 shadow-lg shadow-primary/20"
                  : count > 0
                  ? "border-border bg-card hover:border-primary/50"
                  : "border-border/30 bg-card/30 opacity-40"
              }`}
            >
              <span className="text-xl">{pw.emoji}</span>
              <span className="text-xs text-muted-foreground">{pw.label}</span>
              {(count > 0 || isActive) && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-black">
                  {isActive ? "✓" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activePowerup && (
        <p className="text-center text-xs text-primary font-bold">
          {POWERUPS[activePowerup].emoji} {POWERUPS[activePowerup].desc}
        </p>
      )}
    </div>
  );
}