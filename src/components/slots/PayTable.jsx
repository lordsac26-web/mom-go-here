import { useState } from "react";
import { X, HelpCircle } from "lucide-react";
import { SYMBOLS, WILD, SCATTER, PAYLINES, PAYLINE_COLORS } from "./slotConfig";

export default function PayTable() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-700 text-yellow-300 px-3 py-2 rounded-xl font-bold flex items-center gap-1 border border-gray-600"
      >
        <HelpCircle size={18} /> <span className="text-sm">Pay Table</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={() => setOpen(false)}>
          <div
            className="bg-gray-900 border-2 border-yellow-600 rounded-3xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-yellow-400">💰 Pay Table</h2>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-gray-800">
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* Special symbols */}
            <div className="mb-4">
              <h3 className="text-lg font-black text-purple-400 mb-2">Special Symbols</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                  <span className="text-3xl">{WILD.emoji}</span>
                  <div>
                    <div className="font-bold text-white">WILD</div>
                    <div className="text-sm text-gray-400">Substitutes for any symbol (except Scatter)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                  <span className="text-3xl">{SCATTER.emoji}</span>
                  <div>
                    <div className="font-bold text-white">SCATTER</div>
                    <div className="text-sm text-gray-400">3+ anywhere: 5x/20x/100x total bet</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regular symbols */}
            <h3 className="text-lg font-black text-yellow-400 mb-2">Symbol Payouts (per line bet)</h3>
            <div className="space-y-1.5 mb-4">
              {SYMBOLS.map(sym => (
                <div key={sym.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sym.emoji}</span>
                    <span className="text-white font-bold text-sm">{sym.name}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-gray-400">5×</span>
                    <span className="text-yellow-300 font-bold ml-1">{sym.multiplier}x</span>
                    <span className="text-gray-500 ml-2">4×</span>
                    <span className="text-yellow-200 font-bold ml-1">{Math.round(sym.multiplier * 0.7)}x</span>
                    <span className="text-gray-500 ml-2">3×</span>
                    <span className="text-yellow-100 font-bold ml-1">{Math.round(sym.multiplier * 0.3)}x</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Paylines mini display */}
            <h3 className="text-lg font-black text-cyan-400 mb-2">Paylines ({PAYLINES.length} Total)</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {PAYLINES.map((line, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-1 flex flex-col items-center">
                  <div className="text-[10px] font-bold mb-0.5" style={{ color: PAYLINE_COLORS[i] }}>L{i + 1}</div>
                  <div className="grid grid-cols-5 gap-px">
                    {line.map((row, reel) => (
                      Array.from({ length: 3 }).map((_, r) => (
                        <div
                          key={`${reel}-${r}`}
                          className="w-1.5 h-1.5 rounded-sm"
                          style={{
                            backgroundColor: r === row ? PAYLINE_COLORS[i] : "rgba(255,255,255,0.1)"
                          }}
                        />
                      ))
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full mt-4 bg-yellow-500 text-gray-900 text-xl font-black py-4 rounded-2xl"
            >
              Got it! 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}