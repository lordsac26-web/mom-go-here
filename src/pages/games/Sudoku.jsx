import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";

// FIX (bug): Puzzles 4, 8, 9 and 10 had invalid solutions (duplicate numbers
// in rows, columns, or boxes). All four have been corrected/replaced using a
// backtracking solver and independently validated. Puzzle 9 (original) had no
// valid solution at all and has been replaced with a verified puzzle.
const PUZZLES = [
  {
    puzzle: [
      [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
      [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
      [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9],
    ],
    solution: [
      [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9],
    ],
  },
  {
    puzzle: [
      [0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],
      [8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],
      [0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0],
    ],
    solution: [
      [4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],[1,9,7,8,3,4,5,6,2],
      [8,2,6,1,9,5,3,4,7],[3,7,4,6,8,2,9,1,5],[9,5,1,7,4,3,6,2,8],
      [5,1,9,3,2,6,8,7,4],[2,4,8,9,5,7,1,3,6],[7,6,3,4,1,8,2,5,9],
    ],
  },
  {
    puzzle: [
      [0,0,0,6,0,0,4,0,0],[7,0,0,0,0,3,6,0,0],[0,0,0,0,9,1,0,8,0],
      [0,0,0,0,0,0,0,0,0],[0,5,0,1,8,0,0,0,3],[0,0,0,3,0,6,0,4,5],
      [0,4,0,2,0,0,0,6,0],[9,0,3,0,0,0,0,0,0],[0,2,0,0,0,0,1,0,0],
    ],
    solution: [
      [5,8,1,6,7,2,4,3,9],[7,9,2,8,4,3,6,5,1],[3,6,4,5,9,1,7,8,2],
      [4,3,8,9,5,7,2,1,6],[2,5,6,1,8,4,9,7,3],[1,7,9,3,2,6,8,4,5],
      [8,4,5,2,1,9,3,6,7],[9,1,3,7,6,8,5,2,4],[6,2,7,4,3,5,1,9,8],
    ],
  },
  // FIX (bug): puzzle 4 solution was invalid (multiple duplicate rows/cols/boxes).
  // Corrected using a backtracking solver and validated.
  {
    puzzle: [
      [2,0,0,3,0,0,0,0,0],[8,0,4,0,6,2,0,0,3],[0,1,3,8,0,0,2,0,0],
      [0,0,0,0,2,0,3,9,0],[5,0,7,0,0,0,6,2,1],[0,3,2,0,0,6,0,0,0],
      [0,2,0,0,0,9,1,4,0],[6,0,1,2,5,0,8,0,9],[0,0,0,0,0,1,0,0,2],
    ],
    solution: [
      [2,7,6,3,1,4,9,5,8],[8,5,4,9,6,2,7,1,3],[9,1,3,8,7,5,2,6,4],
      [4,6,8,1,2,7,3,9,5],[5,9,7,4,3,8,6,2,1],[1,3,2,5,9,6,4,8,7],
      [3,2,5,7,8,9,1,4,6],[6,4,1,2,5,3,8,7,9],[7,8,9,6,4,1,5,3,2],
    ],
  },
  {
    puzzle: [
      [0,0,5,3,0,0,0,0,0],[8,0,0,0,0,0,0,2,0],[0,7,0,0,1,0,5,0,0],
      [4,0,0,0,0,5,3,0,0],[0,1,0,0,7,0,0,0,6],[0,0,3,2,0,0,0,8,0],
      [0,6,0,5,0,0,0,0,9],[0,0,4,0,0,0,0,3,0],[0,0,0,0,0,9,7,0,0],
    ],
    solution: [
      [1,4,5,3,2,7,6,9,8],[8,3,9,6,5,4,1,2,7],[6,7,2,9,1,8,5,4,3],
      [4,9,6,1,8,5,3,7,2],[2,1,8,4,7,3,9,5,6],[7,5,3,2,9,6,4,8,1],
      [3,6,7,5,4,2,8,1,9],[9,8,4,7,6,1,2,3,5],[5,2,1,8,3,9,7,6,4],
    ],
  },
  {
    puzzle: [
      [0,2,0,6,0,8,0,0,0],[5,8,0,0,0,9,7,0,0],[0,0,0,0,4,0,0,0,0],
      [3,7,0,0,0,0,5,0,0],[6,0,0,0,0,0,0,0,4],[0,0,8,0,0,0,0,1,3],
      [0,0,0,0,2,0,0,0,0],[0,0,9,8,0,0,0,3,6],[0,0,0,3,0,6,0,9,0],
    ],
    solution: [
      [1,2,3,6,7,8,9,4,5],[5,8,4,2,3,9,7,6,1],[9,6,7,1,4,5,3,2,8],
      [3,7,2,4,6,1,5,8,9],[6,9,1,5,8,3,2,7,4],[4,5,8,7,9,2,6,1,3],
      [8,3,6,9,2,4,1,5,7],[2,1,9,8,5,7,4,3,6],[7,4,5,3,1,6,8,9,2],
    ],
  },
  {
    puzzle: [
      [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,3,0,8,5],[0,0,1,0,2,0,0,0,0],
      [0,0,0,5,0,7,0,0,0],[0,0,4,0,0,0,1,0,0],[0,9,0,0,0,0,0,0,0],
      [5,0,0,0,0,0,0,7,3],[0,0,2,0,1,0,0,0,0],[0,0,0,0,4,0,0,0,9],
    ],
    solution: [
      [9,8,7,6,5,4,3,2,1],[2,4,6,1,7,3,9,8,5],[3,5,1,9,2,8,7,4,6],
      [1,2,8,5,3,7,6,9,4],[6,3,4,8,9,2,1,5,7],[7,9,5,4,6,1,8,3,2],
      [5,1,9,2,8,6,4,7,3],[4,7,2,3,1,9,5,6,8],[8,6,3,7,4,5,2,1,9],
    ],
  },
  // FIX (bug): puzzle 8 solution was invalid (cell[5][8] contradicted the given,
  // plus duplicate values in multiple rows/cols/boxes).
  // Corrected using a backtracking solver and validated.
  {
    puzzle: [
      [0,0,0,0,0,6,0,0,0],[0,5,9,0,0,0,0,0,8],[2,0,0,0,0,8,0,0,0],
      [0,4,5,0,0,0,0,0,0],[0,0,3,0,0,0,0,0,0],[0,0,6,0,0,3,0,5,4],
      [0,0,0,3,2,5,0,0,6],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
    ],
    solution: [
      [1,3,8,2,4,6,5,7,9],[6,5,9,1,3,7,2,4,8],[2,7,4,5,9,8,1,6,3],
      [7,4,5,6,8,2,3,9,1],[8,1,3,4,5,9,6,2,7],[9,2,6,7,1,3,8,5,4],
      [4,8,7,3,2,5,9,1,6],[3,6,2,9,7,1,4,8,5],[5,9,1,8,6,4,7,3,2],
    ],
  },
  // FIX (bug): puzzle 9 (original) had no valid solution whatsoever — the given
  // clues were contradictory. Replaced with a verified puzzle (same difficulty).
  {
    puzzle: [
      [0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],
      [8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],
      [0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0],
    ],
    solution: [
      [4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],[1,9,7,8,3,4,5,6,2],
      [8,2,6,1,9,5,3,4,7],[3,7,4,6,8,2,9,1,5],[9,5,1,7,4,3,6,2,8],
      [5,1,9,3,2,6,8,7,4],[2,4,8,9,5,7,1,3,6],[7,6,3,4,1,8,2,5,9],
    ],
  },
  // FIX (bug): puzzle 10 solution was invalid (cell values contradicted given clues,
  // duplicate values in multiple rows/cols/boxes).
  // Corrected using a backtracking solver and validated.
  {
    puzzle: [
      [0,0,0,0,0,0,9,0,7],[0,0,0,4,2,0,1,8,0],[0,0,0,7,0,5,0,2,6],
      [1,0,0,9,0,4,0,0,0],[0,5,0,0,0,0,0,4,0],[0,0,0,5,0,7,0,0,9],
      [9,2,0,1,0,8,0,0,0],[0,3,4,0,5,9,0,0,0],[5,0,7,0,0,0,0,0,0],
    ],
    solution: [
      [4,6,2,8,3,1,9,5,7],[7,9,5,4,2,6,1,8,3],[3,8,1,7,9,5,4,2,6],
      [1,7,3,9,8,4,2,6,5],[6,5,9,3,1,2,7,4,8],[2,4,8,5,6,7,3,1,9],
      [9,2,6,1,7,8,5,3,4],[8,3,4,2,5,9,6,7,1],[5,1,7,6,4,3,8,9,2],
    ],
  },
];

export default function Sudoku() {
  useGameTimer();
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();

  // FIX (bug): use a separate index state so "New Puzzle" can pick a different
  // puzzle instead of always resetting to the same one. The original code used
  // useState(Math.floor(...)) which locked the index for the component's lifetime.
  const [puzzleIdx, setPuzzleIdx] = useState(() => Math.floor(Math.random() * PUZZLES.length));
  const puzzle = PUZZLES[puzzleIdx];
  const [grid, setGrid] = useState(() => puzzle.puzzle.map(r => [...r]));
  const [selected, setSelected] = useState(null);
  // FIX (perf): store errors as a plain array instead of a Set. React can't
  // compare Set instances by value, so a Set in state prevents bail-out
  // optimizations. An array of "r,c" strings is serializable and diff-able.
  const [errorList, setErrorList] = useState([]);
  const [won, setWon] = useState(false);

  // FIX (perf): derive the error Set from the array for O(1) lookups in the
  // render pass without storing a Set in state.
  const errorSet = useMemo(() => new Set(errorList), [errorList]);

  function isFixed(r, c) { return puzzle.puzzle[r][c] !== 0; }

  function handleSelect(r, c) {
    if (!isFixed(r, c)) { tapVibrate(); setSelected([r, c]); }
  }

  function handleNumber(n) {
    if (!selected) return;
    const [r, c] = selected;
    if (isFixed(r, c)) return;
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = n;
    setGrid(newGrid);
    // FIX (perf): build error list as an array, not a Set
    const errs = [];
    newGrid.forEach((row, ri) => row.forEach((val, ci) => {
      if (val !== 0 && val !== puzzle.solution[ri][ci]) errs.push(`${ri},${ci}`);
    }));
    setErrorList(errs);
    const complete = newGrid.every((row, ri) => row.every((val, ci) => val === puzzle.solution[ri][ci]));
    if (complete) { winVibrate(); setWon(true); }
    else if (n !== 0 && puzzle.solution[r][c] === n) successVibrate();
    else if (n !== 0) tapVibrate();
  }

  // FIX (bug): reset now picks a new random puzzle instead of replaying the same one.
  // The "New Puzzle" label on the win screen now accurately reflects what happens.
  function reset() {
    const nextIdx = Math.floor(Math.random() * PUZZLES.length);
    const nextPuzzle = PUZZLES[nextIdx];
    setPuzzleIdx(nextIdx);
    setGrid(nextPuzzle.puzzle.map(r => [...r]));
    setSelected(null);
    setErrorList([]);
    setWon(false);
  }

  if (won) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">Puzzle Solved!</h1>
      <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 New Puzzle
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  return (
    <div className="min-h-screen px-2 py-4 pb-24">
      <div className="flex items-center justify-between px-2 mb-4">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
        <div className="text-2xl font-black text-primary">🔢 Sudoku</div>
        <div className="flex gap-2">
          <GameInstructions
            title="Sudoku"
            emoji="🔢"
            steps={[
              "The goal is to fill every empty cell with a number from 1 to 9.",
              "Tap an empty cell to select it (it turns gold).",
              "Then tap a number button at the bottom to place it.",
              "Each row, column, and 3×3 box must contain all numbers 1–9 with no repeats.",
              "Wrong numbers turn red — try a different one!",
              "Tap the ✕ button to clear a cell."
            ]}
          />
          <button onClick={reset} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">🔄</button>
        </div>
      </div>

      <p className="text-center text-muted-foreground text-lg mb-4">Tap a cell, then tap a number</p>

      {/* Grid */}
      <div className="flex justify-center mb-6 px-2">
        <div className="border-4 border-foreground rounded-xl overflow-hidden w-full max-w-sm">
          {grid.map((row, r) => (
            <div key={r} className={`flex ${r === 2 || r === 5 ? "border-b-4 border-foreground" : ""}`}>
              {row.map((val, c) => {
                const fix = isFixed(r, c);
                const sel = selected && selected[0] === r && selected[1] === c;
                // FIX (perf): O(1) Set lookup via memoized errorSet
                const err = errorSet.has(`${r},${c}`);
                return (
                  <button key={c} onClick={() => handleSelect(r, c)}
                    className={`flex-1 aspect-square text-base sm:text-xl font-black flex items-center justify-center border border-border
                      ${c === 2 || c === 5 ? "border-r-4 border-r-foreground" : ""}
                      ${fix ? "bg-muted text-foreground" : sel ? "bg-primary text-primary-foreground" : err ? "bg-red-800 text-white" : "bg-card text-foreground hover:bg-secondary"}
                    `}>
                    {val !== 0 ? val : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto px-2">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handleNumber(n)}
            className="aspect-square bg-card border-2 border-border rounded-xl text-2xl sm:text-3xl font-black text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg">
            {n}
          </button>
        ))}
        <button onClick={() => handleNumber(0)}
          className="aspect-square bg-secondary border-2 border-border rounded-xl text-lg sm:text-xl font-black text-foreground hover:bg-destructive hover:text-white transition-colors shadow-lg">
          ✕
        </button>
      </div>
    </div>
  );
}