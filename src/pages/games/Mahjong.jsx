import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import MahjongTile from "../../components/MahjongTile";
import useConfetti from "../../hooks/useConfetti";
import { LAYOUTS } from "../../components/mahjong/MahjongLayout";
import {
  generateTiles,
  isTileFree,
  canMatch,
  hasValidMoves,
  remainingCount,
  getFreeTiles,
} from "../../components/mahjong/MahjongEngine";

const DIFFICULTY_OPTIONS = [
  { key: "easy", label: "Easy (72 tiles)", sub: "Fortress layout" },
  { key: "classic", label: "Classic (144 tiles)", sub: "Traditional Turtle" },
];

export default function Mahjong() {
  useGameTimer();
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();
  const { mahjongTileSound, matchSound, winSound, uiClickSound } = useGameAudio();
  const { spark, burst, fireworks, emojiRain } = useConfetti();

  const [difficulty, setDifficulty] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  const [stuck, setStuck] = useState(false);

  const mismatchRef = useRef(null);
  const totalPairs = tiles.length / 2;

  // Compute free tiles for highlighting
  const freeTileIds = useMemo(() => {
    if (!tiles.length) return new Set();
    return new Set(getFreeTiles(tiles).map(t => t.id));
  }, [tiles]);

  // Compute board bounds for positioning
  const bounds = useMemo(() => {
    if (!tiles.length) return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0, maxLayer: 0 };
    const active = tiles.filter(t => !t.removed);
    if (!active.length) return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0, maxLayer: 0 };
    return {
      minRow: Math.min(...active.map(t => t.row)),
      maxRow: Math.max(...active.map(t => t.row)),
      minCol: Math.min(...active.map(t => t.col)),
      maxCol: Math.max(...active.map(t => t.col)),
      maxLayer: Math.max(...active.map(t => t.layer)),
    };
  }, [tiles]);

  function startGame(key) {
    uiClickSound();
    if (mismatchRef.current) clearTimeout(mismatchRef.current);
    const layout = LAYOUTS[key];
    const newTiles = generateTiles(layout.positions);
    setDifficulty(key);
    setTiles(newTiles);
    setSelectedId(null);
    setMatches(0);
    setMoves(0);
    setMessage("");
    setWon(false);
    setStuck(false);
  }

  function handleShuffle() {
    // Reshuffle remaining tiles in place (keeps positions, reassigns tile faces)
    uiClickSound();
    const remaining = tiles.filter(t => !t.removed);
    const removed = tiles.filter(t => t.removed);
    const positions = remaining.map(t => ({ row: t.row, col: t.col, layer: t.layer }));
    const newTiles = generateTiles(positions);
    // Give them new IDs offset from removed max
    const maxId = Math.max(...tiles.map(t => t.id)) + 1;
    const reshuffled = newTiles.map((t, i) => ({ ...t, id: maxId + i }));
    setTiles([...removed, ...reshuffled]);
    setSelectedId(null);
    setStuck(false);
    setMessage("🔀 Tiles reshuffled!");
    setTimeout(() => setMessage(""), 1500);
  }

  function handleClick(id) {
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.removed) return;
    
    // Check if tile is free
    if (!isTileFree(tile, tiles)) {
      setMessage("🔒 That tile is blocked!");
      setTimeout(() => setMessage(""), 1200);
      return;
    }

    tapVibrate();
    mahjongTileSound();

    if (selectedId === null) {
      // Clear pending mismatch
      if (mismatchRef.current) {
        clearTimeout(mismatchRef.current);
        mismatchRef.current = null;
      }
      setSelectedId(id);
      return;
    }

    if (selectedId === id) {
      setSelectedId(null);
      return;
    }

    const first = tiles.find(t => t.id === selectedId);
    setMoves(m => m + 1);

    if (canMatch(first, tile)) {
      // Match!
      const newMatches = matches + 1;
      matchSound();
      spark();
      successVibrate();

      const updated = tiles.map(t =>
        t.id === selectedId || t.id === id ? { ...t, removed: true } : t
      );
      setTiles(updated);
      setMatches(newMatches);
      setSelectedId(null);

      const left = remainingCount(updated);
      if (left === 0) {
        winVibrate(); winSound(); fireworks(); emojiRain(["🀄", "🎉", "⭐", "🏆"]);
        setWon(true);
        setMessage("");
      } else {
        if (newMatches % 5 === 0) burst();
        setMessage("✅ Match!");
        setTimeout(() => setMessage(""), 1000);
        // Check for deadlock
        if (!hasValidMoves(updated)) {
          setStuck(true);
        }
      }
    } else {
      // No match
      setMessage("❌ Tiles don't match!");
      setSelectedId(null);
      mismatchRef.current = setTimeout(() => {
        setMessage("");
        mismatchRef.current = null;
      }, 1000);
    }
  }

  function reset() {
    if (difficulty) startGame(difficulty);
  }

  function backToMenu() {
    uiClickSound();
    if (mismatchRef.current) clearTimeout(mismatchRef.current);
    setDifficulty(null);
    setTiles([]);
    setWon(false);
    setStuck(false);
  }

  // ── Difficulty selection ──
  if (difficulty === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24">
        <div className="text-8xl mb-4">🀄</div>
        <h1 className="text-4xl font-black text-primary mb-2 text-center">Mahjong Solitaire</h1>
        <p className="text-xl text-muted-foreground text-center mb-2">Match free tiles to clear the board</p>
        <p className="text-base text-muted-foreground text-center mb-8 max-w-sm">
          Only tiles with a free left or right side and nothing on top can be selected. Match identical tiles to remove them.
        </p>
        <div className="space-y-4 w-full max-w-sm">
          {DIFFICULTY_OPTIONS.map(d => (
            <button
              key={d.key}
              onClick={() => startGame(d.key)}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white text-2xl font-black py-5 rounded-2xl shadow-xl"
            >
              <div>{d.label}</div>
              <div className="text-sm font-semibold text-white/70">{d.sub}</div>
            </button>
          ))}
        </div>
        <Link to="/games" className="mt-8 text-primary text-xl font-bold">← Back to Games</Link>
      </div>
    );
  }

  // ── Win screen ──
  if (won) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
        <div className="text-8xl mb-4">🎉</div>
        <h1 className="text-4xl font-black text-primary mb-4">Board Cleared!</h1>
        <p className="text-2xl text-foreground mb-1">Layout: {LAYOUTS[difficulty].name}</p>
        <p className="text-2xl text-foreground mb-2">Moves: {moves} | Matches: {matches}</p>
        <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
          🔄 Play Again
        </button>
        <button onClick={backToMenu} className="text-primary text-xl font-bold mb-2">Choose Layout</button>
        <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
      </div>
    );
  }

  // ── Game board ──
  // Calculate tile dimensions based on screen
  const TILE_W = difficulty === "easy" ? 42 : 34;
  const TILE_H = TILE_W * 1.33;
  const LAYER_OFFSET = 4;

  const boardWidth = (bounds.maxCol - bounds.minCol + 1) * TILE_W + bounds.maxLayer * LAYER_OFFSET + TILE_W;
  const boardHeight = (bounds.maxRow - bounds.minRow + 1) * TILE_H + bounds.maxLayer * LAYER_OFFSET + TILE_H;

  return (
    <div className="min-h-screen px-2 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-3">
        <Link to="/games" className="text-primary text-lg font-bold">← Back</Link>
        <div className="text-center">
          <div className="text-xl font-black text-primary">🀄 Mahjong</div>
          <div className="text-sm text-muted-foreground">
            Matched: {matches} | Left: {remainingCount(tiles)} | Moves: {moves}
          </div>
        </div>
        <div className="flex gap-2">
          <GameInstructions
            title="Mahjong Solitaire"
            emoji="🀄"
            steps={[
              "Only 'free' tiles can be selected — tiles with nothing on top AND at least one open side (left or right).",
              "Free tiles have a subtle glow. Blocked tiles appear slightly darker.",
              "Tap two matching free tiles to remove them from the board.",
              "Tiles match if they are the same type: same suit and number, same wind, or same dragon.",
              "Clear all tiles from the board to win!",
              "If you get stuck, use the Shuffle button to rearrange remaining tiles.",
            ]}
          />
          <button onClick={reset} className="bg-secondary text-foreground px-3 py-2 rounded-xl font-bold text-sm">🔄</button>
        </div>
      </div>

      {message && (
        <div className="text-center text-xl font-black text-primary mb-2">{message}</div>
      )}

      {/* Stuck warning */}
      {stuck && (
        <div className="text-center mb-3">
          <div className="bg-destructive/20 border-2 border-destructive rounded-2xl p-3 max-w-sm mx-auto">
            <p className="text-lg font-bold text-destructive">No more moves available!</p>
            <button
              onClick={handleShuffle}
              className="mt-2 bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold text-lg"
            >
              🔀 Shuffle Tiles
            </button>
          </div>
        </div>
      )}

      {/* Board — scrollable container */}
      <div className="overflow-auto pb-4 flex justify-center">
        <div
          className="relative"
          style={{
            width: `${boardWidth}px`,
            height: `${boardHeight}px`,
            minWidth: `${boardWidth}px`,
          }}
        >
          {/* Render tiles sorted by layer (bottom first) so higher tiles render on top */}
          {tiles
            .filter(t => !t.removed)
            .sort((a, b) => a.layer - b.layer || a.row - b.row || a.col - b.col)
            .map(tile => {
              const isFree = freeTileIds.has(tile.id);
              const isSelected = tile.id === selectedId;
              const left = (tile.col - bounds.minCol) * TILE_W + tile.layer * LAYER_OFFSET;
              const top = (tile.row - bounds.minRow) * TILE_H - tile.layer * LAYER_OFFSET;

              return (
                <div
                  key={tile.id}
                  className="absolute"
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${TILE_W}px`,
                    height: `${TILE_H}px`,
                    zIndex: tile.layer * 100 + Math.round(tile.row * 10),
                  }}
                >
                  <MahjongTile
                    tile={{ ...tile, selected: isSelected }}
                    onClick={handleClick}
                    isFree={isFree}
                  />
                </div>
              );
            })}
        </div>
      </div>

      {/* Shuffle button at bottom */}
      <div className="text-center mt-3">
        <button
          onClick={handleShuffle}
          className="bg-secondary text-foreground px-5 py-2 rounded-xl font-bold text-base border border-border"
        >
          🔀 Shuffle Remaining
        </button>
      </div>
    </div>
  );
}