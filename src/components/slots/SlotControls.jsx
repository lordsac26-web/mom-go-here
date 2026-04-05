import { BET_LEVELS, PAYLINES } from "./slotConfig";

export default function SlotControls({
  balance,
  bet,
  onBetChange,
  activePaylines,
  onPaylinesChange,
  onSpin,
  spinning,
  autoSpin,
  onAutoSpinToggle,
  lastWin,
}) {
  const betIdx = BET_LEVELS.indexOf(bet);

  return (
    <div className="bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800 border-t-2 border-yellow-600/50 px-3 py-3 space-y-3">
      {/* Balance / Win / Bet row */}
      <div className="flex items-center justify-between text-sm font-bold">
        <div className="text-center">
          <div className="text-yellow-400/70 text-xs uppercase tracking-wider">Balance</div>
          <div className="text-yellow-300 text-lg tabular-nums">{balance.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-green-400/70 text-xs uppercase tracking-wider">Last Win</div>
          <div className={`text-lg tabular-nums ${lastWin > 0 ? "text-green-400" : "text-gray-500"}`}>
            {lastWin > 0 ? `+${lastWin.toLocaleString()}` : "—"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-cyan-400/70 text-xs uppercase tracking-wider">Total Bet</div>
          <div className="text-cyan-300 text-lg tabular-nums">{bet.toLocaleString()}</div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Bet adjustment */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onBetChange(BET_LEVELS[Math.max(0, betIdx - 1)])}
            disabled={spinning || betIdx === 0}
            className="w-9 h-9 rounded-lg bg-gray-700 text-white font-black text-lg disabled:opacity-30 active:scale-90 transition-all border border-gray-600"
          >
            −
          </button>
          <div className="w-16 text-center text-yellow-300 font-black text-sm">
            {bet.toLocaleString()}
          </div>
          <button
            onClick={() => onBetChange(BET_LEVELS[Math.min(BET_LEVELS.length - 1, betIdx + 1)])}
            disabled={spinning || betIdx === BET_LEVELS.length - 1}
            className="w-9 h-9 rounded-lg bg-gray-700 text-white font-black text-lg disabled:opacity-30 active:scale-90 transition-all border border-gray-600"
          >
            +
          </button>
        </div>

        {/* Lines */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPaylinesChange(Math.max(1, activePaylines - 5))}
            disabled={spinning || activePaylines <= 1}
            className="w-8 h-8 rounded-lg bg-gray-700 text-white font-bold text-xs disabled:opacity-30 active:scale-90 border border-gray-600"
          >
            −
          </button>
          <div className="text-center w-12">
            <div className="text-[10px] text-purple-400/70 uppercase">Lines</div>
            <div className="text-purple-300 font-black text-sm">{activePaylines}</div>
          </div>
          <button
            onClick={() => onPaylinesChange(Math.min(PAYLINES.length, activePaylines + 5))}
            disabled={spinning || activePaylines >= PAYLINES.length}
            className="w-8 h-8 rounded-lg bg-gray-700 text-white font-bold text-xs disabled:opacity-30 active:scale-90 border border-gray-600"
          >
            +
          </button>
        </div>

        {/* SPIN Button */}
        <button
          onClick={onSpin}
          disabled={spinning}
          className={`flex-1 h-14 rounded-2xl font-black text-xl uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
            spinning
              ? "bg-gray-600 text-gray-400"
              : "bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white hover:from-red-500 hover:to-orange-400 shadow-red-600/40"
          } border-2 ${spinning ? "border-gray-500" : "border-yellow-500/50"}`}
        >
          {spinning ? "🎰 ..." : "🎰 SPIN"}
        </button>

        {/* Auto Spin */}
        <button
          onClick={onAutoSpinToggle}
          disabled={spinning && !autoSpin}
          className={`w-12 h-12 rounded-xl font-bold text-xs transition-all active:scale-90 border-2 ${
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