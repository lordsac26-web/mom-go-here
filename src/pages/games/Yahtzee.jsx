import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameBackButton from "../../components/GameBackButton";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import Dice2DRoller from "../../components/Dice2DRoller";
import { useGameStore } from "../../stores/gameStore";
import useConfetti from "../../hooks/useConfetti";
import { useGameActivity } from "../../hooks/useGameActivity";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { saveGameScore } from "@/lib/scoreSaver";
import YahtzeeResetDialog from "../../components/yahtzee/YahtzeeResetDialog";
import YahtzeeStatusBar from "../../components/yahtzee/YahtzeeStatusBar";
import YahtzeeScorecard from "../../components/yahtzee/YahtzeeScorecard";
import YahtzeeGameOver from "../../components/yahtzee/YahtzeeGameOver";

const UPPER_KEYS = ["ones", "twos", "threes", "fours", "fives", "sixes"];
const UPPER_BONUS_TARGET = 63;
const UPPER_BONUS_VALUE = 35;

const ALL_CATEGORIES = [
  "ones", "twos", "threes", "fours", "fives", "sixes",
  "threeofakind", "fourofakind", "fullhouse", "smallstraight", "largestraight", "yahtzee", "chance",
];

function calcScore(key, dice) {
  const counts = Array(7).fill(0);
  dice.forEach(d => counts[d]++);
  const sum = dice.reduce((a, b) => a + b, 0);
  const vals = counts.slice(1);
  switch (key) {
    case "ones": return counts[1] * 1;
    case "twos": return counts[2] * 2;
    case "threes": return counts[3] * 3;
    case "fours": return counts[4] * 4;
    case "fives": return counts[5] * 5;
    case "sixes": return counts[6] * 6;
    case "threeofakind": return vals.some(c => c >= 3) ? sum : 0;
    case "fourofakind": return vals.some(c => c >= 4) ? sum : 0;
    case "fullhouse": return (vals.some(c => c === 3) && vals.some(c => c === 2)) ? 25 : 0;
    case "smallstraight": {
      const u = [...new Set(dice)].sort();
      const str = u.join("");
      return (str.includes("1234") || str.includes("2345") || str.includes("3456")) ? 30 : 0;
    }
    case "largestraight": {
      const u = [...new Set(dice)].sort().join("");
      return (u === "12345" || u === "23456") ? 40 : 0;
    }
    case "yahtzee": return vals.some(c => c === 5) ? 50 : 0;
    case "chance": return sum;
    default: return 0;
  }
}

function isYahtzee(dice) {
  return dice.every(d => d === dice[0]);
}

export default function Yahtzee() {
  useGameTimer();
  const { user } = useAuth();
  const { tapVibrate, scoreHit, scoreMilestone, bonusPoints, winVibrate } = useHaptics();
  const { diceshakeSound, diceCollideSound, matchSound, winSound, uiClickSound } = useGameAudio();
  const { spark, burst, sideCannons, fireworks, emojiRain } = useConfetti();
  const { reportWin } = useGameActivity();

  const rollerRef = useRef(null);
  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [isRolling, setIsRolling] = useState(false);
  const [scores, setScores] = useState({});
  const [yahtzeeBonus, setYahtzeeBonus] = useState(0);
  const [turn, setTurn] = useState(1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [winTime, setWinTime] = useState(null);

  const totalTurns = 13;
  const gameStartRef = useRef(Date.now());
  const statsRecordedRef = useRef(false);
  const isRollingRef = useRef(false);
  const zustandInitRef = useRef(false);

  // Computed scores
  const upperSubtotal = useMemo(() =>
    UPPER_KEYS.reduce((sum, k) => sum + (scores[k] || 0), 0),
  [scores]);

  const upperBonusEarned = upperSubtotal >= UPPER_BONUS_TARGET;

  const lowerSubtotal = useMemo(() =>
    ALL_CATEGORIES.filter(k => !UPPER_KEYS.includes(k)).reduce((sum, k) => sum + (scores[k] || 0), 0),
  [scores]);

  const totalScore = useMemo(() =>
    upperSubtotal + (upperBonusEarned ? UPPER_BONUS_VALUE : 0) + lowerSubtotal + yahtzeeBonus,
  [upperSubtotal, upperBonusEarned, lowerSubtotal, yahtzeeBonus]);

  const gameOver = Object.keys(scores).length === totalTurns;

  // Zustand init
  const initializeGame = useGameStore(s => s.initializeGame);
  const addHistoryEntry = useGameStore(s => s.addHistoryEntry);
  const setPlayerScore = useGameStore(s => s.setPlayerScore);
  const gameStatus = useGameStore(s => s.gameStatus);

  useEffect(() => {
    if (gameStatus === "setup" && !zustandInitRef.current) {
      zustandInitRef.current = true;
      initializeGame([{ id: "player-1", name: "Player" }], totalTurns);
    }
  }, [gameStatus, initializeGame, totalTurns]);

  // Handle game over side effects
  useEffect(() => {
    if (!gameOver) return;
    winVibrate();
    winSound();
    fireworks();
    emojiRain(["🎲", "🎉", "⭐"]);
    reportWin("Yahtzee");
    setPlayerScore("player-1", totalScore);
    const elapsed = Math.round((Date.now() - gameStartRef.current) / 1000);
    setWinTime(elapsed);
    recordStats(elapsed);
  }, [gameOver]);

  async function recordStats(elapsed) {
    if (!user?.email || statsRecordedRef.current) return;
    statsRecordedRef.current = true;
    await saveGameScore({
      game_name: "Yahtzee",
      score: totalScore,
      duration_seconds: elapsed,
      completed: true,
    });
  }

  const handleRollComplete = useCallback((results) => {
    diceCollideSound();
    setDice(results);
    setRollsLeft(r => r - 1);
    setIsRolling(false);
    isRollingRef.current = false;
  }, [diceCollideSound]);

  function roll() {
    if (isRollingRef.current || rollsLeft === 0) return;
    isRollingRef.current = true;
    tapVibrate();
    diceshakeSound();
    setIsRolling(true);
    rollerRef.current?.roll();
  }

  function toggleHold(i) {
    if (rollsLeft === 3) return;
    uiClickSound();
    setHeld(h => h.map((v, idx) => idx === i ? !v : v));
  }

  const scorePreviews = useMemo(() => {
    if (rollsLeft === 3) return {};
    return Object.fromEntries(
      ALL_CATEGORIES.map(key => [key, calcScore(key, dice)])
    );
  }, [dice, rollsLeft]);

  function scoreCategory(key) {
    if (scores[key] !== undefined || rollsLeft === 3) return;

    const s = scorePreviews[key] ?? calcScore(key, dice);

    // Check for Yahtzee Bonus: if rolling a Yahtzee and yahtzee category already scored with 50
    let bonusAwarded = 0;
    if (isYahtzee(dice) && scores.yahtzee === 50 && key !== "yahtzee") {
      bonusAwarded = 100;
      setYahtzeeBonus(prev => prev + 100);
      scoreMilestone();
      fireworks();
      emojiRain(["🎲", "💯", "🔥"]);
    }

    // Celebration effects based on score
    if (s >= 50) {
      scoreMilestone(); matchSound(); fireworks(); emojiRain(["🎲", "🏆", "🔥"]);
    } else if (s >= 25) {
      scoreMilestone(); matchSound(); sideCannons();
    } else if (s > 0) {
      scoreHit(); matchSound(); spark();
    } else {
      tapVibrate(); uiClickSound();
    }

    // Check if upper bonus just earned
    const newScores = { ...scores, [key]: s };
    const newUpperSub = UPPER_KEYS.reduce((sum, k) => sum + (newScores[k] || 0), 0);
    if (newUpperSub >= UPPER_BONUS_TARGET && upperSubtotal < UPPER_BONUS_TARGET) {
      // Just crossed the threshold!
      setTimeout(() => {
        bonusPoints();
        burst();
        emojiRain(["🎁", "⭐", "💰"]);
      }, 300);
    }

    setScores(newScores);

    addHistoryEntry({
      round: turn,
      playerId: "player-1",
      playerName: "Player",
      action: "score",
      result: { category: key, score: s, bonus: bonusAwarded },
    });

    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setTurn(t => t + 1);
  }

  function reset() {
    uiClickSound();
    tapVibrate();
    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setScores({});
    setYahtzeeBonus(0);
    setTurn(1);
    setWinTime(null);
    setShowResetConfirm(false);
    isRollingRef.current = false;
    zustandInitRef.current = false;
    statsRecordedRef.current = false;
    gameStartRef.current = Date.now();
  }

  function handleResetClick() {
    if (Object.keys(scores).length > 0 && !gameOver) {
      setShowResetConfirm(true);
    } else {
      reset();
    }
  }

  // ── GAME OVER SCREEN ──
  if (gameOver) return (
    <YahtzeeGameOver
      totalScore={totalScore}
      upperSubtotal={upperSubtotal}
      lowerSubtotal={lowerSubtotal}
      upperBonusEarned={upperBonusEarned}
      yahtzeeBonus={yahtzeeBonus}
      winTime={winTime}
      onPlayAgain={reset}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-red-950 to-slate-950 px-2 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <GameBackButton />
        <div className="text-xl sm:text-2xl font-black text-white">🎲 Yahtzee</div>
        <div className="flex gap-1.5">
          <GameInstructions
            title="Yahtzee"
            emoji="🎲"
            steps={[
              "Tap 'Roll Dice' to roll all five dice (3 rolls per turn).",
              "After rolling, tap any die to HOLD (keep) it for the next roll.",
              "Roll again to re-roll the dice you didn't hold.",
              "Tap a scoring category on the scorecard to lock in your points.",
              "Upper section (Ones–Sixes): scores the sum of matching dice. Get 63+ for a 35-point bonus!",
              "Lower section: 3/4 of a Kind, Full House (25), Straights (30/40), Yahtzee (50!), or Chance.",
              "Extra Yahtzees earn a 100-point bonus each!",
              "Play 13 turns — score as high as you can!"
            ]}
          />
          <button onClick={handleResetClick} className="bg-secondary text-foreground px-3 py-2 rounded-xl font-bold text-sm">🔄</button>
        </div>
      </div>

      {/* Status bar */}
      <YahtzeeStatusBar
        turn={turn}
        totalTurns={totalTurns}
        totalScore={totalScore}
        gameStartTime={gameStartRef.current}
        gameOver={gameOver}
      />

      {/* Dice Roller */}
      <div className="bg-card border-2 border-border rounded-2xl p-3 mb-3 overflow-hidden space-y-2">
        <Dice2DRoller ref={rollerRef} onRollComplete={handleRollComplete} held={held} onToggleHold={toggleHold} />

        {/* Hold hint */}
        {rollsLeft < 3 && rollsLeft > 0 && (
          <p className="text-center text-muted-foreground text-sm">Tap a die to hold/release it 👆</p>
        )}
        {rollsLeft === 3 && turn > 1 && (
          <p className="text-center text-muted-foreground text-sm">Roll the dice to start your turn!</p>
        )}

        <button
          onClick={roll}
          disabled={rollsLeft === 0 || isRolling}
          className={`w-full text-2xl font-black py-4 rounded-2xl transition-all shadow-lg ${
            rollsLeft === 0 || isRolling
              ? "bg-muted text-muted-foreground"
              : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
          }`}
        >
          {isRolling ? "🎲 Rolling..." : rollsLeft === 0 ? "Pick a category below ⬇️" : `🎲 Roll Dice (${rollsLeft} left)`}
        </button>
      </div>

      {/* Scorecard */}
      <YahtzeeScorecard
        scores={scores}
        scorePreviews={scorePreviews}
        rollsLeft={rollsLeft}
        yahtzeeBonus={yahtzeeBonus}
        onScoreCategory={scoreCategory}
        totalScore={totalScore}
        upperSubtotal={upperSubtotal}
        lowerSubtotal={lowerSubtotal}
        upperBonusEarned={upperBonusEarned}
      />

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <YahtzeeResetDialog
            onConfirm={reset}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}