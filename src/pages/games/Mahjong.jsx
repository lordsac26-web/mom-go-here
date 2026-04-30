import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameBackButton from "../../components/GameBackButton";
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
import { useGameActivity } from "../../hooks/useGameActivity";
import { base44 } from "@/api/base44Client";
import MahjongHintButton from "../../components/mahjong/MahjongHintButton";
import MahjongResetDialog from "../../components/mahjong/MahjongResetDialog";
import MahjongStarRating from "../../components/mahjong/MahjongStarRating";

const DIFFICULTY_OPTIONS = [
  { key: "easy", label: "Easy (72 tiles)", sub: "Fortress layout" },
  { key: "medium", label: "Medium (108 tiles)", sub: "Pagoda layout" },
  { key: "classic", label: "Classic (144 tiles)", sub: "Traditional Turtle" },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Max auto-reshuffle attempts to find a solvable deal
const MAX_RESHUFFLE = 10;

export default function Mahjong() {
  useGameTimer();
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();
  const { mahjongTileSound, matchSound, winSound, uiClickSound } = useGameAudio();
  const { spark, burst, fireworks, emojiRain } = useConfetti();
  const { reportWin } = useGameActivity();

  const [difficulty, setDifficulty] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hintPair, setHintPair] = useState(null);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Best scores
  const [bestScores, setBestScores] = useState({});
  const userEmailRef = useRef(null);

  const mismatchRef = useRef(null);
  const hintTimerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load user + best scores
  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user?.email) return;
      userEmailRef.current = user.email;
      base44.entities.GameScore.filter({ user_email: user.email, game_name: "Mahjong" }).then(scores => {
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

  // Timer tick
  useEffect(() => {
    if (difficulty && !won) {
      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    if (won && timerRef.current) clearInterval(timerRef.current);
  }, [difficulty, won]);

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

  const totalTiles = useMemo(() => tiles.filter(t => !t.removed).length + matches * 2, [tiles, matches]);
  const totalPairs = totalTiles / 2;
  const currentLeft = remainingCount(tiles);

  // ── Generate a solvable board ──
  function dealSolvableBoard(positions) {
    for (let attempt = 0; attempt < MAX_RESHUFFLE; attempt++) {
      const newTiles = generateTiles(positions);
      if (hasValidMoves(newTiles)) return newTiles;
    }
    // Fallback: return last attempt anyway (shuffle button available)
    return generateTiles(positions);
  }

  function startGame(key) {
    uiClickSound();
    if (mismatchRef.current) clearTimeout(mismatchRef.current);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    const layout = LAYOUTS[key];
    const newTiles = dealSolvableBoard(layout.positions);
    setDifficulty(key);
    setTiles(newTiles);
    setSelectedId(null);
    setMatches(0);
    setMoves(0);
    setMessage("");
    setWon(false);
    setStuck(false);
    setHintPair(null);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
  }

  function handleShuffle() {
    uiClickSound();
    const remaining = tiles.filter(t => !t.removed);
    const removed = tiles.filter(t => t.removed);
    const positions = remaining.map(t => ({ row: t.row, col: t.col, layer: t.layer }));

    // Try to get a solvable reshuffle
    let reshuffled;
    for (let attempt = 0; attempt < MAX_RESHUFFLE; attempt++) {
      const newTiles = generateTiles(positions);
      const maxId = Math.max(...tiles.map(t => t.id), 0) + 1;
      reshuffled = newTiles.map((t, i) => ({ ...t, id: maxId + i }));
      const combined = [...removed, ...reshuffled];
      if (hasValidMoves(combined)) {
        setTiles(combined);
        setSelectedId(null);
        setStuck(false);
        setHintPair(null);
        setMessage("🔀 Tiles reshuffled!");
        setTimeout(() => setMessage(""), 1500);
        return;
      }
    }
    // Fallback
    const maxId = Math.max(...tiles.map(t => t.id), 0) + 1;
    reshuffled = generateTiles(positions).map((t, i) => ({ ...t, id: maxId + i }));
    setTiles([...removed, ...reshuffled]);
    setSelectedId(null);
    setStuck(false);
    setHintPair(null);
    setMessage("🔀 Tiles reshuffled!");
    setTimeout(() => setMessage(""), 1500);
  }

  // ── Hint handler ──
  const handleHint = useCallback((pair) => {
    setHintPair({ id1: pair[0].id, id2: pair[1].id });
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintPair(null), 2500);
  }, []);

  // Clear hint on state change
  useEffect(() => {
    setHintPair(null);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, [tiles, selectedId]);

  // ── Persist win ──
  async function recordWin(moveCount, seconds, diffLabel) {
    const email = userEmailRef.current;
    if (!email) return;
    await base44.entities.GameScore.create({
      user_email: email,
      game_name: "Mahjong",
      score: moveCount,
      duration_seconds: seconds,
      difficulty: diffLabel,
      completed: true,
    });
    const currentBest = bestScores[diffLabel];
    if (!currentBest || moveCount < currentBest.moves) {
      setBestScores(prev => ({ ...prev, [diffLabel]: { moves: moveCount, time: seconds } }));
    }
  }

  function handleClick(id) {
    if (won) return;
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.removed) return;
    
    // Check if tile is free
    if (!isTileFree(tile, tiles)) {
      setMessage("That tile isn't free yet — look for tiles with an open side! 👀");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    tapVibrate();
    mahjongTileSound();

    if (selectedId === null) {
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
        const finalSeconds = startTimeRef.current
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : 0;
        setElapsedSeconds(finalSeconds);
        reportWin("Mahjong");
        const diffLabel = LAYOUTS[difficulty]?.label || difficulty;
        recordWin(moves + 1, finalSeconds, diffLabel);
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
      setMessage("❌ Those don't match — try again!");
      setSelectedId(null);
      mismatchRef.current = setTimeout(() => {
        setMessage("");
        mismatchRef.current = null;
      }, 1200);
    }
  }

  function requestReset() {
    if (moves > 0 && !won) {
      setShowResetConfirm(true);
    } else if (difficulty) {
      startGame(difficulty);
    }
  }

  function confirmReset() {
    setShowResetConfirm(false);
    if (difficulty) startGame(difficulty);
  }

  function backToMenu() {
    uiClickSound();
    if (mismatchRef.current) clearTimeout(mismatchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
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
          Only tiles with an open left or right side and nothing on top can be selected. Match identical tiles to remove them.
        </p>
        <div className="space-y-4 w-full max-w-sm">
          {DIFFICULTY_OPTIONS.map(d => {
            const best = bestScores[LAYOUTS[d.key]?.label];
            return (
              <button
                key={d.key}
                onClick={() => startGame(d.key)}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white text-2xl font-black py-5 rounded-2xl shadow-xl"
              >
                <div>{d.label}</div>
                <div className="text-sm font-semibold text-white/70">{d.sub}</div>
                {best && (
                  <div className="text-sm font-bold text-white/60 mt-0.5">
                    Best: {best.moves} moves{best.time > 0 ? ` · ${formatTime(best.time)}` : ""}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <GameBackButton className="mt-8" />
      </div>
    );
  }

  // ── Win screen ──
  if (won) {
    const diffLabel = LAYOUTS[difficulty]?.label || difficulty;
    const best = bestScores[diffLabel];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
        <div className="text-8xl mb-4">🎉</div>
        <h1 className="text-4xl font-black text-primary mb-3">Board Cleared!</h1>
        <MahjongStarRating moves={moves} pairs={totalPairs} />
        <p className="text-2xl text-foreground mb-1">Layout: {LAYOUTS[difficulty].name}</p>
        <p className="text-xl text-muted-foreground mb-2">
          {moves} moves · {formatTime(elapsedSeconds)}
        </p>
        {best && (
          <p className="text-base text-primary font-bold mb-4">
            🏆 Personal Best: {best.moves} moves{best.time > 0 ? ` · ${formatTime(best.time)}` : ""}
          </p>
        )}
        <button onClick={() => startGame(difficulty)} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-3">
          🔄 Play Again
        </button>
        <button onClick={backToMenu} className="bg-secondary text-foreground text-lg font-bold px-6 py-3 rounded-xl mb-4">
          Change Layout
        </button>
        <GameBackButton />
      </div>
    );
  }

  // ── Game board ──
  // Auto-fit tiles: calculate tile width based on viewport
  const colSpan = bounds.maxCol - bounds.minCol + 2; // +2 for tile width
  const viewportW = typeof window !== "undefined" ? window.innerWidth - 16 : 400; // 16px padding
  const idealTileW = Math.floor(viewportW / colSpan);
  const TILE_W = Math.max(36, Math.min(idealTileW, difficulty === "easy" ? 50 : 44));
  const TILE_H = Math.round(TILE_W * 1.33);
  const LAYER_OFFSET = 4;

  const boardWidth = (bounds.maxCol - bounds.minCol + 1) * TILE_W + bounds.maxLayer * LAYER_OFFSET + TILE_W;
  const boardHeight = (bounds.maxRow - bounds.minRow + 1) * TILE_H + bounds.maxLayer * LAYER_OFFSET + TILE_H;

  // Progress percentage
  const progressPct = totalTiles > 0 ? Math.round(((totalTiles - currentLeft) / totalTiles) * 100) : 0;

  return (
    <div className="min-h-screen px-2 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <GameBackButton />
        <div className="text-center">
          <div className="text-xl font-black text-primary">🀄 Mahjong</div>
          <div className="text-sm text-muted-foreground">
            Pairs: {matches}/{totalPairs} · Moves: {moves} · ⏱ {formatTime(elapsedSeconds)}
          </div>
        </div>
        <div className="flex gap-1.5">
          <GameInstructions
            title="Mahjong Solitaire"
            emoji="🀄"
            steps={[
              "Only 'free' tiles can be selected — tiles with nothing on top AND at least one open side (left or right).",
              "Free tiles glow green. Blocked tiles look darker — don't worry, they'll free up!",
              "Tap two matching free tiles to remove them from the board.",
              "Tiles match if they are the same type: same suit and number, same wind, or same dragon.",
              "Clear all tiles from the board to win!",
              "Use 💡 Hint if you're stuck, or 🔀 Shuffle to rearrange remaining tiles.",
            ]}
          />
          <MahjongHintButton tiles={tiles} onHint={handleHint} disabled={won || stuck} />
          <button onClick={requestReset} className="bg-secondary text-foreground px-3 py-2 rounded-xl font-bold text-sm">🔄</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-2 mb-2">
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-center text-xs text-muted-foreground mt-0.5">{currentLeft} tiles left</div>
      </div>

      {message && (
        <div className="text-center text-lg font-black text-primary mb-2 px-4">{message}</div>
      )}

      {/* Stuck warning */}
      {stuck && (
        <div className="text-center mb-3">
          <div className="bg-destructive/20 border-2 border-destructive rounded-2xl p-3 max-w-sm mx-auto">
            <p className="text-lg font-bold text-destructive">No more moves available!</p>
            <p className="text-sm text-muted-foreground mb-2">Don't worry — just shuffle to keep playing.</p>
            <button
              onClick={handleShuffle}
              className="mt-1 bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold text-lg"
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
          {tiles
            .filter(t => !t.removed)
            .sort((a, b) => a.layer - b.layer || a.row - b.row || a.col - b.col)
            .map(tile => {
              const isFree = freeTileIds.has(tile.id);
              const isSelected = tile.id === selectedId;
              const isHinted = hintPair && (tile.id === hintPair.id1 || tile.id === hintPair.id2);
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
                    isHinted={isHinted}
                  />
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="text-center mt-2">
        <button
          onClick={handleShuffle}
          className="bg-secondary text-foreground px-5 py-2 rounded-xl font-bold text-base border border-border"
        >
          🔀 Shuffle Remaining
        </button>
      </div>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <MahjongResetDialog
            onConfirm={confirmReset}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}