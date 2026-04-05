import { useState, useEffect, useRef } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";

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
  return (
    <div
      onClick={() => !card.matched && !card.flipped && onClick(card.id)}
      className="perspective-1000 cursor-pointer"
      style={{ aspectRatio: "1" }}
    >
      <div
        className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${card.flipped || card.matched ? "rotate-y-180" : ""}`}
      >
        {/* Back */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-700 to-purple-900 rounded-xl border-4 border-purple-500 flex items-center justify-center shadow-lg">
          <span className="text-3xl">🌸</span>
        </div>
        {/* Front */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-4 flex items-center justify-center shadow-lg text-4xl ${card.matched ? "bg-gradient-to-br from-green-600 to-green-800 border-green-400" : "bg-gradient-to-br from-yellow-600 to-yellow-800 border-yellow-400"}`}>
          {card.emoji}
        </div>
      </div>
    </div>
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

  function startGame(idx = sizeIdx) {
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
  }

  function handleClick(id) {
    if (lockRef.current) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

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
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true, flipped: true } : c));
          setMatched(prev => {
            const newMatched = prev + 1;
            if (newMatched === SIZES[sizeIdx].pairs) setWon(true);
            return newMatched;
          });
          setFlipped([]);
          lockRef.current = false;
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
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
        <button onClick={() => startGame()} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">
          🔄 New
        </button>
      </div>
      <div className={`grid gap-2 max-w-lg mx-auto`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map(card => <Tile key={card.id} card={card} onClick={handleClick} />)}
      </div>
    </div>
  );
}