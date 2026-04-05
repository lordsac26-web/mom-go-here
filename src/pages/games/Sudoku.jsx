import { useState } from "react";
import { Link } from "react-router-dom";
import { useGameTimer } from "../../hooks/useGameTimer";

// Simple Sudoku puzzles (0 = empty)
const PUZZLES = [
  {
    puzzle: [
      [5,3,0,0,7,0,0,0,0],
      [6,0,0,1,9,5,0,0,0],
      [0,9,8,0,0,0,0,6,0],
      [8,0,0,0,6,0,0,0,3],
      [4,0,0,8,0,3,0,0,1],
      [7,0,0,0,2,0,0,0,6],
      [0,6,0,0,0,0,2,8,0],
      [0,0,0,4,1,9,0,0,5],
      [0,0,0,0,8,0,0,7,9],
    ],
    solution: [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9],
    ]
  },
  {
    puzzle: [
      [0,0,0,2,6,0,7,0,1],
      [6,8,0,0,7,0,0,9,0],
      [1,9,0,0,0,4,5,0,0],
      [8,2,0,1,0,0,0,4,0],
      [0,0,4,6,0,2,9,0,0],
      [0,5,0,0,0,3,0,2,8],
      [0,0,9,3,0,0,0,7,4],
      [0,4,0,0,5,0,0,3,6],
      [7,0,3,0,1,8,0,0,0],
    ],
    solution: [
      [4,3,5,2,6,9,7,8,1],
      [6,8,2,5,7,1,4,9,3],
      [1,9,7,8,3,4,5,6,2],
      [8,2,6,1,9,5,3,4,7],
      [3,7,4,6,8,2,9,1,5],
      [9,5,1,7,4,3,6,2,8],
      [5,1,9,3,2,6,8,7,4],
      [2,4,8,9,5,7,1,3,6],
      [7,6,3,4,1,8,2,5,9],
    ]
  }
];

export default function Sudoku() {
  useGameTimer();
  const [puzzleIdx] = useState(Math.floor(Math.random() * PUZZLES.length));
  const puzzle = PUZZLES[puzzleIdx];
  const [grid, setGrid] = useState(puzzle.puzzle.map(r => [...r]));
  const [selected, setSelected] = useState(null);
  const [errors, setErrors] = useState(new Set());
  const [won, setWon] = useState(false);

  function isFixed(r, c) { return puzzle.puzzle[r][c] !== 0; }

  function handleSelect(r, c) {
    if (!isFixed(r, c)) setSelected([r, c]);
  }

  function handleNumber(n) {
    if (!selected) return;
    const [r, c] = selected;
    if (isFixed(r, c)) return;
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = n;
    setGrid(newGrid);
    // Check errors
    const errs = new Set();
    newGrid.forEach((row, ri) => row.forEach((val, ci) => {
      if (val !== 0 && val !== puzzle.solution[ri][ci]) errs.add(`${ri},${ci}`);
    }));
    setErrors(errs);
    // Check win
    const complete = newGrid.every((row, ri) => row.every((val, ci) => val === puzzle.solution[ri][ci]));
    if (complete) setWon(true);
  }

  function reset() {
    setGrid(puzzle.puzzle.map(r => [...r]));
    setSelected(null);
    setErrors(new Set());
    setWon(false);
  }

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">Puzzle Solved!</h1>
      <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 New Puzzle
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-2 py-4 pb-24">
      <div className="flex items-center justify-between px-2 mb-4">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
        <div className="text-2xl font-black text-primary">🔢 Sudoku</div>
        <button onClick={reset} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">🔄</button>
      </div>

      <p className="text-center text-muted-foreground text-lg mb-4">Tap a cell, then tap a number</p>

      {/* Grid */}
      <div className="flex justify-center mb-6">
        <div className="border-4 border-foreground rounded-xl overflow-hidden">
          {grid.map((row, r) => (
            <div key={r} className={`flex ${r === 2 || r === 5 ? "border-b-4 border-foreground" : ""}`}>
              {row.map((val, c) => {
                const fix = isFixed(r, c);
                const sel = selected && selected[0] === r && selected[1] === c;
                const err = errors.has(`${r},${c}`);
                return (
                  <button key={c} onClick={() => handleSelect(r, c)}
                    className={`w-10 h-10 text-xl font-black flex items-center justify-center border border-border
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
      <div className="flex justify-center gap-2 flex-wrap max-w-sm mx-auto">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handleNumber(n)}
            className="w-16 h-16 bg-card border-2 border-border rounded-xl text-3xl font-black text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg">
            {n}
          </button>
        ))}
        <button onClick={() => handleNumber(0)}
          className="w-16 h-16 bg-secondary border-2 border-border rounded-xl text-xl font-black text-foreground hover:bg-destructive hover:text-white transition-colors shadow-lg">
          ✕
        </button>
      </div>
    </div>
  );
}