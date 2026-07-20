import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameBackButton from "../../components/GameBackButton";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import useConfetti from "../../hooks/useConfetti";
import { useGameActivity } from "../../hooks/useGameActivity";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { saveGameScore } from "@/lib/scoreSaver";
import SudokuResetDialog from "../../components/sudoku/SudokuResetDialog";
import SudokuHintButton from "../../components/sudoku/SudokuHintButton";
import SudokuStatusBar from "../../components/sudoku/SudokuStatusBar";
import { getPuzzlesByDifficulty } from "../../components/sudoku/sudokuPuzzles";
import GameVictoryScreen from "../../components/games/GameVictoryScreen";
import { awardCoinsForStars, computeStars, coinsForStars } from "@/lib/awardCoins";

function getBox(r, c) { return Math.floor(r / 3) * 3 + Math.floor(c / 3); }

export default function Sudoku() {
  useGameTimer();
  const { user } = useAuth();
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();
  const { uiClickSound, matchSound, winSound } = useGameAudio();
  const { fireworks, emojiRain, spark } = useConfetti();
  const { reportWin } = useGameActivity();

  const [difficulty, setDifficulty] = useState(null);
  const [started, setStarted] = useState(false);
  const [puzzle, setPuzzle] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selected, setSelected] = useState(null);
  const [errorList, setErrorList] = useState([]);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [winTime, setWinTime] = useState(null);
  const [winStars, setWinStars] = useState(0);
  const [coinsWon, setCoinsWon] = useState(0);

  // Undo stack
  const [undoStack, setUndoStack] = useState([]);
  const MAX_UNDO = 10;

  // Timer
  const gameStartRef = useRef(null);
  const statsRecordedRef = useRef(false);

  // Hint animation
  const [hintCell, setHintCell] = useState(null);
  const hintTimerRef = useRef(null);

  useEffect(() => {
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  }, []);

  const errorSet = useMemo(() => new Set(errorList), [errorList]);

  function isFixed(r, c) { return puzzle?.puzzle[r][c] !== 0; }

  // Count how many of each number are correctly placed
  const numberCounts = useMemo(() => {
    if (!puzzle) return {};
    const counts = {};
    for (let n = 1; n <= 9; n++) counts[n] = 0;
    grid.forEach((row, r) => row.forEach((val, c) => {
      if (val !== 0 && val === puzzle.solution[r][c]) counts[val]++;
    }));
    return counts;
  }, [grid, puzzle]);

  // Highlight helpers for selected cell
  const selectedRow = selected ? selected[0] : -1;
  const selectedCol = selected ? selected[1] : -1;
  const selectedBox = selected ? getBox(selected[0], selected[1]) : -1;
  const selectedVal = selected && grid[selected[0]]?.[selected[1]] !== 0 ? grid[selected[0]][selected[1]] : null;

  function startGame(diff) {
    const puzzles = getPuzzlesByDifficulty(diff);
    const idx = Math.floor(Math.random() * puzzles.length);
    const p = puzzles[idx];
    setDifficulty(diff);
    setPuzzle(p);
    setGrid(p.puzzle.map(r => [...r]));
    setSelected(null);
    setErrorList([]);
    setWon(false);
    setMoves(0);
    setTotalErrors(0);
    setUndoStack([]);
    setHintCell(null);
    setWinTime(null);
    setShowResetConfirm(false);
    statsRecordedRef.current = false;
    gameStartRef.current = Date.now();
    setStarted(true);
  }

  function handleResetClick() {
    if (moves > 0 && !won) {
      setShowResetConfirm(true);
    } else {
      startGame(difficulty);
    }
  }

  function handleSelect(r, c) {
    if (!isFixed(r, c)) {
      tapVibrate();
      uiClickSound();
      setSelected([r, c]);
    } else {
      // Allow selecting fixed cells for highlighting
      tapVibrate();
      setSelected([r, c]);
    }
  }

  function pushUndo(currentGrid, currentMoves) {
    setUndoStack(prev => {
      const next = [...prev, { grid: currentGrid.map(r => [...r]), moves: currentMoves }];
      if (next.length > MAX_UNDO) next.shift();
      return next;
    });
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    tapVibrate();
    uiClickSound();
    const prev = undoStack[undoStack.length - 1];
    setGrid(prev.grid);
    setMoves(prev.moves);
    setSelected(null);
    setHintCell(null);
    // Recalculate errors
    const errs = [];
    prev.grid.forEach((row, ri) => row.forEach((val, ci) => {
      if (val !== 0 && val !== puzzle.solution[ri][ci]) errs.push(`${ri},${ci}`);
    }));
    setErrorList(errs);
    setUndoStack(stack => stack.slice(0, -1));
  }

  function handleNumber(n) {
    if (!selected) return;
    const [r, c] = selected;
    if (isFixed(r, c)) return;

    pushUndo(grid, moves);

    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = n;
    setGrid(newGrid);
    setMoves(m => m + 1);

    const errs = [];
    newGrid.forEach((row, ri) => row.forEach((val, ci) => {
      if (val !== 0 && val !== puzzle.solution[ri][ci]) errs.push(`${ri},${ci}`);
    }));
    setErrorList(errs);

    if (n !== 0 && puzzle.solution[r][c] !== n) {
      setTotalErrors(e => e + 1);
      tapVibrate();
    }

    const complete = newGrid.every((row, ri) => row.every((val, ci) => val === puzzle.solution[ri][ci]));
    if (complete) {
      winVibrate();
      winSound();
      fireworks();
      emojiRain(["🔢", "🎉", "⭐"]);
      const elapsed = gameStartRef.current ? Math.round((Date.now() - gameStartRef.current) / 1000) : 0;
      setWinTime(elapsed);
      setWon(true);
      recordStats(elapsed);
    } else if (n !== 0 && puzzle.solution[r][c] === n) {
      successVibrate();
      matchSound();
      spark();
    }
  }

  function handleHint() {
    if (!puzzle) return;
    // If a cell is selected and it's empty or wrong, fill it
    if (selected) {
      const [r, c] = selected;
      if (!isFixed(r, c) && grid[r][c] !== puzzle.solution[r][c]) {
        tapVibrate();
        pushUndo(grid, moves);
        const newGrid = grid.map(row => [...row]);
        newGrid[r][c] = puzzle.solution[r][c];
        setGrid(newGrid);
        setMoves(m => m + 1);
        spark();
        setHintCell(`${r},${c}`);
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        hintTimerRef.current = setTimeout(() => setHintCell(null), 1500);

        // Recalc errors
        const errs = [];
        newGrid.forEach((row, ri) => row.forEach((val, ci) => {
          if (val !== 0 && val !== puzzle.solution[ri][ci]) errs.push(`${ri},${ci}`);
        }));
        setErrorList(errs);

        const complete = newGrid.every((row, ri) => row.every((val, ci) => val === puzzle.solution[ri][ci]));
        if (complete) {
          winVibrate(); winSound(); fireworks(); emojiRain(["🔢", "🎉", "⭐"]);
          const elapsed = gameStartRef.current ? Math.round((Date.now() - gameStartRef.current) / 1000) : 0;
          setWinTime(elapsed);
          setWon(true);
          recordStats(elapsed);
        }
        return;
      }
    }

    // Otherwise find any empty cell and fill it
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== puzzle.solution[r][c]) {
          tapVibrate();
          pushUndo(grid, moves);
          const newGrid = grid.map(row => [...row]);
          newGrid[r][c] = puzzle.solution[r][c];
          setGrid(newGrid);
          setMoves(m => m + 1);
          setSelected([r, c]);
          spark();
          setHintCell(`${r},${c}`);
          if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
          hintTimerRef.current = setTimeout(() => setHintCell(null), 1500);

          const errs = [];
          newGrid.forEach((row, ri) => row.forEach((val, ci) => {
            if (val !== 0 && val !== puzzle.solution[ri][ci]) errs.push(`${ri},${ci}`);
          }));
          setErrorList(errs);

          const complete = newGrid.every((row, ri) => row.every((val, ci) => val === puzzle.solution[ri][ci]));
          if (complete) {
            winVibrate(); winSound(); fireworks(); emojiRain(["🔢", "🎉", "⭐"]);
            const elapsed = gameStartRef.current ? Math.round((Date.now() - gameStartRef.current) / 1000) : 0;
            setWinTime(elapsed);
            setWon(true);
            recordStats(elapsed);
          }
          return;
        }
      }
    }
  }

  async function recordStats(elapsed) {
    if (!user?.email || statsRecordedRef.current) return;
    statsRecordedRef.current = true;
    reportWin("Sudoku");

    // Star rating: fewer errors = more stars
    const stars = computeStars(totalErrors, 0, 3, true);
    setWinStars(stars);

    // Coin reward scaled by difficulty + stars
    const diffBase = { easy: 15, medium: 25, hard: 40 }[difficulty] || 20;
    const reward = coinsForStars(stars, diffBase);
    const awarded = await awardCoinsForStars(stars, diffBase);
    setCoinsWon(awarded);

    await saveGameScore({
      game_name: "Sudoku",
      score: moves,
      duration_seconds: elapsed,
      difficulty: difficulty,
      completed: true,
    });
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const DIFF_OPTIONS = [
    { key: "easy", label: "Easy", emoji: "😊", desc: "Lots of clues · great for learning", color: "from-emerald-500 to-teal-600", border: "border-emerald-400" },
    { key: "medium", label: "Medium", emoji: "🧩", desc: "A fair challenge", color: "from-blue-500 to-indigo-600", border: "border-blue-400" },
    { key: "hard", label: "Hard", emoji: "🧠", desc: "Fewer clues · for experts", color: "from-rose-500 to-purple-600", border: "border-rose-400" },
  ];

  // ── DIFFICULTY SELECT ──
  if (!started) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 flex flex-col items-center justify-center px-4 pb-24">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="text-8xl mb-2 select-none">🔢</motion.div>
      <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-5xl font-black text-white mb-1 tracking-tight">Sudoku</motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
        className="text-lg text-blue-300 mb-8 text-center">Fill every row, column & box with 1–9</motion.p>

      <div className="space-y-3 w-full max-w-sm">
        {DIFF_OPTIONS.map((d, i) => (
          <motion.button key={d.key}
            initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.1, type: "spring", stiffness: 220 }}
            onClick={() => { tapVibrate(); uiClickSound(); startGame(d.key); }}
            className={`w-full bg-gradient-to-r ${d.color} text-white rounded-2xl shadow-xl border-2 ${d.border} active:scale-95 transition-transform`}
          >
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="text-left">
                <div className="text-2xl font-black">{d.emoji} {d.label}</div>
                <div className="text-sm font-bold opacity-80">{d.desc}</div>
              </div>
              <span className="text-4xl">▶</span>
            </div>
          </motion.button>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6">
        <GameBackButton />
      </motion.div>
    </div>
  );

  const diffLabel = { easy: "😊 Easy", medium: "🧩 Medium", hard: "🧠 Hard" }[difficulty];

  // ── WIN SCREEN ──
  if (won) return (
    <GameVictoryScreen
      emoji="🔢"
      title="Puzzle Solved!"
      accent="from-blue-500 to-indigo-600"
      stars={winStars}
      coins={coinsWon}
      stats={[
        { label: "Time", value: winTime != null ? formatTime(winTime) : "—" },
        { label: "Moves", value: moves },
        { label: "Errors", value: totalErrors, highlight: totalErrors === 0 },
      ]}
      perfectLabel={totalErrors === 0 ? "Perfect — No Errors!" : null}
      primaryLabel="🔄 New Puzzle"
      onPrimary={() => startGame(difficulty)}
      secondaryLabel="Change Difficulty"
      onSecondary={() => { setStarted(false); setDifficulty(null); }}
    />
  );

  // ── GAME BOARD ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 px-2 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <GameBackButton />
        <div className="text-xl sm:text-2xl font-black text-white">🔢 Sudoku</div>
        <div className="flex gap-1.5">
          <GameInstructions
            title="Sudoku"
            emoji="🔢"
            steps={[
              "Fill every empty cell with a number from 1 to 9.",
              "Tap an empty cell to select it — it highlights in gold.",
              "The row, column, and 3×3 box light up to help you see what's taken.",
              "Tap a number button below to place it.",
              "Wrong numbers turn red — tap ✕ to clear a cell.",
              "Use 💡 Hint to reveal a correct number.",
              "Use ↩ Undo to take back a move.",
              "Fill the whole grid correctly to win! 🎉"
            ]}
          />
          <SudokuHintButton onHint={handleHint} disabled={won} />
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            aria-label="Undo"
            className={`rounded-xl font-bold text-sm flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-transform ${
              undoStack.length > 0 ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground opacity-50"
            }`}
          >↩</button>
          <button onClick={handleResetClick} aria-label="Reset game" className="bg-secondary text-foreground rounded-xl font-bold text-sm flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-transform">🔄</button>
        </div>
      </div>

      {/* Status bar */}
      <SudokuStatusBar
        moves={moves}
        errorCount={totalErrors}
        gameStartTime={gameStartRef.current}
        gameOver={won}
        difficulty={difficulty}
      />

      {/* Grid */}
      <div className="flex justify-center mb-4 px-1">
        <div className="border-[3px] border-foreground rounded-xl overflow-hidden w-full max-w-sm">
          {grid.map((row, r) => (
            <div key={r} className={`flex ${r === 2 || r === 5 ? "border-b-[3px] border-foreground" : ""}`}>
              {row.map((val, c) => {
                const fix = isFixed(r, c);
                const sel = selected && selected[0] === r && selected[1] === c;
                const err = errorSet.has(`${r},${c}`);
                const isHint = hintCell === `${r},${c}`;

                // Row/col/box highlighting
                const inSelectedRow = r === selectedRow;
                const inSelectedCol = c === selectedCol;
                const inSelectedBox = getBox(r, c) === selectedBox;
                const isHighlighted = !sel && (inSelectedRow || inSelectedCol || inSelectedBox);

                // Same-number highlighting
                const hasSameVal = !sel && val !== 0 && val === selectedVal;

                // User-entered correct number styling
                const isUserCorrect = !fix && val !== 0 && !err;

                return (
                  <button key={c} onClick={() => handleSelect(r, c)}
                    className={`flex-1 aspect-square text-xl sm:text-2xl font-black flex items-center justify-center border border-border transition-all
                      ${c === 2 || c === 5 ? "border-r-[3px] border-r-foreground" : ""}
                      ${sel ? "bg-primary text-primary-foreground"
                        : err ? "bg-red-800 text-white"
                        : isHint ? "bg-green-600 text-white"
                        : hasSameVal ? "bg-primary/30 text-foreground"
                        : isHighlighted ? "bg-secondary/60"
                        : fix ? "bg-muted text-foreground"
                        : isUserCorrect ? "bg-card text-blue-400"
                        : "bg-card text-foreground"
                      }
                      ${isHint ? "animate-pulse" : ""}
                    `}>
                    {val !== 0 ? val : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Number pad — 3×3 + clear row */}
      <div className="max-w-xs mx-auto px-2">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[1,2,3,4,5,6,7,8,9].map(n => {
            const isComplete = numberCounts[n] >= 9;
            return (
              <button key={n} onClick={() => handleNumber(n)}
                disabled={isComplete}
                className={`aspect-square rounded-xl text-2xl sm:text-3xl font-black transition-colors shadow-lg border-2 ${
                  isComplete
                    ? "bg-muted border-border text-muted-foreground opacity-40 cursor-not-allowed"
                    : "bg-card border-border text-foreground hover:bg-primary hover:text-primary-foreground active:scale-95"
                }`}>
                {n}
              </button>
            );
          })}
        </div>
        <button onClick={() => handleNumber(0)}
          className="w-full py-4 bg-secondary border-2 border-border rounded-xl text-lg font-black text-foreground hover:bg-destructive hover:text-white transition-colors shadow-lg active:scale-95">
          ✕ Clear Cell
        </button>
      </div>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <SudokuResetDialog
            onConfirm={() => { setShowResetConfirm(false); startGame(difficulty); }}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}