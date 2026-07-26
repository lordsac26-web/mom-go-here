import { Slider } from "@/components/ui/slider";

export default function CoinPusherControls({ balance, dropping, dropCount, dropX, onCountChange, onPositionChange, onDrop }) {
  return (
    <>
      <div className="shrink-0 flex items-center gap-3 px-1">
        <span className="text-slate-400 text-xs font-bold">◀</span>
        <Slider value={[Math.round(dropX * 100)]} onValueChange={([value]) => onPositionChange(value / 100)} min={15} max={85} step={1} disabled={dropping} className="flex-1" />
        <span className="text-slate-400 text-xs font-bold">▶</span>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <div className="flex gap-1.5 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-1.5">
          {[1, 2, 3].map((count) => (
            <button key={count} type="button" onClick={() => onCountChange(count)} disabled={dropping} className={`h-11 w-11 rounded-xl text-lg font-black transition-all active:scale-90 ${dropCount === count ? "scale-105 bg-sky-500 text-white shadow-lg" : "bg-transparent text-slate-400"}`}>
              {count}
            </button>
          ))}
        </div>
        <button type="button" onClick={onDrop} disabled={dropping || (balance ?? 0) < dropCount} className="flex-1 rounded-2xl border border-white/20 bg-gradient-to-r from-sky-500 to-blue-600 py-3.5 text-xl font-black text-white shadow-xl transition-transform active:scale-95 disabled:opacity-50">
          {(balance ?? 0) < dropCount ? "Out of Coins" : `⬇️ Drop ${dropCount > 1 ? `${dropCount} Coins` : "Coin"} — ${dropCount} 🪙`}
        </button>
      </div>
    </>
  );
}