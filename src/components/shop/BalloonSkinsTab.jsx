import { useState } from "react";
import { BALLOON_SKINS } from "./shopCatalog";
import { Check, Lock, Sparkles } from "lucide-react";

const RAINBOW_COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#a855f7","#ec4899"];

function BalloonPreview({ skin }) {
  if (skin.preview === "rainbow") {
    return (
      <div className="flex gap-0.5 justify-center flex-wrap w-12">
        {RAINBOW_COLORS.map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-full border border-white/20" style={{ background: c }} />
        ))}
      </div>
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-full border-2 border-white/30 shadow-lg flex items-center justify-center text-2xl"
      style={{ background: skin.preview }}
    >
      {skin.emoji}
    </div>
  );
}

export default function BalloonSkinsTab({ inventory, coins, onBuy, onEquip }) {
  const [buying, setBuying] = useState(null);
  const owned = inventory?.owned_balloon_skins ?? ["default"];
  const active = inventory?.active_balloon_skin ?? "default";

  async function handleBuy(skin) {
    setBuying(skin.id);
    await onBuy(skin);
    setBuying(null);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {BALLOON_SKINS.map(skin => {
        const isOwned = owned.includes(skin.id);
        const isActive = active === skin.id;
        const canAfford = (coins ?? 0) >= skin.price;
        return (
          <div
            key={skin.id}
            className={`relative bg-card rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all
              ${isActive ? "border-primary shadow-[0_0_16px_rgba(245,158,11,0.4)]" : "border-border"}
              ${skin.rare && !isOwned ? "border-purple-500/50" : ""}`}
          >
            {skin.rare && (
              <span className="absolute top-1.5 right-1.5 bg-purple-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Sparkles size={9} /> RARE
              </span>
            )}
            <BalloonPreview skin={skin} />
            <p className="font-black text-foreground text-sm text-center leading-tight">{skin.label}</p>
            <p className="text-muted-foreground text-xs text-center leading-snug">{skin.desc}</p>

            {isOwned ? (
              <button
                onClick={() => onEquip("balloon", skin.id)}
                className={`w-full py-2 rounded-xl font-black text-sm transition-all
                  ${isActive
                    ? "bg-primary text-primary-foreground cursor-default"
                    : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"}`}
              >
                {isActive ? <span className="flex items-center justify-center gap-1"><Check size={14} /> Equipped</span> : "Equip"}
              </button>
            ) : (
              <button
                onClick={() => handleBuy(skin)}
                disabled={!canAfford || buying === skin.id}
                className={`w-full py-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1
                  ${canAfford ? "bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                {buying === skin.id ? "…" : (
                  skin.free ? "Free" : <><span>🪙</span>{skin.price}</>
                )}
                {!canAfford && !buying && <Lock size={12} />}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}