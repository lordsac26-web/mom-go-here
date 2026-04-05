import { useState } from "react";
import { Link } from "react-router-dom";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import MahjongTile from "../../components/MahjongTile";

// Authentic Mahjong tile definitions with suits
const TILE_DEFS = [
  // Characters (萬) 1-9
  ...Array.from({ length: 9 }, (_, i) => ({ suit: "characters", value: i + 1, key: `char-${i + 1}` })),
  // Circles (筒) 1-9
  ...Array.from({ length: 9 }, (_, i) => ({ suit: "circles", value: i + 1, key: `circ-${i + 1}` })),
  // Bamboo (條) 1-9
  ...Array.from({ length: 9 }, (_, i) => ({ suit: "bamboo", value: i + 1, key: `bamb-${i + 1}` })),
  // Winds
  { suit: "wind", value: "east", key: "wind-e" },
  { suit: "wind", value: "south", key: "wind-s" },
  { suit: "wind", value: "west", key: "wind-w" },
  { suit: "wind", value: "north", key: "wind-n" },
  // Dragons
  { suit: "dragon", value: "red", key: "drag-r" },
  { suit: "dragon", value: "green", key: "drag-g" },
  { suit: "dragon", value: "white", key: "drag-w" },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function buildTiles() {
  const selected = shuffle(TILE_DEFS).slice(0, 18);
  const pairs = [...selected, ...selected];
  return shuffle(pairs).map((def, i) => ({
    id: i,
    suit: def.suit,
    value: def.value,
    key: def.key,
    matched: false,
    selected: false,
  }));
}

export default function Mahjong() {
  useGameTimer();
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();
  const { mahjongTileSound, matchSound, winSound, uiClickSound } = useGameAudio();
  const [tiles, setTiles] = useState(buildTiles());
  const [selectedId, setSelectedId] = useState(null);
  const [matches, setMatches] = useState(0);
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  const total = tiles.length / 2;

  function handleClick(id) {
    tapVibrate();
    mahjongTileSound();
    if (selectedId === null) {
      setTiles(prev => prev.map(t => t.id === id ? { ...t, selected: true } : t));
      setSelectedId(id);
      return;
    }
    if (selectedId === id) {
      setTiles(prev => prev.map(t => t.id === id ? { ...t, selected: false } : t));
      setSelectedId(null);
      return;
    }
    const first = tiles.find(t => t.id === selectedId);
    const second = tiles.find(t => t.id === id);
    setMoves(m => m + 1);

    if (first.key === second.key) {
      const newMatches = matches + 1;
      matchSound();
      if (newMatches === total) { winVibrate(); winSound(); setWon(true); setMessage(""); } else { successVibrate(); setMessage("✅ Match!"); }
      setTiles(prev => prev.map(t => [selectedId, id].includes(t.id) ? { ...t, matched: true, selected: false } : t));
      setMatches(newMatches);
      setSelectedId(null);
      setTimeout(() => setMessage(""), 1000);
    } else {
      setMessage("❌ No match, try again!");
      setTiles(prev => prev.map(t => [selectedId, id].includes(t.id) ? { ...t, selected: true } : t));
      setTimeout(() => {
        setTiles(prev => prev.map(t => [selectedId, id].includes(t.id) ? { ...t, selected: false } : t));
        setMessage("");
      }, 900);
      setSelectedId(null);
    }
  }

  function reset() {
    uiClickSound();
    setTiles(buildTiles());
    setSelectedId(null);
    setMatches(0);
    setMessage("");
    setWon(false);
    setMoves(0);
  }

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">All Tiles Matched!</h1>
      <p className="text-2xl text-foreground mb-2">Moves: {moves}</p>
      <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 Play Again
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-2 py-4 pb-24">
      <div className="flex items-center justify-between px-2 mb-4">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
        <div className="text-center">
          <div className="text-2xl font-black text-primary">🀄 Mahjong</div>
          <div className="text-muted-foreground">Pairs: {matches}/{total} | Moves: {moves}</div>
        </div>
        <div className="flex gap-2">
          <GameInstructions
            title="Mahjong"
            emoji="🀄"
            steps={[
              "Tap a tile to select it — it highlights in yellow.",
              "Tap a second tile with the same symbol to make a match.",
              "Matched tiles disappear from the board.",
              "If the tiles don't match, they deselect — try again!",
              "Remove all tiles from the board to win.",
              "Try to finish in as few moves as possible!"
            ]}
          />
          <button onClick={reset} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">🔄</button>
        </div>
      </div>

      {message && (
        <div className="text-center text-2xl font-black text-primary mb-3">{message}</div>
      )}

      <p className="text-center text-muted-foreground text-lg mb-4">Tap two matching tiles to remove them</p>

      <div className="grid gap-1.5 sm:gap-2 px-1 max-w-md mx-auto" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        {tiles.map(tile => <MahjongTile key={tile.id} tile={tile} onClick={handleClick} />)}
      </div>
    </div>
  );
}