import { useState, useRef, useEffect } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { AnimatePresence, motion } from "framer-motion";
import GameBackButton from "../../components/GameBackButton";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import SparkleEffect from "../../components/SparkleEffect";
import { Palette } from "lucide-react";
import { WS_THEMES, DEFAULT_THEME } from "../../components/wordsearch/themes";
import ThemePanel from "../../components/wordsearch/ThemePanel";
import useGridReveal from "../../hooks/useGridReveal";
import { useGameActivity } from "../../hooks/useGameActivity";
import useConfetti from "../../hooks/useConfetti";
import { base44 } from "@/api/base44Client";
import { saveGameScore } from "@/lib/scoreSaver";
import { useAuth } from "@/lib/AuthContext";
import WordSearchResetDialog from "../../components/wordsearch/WordSearchResetDialog";
import WordSearchHintButton from "../../components/wordsearch/WordSearchHintButton";
import WordSearchStatusBar from "../../components/wordsearch/WordSearchStatusBar";
import { WORD_LISTS_EASY, WORD_LISTS_ADVANCED } from "../../components/wordsearch/wordLists";

const DIFFICULTIES = {
  easy: { label: "Easy", emoji: "😊", gridSize: 10, wordLists: WORD_LISTS_EASY, desc: "10×10 grid · 8 words" },
  advanced: { label: "Advanced", emoji: "🧠", gridSize: 12, wordLists: WORD_LISTS_ADVANCED, desc: "12×12 grid · 10 words" },
};

function generateGrid(size, words) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(""));
  const placed = [];
  const directions = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];

  for (const word of words) {
    let tries = 0;
    while (tries < 200) {
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

  const placedWords = placed.map(p => p.word);
  return { grid, placed, placedWords };
}

// Find one unfound word and return its first + last cell for hint highlighting
function findHint(gridData, foundWords) {
  if (!gridData) return null;
  for (const { word, cells } of gridData.placed) {
    if (!foundWords.includes(word)) {
      return { word, cells, firstCell: cells[0], lastCell: cells[cells.length - 1] };
    }
  }
  return null;
}

export default function WordSearch() {
  useGameTimer();
  const { user } = useAuth();
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();
  const { uiClickSound, matchSound, winSound } = useGameAudio();
  const { reportWin } = useGameActivity();
  const { fireworks, emojiRain, spark } = useConfetti();

  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState(null);
  const size = difficulty ? DIFFICULTIES[difficulty].gridSize : 10;
  const [gridData, setGridData] = useState(null);
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [foundCellsSet, setFoundCellsSet] = useState(new Set());
  const [justFoundCells, setJustFoundCells] = useState(new Set());
  const [justFoundWord, setJustFoundWord] = useState(null);
  const glowTimerRef = useRef(null);
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME);
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const theme = WS_THEMES[themeKey];
  const { gridRef, reveal } = useGridReveal(size, size);
  const [revealKey, setRevealKey] = useState(0);

  // New: reset confirmation, hint, timer, GameScore
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hintCells, setHintCells] = useState(new Set());
  const hintTimerRef = useRef(null);
  const gameStartRef = useRef(null);
  const statsRecordedRef = useRef(false);
  const [winTime, setWinTime] = useState(null);

  const won = foundWords.length === words.length && words.length > 0;

  useEffect(() => {
    if (started && gridData && !won) {
      const t = setTimeout(() => reveal("spiral"), 50);
      return () => clearTimeout(t);
    }
  }, [revealKey, started, won, reveal]);

  useEffect(() => {
    return () => {
      clearTimeout(glowTimerRef.current);
      clearTimeout(hintTimerRef.current);
    };
  }, []);

  // Clear hint on any game state change
  useEffect(() => {
    setHintCells(new Set());
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, [foundWords, selected]);

  function startGame(diff) {
    const d = diff || difficulty || "easy";
    if (!difficulty) setDifficulty(d);
    const config = DIFFICULTIES[d];
    const wlist = config.wordLists[Math.floor(Math.random() * config.wordLists.length)];
    const data = generateGrid(config.gridSize, wlist);
    setGridData(data);
    setWords(data.placedWords);
    setSelected([]);
    setFoundWords([]);
    setFoundCellsSet(new Set());
    setJustFoundCells(new Set());
    setJustFoundWord(null);
    setHintCells(new Set());
    setShowResetConfirm(false);
    setWinTime(null);
    statsRecordedRef.current = false;
    gameStartRef.current = Date.now();
    setStarted(true);
    setRevealKey(prev => prev + 1);
  }

  function handleResetClick() {
    if (foundWords.length > 0 && !won) {
      setShowResetConfirm(true);
    } else {
      startGame(difficulty);
    }
  }

  function handleHint() {
    const hint = findHint(gridData, foundWords);
    if (!hint) return;
    tapVibrate();
    // Highlight all cells of the unfound word
    const keys = new Set(hint.cells.map(([r, c]) => cellKey(r, c)));
    setHintCells(keys);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintCells(new Set()), 2500);
  }

  // Record stats on win
  async function recordStats() {
    if (!user?.email || statsRecordedRef.current) return;
    statsRecordedRef.current = true;
    reportWin("Word Search");
    const elapsed = gameStartRef.current
      ? Math.round((Date.now() - gameStartRef.current) / 1000)
      : 0;
    setWinTime(elapsed);
    await saveGameScore({
      game_name: "Word Search",
      score: words.length,
      duration_seconds: elapsed,
      difficulty: difficulty,
      completed: true,
    });
  }

  function cellKey(r, c) { return `${r},${c}`; }

  function getLineCells(r1, c1, r2, c2) {
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    const rowDist = Math.abs(r2 - r1);
    const colDist = Math.abs(c2 - c1);
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
    const keys = wCells.map(([cr, cc]) => cellKey(cr, cc));
    setFoundWords(prev => [...prev, word]);
    setFoundCellsSet(prev => new Set([...prev, ...keys]));
    setSelected([]);
    setJustFoundCells(new Set(keys));
    setJustFoundWord(word);
    spark();
    if (isWinning) {
      winSound();
      winVibrate();
      fireworks();
      emojiRain(["🔤", "⭐", "🎉"]);
      recordStats();
    } else {
      matchSound();
      successVibrate();
    }
    clearTimeout(glowTimerRef.current);
    glowTimerRef.current = setTimeout(() => {
      setJustFoundCells(new Set());
      setJustFoundWord(null);
    }, 800);
  }

  function handleCellTap(r, c) {
    uiClickSound();
    tapVibrate();
    const key = cellKey(r, c);

    if (selected.length === 0) {
      setSelected([[r, c]]);
      return;
    }
    if (selected.length === 1) {
      if (cellKey(selected[0][0], selected[0][1]) === key) {
        setSelected([]);
        return;
      }
      const [r1, c1] = selected[0];
      const lineCells = getLineCells(r1, c1, r, c);
      if (!lineCells) {
        setSelected([[r, c]]);
        return;
      }
      setSelected(lineCells);
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
    setSelected([[r, c]]);
  }

  function clearSelection() {
    setSelected([]);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // ── START SCREEN ──
  if (!started) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-green-950 to-slate-950 flex flex-col items-center justify-center px-4 pb-24">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }} className="text-8xl mb-2 select-none">🔤</motion.div>
      <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-5xl font-black text-white mb-1 tracking-tight">Word Search</motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
        className="text-lg text-green-300 mb-5 text-center">Tap first · tap last · find every word</motion.p>

      {/* Theme picker */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-2 justify-center mb-4">
        {Object.entries(WS_THEMES).map(([key, t]) => (
          <button key={key} onClick={() => setThemeKey(key)}
            className={`px-3 py-2 rounded-xl font-bold text-sm border-2 transition-all ${key === themeKey ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60"}`}
            style={{ background: t.cell, color: t.cellText }}>
            {t.emoji} {t.name}
          </button>
        ))}
      </motion.div>

      {/* Difficulty */}
      <div className="flex gap-4 mb-6">
        {Object.entries(DIFFICULTIES).map(([key, d], i) => (
          <motion.button key={key}
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 220 }}
            onClick={() => { tapVibrate(); uiClickSound(); setDifficulty(key); startGame(key); }}
            className="flex flex-col items-center gap-1 px-6 py-5 rounded-2xl border-2 font-black text-xl shadow-xl active:scale-95 transition-transform"
            style={{ background: theme.selected, color: theme.selectedText, borderColor: theme.selected }}
          >
            <span className="text-3xl">{d.emoji}</span>
            <span>{d.label}</span>
            <span className="text-xs font-bold opacity-80">{d.desc}</span>
          </motion.button>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
        <GameBackButton />
      </motion.div>
    </div>
  );

  // ── WIN SCREEN ──
  if (won) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-green-950 to-slate-950 flex flex-col items-center justify-center px-4 pb-24 text-center">
      <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }} className="text-8xl mb-3">🎉</motion.div>
      <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-5xl font-black text-white mb-4">All Words Found!</motion.h1>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
        className="bg-white/10 border border-white/20 rounded-2xl px-8 py-5 mb-5 w-full max-w-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-black text-white">{winTime != null ? formatTime(winTime) : "—"}</div>
            <div className="text-xs text-green-300 uppercase tracking-wide">Time</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{words.length}</div>
            <div className="text-xs text-green-300 uppercase tracking-wide">Words Found</div>
          </div>
        </div>
        <div className="mt-3 text-green-300 text-sm font-bold">
          {DIFFICULTIES[difficulty]?.label} · {DIFFICULTIES[difficulty]?.desc}
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }}
        className="space-y-3 w-full max-w-xs">
        <button onClick={() => startGame(difficulty)}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-transform border-2 border-green-400">
          🔄 New Puzzle
        </button>
        <button onClick={() => { setStarted(false); setDifficulty(null); }}
          className="w-full bg-white/10 border border-white/20 text-white text-lg font-bold py-3 rounded-xl active:scale-95 transition-transform">
          Change Difficulty
        </button>
        <GameBackButton />
      </motion.div>
    </div>
  );

  // ── GAME BOARD ──
  return (
    <div className="min-h-screen px-2 py-4 pb-24 select-none" style={{ background: theme.bg }}>
      <ThemePanel open={themePanelOpen} onClose={() => setThemePanelOpen(false)} currentTheme={themeKey} onSelectTheme={setThemeKey} />

      {/* Header — simplified: Help, Hint, Theme, Clear, Reset */}
      <div className="flex items-center justify-between px-2 mb-2">
        <GameBackButton />
        <div className="text-xl sm:text-2xl font-black" style={{ color: theme.selected }}>🔤 Word Search</div>
        <div className="flex gap-1.5">
          <GameInstructions
            title="Word Search"
            emoji="🔤"
            steps={[
              "Look at the word list below — those are the words hidden in the grid.",
              "Words can go in any direction: across, down, diagonal, even backwards!",
              "Tap the FIRST letter of a word, then tap the LAST letter.",
              "The app draws a straight line between them — if it matches a word, it turns green!",
              "Use the 💡 Hint button if you get stuck — it highlights a hidden word.",
              "Find all the words to win! 🎉",
            ]}
          />
          <WordSearchHintButton onHint={handleHint} disabled={won} theme={theme} />
          <button onClick={() => setThemePanelOpen(true)}
            className="px-3 py-2 rounded-xl font-bold"
            style={{ background: theme.cell, color: theme.cellText }}
            title="Change theme">
            <Palette size={18} />
          </button>
          <button onClick={clearSelection} className="px-3 py-2 rounded-xl font-bold" style={{ background: theme.cell, color: theme.cellText }}>✕</button>
          <button onClick={handleResetClick} className="px-3 py-2 rounded-xl font-bold" style={{ background: theme.cell, color: theme.cellText }}>🔄</button>
        </div>
      </div>

      {/* Status bar: found count + timer */}
      <WordSearchStatusBar
        foundCount={foundWords.length}
        totalCount={words.length}
        gameStartTime={gameStartRef.current}
        gameOver={won}
        theme={theme}
      />

      {/* Words to find */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mb-3 px-2">
        {words.map(w => (
          <SparkleEffect key={w} active={justFoundWord === w} sparkleColor={theme.sparkleColor}>
            <span className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-sm sm:text-lg font-black border-2 inline-block transition-all duration-300 ${
              justFoundWord === w ? "scale-110" : foundWords.includes(w) ? "line-through opacity-60" : ""
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

      {/* Grid — increased max-w for better touch targets */}
      <div className="flex justify-center px-1">
        <div ref={gridRef} className="w-full max-w-lg" style={{ display: "grid", gridTemplateColumns: `repeat(${size}, 1fr)`, gap: "2px" }}>
          {gridData.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = cellKey(r, c);
              const isSelected = selected.some(([sr, sc]) => cellKey(sr, sc) === key);
              const isFound = foundCellsSet.has(key);
              const isJustFound = justFoundCells.has(key);
              const isHint = hintCells.has(key);
              return (
                <div key={key}
                  onClick={() => handleCellTap(r, c)}
                  className={`aspect-square flex items-center justify-center text-base sm:text-xl font-black rounded-sm cursor-pointer transition-colors ${
                    isJustFound ? "cell-found-glow" : ""
                  } ${isHint ? "animate-pulse" : ""}`}
                  style={{
                    background: isJustFound ? theme.justFound
                      : isFound ? theme.found
                      : isHint ? (theme.selected + "80")
                      : isSelected ? theme.selected
                      : theme.cell,
                    color: isJustFound ? theme.foundText
                      : isFound ? theme.foundText
                      : isSelected ? theme.selectedText
                      : isHint ? theme.selectedText
                      : theme.cellText,
                    "--glow-color": theme.justFoundGlow,
                  }}>
                  {letter}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected letters preview */}
      {selected.length > 0 && (
        <div className="text-center mt-3">
          <span className="px-4 py-2 rounded-xl text-lg font-black tracking-wider" style={{ background: theme.selected, color: theme.selectedText }}>
            {selected.map(([sr, sc]) => gridData.grid[sr][sc]).join("")}
          </span>
        </div>
      )}

      {/* Mode hint */}
      <p className="text-center text-sm mt-2" style={{ color: theme.cellText, opacity: 0.5 }}>
        Tap first letter → tap last letter
      </p>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <WordSearchResetDialog
            onConfirm={() => { setShowResetConfirm(false); startGame(difficulty); }}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}