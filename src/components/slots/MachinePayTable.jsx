import { useState } from "react";
import { X, HelpCircle } from "lucide-react";
import { PAYLINES, PAYLINE_COLORS } from "./slotConfig";

/**
 * Machine-specific pay table that shows symbols/payouts for the active machine.
 */
export default function MachinePayTable({ machine }) {
  const [open, setOpen] = useState(false);

  if (!machine) return null;

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
              <h2 className="text-2xl font-black text-yellow-400">{machine.emoji} {machine.name}</h2>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-gray-800">
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* Machine info */}
            <div className="bg-gray-800 rounded-xl p-3 mb-4 text-sm text-gray-300">
              <p>{machine.description}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                  {machine.volatility.toUpperCase()} VOL
                </span>
                <span className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                  Bonus: {machine.bonusType === "boxes" ? "Mystery Boxes" : machine.bonusType === "plinko" ? "Plinko Drop" : "Free Spins"}
                </span>
              </div>
            </div>

            {/* Special symbols */}
            <div className="mb-4">
              <h3 className="text-lg font-black text-purple-400 mb-2">Special Symbols</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                  <span className="text-3xl">{machine.wild.emoji}</span>
                  <div>
                    <div className="font-bold text-white">{machine.wild.name}</div>
                    <div className="text-sm text-gray-400">Substitutes for any symbol (except Scatter)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                  <span className="text-3xl">{machine.scatter.emoji}</span>
                  <div>
                    <div className="font-bold text-white">{machine.scatter.name}</div>
                    <div className="text-sm text-gray-400">
                      3+ anywhere: triggers {machine.bonusType === "boxes" ? "Mystery Box" : machine.bonusType === "plinko" ? "Plinko" : "Free Spins"} bonus!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regular symbols */}
            <h3 className="text-lg font-black text-yellow-400 mb-2">Symbol Payouts (per line bet)</h3>
            <div className="space-y-1.5 mb-4">
              {machine.symbols.map(sym => (
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