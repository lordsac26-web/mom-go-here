import { useState, useCallback } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import GameInstructions from "../../components/GameInstructions";

const WORD_LISTS = [
  ["LOVE", "HOPE", "FAITH", "GRACE", "PEACE", "JOY", "FAMILY", "HEART"],
  ["GARDEN", "FLOWER", "SPRING", "BIRDS", "SUNNY", "RIVER", "TREE", "ROSE"],
  ["MUSIC", "DANCE", "LAUGH", "SMILE", "HAPPY", "DREAM", "FRIEND", "WARM"],
];

function generateGrid(size, words) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(""));
  const placed = [];
  const directions = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];

  for (const word of words) {
    let tries = 0;
    while (tries < 100) {
      tries++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const cells = [];
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dir[0] * i;
        const c = col + dir[1] * i;
        if (r < 0 || r >= size || c < 0 || c >= size) { fits = false; break; }
        if (grid[r][c] !== "" && grid[r][c] !== word[i]) { fits = false; break; }
        cells.push([r, c]);
      }
      if (fits) {
        cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
        placed.push({ word, cells });
        break;
      }
    }
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!grid[r][c]) grid[r][c] = letters[Math.floor(Math.random() * 26)];

  return { grid, placed };
}

export default function WordSearch() {
  useGameTimer();
  const [started, setStarted] = useState(false);
  const [size] = useState(10);
  const [gridData, setGridData] = useState(null);
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState([]);

  function startGame() {
    const wlist = WORD_LISTS[Math.floor(Math.random() * WORD_LISTS.length)];
    const data = generateGrid(size, wlist);
    setGridData(data);
    setWords(wlist);
    setSelected([]);
    setFoundWords([]);
    setFoundCells([]);
    setSelecting(false);
    setStarted(true);
  }

  function cellKey(r, c) { return `${r},${c}`; }

  function handleCellDown(r, c) {
    setSelecting(true);
    setSelected([[r, c]]);
  }

  function handleCellEnter(r, c) {
    if (!selecting) return;
    setSelected(prev => {
      const key = cellKey(r, c);
      if (prev.find(([pr, pc]) => cellKey(pr, pc) === key)) return prev;
      return [...prev, [r, c]];
    });
  }

  function handleUp() {
    if (!selecting) return;
    setSelecting(false);
    // Check if selected cells spell any unfound word
    const selStr = selected.map(([r, c]) => gridData.grid[r][c]).join("");
    const selRev = selStr.split("").reverse().join("");
    for (const { word, cells } of gridData.placed) {
      if (foundWords.includes(word)) continue;
      if (word === selStr || word === selRev) {
        setFoundWords(prev => [...prev, word]);
        setFoundCells(prev => [...prev, ...cells.map(([r, c]) => cellKey(r, c))]);
        break;
      }
    }
    setSelected([]);
  }

  const won = foundWords.length === words.length && words.length > 0;

  if (!started) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24">
      <div className="text-8xl mb-4">🔤</div>
      <h1 className="text-4xl font-black text-primary mb-4 text-center">Word Search</h1>
      <p className="text-xl text-muted-foreground text-center mb-8">Drag your finger to highlight hidden words!</p>
      <button onClick={startGame} className="bg-yellow-600 text-white text-2xl font-black px-10 py-6 rounded-2xl shadow-xl mb-4">
        🔤 Start Game
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">All Words Found!</h1>
      <button onClick={startGame} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 New Puzzle
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-2 py-4 pb-24 select-none"
      onMouseUp={handleUp} onTouchEnd={handleUp}>
      <div className="flex items-center justify-between px-2 mb-3">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
        <div className="text-2xl font-black text-primary">🔤 Word Search</div>
        <div className="flex gap-2">
          <GameInstructions
            title="Word Search"
            emoji="🔤"
            steps={[
              "Look at the word list at the top — those are the words to find.",
              "Words are hidden in the grid in any direction (horizontal, vertical, diagonal, even backwards!).",
              "Drag your finger across the letters to highlight a word.",
              "If the highlighted letters match a word, it turns green!",
              "Find all the words to win the puzzle."
            ]}
          />
          <button onClick={startGame} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">🔄</button>
        </div>
      </div>

      {/* Words to find */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mb-4 px-2">
        {words.map(w => (
          <span key={w} className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-sm sm:text-lg font-black border-2 ${foundWords.includes(w) ? "bg-green-700 border-green-500 text-white line-through" : "bg-card border-border text-foreground"}`}>
            {w}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="flex justify-center px-1">
        <div className="w-full max-w-md" style={{ display: "grid", gridTemplateColumns: `repeat(${size}, 1fr)`, gap: "2px" }}
          onMouseLeave={() => { if (selecting) handleUp(); }}>
          {gridData.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = cellKey(r, c);
              const isSelected = selected.find(([sr, sc]) => cellKey(sr, sc) === key);
              const isFound = foundCells.includes(key);
              return (
                <div key={key}
                  onMouseDown={() => handleCellDown(r, c)}
                  onMouseEnter={() => handleCellEnter(r, c)}
                  onTouchStart={() => { setSelecting(true); setSelected([[r, c]]); }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (el?.dataset?.r && el?.dataset?.c) handleCellEnter(+el.dataset.r, +el.dataset.c);
                  }}
                  data-r={r} data-c={c}
                  className={`aspect-square flex items-center justify-center text-sm sm:text-lg font-black rounded cursor-pointer transition-colors ${
                    isFound ? "bg-green-600 text-white" :
                    isSelected ? "bg-primary text-primary-foreground" :
                    "bg-card text-foreground"
                  }`}>
                  {letter}
                </div>
              );
            })
          )}
        </div>
      </div>
      <p className="text-center text-muted-foreground text-lg mt-3">Found: {foundWords.length} / {words.length}</p>
    </div>
  );
}