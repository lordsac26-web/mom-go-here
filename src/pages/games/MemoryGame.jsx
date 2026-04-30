import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import GameBackButton from "../../components/GameBackButton";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameStore } from "../../stores/gameStore";
import useConfetti from "../../hooks/useConfetti";
import GridRevealWrapper from "../../components/GridRevealWrapper";
import MemoryBackgroundPicker, { MEMORY_BACKGROUNDS } from "../../components/MemoryBackgroundPicker";
import { useGameActivity } from "../../hooks/useGameActivity";
import { base44 } from "@/api/base44Client";
import MemoryTile from "../../components/memory/MemoryTile";
import MemoryResetDialog from "../../components/memory/MemoryResetDialog";
import MemoryStarRating from "../../components/memory/MemoryStarRating";

// ── Expanded emoji set (50+ unique) for all difficulty levels ──
const EMOJI_SETS = [
  "🌸", "🦋", "🌈", "⭐", "🍀", "🌺", "🐝", "🦁", "🌙", "🍎",
  "🐬", "🎵", "🌻", "🦚", "🍓", "🐱", "🦊", "🌴", "🐘", "🎨",
  "💎", "🦅", "🍇", "🌊", "🐢", "🦜", "🍄", "🌮", "🐙", "🎸",
  "🦩", "🏔️", "🌿", "🐠", "🍰", "🦄", "🌹", "🎯", "🐳", "🍕",
  "🦔", "🌽", "🎪", "🐧", "🍉", "🦀", "🌶️", "🎭", "🐌", "🍩",
  "🦉", "🌵", "🎳", "🐸", "🍫",
];

// ── Difficulty tiers: rebalanced for seniors ──
const SIZES = [
  { label: "Easy (4×3)", rows: 3, cols: 4, pairs: 6 },
  { label: "Medium (4×4)", rows: 4, cols: 4, pairs: 8 },
  { label: "Hard (6×6)", rows: 6, cols: 6, pairs: 18 },
];

// ── Fisher-Yates shuffle (unbiased) ──
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Format seconds to M:SS ──
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MemoryGame() {
  const [sizeIdx, setSizeIdx] = useState(0);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [bgKey, setBgKey] = useState("classic");
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [peeking, setPeeking] = useState(false);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Best scores per difficulty
  const [bestScores, setBestScores] = useState({});

  useGameTimer();
  const lockRef = useRef(false);
  const mountedRef = useRef(true);
  const sizeIdxRef = useRef(sizeIdx);
  const userEmailRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load user email + best scores
  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user?.email) return;
      userEmailRef.current = user.email;
      base44.entities.GameScore.filter({ user_email: user.email, game_name: "Memory Match" }).then(scores => {
        const bests = {};
        for (const s of scores) {
          if (!s.difficulty || !s.completed) continue;
          const existing = bests[s.difficulty];
          if (!existing || s.score < existing.moves) {
            bests[s.difficulty] = { moves: s.score, time: s.duration_seconds || 0 };
          }
        }
        setBestScores(bests);
      });
    });
  }, []);

  const { tapVibrate, matchVibrate, winVibrate } = useHaptics();
  const { cardFlipSound, matchSound, winSound, uiClickSound } = useGameAudio();
  const { spark, burst, fireworks, emojiRain } = useConfetti();
  const { reportWin } = useGameActivity();

  const initializeGame = useGameStore(s => s.initializeGame);
  const addHistoryEntry = useGameStore(s => s.addHistoryEntry);
  const setPlayerScore = useGameStore(s => s.setPlayerScore);
  const gameStatus = useGameStore(s => s.gameStatus);

  const zustandInitRef = useRef(false);
  useEffect(() => {
    if (started && gameStatus === "setup" && !zustandInitRef.current) {
      zustandInitRef.current = true;
      let user = {};
      try { user = JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch {}
      initializeGame([{ id: user.id || "player-1", name: user.name || "Player" }], 1);
    }
  }, [started, gameStatus, initializeGame]);

  // Timer tick
  useEffect(() => {
    if (started && !won && !peeking) {
      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    if (won && timerRef.current) clearInterval(timerRef.current);
  }, [started, won, peeking]);

  // ── Start game with optional peek ──
  function startGame(idx = sizeIdx) {
    uiClickSound();
    sizeIdxRef.current = idx;
    setSizeIdx(idx);
    zustandInitRef.current = false;

    const { pairs } = SIZES[idx];
    const selected = shuffle(EMOJI_SETS).slice(0, pairs);
    const deck = shuffle(
      [...selected, ...selected].map((emoji, i) => ({
        id: i, emoji, flipped: false, matched: false,
      }))
    );

    // Start with peek: show all cards for 2 seconds
    const peekDeck = deck.map(c => ({ ...c, flipped: true }));
    setCards(peekDeck);
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setWon(false);
    setStarted(true);
    setPeeking(true);
    setElapsedSeconds(0);
    setGameKey(k => k + 1);
    lockRef.current = true;

    addHistoryEntry({
      round: 1, playerId: "player-1", playerName: "Player",
      action: "start_game", result: { difficulty: SIZES[idx].label },
    });

    // After peek, flip all cards back and start the timer
    const peekTime = pairs <= 8 ? 2500 : 3500;
    setTimeout(() => {
      if (!mountedRef.current) return;
      setCards(deck);
      setPeeking(false);
      lockRef.current = false;
      startTimeRef.current = Date.now();
    }, peekTime);
  }

  // ── Persist win to GameScore ──
  async function recordGameWin(moveCount, seconds, difficulty) {
    const email = userEmailRef.current;
    if (!email) return;
    await base44.entities.GameScore.create({
      user_email: email,
      game_name: "Memory Match",
      score: moveCount,
      duration_seconds: seconds,
      difficulty,
      completed: true,
    });
    // Update best scores state
    const currentBest = bestScores[difficulty];
    if (!currentBest || moveCount < currentBest.moves) {
      setBestScores(prev => ({ ...prev, [difficulty]: { moves: moveCount, time: seconds } }));
    }
  }

  function handleClick(id) {
    if (lockRef.current || peeking) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;
    tapVibrate();
    cardFlipSound();

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    const newFlipped = [...flipped, id];
    setCards(newCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      lockRef.current = true;
      const [a, b] = newFlipped.map(fid => newCards.find(c => c.id === fid));

      if (a.emoji === b.emoji) {
        setTimeout(() => {
          if (!mountedRef.current) return;
          matchVibrate(); matchSound(); spark();

          setCards(prev =>
            prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true, flipped: true } : c)
          );

          setMatched(prev => {
            const newMatched = prev + 1;
            const currentSize = SIZES[sizeIdxRef.current];

            addHistoryEntry({
              round: 1, playerId: "player-1", playerName: "Player",
              action: "match_found", result: { pair: newMatched, totalPairs: currentSize.pairs },
            });

            const pct = newMatched / currentSize.pairs;
            if (pct === 0.25 || pct === 0.5 || pct === 0.75) burst();

            if (newMatched === currentSize.pairs) {
              winVibrate(); winSound(); fireworks(); emojiRain(["🧠", "🎉", "⭐"]);
              reportWin("Memory Match");
              const finalSeconds = startTimeRef.current
                ? Math.floor((Date.now() - startTimeRef.current) / 1000)
                : 0;
              setElapsedSeconds(finalSeconds);
              recordGameWin(moves + 1, finalSeconds, currentSize.label);
              setTimeout(() => { if (mountedRef.current) setWon(true); }, 0);
              setPlayerScore("player-1", newMatched);
            }
            return newMatched;
          });

          setFlipped([]);
          lockRef.current = false;
        }, 600);
      } else {
        setTimeout(() => {
          if (!mountedRef.current) return;
          setCards(prev =>
            prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c)
          );
          addHistoryEntry({
            round: 1, playerId: "player-1", playerName: "Player",
            action: "mismatch", result: { move: moves + 1 },
          });
          setFlipped([]);
          lockRef.current = false;
        }, 1200);
      }
    }
  }

  // ── Reset handler with confirmation ──
  function handleNewGame() {
    if (moves > 0 && !won) {
      setShowResetConfirm(true);
    } else {
      setStarted(false);
    }
  }

  function confirmReset() {
    setShowResetConfirm(false);
    setStarted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const currentBg = MEMORY_BACKGROUNDS.find(b => b.key === bgKey) || MEMORY_BACKGROUNDS[0];
  const currentSize = SIZES[sizeIdx];

  // ── START SCREEN ──
  if (!started) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24">
      <div className="text-8xl mb-4">🧠</div>
      <h1 className="text-4xl font-black text-primary mb-2 text-center">Memory Match</h1>
      <p className="text-xl text-muted-foreground text-center mb-6">Flip tiles to find matching pairs!</p>

      {/* Collapsed background picker */}
      <button
        onClick={() => setShowBgPicker(!showBgPicker)}
        className="text-base font-bold text-primary mb-3"
      >
        🎨 {showBgPicker ? "Hide" : "Card Style"}: {currentBg.emoji} {currentBg.label}
      </button>
      {showBgPicker && <MemoryBackgroundPicker selected={bgKey} onSelect={setBgKey} />}

      <div className="space-y-4 w-full max-w-sm mt-4">
        {SIZES.map((s, i) => {
          const best = bestScores[s.label];
          return (
            <button key={i} onClick={() => startGame(i)}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white text-2xl font-black py-5 rounded-2xl shadow-xl relative"
            >
              {s.label}
              {best && (
                <span className="block text-sm font-bold text-purple-200 mt-0.5">
                  Best: {best.moves} moves{best.time > 0 ? ` · ${formatTime(best.time)}` : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <GameBackButton className="mt-8" />
    </div>
  );

  // ── WIN SCREEN ──
  if (won) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-3">You Won!</h1>
      <MemoryStarRating moves={moves} pairs={currentSize.pairs} />
      <p className="text-2xl text-foreground mb-1">
        Matched all {currentSize.pairs} pairs!
      </p>
      <p className="text-xl text-muted-foreground mb-2">
        {moves} moves · {formatTime(elapsedSeconds)}
      </p>
      {bestScores[currentSize.label] && (
        <p className="text-base text-primary font-bold mb-6">
          🏆 Personal Best: {bestScores[currentSize.label].moves} moves
          {bestScores[currentSize.label].time > 0 && ` · ${formatTime(bestScores[currentSize.label].time)}`}
        </p>
      )}
      <button
        onClick={() => { tapVibrate(); startGame(); }}
        className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-3"
      >
        🔄 Play Again
      </button>
      <button
        onClick={() => { setStarted(false); }}
        className="bg-secondary text-foreground text-lg font-bold px-6 py-3 rounded-xl mb-4"
      >
        Change Difficulty
      </button>
      <GameBackButton />
    </div>
  );

  // ── GAME BOARD ──
  const { cols } = currentSize;
  return (
    <div className="min-h-screen px-2 py-4 pb-24">
      <div className="flex items-center justify-between px-2 mb-4">
        <GameBackButton />
        <div className="text-center">
          <div className="text-2xl font-black text-primary">🧠 Memory</div>
          <div className="text-muted-foreground text-sm">
            Moves: {moves} · Pairs: {matched}/{currentSize.pairs} · ⏱ {formatTime(elapsedSeconds)}
          </div>
        </div>
        <div className="flex gap-1.5">
          <GameInstructions
            title="Memory Match"
            emoji="🧠"
            steps={[
              "Cards peek face-up briefly — try to memorize them!",
              "Tap any tile to flip it over and reveal the emoji.",
              "Tap a second tile — if both emojis match, they stay face up!",
              "If they don't match, both tiles flip back. Remember where they are!",
              "Keep matching until all pairs are found.",
              "Try to finish in as few moves as possible!",
            ]}
          />
          <button
            onClick={handleNewGame}
            className="bg-secondary text-foreground px-3 py-2 rounded-xl font-bold text-sm"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Peek indicator */}
      {peeking && (
        <div className="text-center text-lg font-black text-primary mb-3 animate-pulse">
          👀 Memorize the cards!
        </div>
      )}

      <GridRevealWrapper
        cols={cols}
        pattern="auto"
        revealKey={gameKey}
        className="grid gap-2 max-w-lg mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map(card => (
          <MemoryTile key={card.id} card={card} onClick={handleClick} bgStyle={currentBg} />
        ))}
      </GridRevealWrapper>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <MemoryResetDialog
            onConfirm={confirmReset}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}