import { useState } from "react";
import { WHEEL_THEMES } from "./shopCatalog";
import { Check, Lock, Sparkles } from "lucide-react";

function WheelPreview({ theme }) {
  const count = theme.colors.length;
  const size = 56;
  const cx = size / 2, cy = size / 2, r = size / 2 - 2;
  const sliceAngle = (2 * Math.PI) / count;
  const paths = theme.colors.map((color, i) => {
    const a1 = i * sliceAngle - Math.PI / 2;
    const a2 = a1 + sliceAngle;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    return (
      <path
        key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
        fill={color}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
      />
    );
  });

  // Premium themes: show colored slices + the AI rim & hub layered on top
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-full overflow-hidden">
        {paths}
      </svg>
      {theme.rim && (
        <img src={theme.rim} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: "scale(1.12)" }} />
      )}
      {theme.hub && (
        <img src={theme.hub} alt="" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 pointer-events-none" />
      )}
      {!theme.rim && <div className="absolute inset-0 rounded-full border-2 border-white/20" />}
    </div>
  );
}

export default function WheelThemesTab({ inventory, coins, onBuy, onEquip }) {
  const [buying, setBuying] = useState(null);
  const owned = inventory?.owned_wheel_themes ?? ["default"];
  const active = inventory?.active_wheel_theme ?? "default";

  async function handleBuy(theme) {
    setBuying(theme.id);
    await onBuy(theme);
    setBuying(null);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {WHEEL_THEMES.map(theme => {
        const isOwned = owned.includes(theme.id);
        const isActive = active === theme.id;
        const canAfford = (coins ?? 0) >= theme.price;
        return (
          <div
            key={theme.id}
            className={`relative bg-card rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all
              ${isActive ? "border-primary shadow-[0_0_16px_rgba(245,158,11,0.4)]" : "border-border"}
              ${theme.rare && !isOwned ? "border-purple-500/50" : ""}`}
          >
            {theme.rare && (
              <span className="absolute top-1.5 right-1.5 bg-purple-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Sparkles size={9} /> RARE
              </span>
            )}
            <WheelPreview theme={theme} />
            <p className="font-black text-foreground text-sm text-center leading-tight">{theme.emoji} {theme.label}</p>
            <p className="text-muted-foreground text-xs text-center leading-snug">{theme.desc}</p>

            {isOwned ? (
              <button
                onClick={() => onEquip("wheel", theme.id)}
                className={`w-full py-2 rounded-xl font-black text-sm transition-all
                  ${isActive
                    ? "bg-primary text-primary-foreground cursor-default"
                    : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"}`}
              >
                {isActive ? <span className="flex items-center justify-center gap-1"><Check size={14} /> Equipped</span> : "Equip"}
              </button>
            ) : (
              <button
                onClick={() => handleBuy(theme)}
                disabled={!canAfford || buying === theme.id}
                className={`w-full py-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1
                  ${canAfford ? "bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                {buying === theme.id ? "…" : (
                  theme.free ? "Free" : <><span>🪙</span>{theme.price}</>
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