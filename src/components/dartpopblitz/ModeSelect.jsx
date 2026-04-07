import { DART_PRESETS, BALLOON_TYPES, POWERUPS } from "./gameConfig";
import DartPopLeaderboard from "./DartPopLeaderboard";

export default function ModeSelect({ onSelect }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 px-4 max-w-md mx-auto">
      <span className="text-6xl">🎯</span>
      <h1 className="text-3xl font-black text-primary text-center">Dart Pop Blitz</h1>
      <p className="text-muted-foreground text-center text-lg font-semibold">
        Aim, fire, and pop every balloon!
      </p>

      {/* Mode buttons */}
      <div className="w-full space-y-3 mt-1">
        {DART_PRESETS.map((preset, i) => {
          const totalBalloons = Object.values(preset.balloons).reduce((a, b) => a + b, 0);
          const isEndless = preset.endless;
          return (
            <button
              key={i}
              onClick={() => onSelect(preset)}
              className={`w-full border-2 rounded-2xl p-5 text-left transition-all ${
                isEndless
                  ? "bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/60 hover:border-purple-400"
                  : "bg-card border-border hover:border-primary"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl font-black text-foreground">{preset.label}</span>
                <span className="text-primary font-black text-lg">
                  {isEndless ? "♾️ Darts" : `🎯 ×${preset.darts}`}
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-semibold">
                {preset.subtitle}
              </p>
              {!isEndless && (
                <p className="text-muted-foreground text-xs mt-1">
                  {totalBalloons} balloons • {preset.balloons.tough} tough • {preset.balloons.bomb} bombs
                  {preset.obstacles.length > 0 && (
                    <span className="text-red-400"> • ⚡ {preset.obstacles.length} obstacle{preset.obstacles.length > 1 ? "s" : ""}</span>
                  )}
                </p>
              )}
              {isEndless && (
                <p className="text-purple-300 text-xs mt-1 font-semibold">
                  Balloons keep appearing — see how long you can last!
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Balloon Types Legend */}
      <div className="bg-card/60 border border-border rounded-2xl p-4 w-full">
        <h3 className="text-sm font-black text-foreground mb-2">🎈 Balloon Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(BALLOON_TYPES).map(([key, bt]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-lg">{bt.emoji}</span>
              <div>
                <span className="text-xs font-black text-foreground">{bt.label}</span>
                <span className="text-xs text-muted-foreground ml-1">— {bt.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Power-ups Legend */}
      <div className="bg-card/60 border border-border rounded-2xl p-4 w-full">
        <h3 className="text-sm font-black text-foreground mb-2">⚡ Power-Ups <span className="text-muted-foreground font-semibold">(hit {4} in a row!)</span></h3>
        <div className="space-y-1">
          {Object.entries(POWERUPS).map(([key, pw]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-lg">{pw.emoji}</span>
              <span className="text-xs font-black text-foreground">{pw.label}</span>
              <span className="text-xs text-muted-foreground">— {pw.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <DartPopLeaderboard />
    </div>
  );
}