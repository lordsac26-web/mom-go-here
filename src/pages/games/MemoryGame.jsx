import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GameBackButton from "../../components/GameBackButton";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import useConfetti from "../../hooks/useConfetti";
import MemoryBackgroundPicker, { MEMORY_BACKGROUNDS } from "../../components/MemoryBackgroundPicker";
import { useGameActivity } from "../../hooks/useGameActivity";
import { useDailyMissions } from "../../hooks/useDailyMissions";
import { base44 } from "@/api/base44Client";
import { saveGameScore } from "@/lib/scoreSaver";
import MemoryTile from "../../components/memory/MemoryTile";
import MemoryResetDialog from "../../components/memory/MemoryResetDialog";
import MemoryStarRating from "../../components/memory/MemoryStarRating";
import { useMemorySounds } from "../../hooks/useMemorySounds";
import CoinRewardBadge from "../../components/games/CoinRewardBadge";
import { awardCoinsForStars } from "@/lib/awardCoins";

const EMOJI_SETS = [
  "🌸", "🦋", "🌈", "⭐", "🍀", "🌺", "🐝", "🦁", "🌙", "🍎",
  "🐬", "🎵", "🌻", "🦚", "🍓", "🐱", "🦊", "🌴", "🐘", "🎨",
  "💎", "🦅", "🍇", "🌊", "🐢", "🦜", "🍄", "🌮", "🐙", "🎸",
  "🦩", "🏔️", "🌿", "🐠", "🍰", "🦄", "🌹", "🎯", "🐳", "🍕",
  "🦔", "🌽", "🎪", "🐧", "🍉", "🦀", "🌶️", "🎭", "🐌", "🍩",
  "🦉", "🌵", "🎳", "🐸", "🍫",
];

const SIZES = [
  { label: "Easy", sublabel: "4×3", rows: 3, cols: 4, pairs: 6, emoji: "😊", color: "from-emerald-500 to-teal-600", border: "border-emerald-400" },
  { label: "Medium", sublabel: "4×4", rows: 4, cols: 4, pairs: 8, emoji: "🧠", color: "from-blue-500 to-indigo-600", border: "border-blue-400" },
  { label: "Hard", sublabel: "6×6", rows: 6, cols: 6, pairs: 18, emoji: "🔥", color: "from-rose-500 to-purple-600", border: "border-rose-400" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getStars(moves, pairs) {
  const ratio = moves / pairs;
  if (ratio <= 1.3) return 3;
  if (ratio <= 1.8) return 2;
  return 1;
}

export default function MemoryGame() {
  const [phase, setPhase] = useState("menu"); // menu | playing | won
  const [sizeIdx, setSizeIdx] = useState(0);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [bgKey, setBgKey] = useState("classic");
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bestScores, setBestScores] = useState({});
  const [muted, setMuted] = useState(false);
  const [peekCountdown, setPeekCountdown] = useState(0);
  const [coinsWon, setCoinsWon] = useState(0);

  useGameTimer();
  const lockRef = useRef(false);
  const mountedRef = useRef(true);
  const sizeIdxRef = useRef(sizeIdx);
  const userEmailRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const matchedRef = useRef(0);
  const movesRef = useRef(0);

  const { tapVibrate, matchVibrate, winVibrate } = useHaptics();
  const { spark, burst, fireworks, emojiRain } = useConfetti();
  const { reportWin } = useGameActivity();
  const { reportMissionProgress } = useDailyMissions();
  const sounds = useMemorySounds();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    sounds.setMuted(muted);
  }, [muted]);

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

  // Timer
  useEffect(() => {
    if (phase === "playing" && !peeking) {
      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    if (phase !== "playing" && timerRef.current) clearInterval(timerRef.current);
  }, [phase, peeking]);

  function startGame(idx = sizeIdx) {
    sizeIdxRef.current = idx;
    setSizeIdx(idx);
    matchedRef.current = 0;
    movesRef.current = 0;
    setCoinsWon(0);

    const { pairs } = SIZES[idx];
    const selected = shuffle(EMOJI_SETS).slice(0, pairs);
    const deck = shuffle(
      [...selected, ...selected].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    );

    const peekDeck = deck.map(c => ({ ...c, flipped: true }));
    setCards(peekDeck);
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setPhase("playing");
    setPeeking(true);
    setElapsedSeconds(0);
    setGameKey(k => k + 1);
    lockRef.current = true;
    sounds.playPeek();

    const peekTime = pairs <= 8 ? 2500 : 3500;
    // countdown
    let remaining = Math.ceil(peekTime / 1000);
    setPeekCountdown(remaining);
    const countInterval = setInterval(() => {
      remaining--;
      setPeekCountdown(remaining);
      if (remaining <= 0) clearInterval(countInterval);
    }, 1000);

    setTimeout(() => {
      if (!mountedRef.current) return;
      setCards(deck);
      setPeeking(false);
      setPeekCountdown(0);
      lockRef.current = false;
      startTimeRef.current = Date.now();
    }, peekTime);
  }

  async function recordGameWin(moveCount, seconds, difficulty) {
    const email = userEmailRef.current;
    if (!email) return;
    await saveGameScore({
      game_name: "Memory Match",
      score: moveCount,
      duration_seconds: seconds,
      difficulty,
      completed: true,
    });
    const currentBest = bestScores[difficulty];
    if (!currentBest || moveCount < currentBest.moves) {
      setBestScores(prev => ({ ...prev, [difficulty]: { moves: moveCount, time: seconds } }));
    }
    // Award coins scaled by star rating + difficulty (mirrors the other classic games)
    const pairs = SIZES.find(s => s.label === difficulty)?.pairs ?? 6;
    const stars = getStars(moveCount, pairs);
    const diffBase = { Easy: 15, Medium: 25, Hard: 40 }[difficulty] || 20;
    const awarded = await awardCoinsForStars(stars, diffBase);
    setCoinsWon(awarded);
  }

  function handleClick(id) {
    if (lockRef.current || peeking) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;
    tapVibrate();
    sounds.playFlip();

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    const newFlipped = [...flipped, id];
    setCards(newCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      movesRef.current += 1;
      setMoves(movesRef.current);
      lockRef.current = true;
      const [a, b] = newFlipped.map(fid => newCards.find(c => c.id === fid));

      if (a.emoji === b.emoji) {
        setTimeout(() => {
          if (!mountedRef.current) return;
          matchVibrate();
          sounds.playMatch();
          spark();

          setCards(prev =>
            prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true, flipped: true } : c)
          );

          matchedRef.current += 1;
          setMatched(matchedRef.current);

          const currentSize = SIZES[sizeIdxRef.current];
          const pct = matchedRef.current / currentSize.pairs;
          if (pct === 0.25 || pct === 0.5 || pct === 0.75) burst();

          if (matchedRef.current === currentSize.pairs) {
            winVibrate();
            sounds.playWin();
            fireworks();
            emojiRain(["🧠", "🎉", "⭐", "🌟"]);
            reportWin("Memory Match");
            reportMissionProgress([
              { type: "win_specific", extra: "Memory Match" },
              "win_any",
              "play_any",
            ]);
            const finalSeconds = startTimeRef.current
              ? Math.floor((Date.now() - startTimeRef.current) / 1000)
              : 0;
            setElapsedSeconds(finalSeconds);
            recordGameWin(movesRef.current, finalSeconds, currentSize.label);
            setTimeout(() => { if (mountedRef.current) setPhase("won"); }, 600);
          }

          setFlipped([]);
          lockRef.current = false;
        }, 600);
      } else {
        setTimeout(() => {
          if (!mountedRef.current) return;
          sounds.playMismatch();
          setCards(prev =>
            prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c)
          );
          setFlipped([]);
          lockRef.current = false;
        }, 1100);
      }
    }
  }

  function handleNewGame() {
    if (movesRef.current > 0 && phase === "playing") {
      setShowResetConfirm(true);
    } else {
      setPhase("menu");
    }
  }

  function confirmReset() {
    setShowResetConfirm(false);
    setPhase("menu");
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const currentBg = MEMORY_BACKGROUNDS.find(b => b.key === bgKey) || MEMORY_BACKGROUNDS[0];
  const currentSize = SIZES[sizeIdx];
  const progressPct = currentSize ? (matched / currentSize.pairs) * 100 : 0;

  // ── MENU ──
  if (phase === "menu") return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-center px-4 pb-24">
      {/* Hero */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="text-8xl mb-2 select-none"
      >
        🧠
      </motion.div>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-5xl font-black text-white mb-1 tracking-tight"
      >
        Memory Match
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-lg text-purple-300 mb-6 text-center"
      >
        Flip tiles · Find pairs · Train your brain
      </motion.p>

      {/* Card Style Picker */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        onClick={() => setShowBgPicker(!showBgPicker)}
        className="text-sm font-bold text-purple-300 mb-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20"
      >
        🎨 Card Style: {currentBg.emoji} {currentBg.label} {showBgPicker ? "▲" : "▼"}
      </motion.button>
      <AnimatePresence>
        {showBgPicker && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <MemoryBackgroundPicker selected={bgKey} onSelect={(k) => { setBgKey(k); setShowBgPicker(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Difficulty Cards */}
      <div className="space-y-3 w-full max-w-sm mt-3">
        {SIZES.map((s, i) => {
          const best = bestScores[s.label];
          return (
            <motion.button
              key={i}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.1, type: "spring", stiffness: 220 }}
              onClick={() => startGame(i)}
              className={`w-full bg-gradient-to-r ${s.color} text-white rounded-2xl shadow-xl border-2 ${s.border} active:scale-95 transition-transform`}
            >
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="text-left">
                  <div className="text-2xl font-black">{s.emoji} {s.label}</div>
                  <div className="text-sm font-bold opacity-80">{s.sublabel} · {s.pairs} pairs</div>
                  {best && (
                    <div className="text-xs opacity-70 mt-0.5">
                      🏆 Best: {best.moves} moves{best.time > 0 ? ` · ${formatTime(best.time)}` : ""}
                    </div>
                  )}
                </div>
                <span className="text-4xl">{best ? "🏆" : "▶"}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="flex items-center gap-3 mt-6"
      >
        <button
          onClick={() => setMuted(m => !m)}
          className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          {muted ? "🔇 Sound Off" : "🔊 Sound On"}
        </button>
        <GameBackButton />
      </motion.div>
    </div>
  );

  // ── WIN SCREEN ──
  if (phase === "won") {
    const stars = getStars(moves, currentSize.pairs);
    const isNewBest = bestScores[currentSize.label]?.moves === moves;
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-center px-4 pb-24 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="text-8xl mb-3"
        >
          🎉
        </motion.div>
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-black text-white mb-2"
        >
          You Won!
        </motion.h1>

        {/* Stars */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, type: "spring" }}
          className="flex gap-2 text-5xl mb-4"
        >
          {[1, 2, 3].map(n => (
            <span key={n} className={n <= stars ? "text-yellow-400" : "text-gray-600"}>★</span>
          ))}
        </motion.div>

        {coinsWon > 0 && (
          <div className="mb-4">
            <CoinRewardBadge amount={coinsWon} />
          </div>
        )}

        {/* Stats card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="bg-white/10 border border-white/20 rounded-2xl px-8 py-5 mb-5 w-full max-w-xs"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-black text-white">{moves}</div>
              <div className="text-xs text-purple-300 uppercase tracking-wide">Moves</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">{formatTime(elapsedSeconds)}</div>
              <div className="text-xs text-purple-300 uppercase tracking-wide">Time</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">{currentSize.pairs}</div>
              <div className="text-xs text-purple-300 uppercase tracking-wide">Pairs</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">{stars}⭐</div>
              <div className="text-xs text-purple-300 uppercase tracking-wide">Rating</div>
            </div>
          </div>
          {isNewBest && (
            <div className="mt-3 text-yellow-400 font-black text-sm animate-pulse">🏆 New Personal Best!</div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="space-y-3 w-full max-w-xs"
        >
          <button
            onClick={() => { tapVibrate(); startGame(); }}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-2xl font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-transform border-2 border-purple-400"
          >
            🔄 Play Again
          </button>
          <button
            onClick={() => setPhase("menu")}
            className="w-full bg-white/10 border border-white/20 text-white text-lg font-bold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Change Difficulty
          </button>
          <GameBackButton />
        </motion.div>
      </div>
    );
  }

  // ── GAME BOARD ──
  const { cols } = currentSize;
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950 flex flex-col pb-4">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm px-3 py-3 flex items-center justify-between border-b border-white/10">
        <GameBackButton />
        <div className="text-center">
          <div className="text-lg font-black text-white">🧠 Memory Match</div>
          <div className="text-xs text-purple-300">{currentSize.label} · {currentSize.sublabel}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setMuted(m => !m)} className="text-lg p-1">
            {muted ? "🔇" : "🔊"}
          </button>
          <GameInstructions
            title="Memory Match"
            emoji="🧠"
            steps={[
              "Cards peek face-up briefly — try to memorize them!",
              "Tap any tile to flip it over and reveal the emoji.",
              "Tap a second tile — if both emojis match, they stay face up!",
              "If they don't match, both flip back. Remember where they are!",
              "Keep matching until all pairs are found.",
              "Fewer moves = more stars!",
            ]}
          />
          <button
            onClick={handleNewGame}
            className="bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-xl font-bold text-sm"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-3 py-2 flex items-center justify-between text-sm font-bold">
        <div className="bg-black/30 rounded-xl px-3 py-1.5 text-center">
          <div className="text-xl font-black text-white">{moves}</div>
          <div className="text-[10px] text-purple-300 uppercase">Moves</div>
        </div>
        <div className="flex-1 mx-2">
          {/* Progress bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 80 }}
            />
          </div>
          <div className="text-center text-xs text-purple-300">
            {matched}/{currentSize.pairs} pairs · ⏱ {formatTime(elapsedSeconds)}
          </div>
        </div>
        <div className="bg-black/30 rounded-xl px-3 py-1.5 text-center">
          <div className="text-xl font-black text-white">{matched}</div>
          <div className="text-[10px] text-purple-300 uppercase">Matched</div>
        </div>
      </div>

      {/* Peek indicator */}
      <AnimatePresence>
        {peeking && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-3 mb-2 bg-yellow-500/20 border border-yellow-400/40 rounded-xl px-4 py-2 text-center"
          >
            <div className="text-yellow-300 font-black text-lg animate-pulse">
              👀 Memorize! {peekCountdown > 0 ? `(${peekCountdown}s)` : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Grid */}
      <div
        className="flex-1 grid gap-2 px-3 pt-1 content-center"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map(card => (
          <MemoryTile key={card.id} card={card} onClick={handleClick} bgStyle={currentBg} />
        ))}
      </div>

      {/* Reset Dialog */}
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