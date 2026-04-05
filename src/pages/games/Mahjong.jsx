import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import MahjongTile from "../../components/MahjongTile";
import useConfetti from "../../hooks/useConfetti";
import GridRevealWrapper from "../../components/GridRevealWrapper";

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

const DIFFICULTIES = [
  { label: "Easy (12 pairs)", pairs: 12, cols: 6 },
  { label: "Hard (24 pairs)", pairs: 24, cols: 8 },
];

function buildTiles(pairCount) {
  // FIX (bug): guard against requesting more pairs than tile definitions exist
  if (pairCount > TILE_DEFS.length) {
    throw new Error(`Cannot create ${pairCount} pairs — only ${TILE_DEFS.length} unique tiles available.`);
  }
  const selected = shuffle(TILE_DEFS).slice(0, pairCount);
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
  const { spark, burst, shower, fireworks, emojiRain } = useConfetti();
  const [diffIdx, setDiffIdx] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [matches, setMatches] = useState(0);
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  // FIX (bug): store the mismatch deselect timeout so it can be cancelled on new selection
  const mismatchTimeoutRef = useRef(null);

  const diff = diffIdx !== null ? DIFFICULTIES[diffIdx] : null;
  const total = tiles.length / 2;

  function handleClick(id) {
    tapVibrate();
    mahjongTileSound();

    if (selectedId === null) {
      // FIX (bug): cancel any pending mismatch deselect before making a new selection
      if (mismatchTimeoutRef.current) {
        clearTimeout(mismatchTimeoutRef.current);
        mismatchTimeoutRef.current = null;
        // Clear any previously highlighted mismatch tiles before starting fresh
        setTiles(prev => prev.map(t => ({ ...t, selected: false })));
      }
      setTiles(prev => prev.map(t => t.id === id ? { ...t, selected: true } : t));
      setSelectedId(id);
      return;
    }

    if (selectedId === id) {
      setTiles(prev => prev.map(t => t.id === id ? { ...t, selected: false } : t));
      setSelectedId(null);
      return;
    }

    // FIX (perf): look up both tiles in one pass and batch the state update
    const first = tiles.find(t => t.id === selectedId);
    const second = tiles.find(t => t.id === id);
    setMoves(m => m + 1);

    if (first.key === second.key) {
      const newMatches = matches + 1;
      matchSound();
      spark();
      if (newMatches === total) {
        winVibrate(); winSound(); fireworks(); emojiRain(["🀄", "🎉", "⭐"]);
        setWon(true);
        setMessage("");
      } else {
        const pct = newMatches / total;
        if (pct === 0.25 || pct === 0.5 || pct === 0.75) burst();
        successVibrate();
        setMessage("✅ Match!");
      }
      // FIX (perf): single map pass — mark both matched tiles at once
      setTiles(prev =>
        prev.map(t =>
          t.id === selectedId || t.id === id
            ? { ...t, matched: true, selected: false }
            : t
        )
      );
      setMatches(newMatches);
      setSelectedId(null);
      setTimeout(() => setMessage(""), 1000);
    } else {
      setMessage("❌ No match, try again!");
      setTiles(prev =>
        prev.map(t =>
          t.id === selectedId || t.id === id ? { ...t, selected: true } : t
        )
      );
      // FIX (bug): store timeout ID so a new selection can cancel it
      mismatchTimeoutRef.current = setTimeout(() => {
        setTiles(prev =>
          prev.map(t =>
            t.id === selectedId || t.id === id ? { ...t, selected: false } : t
          )
        );
        setMessage("");
        mismatchTimeoutRef.current = null;
      }, 900);
      setSelectedId(null);
    }
  }

  function startGame(idx) {
    uiClickSound();
    // FIX (bug): cancel any pending timeout when restarting mid-game
    if (mismatchTimeoutRef.current) {
      clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }
    setDiffIdx(idx);
    setTiles(buildTiles(DIFFICULTIES[idx].pairs));
    setSelectedId(null);
    setMatches(0);
    setMessage("");
    setWon(false);
    setMoves(0);
  }

  function reset() {
    if (diffIdx === null) return;
    startGame(diffIdx);
  }

  function backToMenu() {
    uiClickSound();
    if (mismatchTimeoutRef.current) {
      clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }
    setDiffIdx(null);
    setTiles([]);
    setWon(false);
    setMoves(0);
    setMatches(0);
  }

  // Difficulty selection screen
  if (diffIdx === null) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24">
      <div className="text-8xl mb-4">🀄</div>
      <h1 className="text-4xl font-black text-primary mb-2 text-center">Mahjong</h1>
      <p className="text-xl text-muted-foreground text-center mb-8">Match pairs of tiles to clear the board!</p>
      <div className="space-y-4 w-full max-w-sm">
        {DIFFICULTIES.map((d, i) => (
          <button
            key={i}
            onClick={() => startGame(i)}
            className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white text-2xl font-black py-5 rounded-2xl shadow-xl"
          >
            {d.label}
          </button>
        ))}
      </div>
      <Link to="/games" className="mt-8 text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">All Tiles Matched!</h1>
      <p className="text-2xl text-foreground mb-1">Difficulty: {diff.label}</p>
      <p className="text-2xl text-foreground mb-2">Moves: {moves}</p>
      <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 Play Again
      </button>
      <button onClick={backToMenu} className="text-primary text-xl font-bold mb-2">Choose Difficulty</button>
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

      <GridRevealWrapper
        cols={diff.cols}
        pattern="auto"
        revealKey={matches === 0 ? diffIdx : -1}
        className="grid gap-1.5 sm:gap-2 px-1 max-w-md mx-auto"
        style={{ gridTemplateColumns: `repeat(${diff.cols}, 1fr)` }}
      >
        {tiles.map(tile => <MahjongTile key={tile.id} tile={tile} onClick={handleClick} />)}
      </GridRevealWrapper>
    </div>
  );
}