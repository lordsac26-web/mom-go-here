import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import SlotReel from "./SlotReel";
import { PAYLINES } from "./slotConfig";

/**
 * Free Spins bonus round. Auto-spins N times with a random escalating multiplier.
 * Scatters during free spins grant extra spins.
 *
 * All mutable game state is kept in refs to avoid stale-closure bugs.
 * React state is used only for rendering.
 */

export default function FreeSpinsBonus({ machine, baseWin, scatterCount, onComplete }) {
  const allSymbols = [...machine.symbols, machine.wild, machine.scatter];

  const buildStrip = () => {
    const strip = [];
    allSymbols.forEach(sym => {
      for (let i = 0; i < sym.weight; i++) strip.push(sym);
    });
    for (let i = strip.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [strip[i], strip[j]] = [strip[j], strip[i]];
    }
    return strip;
  };

  // Build weighted pool so rare symbols stay rare during free spins
  function buildWeightedPool() {
    const pool = [];
    allSymbols.forEach(sym => {
      for (let i = 0; i < sym.weight; i++) pool.push(sym);
    });
    return pool;
  }
  const weightedPool = buildWeightedPool();

  function generateGrid() {
    const g = [];
    for (let r = 0; r < 5; r++) {
      const col = [];
      for (let row = 0; row < 3; row++) {
        col.push(weightedPool[Math.floor(Math.random() * weightedPool.length)]);
      }
      g.push(col);
    }
    return g;
  }

  const initialFreeSpins = scatterCount >= 5 ? 15 : scatterCount >= 4 ? 10 : 7;

  // ── Refs for mutable game state (avoids stale closures) ──
  const totalFreeSpinsRef = useRef(initialFreeSpins);
  const currentSpinRef = useRef(0);
  const spinningRef = useRef(false);
  const multiplierRef = useRef(1);
  const totalWinRef = useRef(0);
  const reelsStopped = useRef(0);
  const nextGridRef = useRef(null);
  const autoTimerRef = useRef(null);

  // ── React state for rendering only ──
  const [reelStrip] = useState(buildStrip);
  const [grid, setGrid] = useState(generateGrid);
  const [spinning, setSpinning] = useState(false);
  const [totalFreeSpins, setTotalFreeSpins] = useState(initialFreeSpins);
  const [currentSpin, setCurrentSpin] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [spinResult, setSpinResult] = useState(null);
  const [extraSpinsMsg, setExtraSpinsMsg] = useState(null);
  const [phase, setPhase] = useState("playing"); // playing | done
  const containerRef = useRef(null);

  // ── Entrance animation + auto-start ──
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }
      );
    }
    const timer = setTimeout(() => doSpin(), 1500);
    return () => {
      clearTimeout(timer);
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  // ── Win checker ──
  function checkFreeSpinWins(g) {
    let totalWin = 0;
    let scatters = 0;
    const wins = [];

    for (let r = 0; r < 5; r++) {
      for (let row = 0; row < 3; row++) {
        if (g[r][row].id === "scatter") scatters++;
      }
    }

    if (scatters >= 3) {
      totalWin += baseWin * (scatters === 3 ? 2 : scatters === 4 ? 5 : 15);
      wins.push({ type: "scatter", count: scatters });
    }

    const lineBet = Math.max(1, Math.round(baseWin / 20));
    for (let i = 0; i < 20; i++) {
      const line = PAYLINES[i];
      const lineSymbols = line.map((row, reel) => g[reel][row]);

      let matchSym = lineSymbols[0].id === "wild" ? null : lineSymbols[0].id;
      let matchCount = 0;

      for (let r = 0; r < 5; r++) {
        const sym = lineSymbols[r];
        if (sym.id === "wild") { matchCount++; if (!matchSym) continue; }
        else if (!matchSym) { matchSym = sym.id; matchCount++; }
        else if (sym.id === matchSym) { matchCount++; }
        else break;
      }

      if (matchCount >= 3 && matchSym) {
        const symDef = machine.symbols.find(s => s.id === matchSym) || machine.wild;
        let payout = 0;
        if (matchCount === 3) payout = lineBet * symDef.multiplier * 0.3;
        else if (matchCount === 4) payout = lineBet * symDef.multiplier * 0.7;
        else payout = lineBet * symDef.multiplier;
        payout = Math.round(payout);
        if (payout > 0) {
          totalWin += payout;
          wins.push({ type: "line", lineIndex: i, payout });
        }
      }
    }

    return { totalWin, wins, scatters };
  }

  // ── Core spin function (reads refs, not state) ──
  function doSpin() {
    if (spinningRef.current) return;
    if (currentSpinRef.current >= totalFreeSpinsRef.current) {
      setPhase("done");
      return;
    }

    spinningRef.current = true;
    setSpinning(true);
    setSpinResult(null);
    setExtraSpinsMsg(null);
    reelsStopped.current = 0;

    // Escalate multiplier every 2 spins, cap at 10x
    const spinNum = currentSpinRef.current + 1;
    if (spinNum % 2 === 0 && multiplierRef.current < 10) {
      multiplierRef.current += 1;
      setCurrentMultiplier(multiplierRef.current);
    }

    const newGrid = generateGrid();
    nextGridRef.current = newGrid;
    setGrid(newGrid);
  }

  // ── Reel stop handler (reads refs, never stale) ──
  const handleReelStop = useCallback(() => {
    reelsStopped.current += 1;
    if (reelsStopped.current < 5) return;

    setTimeout(() => {
      const g = nextGridRef.current;
      if (!g) return;

      const result = checkFreeSpinWins(g);
      const multipliedWin = Math.round(result.totalWin * multiplierRef.current);

      // Update refs
      totalWinRef.current += multipliedWin;
      currentSpinRef.current += 1;
      spinningRef.current = false;

      // Update render state
      setSpinResult({ ...result, multipliedWin });
      setTotalWinnings(totalWinRef.current);
      setCurrentSpin(currentSpinRef.current);
      setSpinning(false);

      // Handle extra scatters
      if (result.scatters >= 3) {
        const extra = result.scatters >= 5 ? 5 : result.scatters >= 4 ? 3 : 2;
        totalFreeSpinsRef.current += extra;
        setTotalFreeSpins(totalFreeSpinsRef.current);
        setExtraSpinsMsg(`+${extra} Extra Free Spins!`);
      }

      // Check if we're done
      if (currentSpinRef.current >= totalFreeSpinsRef.current) {
        setTimeout(() => setPhase("done"), 1200);
      } else {
        // Schedule next spin
        autoTimerRef.current = setTimeout(() => doSpin(), 1200);
      }
    }, 200);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-start sm:items-center justify-center px-4 overflow-y-auto py-4">
      <div ref={containerRef} className="w-full max-w-sm" style={{ opacity: 0 }}>
        {/* Header */}
        <div className="text-center mb-3">
          <div className="text-4xl mb-1">🎰</div>
          <h2 className="text-2xl font-black text-yellow-400">FREE SPINS!</h2>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs font-bold">
            <span className="text-cyan-400">
              Spin {Math.min(currentSpin + 1, totalFreeSpins)}/{totalFreeSpins}
            </span>
            <span className="text-yellow-400">
              {currentMultiplier}x Multiplier
            </span>
            <span className="text-green-400">
              Won: {totalWinnings.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Multiplier bar */}
        <div className="flex items-center justify-center gap-1 mb-3 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(m => (
            <div
              key={m}
              className={`px-2 py-1 rounded-lg text-xs font-black border transition-all ${
                m === currentMultiplier
                  ? "bg-yellow-500 text-gray-900 border-yellow-300 scale-110 shadow-lg"
                  : m < currentMultiplier
                  ? "bg-yellow-900/40 text-yellow-400 border-yellow-700"
                  : "bg-gray-800 text-gray-500 border-gray-700"
              }`}
            >
              {m}x
            </div>
          ))}
        </div>

        {/* Extra spins message */}
        {extraSpinsMsg && (
          <div className="text-center mb-2">
            <span className="bg-green-600 text-white text-sm font-black px-4 py-1 rounded-full animate-pulse">
              ✨ {extraSpinsMsg}
            </span>
          </div>
        )}

        {/* Mini reel display */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-yellow-600/60 rounded-2xl p-3 shadow-lg mb-3">
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, reelIdx) => (
              <SlotReel
                key={reelIdx}
                symbols={reelStrip}
                spinning={spinning}
                finalSymbols={grid[reelIdx]}
                reelIndex={reelIdx}
                onStop={handleReelStop}
              />
            ))}
          </div>

          {/* Spin result flash */}
          {spinResult && spinResult.multipliedWin > 0 && !spinning && (
            <div className="text-center mt-2 py-2 bg-green-600/20 rounded-xl border border-green-500/40">
              <span className="text-green-400 font-black text-lg">
                +{spinResult.multipliedWin.toLocaleString()}
              </span>
              {currentMultiplier > 1 && (
                <span className="text-yellow-400 text-xs font-bold ml-2">
                  ({currentMultiplier}x mult!)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Done panel */}
        {phase === "done" && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-2xl py-5 px-4 border-2 border-yellow-300 text-center">
              <div className="text-sm font-bold text-yellow-900 uppercase">Free Spins Complete!</div>
              <div className="text-4xl font-black text-gray-900 tabular-nums mt-2">
                +{totalWinnings.toLocaleString()}
              </div>
              <div className="text-xs text-yellow-900/70 mt-1">
                {currentSpin} spins completed
              </div>
            </div>

            <button
              onClick={() => onComplete(totalWinnings)}
              className="w-full text-xl font-black py-5 rounded-2xl border-2 transition-transform active:scale-95 bg-green-600 text-white border-green-400 animate-pulse"
            >
              💰 Collect +{totalWinnings.toLocaleString()} & Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
}