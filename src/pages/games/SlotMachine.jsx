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
import CasinoFrame from "../../components/slots/CasinoFrame";
import NeonSign from "../../components/slots/NeonSign";
import SlotStatsOverlay from "../../components/slots/SlotStatsOverlay";
import AchievementToast from "../../components/slots/AchievementToast";
import useSlotAchievements from "../../hooks/useSlotAchievements";
import SlotAudioSettings, { useSlotAudioPrefs } from "../../components/slots/SlotAudioSettings";
import BonusRound from "../../components/slots/BonusRound";
import PlinkoBonus from "../../components/slots/PlinkoBonus";
import FreeSpinsBonus from "../../components/slots/FreeSpinsBonus";
import MachinePayTable from "../../components/slots/MachinePayTable";
import MachineSelectScreen from "../../components/slots/MachineSelectScreen";
import GameInstructions from "../../components/GameInstructions";
import JackpotTicker from "../../components/slots/JackpotTicker";
import JackpotWinOverlay from "../../components/slots/JackpotWinOverlay";
import { base44 } from "@/api/base44Client";
import {
  REELS, ROWS, BET_LEVELS,
  STARTING_BALANCE, TOPOFF_THRESHOLD,
  PAYLINES,
} from "../../components/slots/slotConfig";
import {
  getMachineById, getMachineAllSymbols,
  buildMachineReelStrip, loadGlobalStats, saveGlobalStats,
} from "../../components/slots/machineDefinitions";
import { getEffectiveBetLevels, EMERGENCY_THRESHOLD, EMERGENCY_DRIP_AMOUNT } from "../../components/slots/betScaling";
import LowBalanceWarning from "../../components/slots/LowBalanceWarning";
import { useGameActivity } from "../../hooks/useGameActivity";
import { useSlotSounds } from "../../hooks/useSlotSounds";
import { getLevelInfo } from "../../hooks/usePlayerXP";

function generateMachineGrid(machine) {
  const allSyms = getMachineAllSymbols(machine);
  const grid = [];
  for (let r = 0; r < REELS; r++) {
    const col = [];
    for (let row = 0; row < ROWS; row++) {
      col.push(allSyms[Math.floor(Math.random() * allSyms.length)]);
    }
    grid.push(col);
  }
  return grid;
}

function checkMachineWins(grid, bet, activePaylines, machine) {
  const wins = [];
  let totalWin = 0;
  let scatterCount = 0;

  for (let r = 0; r < REELS; r++) {
    for (let row = 0; row < ROWS; row++) {
      if (grid[r][row].id === "scatter") scatterCount++;
    }
  }

  if (scatterCount >= 3) {
    const scatterPay = scatterCount === 3 ? 5 : scatterCount === 4 ? 20 : 100;
    totalWin += bet * scatterPay;
    wins.push({ type: "scatter", count: scatterCount, payout: bet * scatterPay, positions: [] });
  }

  for (let i = 0; i < activePaylines; i++) {
    const line = PAYLINES[i];
    const lineSymbols = line.map((row, reel) => grid[reel][row]);
    let matchSymId = lineSymbols[0].id === "wild" ? null : lineSymbols[0].id;
    let matchCount = 0;
    const positions = [];

    for (let r = 0; r < REELS; r++) {
      const sym = lineSymbols[r];
      if (sym.id === "wild") {
        if (!matchSymId) { matchCount++; positions.push([r, line[r]]); continue; }
        matchCount++; positions.push([r, line[r]]);
      } else if (!matchSymId) {
        matchSymId = sym.id; matchCount++; positions.push([r, line[r]]);
      } else if (sym.id === matchSymId) {
        matchCount++; positions.push([r, line[r]]);
      } else break;
    }

    if (matchCount >= 3 && matchSymId) {
      const symDef = machine.symbols.find(s => s.id === matchSymId) || machine.wild;
      const lineBet = bet / activePaylines;
      let payout = 0;
      if (matchCount === 3) payout = lineBet * symDef.multiplier * 0.3;
      else if (matchCount === 4) payout = lineBet * symDef.multiplier * 0.7;
      else payout = lineBet * symDef.multiplier;
      payout = Math.round(payout);
      if (payout > 0) {
        totalWin += payout;
        wins.push({ type: "line", lineIndex: i, symbol: matchSymId, count: matchCount, payout, positions });
      }
    }
  }

  return { wins, totalWin, scatterCount };
}

function loadBalance() {
  try {
    const saved = localStorage.getItem("slots_balance");
    if (saved === null) return STARTING_BALANCE;
    const parsed = parseInt(saved, 10);
    return isNaN(parsed) ? STARTING_BALANCE : parsed;
  } catch { return STARTING_BALANCE; }
}

export default function SlotMachine() {
  useGameTimer();
  const { tapVibrate, winVibrate, scoreHit, scoreMilestone } = useHaptics();
  const { matchSound, winSound, uiClickSound, diceshakeSound } = useGameAudio();
  const { spark, sideCannons, fireworks, emojiRain } = useConfetti();
  const { reportWin: reportActivityWin, reportLoss: reportActivityLoss } = useGameActivity();
  const {
    leverPull, reelSpinStart, reelSpinStop, reelStopClick,
    coinClink, smallWinSound, mediumWinSound, bigWinSound,
    scatterSound, nudgeSound,
  } = useSlotSounds();

  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const machine = selectedMachineId ? getMachineById(selectedMachineId) : null;

  const [balance, setBalance] = useState(loadBalance);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [emergencyDripShown, setEmergencyDripShown] = useState(false);

  // Fetch player level on mount
  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user?.email) return;
      base44.entities.PlayerXP.filter({ user_email: user.email }).then(rows => {
        const totalXP = rows[0]?.total_xp || 0;
        setPlayerLevel(getLevelInfo(totalXP).level);
      });
    });
  }, []);

  // Compute effective bet levels based on player level
  const rawBetLevels = machine ? (machine.betLevels || BET_LEVELS) : BET_LEVELS;
  const machineBetLevels = getEffectiveBetLevels(rawBetLevels, playerLevel);
  const machineTopOff = machine ? (machine.topOffAmount || 50000) : 50000;
  const [bet, setBet] = useState(rawBetLevels[1] || rawBetLevels[0]);

  // Low balance state
  const isLowBalance = balance > 0 && balance < machineBetLevels[0] * 15;
  // Paylines locked at 20 for simplicity (audit recommendation)
  const activePaylines = 20;
  const [grid, setGrid] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [reelsStopped, setReelsStopped] = useState(0);
  const [wins, setWins] = useState([]);
  const [totalWin, setTotalWin] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [winningLines, setWinningLines] = useState([]);
  const [autoSpin, setAutoSpin] = useState(false);
  const [topOffMessage, setTopOffMessage] = useState(false);
  const [reelStrip, setReelStrip] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [bonusRound, setBonusRound] = useState(null);
  const [plinkoBonus, setPlinkoBonus] = useState(null);
  const [freeSpinsBonus, setFreeSpinsBonus] = useState(null);
  const { prefs: audioPrefs, updatePrefs: updateAudioPrefs } = useSlotAudioPrefs();
  const { stats, recordSpin, recordWin, recordLoss, newBadge } = useSlotAchievements();
  const [jackpotAmount, setJackpotAmount] = useState(0);
  const [jackpotWin, setJackpotWin] = useState(null);
  const spinCountRef = useRef(0);
  const pendingJackpotRef = useRef(0);

  const selectedMachineIdRef = useRef(selectedMachineId);
  useEffect(() => { selectedMachineIdRef.current = selectedMachineId; }, [selectedMachineId]);

  useEffect(() => {
    if (!machine) return;
    setGrid(generateMachineGrid(machine));
    setReelStrip(buildMachineReelStrip(machine));
    setEmergencyDripShown(false);
    // Reset bet to second tier of the effective (level-gated) bet levels
    const effective = getEffectiveBetLevels(machine.betLevels || BET_LEVELS, playerLevel);
    setBet(effective[1] || effective[0]);
  }, [selectedMachineId, playerLevel]);

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
  const betRef = useRef(bet);
  const activePaylinesRef = useRef(activePaylines);
  const sessionStartRef = useRef(Date.now());
  const sessionSpinsRef = useRef(0);
  const sessionWinsRef = useRef(0);
  const sessionEarnedRef = useRef(0);
  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { activePaylinesRef.current = activePaylines; }, [activePaylines]);

  const saveBalanceTimerRef = useRef(null);
  useEffect(() => {
    if (saveBalanceTimerRef.current) clearTimeout(saveBalanceTimerRef.current);
    saveBalanceTimerRef.current = setTimeout(() => {
      try { localStorage.setItem("slots_balance", balance.toString()); } catch {}
    }, 500);
    return () => { if (saveBalanceTimerRef.current) clearTimeout(saveBalanceTimerRef.current); };
  }, [balance]);

  useEffect(() => {
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      setGridRect({ width: rect.width, height: rect.height });
    }
  }, [grid]);

  useEffect(() => {
    // Scale top-off threshold relative to the machine's minimum bet so players always have enough spins
    const minBet = machineBetLevels[0] || 100;
    const dynamicThreshold = Math.max(STARTING_BALANCE * TOPOFF_THRESHOLD, minBet * 10);
    if (balance > 0 && balance <= dynamicThreshold && !spinning) {
      setBalance(prev => prev + machineTopOff);
      setTopOffMessage(true);
      setTimeout(() => setTopOffMessage(false), 3000);
    }
  }, [balance, spinning, machineTopOff, machineBetLevels]);

  // Emergency Fund: daily drip-feed when balance is critically low
  useEffect(() => {
    if (balance > EMERGENCY_THRESHOLD || emergencyDripShown || spinning) return;
    const today = new Date().toISOString().slice(0, 10);

    base44.auth.me().then(user => {
      if (!user?.email) return;
      base44.entities.EmergencyFund.filter({ user_email: user.email }).then(async records => {
        let record = records[0];
        if (record?.last_drip_date === today) return; // already dripped today

        if (!record) {
          record = await base44.entities.EmergencyFund.create({
            user_email: user.email,
            last_drip_date: today,
            total_drips: 1,
            total_drip_amount: EMERGENCY_DRIP_AMOUNT,
          });
        } else {
          await base44.entities.EmergencyFund.update(record.id, {
            last_drip_date: today,
            total_drips: (record.total_drips || 0) + 1,
            total_drip_amount: (record.total_drip_amount || 0) + EMERGENCY_DRIP_AMOUNT,
          });
        }
        setBalance(prev => prev + EMERGENCY_DRIP_AMOUNT);
        setEmergencyDripShown(true);
        setTopOffMessage(true);
        setTimeout(() => setTopOffMessage(false), 4000);
      });
    });
  }, [balance, spinning, emergencyDripShown]);

  useEffect(() => { autoSpinRef.current = autoSpin; }, [autoSpin]);

  const handleReelStop = useCallback((reelIndex) => {
    reelStopClick(reelIndex);
    setReelsStopped(prev => {
      const newCount = prev + 1;
      if (newCount === REELS) {
        reelSpinStop();
        setTimeout(() => {
          const currentGrid = nextGridRef.current;
          const currentMachine = getMachineById(selectedMachineIdRef.current);
          if (!currentGrid || !currentMachine) return;
          const result = checkMachineWins(currentGrid, betRef.current, activePaylinesRef.current, currentMachine);

          const gStats = loadGlobalStats();
          if (result.totalWin > 0) {
            gStats.totalWins += 1;
            gStats.totalEarned += result.totalWin;
            gStats.biggestWin = Math.max(gStats.biggestWin, result.totalWin);
            gStats.currentWinStreak += 1;
            gStats.bestWinStreak = Math.max(gStats.bestWinStreak, gStats.currentWinStreak);
            if (result.scatterCount >= 3) gStats.scatterWins = (gStats.scatterWins || 0) + 1;
          } else {
            gStats.currentWinStreak = 0;
          }
          saveGlobalStats(gStats);

          if (result.totalWin > 0) {
            setWins(result.wins);
            setTotalWin(result.totalWin);
            setLastWin(result.totalWin);
            setShowWin(true);
            setBalance(prev => prev + result.totalWin);
            setWinningLines(result.wins.filter(w => w.type === "line").map(w => w.lineIndex));

            const lineWinCount = result.wins.filter(w => w.type === "line").length;
            const hasScatter = result.wins.some(w => w.type === "scatter");
            recordWin(result.totalWin, lineWinCount, hasScatter);
            reportActivityWin("Lucky Slots");
            sessionWinsRef.current += 1;
            sessionEarnedRef.current += result.totalWin;

            if (result.totalWin >= 25000) {
              winVibrate(); bigWinSound(); fireworks(); emojiRain(["💰", "🎰", "💎", "7️⃣"]);
            } else if (result.totalWin >= 5000) {
              scoreMilestone(); mediumWinSound(); sideCannons();
            } else {
              scoreHit(); smallWinSound(); coinClink(4); spark();
            }

            if (result.scatterCount >= 3) {
              scatterSound();
              setTimeout(() => {
                setShowWin(false); setWinningLines([]); setSpinning(false);
                if (currentMachine.bonusType === "plinko") {
                  setPlinkoBonus({ baseWin: result.totalWin, scatterCount: result.scatterCount });
                } else if (currentMachine.bonusType === "freeSpins") {
                  setFreeSpinsBonus({ baseWin: result.totalWin, scatterCount: result.scatterCount });
                } else {
                  setBonusRound({ baseWin: result.totalWin, scatterCount: result.scatterCount });
                }
              }, 2500);
            } else {
              const triggerRandomPlinko = currentMachine.hasRandomPlinko && Math.random() < 0.10;
              if (triggerRandomPlinko) {
                setTimeout(() => {
                  setShowWin(false); setWinningLines([]); setSpinning(false);
                  setPlinkoBonus({ baseWin: result.totalWin, scatterCount: 3 });
                }, 2500);
              } else {
                setTimeout(() => {
                  setShowWin(false); setWinningLines([]); setSpinning(false);
                  if (autoSpinRef.current) setTimeout(() => handleSpin(), 800);
                }, 2500);
              }
            }
          } else {
            setLastWin(0);
            setSpinning(false);
            recordLoss();
            reportActivityLoss();
            if (autoSpinRef.current) setTimeout(() => handleSpin(), 500);
          }
        }, 200);
      }
      return newCount;
    });
  }, []);

  const spinningRef = useRef(false);
  useEffect(() => { spinningRef.current = spinning; }, [spinning]);

  function handleSpin() {
    if (spinningRef.current || !machine) return;
    const currentBet = betRef.current;

    setBalance(prev => {
      if (prev < currentBet) return prev; // insufficient — don't trigger side effects

      // Side effects are safe here since we only reach this when balance >= bet
      leverPull(); tapVibrate();
      setTimeout(() => reelSpinStart(), 150);
      sessionSpinsRef.current += 1;

      setWins([]); setTotalWin(0); setShowWin(false);
      setWinningLines([]); setReelsStopped(0);

      const newGrid = generateMachineGrid(machine);
      nextGridRef.current = newGrid;
      setGrid(newGrid);
      setSpinning(true);
      recordSpin(currentBet);

      const gStats = loadGlobalStats();
      gStats.totalSpins += 1;
      gStats.totalSpent += currentBet;
      gStats.maxBet = Math.max(gStats.maxBet, currentBet);
      gStats.machineSpins = gStats.machineSpins || {};
      gStats.machineSpins[machine.id] = (gStats.machineSpins[machine.id] || 0) + 1;
      saveGlobalStats(gStats);

      spinCountRef.current += 1;
      pendingJackpotRef.current += currentBet;
      if (spinCountRef.current % 10 === 0) {
        const batchAmount = pendingJackpotRef.current;
        pendingJackpotRef.current = 0;
        base44.functions.invoke("progressiveJackpot", { action: "spin", betAmount: batchAmount })
          .then(res => {
            if (res.data?.jackpot) setJackpotAmount(res.data.jackpot);
            if (res.data?.jackpotWin) setJackpotWin({ winAmount: res.data.winAmount });
          });
      }

      return prev - currentBet;
    });
  }

  function handleAutoSpinToggle() {
    uiClickSound();
    if (autoSpin) { setAutoSpin(false); }
    else { setAutoSpin(true); if (!spinningRef.current) handleSpin(); }
  }

  function handleNudge(reelIdx) {
    if (spinningRef.current) return;
    nudgeSound(); tapVibrate();
    setGrid(prev => {
      const newGrid = [...prev];
      const reel = [...newGrid[reelIdx]];
      newGrid[reelIdx] = [reel[2], reel[0], reel[1]];
      return newGrid;
    });
  }

  function handleBonusComplete(extraWinnings) {
    if (extraWinnings > 0) {
      setBalance(prev => prev + extraWinnings);
      setLastWin(prev => prev + extraWinnings);
    }
    setBonusRound(null); setPlinkoBonus(null); setFreeSpinsBonus(null);
    if (autoSpinRef.current) setTimeout(() => handleSpin(), 800);
  }

  // Record session to GameScore when leaving
  async function recordSessionScore() {
    const user = await base44.auth.me();
    if (!user?.email || sessionSpinsRef.current === 0) return;
    const elapsed = Math.round((Date.now() - sessionStartRef.current) / 1000);
    await base44.entities.GameScore.create({
      user_email: user.email,
      game_name: "Lucky Slots",
      score: sessionEarnedRef.current,
      duration_seconds: elapsed,
      difficulty: machine?.id || "classic",
      completed: true,
    });
  }

  function handleBackToLobby() {
    setAutoSpin(false);
    recordSessionScore();
    // Reset session trackers
    sessionStartRef.current = Date.now();
    sessionSpinsRef.current = 0;
    sessionWinsRef.current = 0;
    sessionEarnedRef.current = 0;
    setSelectedMachineId(null);
  }

  if (!selectedMachineId) {
    return <MachineSelectScreen onSelect={setSelectedMachineId} />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${machine.bgGradient} flex flex-col pb-24`}>
      {/* Header — simplified: Lobby, title, menu */}
      <div className={`bg-gradient-to-r ${machine.frameGradient} px-3 py-3 flex items-center justify-between shadow-lg border-b-2 ${machine.borderColor}/50`}>
        <button onClick={handleBackToLobby} className="text-yellow-400 text-lg font-bold">← Lobby</button>
        <NeonSign text={machine.name.toUpperCase()} spinning={spinning} />
        <div className="flex items-center gap-1.5">
          <GameInstructions
            title={machine.name}
            emoji={machine.emoji}
            steps={[
              "Set your bet amount using the controls at the bottom.",
              "Tap SPIN to spin the reels! All coins are play money — no real money involved.",
              `Match 3+ symbols on a payline to win! ${machine.name} has ${machine.volatility} volatility.`,
              `${machine.scatter.emoji} 3+ Scatters trigger the ${machine.bonusType === "boxes" ? "Mystery Box" : machine.bonusType === "plinko" ? "Plinko Drop" : "Free Spins"} bonus!`,
              machine.hasRandomPlinko ? "Any win has a 10% chance to trigger a bonus Plinko round!" : "Use Auto-Spin for hands-free play.",
              "Tap a reel to nudge it one position for a free peek!",
              "On big wins, tap ⏩ Skip to fast-forward the celebration.",
            ]}
          />
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-gray-800 text-yellow-300 p-2 rounded-xl font-bold border border-gray-600 text-sm"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Dropdown menu for Audio / Stats / Pay Table */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-3 top-14 z-40 bg-gray-800 border-2 border-yellow-600/50 rounded-2xl p-2 shadow-2xl space-y-1 min-w-[160px]"
          >
            <button onClick={() => { setShowAudioSettings(true); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 rounded-xl text-white font-bold text-sm hover:bg-gray-700 active:bg-gray-600 transition-colors">
              🎚️ Sound Settings
            </button>
            <button onClick={() => { setShowStats(true); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 rounded-xl text-white font-bold text-sm hover:bg-gray-700 active:bg-gray-600 transition-colors">
              🏆 Stats & Badges
            </button>
            <div onClick={() => setShowMenu(false)}>
              <MachinePayTable machine={machine} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 pt-2">
        <JackpotTicker amount={jackpotAmount} spinning={spinning} />
      </div>

      <AnimatePresence>
        {topOffMessage && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className={`text-white text-center py-3 px-4 font-bold text-lg shadow-lg ${
              emergencyDripShown
                ? "bg-gradient-to-r from-red-600 to-orange-500"
                : "bg-gradient-to-r from-green-600 to-emerald-500"
            }`}>
            {emergencyDripShown
              ? `🚨 Emergency Fund! +${EMERGENCY_DRIP_AMOUNT.toLocaleString()} coins rescued!`
              : `🎁 Don't worry — we topped up your coins! +${machineTopOff.toLocaleString()} added so you can keep playing!`}
          </motion.div>
        )}
      </AnimatePresence>

      <LowBalanceWarning
        visible={isLowBalance && !spinning && !topOffMessage}
        balance={balance}
        currentMachineId={selectedMachineId}
        onSwitchMachine={(id) => { setAutoSpin(false); setSelectedMachineId(id); }}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-3 py-4 relative">
        <div className="w-full max-w-md">
          <CasinoFrame spinning={spinning}>
            <div className={`bg-gradient-to-b from-gray-800 to-gray-900 border-4 ${machine.borderColor} rounded-2xl p-3 shadow-[0_0_30px_rgba(234,179,8,0.15),inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-2xl z-10" />
              <div className="relative" ref={gridRef}>
                <PaylineOverlay activePaylines={activePaylines} winningLines={winningLines} gridRect={gridRect} previewLines={null} />
                <div className="flex justify-center gap-1.5 sm:gap-2">
                  {grid.length > 0 && reelStrip.length > 0 && Array.from({ length: REELS }).map((_, reelIdx) => (
                    <div key={reelIdx} onClick={() => handleNudge(reelIdx)} className="cursor-pointer">
                      <SlotReel symbols={reelStrip} spinning={spinning} finalSymbols={grid[reelIdx]} reelIndex={reelIdx} onStop={handleReelStop} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute left-0 top-3 bottom-3 w-2 flex flex-col justify-around">
                {[0, 1, 2].map(r => <div key={r} className="w-2 h-2 rounded-full bg-yellow-500/60" />)}
              </div>
              <div className="absolute right-0 top-3 bottom-3 w-2 flex flex-col justify-around">
                {[0, 1, 2].map(r => <div key={r} className="w-2 h-2 rounded-full bg-yellow-500/60" />)}
              </div>
              <WinDisplay wins={wins} totalWin={totalWin} visible={showWin} onSkip={() => {
                setShowWin(false); setWinningLines([]); setSpinning(false);
              }} />
            </div>
          </CasinoFrame>
        </div>
        <div className="text-center mt-2">
          <span className="text-xs text-gray-500">20 paylines • {machine.volatility} volatility</span>
        </div>
        {lastWin > 0 && !showWin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-1">
            <span className="text-green-400 text-lg font-bold">Last win: +{lastWin.toLocaleString()}</span>
          </motion.div>
        )}
      </div>

      <AchievementToast badge={newBadge} />
      {jackpotWin && <JackpotWinOverlay winAmount={jackpotWin.winAmount} onCollect={() => {
        setBalance(prev => prev + jackpotWin.winAmount);
        setLastWin(jackpotWin.winAmount);
        setJackpotWin(null);
        fireworks(); emojiRain(["💰", "🏆", "💎", "👑"]);
      }} />}
      {bonusRound && <BonusRound baseWin={bonusRound.baseWin} scatterCount={bonusRound.scatterCount} onComplete={handleBonusComplete} />}
      {plinkoBonus && <PlinkoBonus baseWin={plinkoBonus.baseWin} scatterCount={plinkoBonus.scatterCount} onComplete={handleBonusComplete} accentColor={machine.accentColor} />}
      {freeSpinsBonus && <FreeSpinsBonus machine={machine} baseWin={freeSpinsBonus.baseWin} scatterCount={freeSpinsBonus.scatterCount} onComplete={handleBonusComplete} />}
      <SlotStatsOverlay open={showStats} onClose={() => setShowStats(false)} stats={stats} />
      <SlotAudioSettings open={showAudioSettings} onClose={() => setShowAudioSettings(false)} prefs={audioPrefs} updatePrefs={updateAudioPrefs} />
      <SlotControls
        balance={balance} bet={bet} onBetChange={setBet}
        betLevels={machineBetLevels}
        onSpin={handleSpin} spinning={spinning} autoSpin={autoSpin}
        onAutoSpinToggle={handleAutoSpinToggle} lastWin={lastWin}
      />
    </div>
  );
}