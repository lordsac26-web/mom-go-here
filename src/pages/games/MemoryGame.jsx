import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import GameBackButton from "../../components/GameBackButton";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";
import FlipCard from "../../components/FlipCard";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameStore } from "../../stores/gameStore";
import useConfetti from "../../hooks/useConfetti";
import GridRevealWrapper from "../../components/GridRevealWrapper";
import MemoryBackgroundPicker, { MEMORY_BACKGROUNDS } from "../../components/MemoryBackgroundPicker";

const EMOJI_SETS = ["🌸", "🦋", "🌈", "⭐", "🍀", "🌺", "🐝", "🦁", "🌙", "🍎", "🐬", "🎵", "🌻", "🦚", "🍓", "🐱", "🦊", "🌴", "🐘", "🎨", "💎", "🦅", "🍇", "🌊", "🐢", "🦜", "🍄", "🌮", "🐙", "🎸", "🦩", "🏔️", "🌿", "🦋", "🐠", "🍰", "🦄", "🌹"];

const SIZES = [
  { label: "Easy (4×4)", rows: 4, cols: 4, pairs: 8 },
  { label: "Medium (6×6)", rows: 6, cols: 6, pairs: 18 },
  { label: "Hard (10×10)", rows: 10, cols: 10, pairs: 50 },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function Tile({ card, onClick, bgStyle }) {
  const isRevealed = card.flipped || card.matched;
  const bg = bgStyle || MEMORY_BACKGROUNDS[0];

  const backContent = (
    <div className={`w-full h-full bg-gradient-to-br ${bg.gradient} rounded-xl border-4 ${bg.border} flex items-center justify-center shadow-lg`}>
      <span className="text-3xl">🌸</span>
    </div>
  );

  const frontContent = (
    <div className={`w-full h-full rounded-xl border-4 flex items-center justify-center shadow-lg text-4xl ${
      card.matched
        ? "bg-gradient-to-br from-green-600 to-green-800 border-green-400"
        : "bg-gradient-to-br from-yellow-600 to-yellow-800 border-yellow-400"
    }`}>
      {card.emoji}
    </div>
  );

  return (
    <FlipCard
      isFlipped={isRevealed}
      front={frontContent}
      back={backContent}
      onTap={() => onClick(card.id)}
      disabled={card.matched || card.flipped}
      matchPulse={card.matched}
      flipDuration={0.45}
    />
  );
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
  useGameTimer();
  const lockRef = useRef(false);

  // FIX (bug): track mounted state to avoid setState calls after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // FIX (perf): store sizeIdx in a ref so async callbacks always see the latest value
  const sizeIdxRef = useRef(sizeIdx);

  const { tapVibrate, matchVibrate, winVibrate } = useHaptics();
  const { cardFlipSound, matchSound, winSound, uiClickSound } = useGameAudio();
  const { spark, burst, shower, fireworks, emojiRain } = useConfetti();

  const initializeGame = useGameStore((state) => state.initializeGame);
  const addHistoryEntry = useGameStore((state) => state.addHistoryEntry);
  const setPlayerScore = useGameStore((state) => state.setPlayerScore);
  const currentRound = useGameStore((state) => state.currentRound);
  const gameStatus = useGameStore((state) => state.gameStatus);

  // FIX (perf): guard against re-initializing Zustand on every render
  const zustandInitRef = useRef(false);
  useEffect(() => {
    if (started && gameStatus === "setup" && !zustandInitRef.current) {
      zustandInitRef.current = true;
      // FIX (security): wrap localStorage access in try/catch — corrupted JSON will crash without it
      let user = {};
      try {
        user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      } catch (err) {
        console.warn("Could not parse currentUser from localStorage:", err);
      }
      initializeGame(
        [{ id: user.id || "player-1", name: user.name || "Player" }],
        1
      );
    }
  }, [started, gameStatus, initializeGame]);

  function startGame(idx = sizeIdx) {
    uiClickSound();
    // FIX (perf): keep ref in sync with state so callbacks read the correct size
    sizeIdxRef.current = idx;
    setSizeIdx(idx);
    zustandInitRef.current = false;

    const { pairs } = SIZES[idx];
    const selected = shuffle(EMOJI_SETS).slice(0, pairs);
    const deck = shuffle(
      [...selected, ...selected].map((emoji, i) => ({
        id: i,
        emoji,
        flipped: false,
        matched: false,
      }))
    );
    setCards(deck);
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setWon(false);
    setStarted(true);
    setGameKey(k => k + 1);
    lockRef.current = false;

    addHistoryEntry({
      round: 1,
      playerId: "player-1",
      playerName: "Player",
      action: "start_game",
      result: { difficulty: SIZES[idx].label },
    });
  }

  function handleClick(id) {
    if (lockRef.current) return;
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
          // FIX (bug): don't update state if the component has unmounted
          if (!mountedRef.current) return;

          matchVibrate();
          matchSound();
          spark();

          // FIX (perf): single map pass to mark both matched tiles
          setCards(prev =>
            prev.map(c =>
              newFlipped.includes(c.id) ? { ...c, matched: true, flipped: true } : c
            )
          );

          setMatched(prev => {
            const newMatched = prev + 1;
            // FIX (bug): read from ref so the pair count is never stale after a restart
            const currentSize = SIZES[sizeIdxRef.current];

            addHistoryEntry({
              round: 1,
              playerId: "player-1",
              playerName: "Player",
              action: "match_found",
              result: { pair: newMatched, totalPairs: currentSize.pairs },
            });

            const pct = newMatched / currentSize.pairs;
            if (pct === 0.25 || pct === 0.5 || pct === 0.75) burst();

            if (newMatched === currentSize.pairs) {
              winVibrate();
              winSound();
              fireworks();
              emojiRain(["🧠", "🎉", "⭐"]);
              // FIX (bug): setWon inside the updater risks batching issues — use a separate call
              setTimeout(() => {
                if (mountedRef.current) setWon(true);
              }, 0);
              setPlayerScore("player-1", newMatched);
            }
            return newMatched;
          });

          setFlipped([]);
          lockRef.current = false;
        }, 600);
      } else {
        setTimeout(() => {
          // FIX (bug): don't update state if the component has unmounted
          if (!mountedRef.current) return;

          setCards(prev =>
            prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c)
          );

          addHistoryEntry({
            round: 1,
            playerId: "player-1",
            playerName: "Player",
            action: "mismatch",
            result: { move: moves + 1 },
          });

          setFlipped([]);
          lockRef.current = false;
        }, 1200);
      }
    }
  }

  const currentBg = MEMORY_BACKGROUNDS.find(b => b.key === bgKey) || MEMORY_BACKGROUNDS[0];

  if (!started) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24">
      <div className="text-8xl mb-4">🧠</div>
      <h1 className="text-4xl font-black text-primary mb-2 text-center">Memory Match</h1>
      <p className="text-xl text-muted-foreground text-center mb-8">Flip tiles to find matching pairs!</p>

      <MemoryBackgroundPicker selected={bgKey} onSelect={setBgKey} />

      <div className="space-y-4 w-full max-w-sm mt-6">
        {SIZES.map((s, i) => (
          <button key={i} onClick={() => { setSizeIdx(i); startGame(i); }}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white text-2xl font-black py-5 rounded-2xl shadow-xl">
            {s.label}
          </button>
        ))}
      </div>
      <GameBackButton className="mt-8" />
    </div>
  );

  if (won) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">You Won!</h1>
      <p className="text-2xl text-foreground mb-2">Matched all {SIZES[sizeIdx].pairs} pairs!</p>
      <p className="text-xl text-muted-foreground mb-8">Total moves: {moves}</p>
      <button
        onClick={() => { tapVibrate(); startGame(); }}
        className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4"
      >
        🔄 Play Again
      </button>
      <GameBackButton />
    </div>
  );

  const { cols } = SIZES[sizeIdx];
  return (
    <div className="min-h-screen px-2 py-4 pb-24">
      <div className="flex items-center justify-between px-2 mb-4">
        <GameBackButton />
        <div className="text-center">
          <div className="text-2xl font-black text-primary">🧠 Memory</div>
          <div className="text-muted-foreground">Moves: {moves} | Pairs: {matched}/{SIZES[sizeIdx].pairs}</div>
        </div>
        <div className="flex gap-2">
          <GameInstructions
            title="Memory Match"
            emoji="🧠"
            steps={[
              "Tap any tile to flip it over and reveal the emoji.",
              "Tap a second tile — if both emojis match, they stay face up!",
              "If they don't match, both tiles flip back. Remember where they are!",
              "Keep matching until all pairs are found.",
              "Try to finish in as few moves as possible!"
            ]}
          />
          <button
            onClick={() => { tapVibrate(); startGame(); }}
            className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold"
          >
            🔄 New
          </button>
        </div>
      </div>
      <GridRevealWrapper
        cols={cols}
        pattern="auto"
        revealKey={gameKey}
        className="grid gap-2 max-w-lg mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map(card => <Tile key={card.id} card={card} onClick={handleClick} bgStyle={currentBg} />)}
      </GridRevealWrapper>
    </div>
  );
}