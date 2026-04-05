import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGameTimer } from "../../hooks/useGameTimer";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import useConfetti from "../../hooks/useConfetti";
import SlotReel from "../../components/slots/SlotReel";
import SlotControls from "../../components/slots/SlotControls";
import WinDisplay from "../../components/slots/WinDisplay";
import PaylineOverlay from "../../components/slots/PaylineOverlay";
import PayTable from "../../components/slots/PayTable";
import {
  ALL_SYMBOLS, REELS, ROWS, BET_LEVELS,
  STARTING_BALANCE, TOPOFF_THRESHOLD, TOPOFF_AMOUNT,
  buildReelStrip, checkWins,
} from "../../components/slots/slotConfig";

function getRandomSymbols(count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]);
  }
  return result;
}

function generateGrid() {
  const grid = [];
  for (let r = 0; r < REELS; r++) {
    grid.push(getRandomSymbols(ROWS));
  }
  return grid;
}

export default function SlotMachine() {
  useGameTimer();
  const { tapVibrate, matchVibrate, winVibrate, scoreHit, scoreMilestone } = useHaptics();
  const { matchSound, winSound, uiClickSound, diceshakeSound, diceCollideSound } = useGameAudio();
  const { spark, burst, sideCannons, fireworks, emojiRain } = useConfetti();

  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("slots_balance");
    return saved ? parseInt(saved) : STARTING_BALANCE;
  });
  const [bet, setBet] = useState(BET_LEVELS[1]);
  const [activePaylines, setActivePaylines] = useState(20);
  const [grid, setGrid] = useState(generateGrid);
  const [spinning, setSpinning] = useState(false);
  const [reelsStopped, setReelsStopped] = useState(0);
  const [wins, setWins] = useState([]);
  const [totalWin, setTotalWin] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [winningLines, setWinningLines] = useState([]);
  const [autoSpin, setAutoSpin] = useState(false);
  const [topOffMessage, setTopOffMessage] = useState(false);
  const [reelStrip] = useState(buildReelStrip);

  const gridRef = useRef(null);
  const [gridRect, setGridRect] = useState(null);
  const nextGridRef = useRef(null);
  const autoSpinRef = useRef(false);

  // Persist balance
  useEffect(() => {
    localStorage.setItem("slots_balance", balance.toString());
  }, [balance]);

  // Measure grid for payline overlay
  useEffect(() => {
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      setGridRect({ width: rect.width, height: rect.height });
    }
  }, [grid]);

  // Auto top-off when balance gets low
  useEffect(() => {
    const threshold = STARTING_BALANCE * TOPOFF_THRESHOLD;
    if (balance > 0 && balance <= threshold && !spinning) {
      setBalance(prev => prev + TOPOFF_AMOUNT);
      setTopOffMessage(true);
      setTimeout(() => setTopOffMessage(false), 3000);
    }
  }, [balance, spinning]);

  // Keep autoSpin ref in sync
  useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  const handleReelStop = useCallback((reelIndex) => {
    setReelsStopped(prev => {
      const newCount = prev + 1;
      if (newCount === REELS) {
        // All reels stopped — check wins
        setTimeout(() => {
          const currentGrid = nextGridRef.current;
          if (!currentGrid) return;
          const result = checkWins(currentGrid, bet, activePaylines);

          if (result.totalWin > 0) {
            setWins(result.wins);
            setTotalWin(result.totalWin);
            setLastWin(result.totalWin);
            setShowWin(true);
            setBalance(prev => prev + result.totalWin);
            setWinningLines(result.wins.filter(w => w.type === "line").map(w => w.lineIndex));

            // Effects based on win size
            if (result.totalWin >= 25000) {
              winVibrate();
              winSound();
              fireworks();
              emojiRain(["💰", "🎰", "💎", "7️⃣"]);
            } else if (result.totalWin >= 5000) {
              scoreMilestone();
              matchSound();
              sideCannons();
            } else {
              scoreHit();
              matchSound();
              spark();
            }

            setTimeout(() => {
              setShowWin(false);
              setWinningLines([]);
              setSpinning(false);
              // Auto-spin continue
              if (autoSpinRef.current) {
                setTimeout(() => doSpin(), 800);
              }
            }, 2500);
          } else {
            setLastWin(0);
            setSpinning(false);
            // Auto-spin continue
            if (autoSpinRef.current) {
              setTimeout(() => doSpin(), 500);
            }
          }
        }, 200);
      }
      return newCount;
    });
  }, [bet, activePaylines]);

  function doSpin() {
    if (spinning) return;
    if (balance < bet) {
      tapVibrate();
      return;
    }

    uiClickSound();
    tapVibrate();
    diceshakeSound();

    // Deduct bet
    setBalance(prev => prev - bet);
    setWins([]);
    setTotalWin(0);
    setShowWin(false);
    setWinningLines([]);
    setReelsStopped(0);

    // Generate next grid
    const newGrid = generateGrid();
    nextGridRef.current = newGrid;
    setGrid(newGrid);
    setSpinning(true);
  }

  function handleAutoSpinToggle() {
    uiClickSound();
    if (autoSpin) {
      setAutoSpin(false);
    } else {
      setAutoSpin(true);
      if (!spinning) doSpin();
    }
  }

  // Nudge feature: tap a reel to nudge it one symbol
  function handleNudge(reelIdx) {
    if (spinning) return;
    // Visual fun only — shift symbols
    uiClickSound();
    tapVibrate();
    setGrid(prev => {
      const newGrid = [...prev];
      const reel = [...newGrid[reelIdx]];
      const nudged = [reel[2], reel[0], reel[1]];
      newGrid[reelIdx] = nudged;
      return newGrid;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 px-3 py-2 flex items-center justify-between shadow-lg">
        <Link to="/games" className="text-gray-900 text-lg font-bold">← Back</Link>
        <div className="text-center">
          <div className="text-2xl font-black text-gray-900 tracking-tight">🎰 Lucky Slots</div>
        </div>
        <PayTable />
      </div>

      {/* Top-off notification */}
      <AnimatePresence>
        {topOffMessage && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white text-center py-3 px-4 font-bold text-lg shadow-lg"
          >
            🎁 Lucky Top-Off! +{TOPOFF_AMOUNT.toLocaleString()} points added!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Machine Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 py-4 relative">
        {/* Machine Frame */}
        <div className="w-full max-w-md">
          {/* Marquee lights */}
          <div className="flex justify-center gap-1.5 mb-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ["#ef4444", "#eab308", "#22c55e", "#3b82f6", "#ec4899"][i % 5] }}
              />
            ))}
          </div>

          {/* Reel Window */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-4 border-yellow-600 rounded-2xl p-3 shadow-2xl relative overflow-hidden">
            {/* Glass reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-2xl z-10" />

            {/* Payline overlay */}
            <div className="relative" ref={gridRef}>
              <PaylineOverlay
                activePaylines={activePaylines}
                winningLines={winningLines}
                gridRect={gridRect}
              />

              {/* Reels */}
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {Array.from({ length: REELS }).map((_, reelIdx) => (
                  <div key={reelIdx} onClick={() => handleNudge(reelIdx)} className="cursor-pointer">
                    <SlotReel
                      symbols={reelStrip}
                      spinning={spinning}
                      finalSymbols={grid[reelIdx]}
                      reelIndex={reelIdx}
                      onStop={handleReelStop}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Row indicators */}
            <div className="absolute left-0 top-3 bottom-3 w-2 flex flex-col justify-around">
              {[0, 1, 2].map(r => (
                <div key={r} className="w-2 h-2 rounded-full bg-yellow-500/60" />
              ))}
            </div>
            <div className="absolute right-0 top-3 bottom-3 w-2 flex flex-col justify-around">
              {[0, 1, 2].map(r => (
                <div key={r} className="w-2 h-2 rounded-full bg-yellow-500/60" />
              ))}
            </div>

            {/* Win display overlay */}
            <WinDisplay wins={wins} totalWin={totalWin} visible={showWin} />
          </div>

          {/* Bottom marquee */}
          <div className="flex justify-center gap-1.5 mt-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ["#ec4899", "#3b82f6", "#22c55e", "#eab308", "#ef4444"][i % 5] }}
              />
            ))}
          </div>
        </div>

        {/* Active paylines indicator */}
        <div className="text-center mt-2">
          <span className="text-xs text-gray-500">{activePaylines} paylines active</span>
        </div>

        {/* Recent wins ticker */}
        {lastWin > 0 && !showWin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-1"
          >
            <span className="text-green-400 text-lg font-bold">Last win: +{lastWin.toLocaleString()}</span>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <SlotControls
        balance={balance}
        bet={bet}
        onBetChange={setBet}
        activePaylines={activePaylines}
        onPaylinesChange={setActivePaylines}
        onSpin={doSpin}
        spinning={spinning}
        autoSpin={autoSpin}
        onAutoSpinToggle={handleAutoSpinToggle}
        lastWin={lastWin}
      />
    </div>
  );
}