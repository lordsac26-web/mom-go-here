import { BET_LEVELS as DEFAULT_BET_LEVELS } from "./slotConfig";
import { getSafeMaxBet } from "./betScaling";

/**
 * Redesigned SlotControls — senior-friendly with larger touch targets.
 * Paylines locked at 20 (removed complexity). Two-row layout: info + controls.
 */
export default function SlotControls({
  balance,
  bet,
  onBetChange,
  onSpin,
  spinning,
  autoSpin,
  onAutoSpinToggle,
  lastWin,
  betLevels,
}) {
  const levels = betLevels || DEFAULT_BET_LEVELS;
  let betIdx = levels.indexOf(bet);
  if (betIdx < 0) {
    const nearest = levels.reduce((prev, curr) =>
      Math.abs(curr - bet) < Math.abs(prev - bet) ? curr : prev
    );
    betIdx = levels.indexOf(nearest);
    Promise.resolve().then(() => onBetChange(nearest));
  }
  const safeMax = getSafeMaxBet(balance, levels);

  return (
    <div className="bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800 border-t-2 border-yellow-600/50 px-3 py-3 space-y-2.5">
      {/* Balance / Win / Bet info row */}
      <div className="flex items-center justify-between text-sm font-bold">
        <div className="text-center flex-1">
          <div className="text-yellow-400/70 text-[10px] uppercase tracking-wider">Balance</div>
          <div className={`text-base sm:text-lg tabular-nums ${balance <= levels[0] * 5 ? "text-red-400 animate-pulse" : "text-yellow-300"}`}>
            {balance.toLocaleString()}
          </div>
        </div>
        <div className="text-center flex-1">
          <div className="text-green-400/70 text-[10px] uppercase tracking-wider">Last Win</div>
          <div className={`text-base sm:text-lg tabular-nums ${lastWin > 0 ? "text-green-400" : "text-gray-500"}`}>
            {lastWin > 0 ? `+${lastWin.toLocaleString()}` : "—"}
          </div>
        </div>
        <div className="text-center flex-1">
          <div className="text-cyan-400/70 text-[10px] uppercase tracking-wider">Bet</div>
          <div className="text-cyan-300 text-base sm:text-lg tabular-nums">{bet.toLocaleString()}</div>
        </div>
      </div>

      {/* Play Money label */}
      <div className="text-center">
        <span className="text-[9px] text-gray-500 uppercase tracking-widest">🎲 Play Coins — No Real Money</span>
      </div>

      {/* Controls row — larger touch targets */}
      <div className="flex items-center gap-2">
        {/* Bet adjustment — larger buttons */}
        <button
          onClick={() => onBetChange(levels[Math.max(0, betIdx - 1)])}
          disabled={spinning || betIdx <= 0}
          className="w-11 h-11 rounded-xl bg-gray-700 text-white font-black text-xl disabled:opacity-30 active:scale-90 transition-all border border-gray-600 shrink-0"
        >
          −
        </button>
        <div className="flex flex-col items-center min-w-[52px]">
          <div className="text-yellow-300 font-black text-sm tabular-nums">{bet.toLocaleString()}</div>
          <div className="text-[9px] text-gray-500 uppercase">Bet</div>
        </div>
        <button
          onClick={() => onBetChange(levels[Math.min(levels.length - 1, betIdx + 1)])}
          disabled={spinning || betIdx >= levels.length - 1}
          className="w-11 h-11 rounded-xl bg-gray-700 text-white font-black text-xl disabled:opacity-30 active:scale-90 transition-all border border-gray-600 shrink-0"
        >
          +
        </button>

        {/* Max Bet — larger */}
        <button
          onClick={() => onBetChange(safeMax)}
          disabled={spinning || bet >= safeMax}
          className={`h-11 px-3 rounded-xl text-xs font-black active:scale-90 transition-all border uppercase shrink-0 ${
            bet >= safeMax
              ? "bg-gray-700 text-gray-500 border-gray-600 opacity-40"
              : "bg-amber-700 text-amber-100 border-amber-500/50"
          }`}
          title="Max bet capped at 20% of balance"
        >
          MAX
        </button>

        {/* SPIN Button */}
        <button
          onClick={onSpin}
          disabled={spinning}
          className={`flex-1 h-14 rounded-2xl font-black text-xl uppercase tracking-wider transition-all shadow-lg relative overflow-hidden ${
            spinning
              ? "bg-gray-600 text-gray-400 border-gray-500"
              : "bg-gradient-to-b from-red-500 via-red-600 to-red-800 text-white border-yellow-400/70 hover:brightness-110 active:scale-95"
          } border-2`}
          style={!spinning ? {
            boxShadow: "0 4px 0 #7f1d1d, 0 0 20px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          } : {}}
        >
          {/* Shine overlay */}
          {!spinning && (
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl pointer-events-none" />
          )}
          <span className="relative z-10">{spinning ? "⏳ SPINNING..." : "🎰 SPIN"}</span>
        </button>

        {/* Auto Spin */}
        <button
          onClick={onAutoSpinToggle}
          disabled={spinning && !autoSpin}
          className={`w-12 h-12 rounded-xl font-bold text-xs transition-all active:scale-90 border-2 shrink-0 ${
            autoSpin
              ? "bg-green-600 text-white border-green-400 animate-pulse"
              : "bg-gray-700 text-gray-300 border-gray-600"
          }`}
        >
          {autoSpin ? "⏸" : "▶▶"}
        </button>
      </div>
    </div>
  );
}