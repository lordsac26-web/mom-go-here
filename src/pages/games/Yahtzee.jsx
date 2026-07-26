import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameTimer } from "@/hooks/useGameTimer";
import { useAuth } from "@/lib/AuthContext";
import { useGameStore } from "@/stores/gameStore";
import useConfetti from "@/hooks/useConfetti";
import useHaptics from "@/hooks/useHaptics";
import { useGameActivity } from "@/hooks/useGameActivity";
import { useGameAudio } from "@/hooks/useGameAudio";
import useYahtzeeGame from "@/hooks/useYahtzeeGame";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "@/lib/yahtzee/scoreRules";
import { awardCoinsForStars } from "@/lib/awardCoins";
import { saveGameScore } from "@/lib/scoreSaver";
import GameBackButton from "@/components/GameBackButton";
import GameInstructions from "@/components/GameInstructions";
import YahtzeeGameOver, { getRating } from "@/components/yahtzee/YahtzeeGameOver";
import YahtzeeResetDialog from "@/components/yahtzee/YahtzeeResetDialog";
import YahtzeeRollPanel from "@/components/yahtzee/YahtzeeRollPanel";
import YahtzeeScoreFeedback from "@/components/yahtzee/YahtzeeScoreFeedback";
import YahtzeeScorecard from "@/components/yahtzee/YahtzeeScorecard";
import YahtzeeStatusBar from "@/components/yahtzee/YahtzeeStatusBar";

export default function Yahtzee() {
  useGameTimer();
  const { user } = useAuth();
  const rollerRef = useRef(null);
  const gameStartRef = useRef(Date.now());
  const statsRecordedRef = useRef(false);
  const completedRef = useRef(false);
  const feedbackTimerRef = useRef(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [winTime, setWinTime] = useState(null);
  const [coinsWon, setCoinsWon] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const { tapVibrate, scoreHit, scoreMilestone, bonusPoints, winVibrate } = useHaptics();
  const { diceshakeSound, diceCollideSound, matchSound, winSound, uiClickSound } = useGameAudio();
  const { spark, burst, sideCannons, fireworks, emojiRain } = useConfetti();
  const { reportWin } = useGameActivity();
  const initializeGame = useGameStore((state) => state.initializeGame);
  const addHistoryEntry = useGameStore((state) => state.addHistoryEntry);
  const setPlayerScore = useGameStore((state) => state.setPlayerScore);
  const gameStatus = useGameStore((state) => state.gameStatus);

  const handleCategoryScored = useCallback(({ key, score, bonusAwarded, upperBonusUnlocked, turn }) => {
    if (score >= 50) { scoreMilestone(); matchSound(); fireworks(); emojiRain(["🎲", "🏆", "🔥"]); }
    else if (score >= 25) { scoreMilestone(); matchSound(); sideCannons(); }
    else if (score > 0) { scoreHit(); matchSound(); spark(); }
    else { tapVibrate(); uiClickSound(); }
    if (bonusAwarded) { scoreMilestone(); fireworks(); emojiRain(["🎲", "💯", "🔥"]); }
    if (upperBonusUnlocked) setTimeout(() => { bonusPoints(); burst(); emojiRain(["🎁", "⭐", "💰"]); }, 300);
    addHistoryEntry({ round: turn, playerId: "player-1", playerName: "Player", action: "score", result: { category: key, score, bonus: bonusAwarded } });
    setFeedback({ label: CATEGORY_LABELS[key], score, bonus: bonusAwarded });
    clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1500);
  }, [addHistoryEntry, bonusPoints, burst, emojiRain, fireworks, matchSound, scoreHit, scoreMilestone, sideCannons, spark, tapVibrate, uiClickSound]);

  const game = useYahtzeeGame({ onCategoryScored: handleCategoryScored });

  useEffect(() => {
    if (gameStatus === "setup") initializeGame([{ id: "player-1", name: "Player" }], ALL_CATEGORIES.length);
  }, [gameStatus, initializeGame]);

  useEffect(() => () => clearTimeout(feedbackTimerRef.current), []);

  useEffect(() => {
    if (!game.gameOver || completedRef.current) return;
    completedRef.current = true;
    const elapsed = Math.round((Date.now() - gameStartRef.current) / 1000);
    winVibrate(); winSound(); fireworks(); emojiRain(["🎲", "🎉", "⭐"]); reportWin("Yahtzee"); setPlayerScore("player-1", game.totalScore); setWinTime(elapsed);
    if (user?.email && !statsRecordedRef.current) {
      statsRecordedRef.current = true;
      saveGameScore({ game_name: "Yahtzee", score: game.totalScore, duration_seconds: elapsed, completed: true });
      awardCoinsForStars(Math.max(getRating(game.totalScore).stars, 1), 25).then(setCoinsWon);
    }
  }, [emojiRain, fireworks, game.gameOver, game.totalScore, reportWin, setPlayerScore, user?.email, winSound, winVibrate]);

  const roll = () => {
    if (!game.beginRoll()) return;
    tapVibrate(); diceshakeSound(); rollerRef.current?.roll();
  };
  const completeRoll = (results) => { diceCollideSound(); game.completeRoll(results); };
  const toggleHold = (index) => { if (game.rollsLeft !== 3) { uiClickSound(); game.toggleHold(index); } };
  const reset = () => { uiClickSound(); tapVibrate(); game.reset(); setWinTime(null); setCoinsWon(0); setFeedback(null); setShowResetConfirm(false); statsRecordedRef.current = false; completedRef.current = false; gameStartRef.current = Date.now(); };
  const requestReset = () => Object.keys(game.scores).length > 0 && !game.gameOver ? setShowResetConfirm(true) : reset();

  if (game.gameOver) return <YahtzeeGameOver totalScore={game.totalScore} upperSubtotal={game.upperSubtotal} lowerSubtotal={game.lowerSubtotal} upperBonusEarned={game.upperBonusEarned} yahtzeeBonus={game.yahtzeeBonus} winTime={winTime} coinsWon={coinsWon} onPlayAgain={reset} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-red-950 to-slate-950 px-2 py-4 pb-24">
      <header className="mb-2 flex items-center justify-between px-2"><GameBackButton /><h1 className="text-xl font-black text-white sm:text-2xl">🎲 Yahtzee</h1><div className="flex gap-1.5"><GameInstructions title="Yahtzee" emoji="🎲" steps={["Roll up to three times each turn.", "Tap dice to hold them before you roll again.", "Tap a scorecard category twice to confirm your points.", "Reach 63 points upstairs for a 35-point bonus.", "Score all 13 categories to finish the game."]} /><button onClick={requestReset} aria-label="Reset game" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-foreground active:scale-95">🔄</button></div></header>
      <YahtzeeStatusBar turn={game.turn} totalTurns={ALL_CATEGORIES.length} totalScore={game.totalScore} gameStartTime={gameStartRef.current} gameOver={game.gameOver} />
      <YahtzeeScoreFeedback feedback={feedback} />
      <YahtzeeRollPanel rollerRef={rollerRef} held={game.held} isRolling={game.isRolling} rollsLeft={game.rollsLeft} turn={game.turn} onRoll={roll} onRollComplete={completeRoll} onToggleHold={toggleHold} />
      <YahtzeeScorecard scores={game.scores} scorePreviews={game.scorePreviews} rollsLeft={game.rollsLeft} yahtzeeBonus={game.yahtzeeBonus} onScoreCategory={game.scoreCategory} totalScore={game.totalScore} upperSubtotal={game.upperSubtotal} lowerSubtotal={game.lowerSubtotal} upperBonusEarned={game.upperBonusEarned} />
      <AnimatePresence>{showResetConfirm && <YahtzeeResetDialog onConfirm={reset} onCancel={() => setShowResetConfirm(false)} />}</AnimatePresence>
    </div>
  );
}