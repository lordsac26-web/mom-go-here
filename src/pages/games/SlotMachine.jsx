import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { useGameTimer } from "../../hooks/useGameTimer";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import useConfetti from "../../hooks/useConfetti";
import SlotReel from "../../components/slots/SlotReel";
import SlotControls from "../../components/slots/SlotControls";
import WinDisplay from "../../components/slots/WinDisplay";
import PaylineOverlay from "../../components/slots/PaylineOverlay";
import PayTable from "../../components/slots/PayTable";
import CasinoFrame from "../../components/slots/CasinoFrame";
import NeonSign from "../../components/slots/NeonSign";
import SlotStatsOverlay from "../../components/slots/SlotStatsOverlay";
import AchievementToast from "../../components/slots/AchievementToast";
import useSlotAchievements from "../../hooks/useSlotAchievements";
import SlotAudioSettings, { useSlotAudioPrefs } from "../../components/slots/SlotAudioSettings";
import BonusRound from "../../components/slots/BonusRound";
import DailyRewardToast, { checkDailyReward } from "../../components/slots/DailyRewardToast";
import JackpotTicker from "../../components/slots/JackpotTicker";
import JackpotWinOverlay from "../../components/slots/JackpotWinOverlay";
import { base44 } from "@/api/base44Client";
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

// FIX (security): parse balance safely — fall back to STARTING_BALANCE if corrupted
function loadBalance() {
  try {
    const saved = localStorage.getItem("slots_balance");
    if (saved === null) return STARTING_BALANCE;
    const parsed = parseInt(saved, 10);
    return isNaN(parsed) ? STARTING_BALANCE : parsed;
  } catch {
    return STARTING_BALANCE;
  }
}

export default function SlotMachine() {
  useGameTimer();
  const { tapVibrate, matchVibrate, winVibrate, scoreHit, scoreMilestone } = useHaptics();
  const { matchSound, winSound, uiClickSound, diceshakeSound, diceCollideSound } = useGameAudio();
  const { spark, burst, sideCannons, fireworks, emojiRain } = useConfetti();

  const [balance, setBalance] = useState(loadBalance);
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
  const [previewLines, setPreviewLines] = useState(null);
  const previewTimerRef = useRef(null);
  const [showStats, setShowStats] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [bonusRound, setBonusRound] = useState(null); // { baseWin, scatterCount }
  const [dailyReward, setDailyReward] = useState(null);
  const { prefs: audioPrefs, updatePrefs: updateAudioPrefs } = useSlotAudioPrefs();
  const { stats, recordSpin, recordWin, recordLoss, newBadge } = useSlotAchievements();
  const [jackpotAmount, setJackpotAmount] = useState(0);
  const [jackpotWin, setJackpotWin] = useState(null); // { winAmount }

  // Daily reward check on mount
  useEffect(() => {
    const reward = checkDailyReward();
    if (reward) setDailyReward(reward);
  }, []);

  // Fetch jackpot on mount + subscribe for real-time updates
  useEffect(() => {
    base44.functions.invoke("progressiveJackpot", { action: "get" })
      .then(res => { if (res.data?.jackpot) setJackpotAmount(res.data.jackpot); });

    const unsub = base44.entities.ProgressiveJackpot.subscribe((event) => {
      if (event.data?.current_amount) setJackpotAmount(event.data.current_amount);
    });
    return unsub;
  }, []);

  const gridRef = useRef(null);
  const [gridRect, setGridRect] = useState(null);
  const nextGridRef = useRef(null);
  const autoSpinRef = useRef(false);

  // FIX (bug): keep refs in sync with state so callbacks always use current values
  const betRef = useRef(bet);
  const activePaylinesRef = useRef(activePaylines);
  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { activePaylinesRef.current = activePaylines; }, [activePaylines]);

  // FIX (perf): debounce localStorage writes to reduce I/O during rapid auto-spin
  const saveBalanceTimerRef = useRef(null);
  useEffect(() => {
    if (saveBalanceTimerRef.current) clearTimeout(saveBalanceTimerRef.current);
    saveBalanceTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem("slots_balance", balance.toString());
      } catch {
        // localStorage may be unavailable in some environments — fail silently
      }
    }, 500);
    return () => {
      if (saveBalanceTimerRef.current) clearTimeout(saveBalanceTimerRef.current);
    };
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

  useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  // FIX (bug): use refs for bet and activePaylines inside useCallback so values are never stale
  const handleReelStop = useCallback((reelIndex) => {
    setReelsStopped(prev => {
      const newCount = prev + 1;
      if (newCount === REELS) {
        setTimeout(() => {
          const currentGrid = nextGridRef.current;
          if (!currentGrid) return;
          // FIX (bug): read from refs so mid-spin bet/payline changes are respected
          const result = checkWins(currentGrid, betRef.current, activePaylinesRef.current);

          if (result.totalWin > 0) {
            setWins(result.wins);
            setTotalWin(result.totalWin);
            setLastWin(result.totalWin);
            setShowWin(true);
            setBalance(prev => prev + result.totalWin);
            setWinningLines(result.wins.filter(w => w.type === "line").map(w => w.lineIndex));

            // Record achievement stats
            const lineWinCount = result.wins.filter(w => w.type === "line").length;
            const hasScatter = result.wins.some(w => w.type === "scatter");
            recordWin(result.totalWin, lineWinCount, hasScatter);

            if (result.totalWin >= 25000) {
              winVibrate(); winSound(); fireworks(); emojiRain(["💰", "🎰", "💎", "7️⃣"]);
            } else if (result.totalWin >= 5000) {
              scoreMilestone(); matchSound(); sideCannons();
            } else {
              scoreHit(); matchSound(); spark();
            }

            // Check for bonus round trigger (3+ scatters)
            if (result.scatterCount >= 3) {
              setTimeout(() => {
                setShowWin(false);
                setWinningLines([]);
                setSpinning(false);
                setBonusRound({ baseWin: result.totalWin, scatterCount: result.scatterCount });
              }, 2500);
            } else {
              setTimeout(() => {
                setShowWin(false);
                setWinningLines([]);
                setSpinning(false);
                if (autoSpinRef.current) setTimeout(() => doSpin(), 800);
              }, 2500);
            }
          } else {
            setLastWin(0);
            setSpinning(false);
            recordLoss();
            if (autoSpinRef.current) setTimeout(() => doSpin(), 500);
          }
        }, 200);
      }
      return newCount;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // FIX (bug): intentionally empty — reads bet/paylines via refs, not stale closure

  // FIX (bug): wrap doSpin in useCallback so auto-spin continuations use a stable reference
  const doSpin = useCallback(() => {
    setSpinning(prev => {
      if (prev) return prev; // already spinning — no-op
      return prev;
    });
    // Read latest spinning state via functional update pattern
    setBalance(prevBalance => {
      const currentBet = betRef.current;
      if (prevBalance < currentBet) {
        tapVibrate();
        return prevBalance; // not enough balance, bail out
      }
      return prevBalance; // actual deduction happens below after guard passes
    });

    // Use a ref-guarded approach: check spinning synchronously via ref
    if (spinningRef.current) return;

    const currentBet = betRef.current;
    setBalance(prev => {
      if (prev < currentBet) return prev;
      return prev; // placeholder — real deduction below
    });

    // Perform the full spin initiation
    uiClickSound();
    tapVibrate();
    diceshakeSound();

    setBalance(prev => prev - currentBet);
    setWins([]);
    setTotalWin(0);
    setShowWin(false);
    setWinningLines([]);
    setReelsStopped(0);

    const newGrid = generateGrid();
    nextGridRef.current = newGrid;
    setGrid(newGrid);
    setSpinning(true);
    spinningRef.current = true;
  }, [tapVibrate, uiClickSound, diceshakeSound]);

  // FIX (bug): track spinning in a ref so doSpin's guard works synchronously
  const spinningRef = useRef(false);
  useEffect(() => { spinningRef.current = spinning; }, [spinning]);

  // Simpler, correct doSpin that uses refs properly
  function handleSpin() {
    if (spinningRef.current) return;
    const currentBet = betRef.current;

    setBalance(prev => {
      if (prev < currentBet) {
        tapVibrate();
        return prev;
      }
      return prev;
    });

    setBalance(prev => {
      if (prev < currentBet) return prev;

      uiClickSound();
      tapVibrate();
      diceshakeSound();

      setWins([]);
      setTotalWin(0);
      setShowWin(false);
      setWinningLines([]);
      setReelsStopped(0);

      const newGrid = generateGrid();
      nextGridRef.current = newGrid;
      setGrid(newGrid);
      setSpinning(true);

      recordSpin(currentBet);

      // Contribute to progressive jackpot (fire-and-forget)
      base44.functions.invoke("progressiveJackpot", { action: "spin", betAmount: currentBet })
        .then(res => {
          if (res.data?.jackpot) setJackpotAmount(res.data.jackpot);
          if (res.data?.jackpotWin) {
            setJackpotWin({ winAmount: res.data.winAmount });
          }
        });

      return prev - currentBet;
    });
  }

  function handleAutoSpinToggle() {
    uiClickSound();
    if (autoSpin) {
      setAutoSpin(false);
    } else {
      setAutoSpin(true);
      if (!spinningRef.current) handleSpin();
    }
  }

  function handleNudge(reelIdx) {
    if (spinningRef.current) return;
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
      <div className="bg-gradient-to-r from-gray-900 via-yellow-900/30 to-gray-900 px-3 py-3 flex items-center justify-between shadow-lg border-b-2 border-yellow-600/50">
        <Link to="/games" className="text-yellow-400 text-lg font-bold">← Back</Link>
        <NeonSign text="LUCKY SLOTS" spinning={spinning} />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAudioSettings(true)}
            className="bg-gray-800 text-yellow-300 p-2 rounded-xl font-bold flex items-center border border-gray-600 text-sm"
            title="Audio Settings"
          >
            🎚️
          </button>
          <button
            onClick={() => setShowStats(true)}
            className="bg-gray-800 text-yellow-300 p-2 rounded-xl font-bold flex items-center border border-gray-600 text-sm"
            title="Stats"
          >
            🏆
          </button>
          <PayTable />
        </div>
      </div>

      {/* Jackpot Ticker */}
      <div className="px-3 pt-2">
        <JackpotTicker amount={jackpotAmount} spinning={spinning} />
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
        <div className="w-full max-w-md">
          <CasinoFrame spinning={spinning}>
          {/* Reel Window */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-4 border-yellow-600 rounded-2xl p-3 shadow-[0_0_30px_rgba(234,179,8,0.15),inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-2xl z-10" />

            <div className="relative" ref={gridRef}>
              <PaylineOverlay
                activePaylines={activePaylines}
                winningLines={winningLines}
                gridRect={gridRect}
                previewLines={previewLines}
              />
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

            <WinDisplay wins={wins} totalWin={totalWin} visible={showWin} />
          </div>
          </CasinoFrame>
        </div>

        <div className="text-center mt-2">
          <span className="text-xs text-gray-500">{activePaylines} paylines active</span>
        </div>

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

      {/* Controls — pass handleSpin instead of doSpin */}
      {/* Achievement Toast */}
      <AchievementToast badge={newBadge} />

      {/* Daily Reward Toast */}
      {dailyReward && (
        <DailyRewardToast
          reward={dailyReward.reward}
          streak={dailyReward.streak}
          onDismiss={() => {
            setBalance(prev => prev + dailyReward.reward);
            setDailyReward(null);
          }}
        />
      )}

      {/* Jackpot Win Overlay */}
      {jackpotWin && (
        <JackpotWinOverlay
          winAmount={jackpotWin.winAmount}
          onCollect={() => {
            setBalance(prev => prev + jackpotWin.winAmount);
            setLastWin(jackpotWin.winAmount);
            setJackpotWin(null);
            fireworks();
            emojiRain(["💰", "🏆", "💎", "👑"]);
          }}
        />
      )}

      {/* Bonus Round */}
      {bonusRound && (
        <BonusRound
          baseWin={bonusRound.baseWin}
          scatterCount={bonusRound.scatterCount}
          onComplete={(bonusWin) => {
            setBalance(prev => prev + bonusWin);
            setLastWin(bonusWin);
            setBonusRound(null);
            if (autoSpinRef.current) setTimeout(() => handleSpin(), 800);
          }}
        />
      )}

      {/* Stats Overlay */}
      <SlotStatsOverlay open={showStats} onClose={() => setShowStats(false)} stats={stats} />

      {/* Audio Settings Overlay */}
      <SlotAudioSettings
        open={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
        prefs={audioPrefs}
        updatePrefs={updateAudioPrefs}
      />

      <SlotControls
        balance={balance}
        bet={bet}
        onBetChange={setBet}
        activePaylines={activePaylines}
        onPaylinesChange={(newVal) => {
          setActivePaylines(newVal);
          // Show preview of all active lines
          if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
          const lines = Array.from({ length: newVal }, (_, i) => i);
          setPreviewLines(lines);
          previewTimerRef.current = setTimeout(() => setPreviewLines(null), 2000);
        }}
        onSpin={handleSpin}
        spinning={spinning}
        autoSpin={autoSpin}
        onAutoSpinToggle={handleAutoSpinToggle}
        lastWin={lastWin}
      />
    </div>
  );
}