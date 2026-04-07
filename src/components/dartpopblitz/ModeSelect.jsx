import { DART_PRESETS } from "./gameConfig";

export default function ModeSelect({ onSelect }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4 max-w-md mx-auto">
      <span className="text-6xl">🎯</span>
      <h1 className="text-3xl font-black text-primary text-center">Dart Pop Blitz</h1>
      <p className="text-muted-foreground text-center text-lg font-semibold">
        Pop all the balloons before you run out of darts! Hit 4 in a row to earn power-ups!
      </p>

      <div className="w-full space-y-3 mt-2">
        {DART_PRESETS.map((preset, i) => {
          const totalBalloons = Object.values(preset.balloons).reduce((a, b) => a + b, 0);
          return (
            <button
              key={i}
              onClick={() => onSelect(preset)}
              className="w-full bg-card border-2 border-border hover:border-primary rounded-2xl p-5 text-left transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl font-black text-foreground">{preset.label}</span>
                <span className="text-primary font-black text-lg">🎯 ×{preset.darts}</span>
              </div>
              <p className="text-muted-foreground text-sm font-semibold">
                {totalBalloons} balloons • {preset.balloons.tough} tough • {preset.balloons.bomb} bombs
                {preset.obstacles && preset.obstacles.length > 0 && (
                  <span className="text-red-400"> • ⚡ {preset.obstacles.length} obstacle{preset.obstacles.length > 1 ? "s" : ""}</span>
                )}
              </p>
            </button>
          );
        })}
      </div>

      <div className="bg-card/60 border border-border rounded-xl p-3 mt-2 w-full space-y-2">
        <p className="text-sm text-muted-foreground font-semibold text-center">
          🔱 <strong>Multi-Shot</strong> • 💥 <strong>MIRV Grenade</strong> • 🎯 <strong>Sniper Dart</strong>
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Pop 4 balloons in a row to earn a random power-up!
        </p>
        <p className="text-xs text-red-400/80 text-center">
          ⚡ Obstacles block your darts — only Sniper can pierce through them!
        </p>
      </div>
    </div>
  );
}