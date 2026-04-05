import { useState, useRef, useEffect } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import GameInstructions from "../../components/GameInstructions";
import useGameSounds from "../../hooks/useGameSounds";
import useHaptics from "../../hooks/useHaptics";
import SparkleEffect from "../../components/SparkleEffect";
import { Volume2, VolumeX, Palette } from "lucide-react";
import { WS_THEMES, DEFAULT_THEME } from "../../components/wordsearch/themes";
import ThemePanel from "../../components/wordsearch/ThemePanel";
import useGridReveal, { PATTERN_LIST } from "../../hooks/useGridReveal";

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
  const { soundOn, setSoundOn, playTap, playSuccess, playWin } = useGameSounds();
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();
  const [started, setStarted] = useState(false);
  const [size] = useState(10);
  const [gridData, setGridData] = useState(null);
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState([]);
  const [lineMode, setLineMode] = useState(true);
  const [justFoundCells, setJustFoundCells] = useState([]);
  const [justFoundWord, setJustFoundWord] = useState(null);
  const glowTimerRef = useRef(null);
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME);
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const theme = WS_THEMES[themeKey];
  const [revealPattern, setRevealPattern] = useState("spiral");
  const [revealPanelOpen, setRevealPanelOpen] = useState(false);
  const { gridRef, reveal } = useGridReveal(size, size);
  const [revealKey, setRevealKey] = useState(0);

  function startGame() {
    const wlist = WORD_LISTS[Math.floor(Math.random() * WORD_LISTS.length)];
    const data = generateGrid(size, wlist);
    setGridData(data);
    setWords(wlist);
    setSelected([]);
    setFoundWords([]);
    setFoundCells([]);
    setJustFoundCells([]);
    setJustFoundWord(null);
    setStarted(true);
    setRevealKey(prev => prev + 1);
  }

  // Trigger GSAP reveal whenever the grid appears or game restarts
  useEffect(() => {
    if (started && gridData && !won) {
      // Small delay so DOM is painted
      const t = setTimeout(() => reveal(revealPattern), 50);
      return () => clearTimeout(t);
    }
  }, [revealKey, started]);

  function cellKey(r, c) { return `${r},${c}`; }

  function getLineCells(r1, c1, r2, c2) {
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    const rowDist = Math.abs(r2 - r1);
    const colDist = Math.abs(c2 - c1);
    // Must be a straight line: horizontal, vertical, or diagonal
    if (rowDist !== 0 && colDist !== 0 && rowDist !== colDist) return null;
    const steps = Math.max(rowDist, colDist);
    if (steps === 0) return null;
    const cells = [];
    for (let i = 0; i <= steps; i++) {
      cells.push([r1 + dr * i, c1 + dc * i]);
    }
    return cells;
  }

  function markFound(word, wCells, isWinning) {
    const cellKeys = wCells.map(([cr, cc]) => cellKey(cr, cc));
    setFoundWords(prev => [...prev, word]);
    setFoundCells(prev => [...prev, ...cellKeys]);
    setSelected([]);
    setJustFoundCells(cellKeys);
    setJustFoundWord(word);
    if (isWinning) { playWin(); winVibrate(); } else { playSuccess(); successVibrate(); }
    clearTimeout(glowTimerRef.current);
    glowTimerRef.current = setTimeout(() => {
      setJustFoundCells([]);
      setJustFoundWord(null);
    }, 800);
  }

  function checkAndMarkWord(cells) {
    const selStr = cells.map(([sr, sc]) => gridData.grid[sr][sc]).join("");
    const selRev = selStr.split("").reverse().join("");
    for (const { word, cells: wCells } of gridData.placed) {
      if (foundWords.includes(word)) continue;
      if (word === selStr || word === selRev) {
        const isWinning = foundWords.length + 1 === words.length;
        markFound(word, wCells, isWinning);
        return true;
      }
    }
    return false;
  }

  function handleCellTap(r, c) {
    playTap();
    tapVibrate();
    const key = cellKey(r, c);

    if (lineMode) {
      // Line mode: tap first letter, then last letter → auto-draw line
      if (selected.length === 0) {
        setSelected([[r, c]]);
        return;
      }
      if (selected.length === 1) {
        // Tapping same cell deselects
        if (cellKey(selected[0][0], selected[0][1]) === key) {
          setSelected([]);
          return;
        }
        const [r1, c1] = selected[0];
        const lineCells = getLineCells(r1, c1, r, c);
        if (!lineCells) {
          // Not a straight line — restart with this cell
          setSelected([[r, c]]);
          return;
        }
        setSelected(lineCells);
        // Check for match immediately
        const selStr = lineCells.map(([sr, sc]) => gridData.grid[sr][sc]).join("");
        const selRev = selStr.split("").reverse().join("");
        let matched = false;
        for (const { word, cells } of gridData.placed) {
          if (foundWords.includes(word)) continue;
          if (word === selStr || word === selRev) {
            const isWinning = foundWords.length + 1 === words.length;
            markFound(word, cells, isWinning);
            matched = true;
            break;
          }
        }
        if (!matched) {
          setTimeout(() => setSelected([]), 1200);
        }
        return;
      }
      // If line is already shown, start fresh
      setSelected([[r, c]]);
      return;
    }

    // Manual tap mode (original)
    const alreadyIdx = selected.findIndex(([sr, sc]) => cellKey(sr, sc) === key);
    if (alreadyIdx === selected.length - 1 && alreadyIdx >= 0) {
      setSelected(prev => prev.slice(0, -1));
      return;
    }
    if (alreadyIdx >= 0) return;
    const newSelected = [...selected, [r, c]];
    setSelected(newSelected);
    checkAndMarkWord(newSelected);
  }

  function clearSelection() {
    setSelected([]);
  }

  const won = foundWords.length === words.length && words.length > 0;

  if (!started) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24" style={{ background: theme.bg }}>
      <div className="text-8xl mb-4">🔤</div>
      <h1 className="text-4xl font-black text-primary mb-4 text-center">Word Search</h1>
      <p className="text-xl text-muted-foreground text-center mb-6">Tap letters to spell out hidden words!</p>
      {/* Theme picker on start screen */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {Object.entries(WS_THEMES).map(([key, t]) => (
          <button key={key} onClick={() => setThemeKey(key)}
            className={`px-3 py-2 rounded-xl font-bold text-sm border-2 transition-all ${key === themeKey ? "border-white scale-105" : "border-transparent opacity-70"}`}
            style={{ background: t.cell, color: t.cellText }}>
            {t.emoji} {t.name}
          </button>
        ))}
      </div>
      <button onClick={startGame} className="text-white text-2xl font-black px-10 py-6 rounded-2xl shadow-xl mb-4" style={{ background: theme.selected, color: theme.selectedText }}>
        🔤 Start Game
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  if (won) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center" style={{ background: theme.bg }}>
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black mb-4" style={{ color: theme.selected }}>All Words Found!</h1>
      <button onClick={startGame} className="text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4" style={{ background: theme.selected, color: theme.selectedText }}>
        🔄 New Puzzle
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  return (
    <div className="min-h-screen px-2 py-4 pb-24 select-none" style={{ background: theme.bg }}>
      <ThemePanel open={themePanelOpen} onClose={() => setThemePanelOpen(false)} currentTheme={themeKey} onSelectTheme={setThemeKey} />
      <div className="flex items-center justify-between px-2 mb-3">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
        <div className="text-2xl font-black" style={{ color: theme.selected }}>🔤 Word Search</div>
        <div className="flex gap-2">
          <GameInstructions
            title="Word Search"
            emoji="🔤"
            steps={[
              "Look at the word list at the top — those are the words to find.",
              "Words are hidden in the grid in any direction (horizontal, vertical, diagonal, even backwards!).",
              "LINE MODE (default): Tap the first letter, then tap the last letter — the app draws a straight line between them!",
              "MANUAL MODE: Tap letters one by one to spell out a word.",
              "If the letters match a word, it turns green! Tap ✕ to clear your selection.",
              "Toggle between modes with the 📏/✏️ button.",
              "Find all the words to win the puzzle."
            ]}
          />
          <button onClick={() => setThemePanelOpen(true)}
            className="px-3 py-2 rounded-xl font-bold"
            style={{ background: theme.cell, color: theme.cellText }}
            title="Change theme">
            <Palette size={20} />
          </button>
          <button onClick={() => setSoundOn(!soundOn)}
            className="px-3 py-2 rounded-xl font-bold"
            style={{ background: theme.cell, color: theme.cellText }}
            title={soundOn ? "Mute sounds" : "Enable sounds"}>
            {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button onClick={() => setLineMode(!lineMode)}
            className="px-3 py-2 rounded-xl font-bold"
            style={{ background: lineMode ? theme.selected : theme.cell, color: lineMode ? theme.selectedText : theme.cellText }}
            title={lineMode ? "Line mode" : "Manual mode"}>
            {lineMode ? "📏" : "✏️"}
          </button>
          <button onClick={() => setRevealPanelOpen(!revealPanelOpen)}
            className="px-3 py-2 rounded-xl font-bold text-sm"
            style={{ background: theme.cell, color: theme.cellText }}
            title="Grid reveal pattern">
            {PATTERN_LIST.find(p => p.key === revealPattern)?.emoji || "🌀"}
          </button>
          <button onClick={clearSelection} className="px-3 py-2 rounded-xl font-bold" style={{ background: theme.cell, color: theme.cellText }}>✕</button>
          <button onClick={startGame} className="px-4 py-2 rounded-xl font-bold" style={{ background: theme.cell, color: theme.cellText }}>🔄</button>
        </div>
      </div>

      {/* Words to find */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mb-4 px-2">
        {words.map(w => (
          <SparkleEffect key={w} active={justFoundWord === w} sparkleColor={theme.sparkleColor}>
            <span className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-sm sm:text-lg font-black border-2 inline-block transition-all duration-300 ${
              justFoundWord === w ? "scale-110" : foundWords.includes(w) ? "line-through" : ""
            }`}
            style={{
              background: justFoundWord === w ? theme.justFound : foundWords.includes(w) ? theme.wordFoundBg : theme.wordBg,
              borderColor: justFoundWord === w ? theme.justFound : foundWords.includes(w) ? theme.wordFoundBorder : theme.wordBorder,
              color: justFoundWord === w ? theme.selectedText : foundWords.includes(w) ? theme.foundText : theme.cellText,
              boxShadow: justFoundWord === w ? `0 4px 20px ${theme.justFoundGlow}` : "none",
            }}>
              {w}
            </span>
          </SparkleEffect>
        ))}
      </div>

      {/* Reveal pattern selector */}
      {revealPanelOpen && (
        <div className="flex flex-wrap gap-1.5 justify-center mb-3 px-2">
          {PATTERN_LIST.map(p => (
            <button key={p.key}
              onClick={() => { setRevealPattern(p.key); setRevealPanelOpen(false); reveal(p.key); }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${p.key === revealPattern ? "scale-105" : "opacity-70"}`}
              style={{
                background: p.key === revealPattern ? theme.selected : theme.cell,
                color: p.key === revealPattern ? theme.selectedText : theme.cellText,
                borderColor: p.key === revealPattern ? theme.selected : theme.wordBorder,
              }}>
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="flex justify-center px-1">
        <div ref={gridRef} className="w-full max-w-md" style={{ display: "grid", gridTemplateColumns: `repeat(${size}, 1fr)`, gap: "2px" }}>
          {gridData.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = cellKey(r, c);
              const isSelected = selected.find(([sr, sc]) => cellKey(sr, sc) === key);
              const isFound = foundCells.includes(key);
              const isJustFound = justFoundCells.includes(key);
              return (
                <div key={key}
                  onClick={() => handleCellTap(r, c)}
                  className={`aspect-square flex items-center justify-center text-sm sm:text-lg font-black rounded cursor-pointer transition-colors ${
                    isJustFound ? "cell-found-glow" : ""
                  }`}
                  style={{
                    background: isJustFound ? theme.justFound : isFound ? theme.found : isSelected ? theme.selected : theme.cell,
                    color: isJustFound ? theme.foundText : isFound ? theme.foundText : isSelected ? theme.selectedText : theme.cellText,
                    "--glow-color": theme.justFoundGlow,
                  }}>
                  {letter}
                </div>
              );
            })
          )}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="text-center mt-3">
          <span className="px-4 py-2 rounded-xl text-lg font-black tracking-widest" style={{ background: theme.selected, color: theme.selectedText }}>
            {selected.map(([sr, sc]) => gridData.grid[sr][sc]).join("")}
          </span>
        </div>
      )}
      <p className="text-center text-sm mt-2" style={{ color: theme.cellText, opacity: 0.6 }}>
        Mode: {lineMode ? "📏 Line (tap first & last letter)" : "✏️ Manual (tap each letter)"}
      </p>
      <p className="text-center text-lg mt-1" style={{ color: theme.cellText, opacity: 0.7 }}>Found: {foundWords.length} / {words.length}</p>
    </div>
  );
}