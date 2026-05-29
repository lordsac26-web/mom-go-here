import { useState } from "react";
import { DART_POWERUPS } from "./shopCatalog";
import { Plus, Lock } from "lucide-react";

export default function DartPowerupsTab({ inventory, coins, onBuy }) {
  const [buying, setBuying] = useState(null);
  const dartPowerups = inventory?.dart_powerups ?? {};

  async function handleBuy(powerup) {
    setBuying(powerup.id);
    await onBuy(powerup);
    setBuying(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm text-center px-2">
        One-time use power-ups added to your inventory. Use them inside Dart Pop Blitz!
      </p>
      <div className="grid grid-cols-1 gap-3">
        {DART_POWERUPS.map(powerup => {
          const owned = dartPowerups[powerup.id] ?? 0;
          const atMax = owned >= (powerup.maxOwn ?? 5);
          const canAfford = (coins ?? 0) >= powerup.price;
          return (
            <div
              key={powerup.id}
              className="bg-card rounded-2xl border-2 border-border p-4 flex items-center gap-3 transition-all hover:border-primary/40"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl shrink-0">
                {powerup.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-foreground text-base">{powerup.label}</p>
                  {owned > 0 && (
                    <span className="bg-primary/20 text-primary text-xs font-black px-2 py-0.5 rounded-full">
                      ×{owned}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs leading-snug mt-0.5">{powerup.desc}</p>
                <p className="text-yellow-400 text-xs font-black mt-1 flex items-center gap-1">
                  🪙 {powerup.price} each
                  {atMax && <span className="text-muted-foreground font-normal">· Max {powerup.maxOwn} owned</span>}
                </p>
              </div>
              <button
                onClick={() => handleBuy(powerup)}
                disabled={!canAfford || atMax || buying === powerup.id}
                className={`shrink-0 w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center transition-all
                  ${canAfford && !atMax
                    ? "bg-yellow-500 text-black hover:bg-yellow-400 active:scale-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                {buying === powerup.id ? "…" : atMax ? "✓" : !canAfford ? <Lock size={16} /> : <Plus size={20} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}