import { useState, useRef, useEffect } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import GameInstructions from "../../components/GameInstructions";
import FlipCard from "../../components/FlipCard";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameStore } from "../../stores/gameStore";

const EMOJI_SETS = ["🌸", "🦋", "🌈", "⭐", "🍀", "🌺", "🐝", "🦁", "🌙", "🍎", "🐬", "🎵", "🌻", "🦚", "🍓", "🐱", "🦊", "🌴", "🐘", "🎨", "💎", "🦅", "🍇", "🌊", "🐢", "🦜", "🍄", "🌮", "🐙", "🎸", "🦩", "🏔️", "🌿", "🦋", "🐠", "🍰", "🦄", "🌹"];

const SIZES = [
  { label: "Easy (4×4)", rows: 4, cols: 4, pairs: 8 },
  { label: "Medium (6×6)", rows: 6, cols: 6, pairs: 18 },
  { label: "Hard (10×10)", rows: 10, cols: 10, pairs: 50 },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function Tile({ card, onClick }) {
  const isRevealed = card.flipped || card.matched;

  const backContent = (
    <div className="w-full h-full bg-gradient-to-br from-purple-700 to-purple-900 rounded-xl border-4 border-purple-500 flex items-center justify-center shadow-lg">
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
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  useGameTimer();
  const lockRef = useRef(false);
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();
  const { cardFlipSound, matchSound, winSound, uiClickSound } = useGameAudio();

  // Zustand store integration
  const initializeGame = useGameStore((state) => state.initializeGame);
  const addHistoryEntry = useGameStore((state) => state.addHistoryEntry);
  const setPlayerScore = useGameStore((state) => state.setPlayerScore);
  const currentRound = useGameStore((state) => state.currentRound);
  const gameStatus = useGameStore((state) => state.gameStatus);

  // Init Zustand on game start
  useEffect(() => {
    if (started && gameStatus === "setup") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      initializeGame(
        [{ id: user.id || "player-1", name: user.name || "Player" }],
        1
      );
    }
  }, [started, gameStatus, initializeGame]);

  function startGame(idx = sizeIdx) {
    uiClickSound();
    const { pairs } = SIZES[idx];
    const selected = shuffle(EMOJI_SETS).slice(0, pairs);
    const deck = shuffle([...selected, ...selected].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })));
    setCards(deck);
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setWon(false);
    setStarted(true);
    lockRef.current = false;
    // Log game start
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
          successVibrate();
          matchSound();
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true, flipped: true } : c));
          setMatched(prev => {
            const newMatched = prev + 1;
            addHistoryEntry({
              round: 1,
              playerId: "player-1",
              playerName: "Player",
              action: "match_found",
              result: { pair: newMatched, totalPairs: SIZES[sizeIdx].pairs },
            });
            if (newMatched === SIZES[sizeIdx].pairs) { 
              winVibrate();
              winSound();
              setWon(true);
              setPlayerScore("player-1", moves + 1);
            }
            return newMatched;
          });
          setFlipped([]);
          lockRef.current = false;
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
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

  if (!started) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24">
      <div className="text-8xl mb-4">🧠</div>
      <h1 className="text-4xl font-black text-primary mb-2 text-center">Memory Match</h1>
      <p className="text-xl text-muted-foreground text-center mb-8">Flip tiles to find matching pairs!</p>
      <div className="space-y-4 w-full max-w-sm">
        {SIZES.map((s, i) => (
          <button key={i} onClick={() => { setSizeIdx(i); startGame(i); }}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white text-2xl font-black py-5 rounded-2xl shadow-xl">
            {s.label}
          </button>
        ))}
      </div>
      <Link to="/games" className="mt-8 text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">You Won!</h1>
      <p className="text-2xl text-foreground mb-2">Matched all {SIZES[sizeIdx].pairs} pairs!</p>
      <p className="text-xl text-muted-foreground mb-8">Total moves: {moves}</p>
      <button onClick={() => startGame()} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 Play Again
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  const { cols } = SIZES[sizeIdx];
  return (
    <div className="min-h-screen bg-background px-2 py-4 pb-24">
      <div className="flex items-center justify-between px-2 mb-4">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
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
          <button onClick={() => startGame()} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">
            🔄 New
          </button>
        </div>
      </div>
      <div className={`grid gap-2 max-w-lg mx-auto`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map(card => <Tile key={card.id} card={card} onClick={handleClick} />)}
      </div>
    </div>
  );
}