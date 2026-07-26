import CoinDisplay from "@/components/shop/CoinDisplay";

function SessionStat({ label, value, tone }) {
  return (
    <div className="text-right">
      <p className="text-slate-400 text-[10px] font-bold leading-tight">{label}</p>
      <span className={`coin-hud-pop inline-flex items-center gap-1 rounded-full border px-3 py-1 text-base font-black ${tone}`}>
        🪙 {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function CoinPusherHUD({ balance, loading, collected, spent }) {
  return (
    <div className="flex items-center justify-between shrink-0 px-1">
      <div>
        <p className="text-slate-400 text-[10px] font-bold leading-tight">Balance</p>
        <CoinDisplay coins={loading ? null : balance} size="md" />
      </div>
      <SessionStat key={`collected-${collected}`} label="Collected" value={collected} tone="border-green-400/40 bg-green-500/20 text-green-300" />
      <SessionStat key={`spent-${spent}`} label="Spent" value={spent} tone="border-red-400/40 bg-red-500/20 text-red-300" />
    </div>
  );
}