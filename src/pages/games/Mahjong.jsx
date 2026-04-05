import { useState } from "react";
import { Link } from "react-router-dom";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";

const TILE_SYMBOLS = [
  "🀇","🀈","🀉","🀊","🀋","🀌","🀍","🀎","🀏",
  "🀙","🀚","🀛","🀜","🀝","🀞","🀟","🀠","🀡",
  "🀀","🀁","🀂","🀃","🀄","🀅","🀆",
  "🌸","🌿","🍃","🎋",
];

// Simple layout: flat grid mahjong (match pairs)
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function buildTiles() {
  const symbols = TILE_SYMBOLS.slice(0, 18);
  const pairs = [...symbols, ...symbols];
  return shuffle(pairs).map((sym, i) => ({ id: i, sym, matched: false, selected: false }));
}

function Tile3D({ tile, onClick }) {
  return (
    <button
      onClick={() => !tile.matched && onClick(tile.id)}
      disabled={tile.matched}
      className={`mahjong-tile aspect-[7/8] rounded-lg text-2xl sm:text-3xl flex items-center justify-center font-bold transition-all select-none
        ${tile.matched
          ? "opacity-0 pointer-events-none"
          : tile.selected
            ? "bg-yellow-300 border-4 border-yellow-500 mahjong-tile-face shadow-2xl scale-110 z-10"
            : "bg-amber-100 border-4 border-amber-400 mahjong-tile-face hover:scale-105"
        }`}
      style={{
        boxShadow: tile.matched ? "none" : tile.selected
          ? "0 8px 20px rgba(0,0,0,0.5), 4px 4px 0 rgba(0,0,0,0.35)"
          : "4px 4px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      {tile.sym}
    </button>
  );
}

export default function Mahjong() {
  useGameTimer();
  const [tiles, setTiles] = useState(buildTiles());
  const [selectedId, setSelectedId] = useState(null);
  const [matches, setMatches] = useState(0);
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  const total = tiles.length / 2;

  function handleClick(id) {
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

    if (first.sym === second.sym) {
      setMessage("✅ Match!");
      const newMatches = matches + 1;
      setTiles(prev => prev.map(t => [selectedId, id].includes(t.id) ? { ...t, matched: true, selected: false } : t));
      setMatches(newMatches);
      setSelectedId(null);
      if (newMatches === total) { setWon(true); setMessage(""); }
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

      <div className="grid gap-1.5 sm:gap-2 px-2 max-w-md mx-auto" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        {tiles.map(tile => <Tile3D key={tile.id} tile={tile} onClick={handleClick} />)}
      </div>
    </div>
  );
}