import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameBackButton from "../../components/GameBackButton";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import LetterHoneycomb from "../../components/wordwhomp/LetterHoneycomb";
import WordList from "../../components/wordwhomp/WordList";
import PUZZLES from "../../components/wordwhomp/wordData";
import useConfetti from "../../hooks/useConfetti";
import BeeFlightTitle from "../../components/BeeFlightTitle";
import { useGameActivity } from "../../hooks/useGameActivity";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { saveGameScore } from "@/lib/scoreSaver";
import BuzzWordResetDialog from "../../components/wordwhomp/BuzzWordResetDialog";
import BuzzWordStatusBar from "../../components/wordwhomp/BuzzWordStatusBar";
import BuzzWordGameOver from "../../components/wordwhomp/BuzzWordGameOver";
import BuzzWordModeSelect from "../../components/wordwhomp/BuzzWordModeSelect";

// Fisher-Yates shuffle (unbiased)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleWithCenter(allLetters, centerLetter) {
  const center = centerLetter.toUpperCase();
  const centerIndex = allLetters.findIndex(l => l.toUpperCase() === center);
  const otherLetters = allLetters.filter((_, i) => i !== centerIndex);
  const shuffled = shuffle(otherLetters);
  shuffled.splice(3, 0, center);
  return shuffled;
}

function getRandomPuzzleIndex(excludeIndex) {
  if (PUZZLES.length <= 1) return 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * PUZZLES.length);
  } while (idx === excludeIndex);
  return idx;
}

const TIMED_DURATION = 180; // 3 minutes

export default function WordWhomp() {
  useGameTimer();
  const { user } = useAuth();
  const { tapVibrate, matchVibrate, winVibrate, scoreHit } = useHaptics();
  const { matchSound, winSound, uiClickSound, cardFlipSound } = useGameAudio();
  const { spark, burst, fireworks, sideCannons, emojiRain } = useConfetti();
  const { reportWin, reportLoss } = useGameActivity();

  // Mode selection
  const [mode, setMode] = useState(null); // null = not started, "timed" | "relaxed"
  const [started, setStarted] = useState(false);

  const [puzzleIndex, setPuzzleIndex] = useState(() => Math.floor(Math.random() * PUZZLES.length));
  const [letters, setLetters] = useState(() => {
    const p = PUZZLES[puzzleIndex];
    return shuffleWithCenter([...p.letters], p.center);
  });
  const [currentWord, setCurrentWord] = useState([]);
  const [usedIndices, setUsedIndices] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [lastFoundWord, setLastFoundWord] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMED_DURATION);
  const [timerActive, setTimerActive] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const gameStartRef = useRef(null);
  const statsRecordedRef = useRef(false);

  const puzzle = PUZZLES[puzzleIndex];
  const allWords = useMemo(() => puzzle.words, [puzzleIndex]);
  const centerLetter = puzzle.center;
  const isRelaxed = mode === "relaxed";

  // Timer countdown for timed mode
  useEffect(() => {
    if (isRelaxed || !timerActive || gameOver || timeLeft <= 0) {
      if (!isRelaxed && timeLeft <= 0 && !gameOver) {
        setGameOver(true);
      }
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, timerActive, gameOver, isRelaxed]);

  // Check win
  useEffect(() => {
    if (foundWords.length === allWords.length && allWords.length > 0 && started) {
      winVibrate();
      winSound();
      fireworks();
      emojiRain(["🐝", "🏆", "⭐"]);
      setGameOver(true);
      setTimerActive(false);
      reportWin("Buzz Word");
      recordStats();
    }
  }, [foundWords, allWords, started]);

  // Milestone celebration
  useEffect(() => {
    if (allWords.length === 0 || gameOver || !started) return;
    const pct = foundWords.length / allWords.length;
    if (foundWords.length > 0 && (pct === 0.25 || pct === 0.5 || pct === 0.75)) {
      burst();
    }
  }, [foundWords, allWords, gameOver, started]);

  // Record stats on game over (timeout path)
  useEffect(() => {
    if (gameOver && started && !statsRecordedRef.current && foundWords.length < allWords.length) {
      // Time ran out without finding everything — still counts as a play for missions
      reportLoss("Buzz Word");
      recordStats();
    }
  }, [gameOver]);

  async function recordStats() {
    if (!user?.email || statsRecordedRef.current) return;
    statsRecordedRef.current = true;
    const elapsed = gameStartRef.current ? Math.round((Date.now() - gameStartRef.current) / 1000) : 0;
    const allFound = foundWords.length === allWords.length;
    await saveGameScore({
      game_name: "Buzz Word",
      score: score,
      duration_seconds: elapsed,
      difficulty: isRelaxed ? "relaxed" : "timed",
      completed: allFound,
    });
  }

  function handleSelectMode(selectedMode) {
    setMode(selectedMode);
    setStarted(true);
    setTimerActive(selectedMode === "timed");
    gameStartRef.current = Date.now();
    statsRecordedRef.current = false;
  }

  const showMessage = useCallback((text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 1500);
  }, []);

  function handleLetterTap(letter, index) {
    tapVibrate();
    cardFlipSound();
    setCurrentWord(prev => [...prev, letter]);
    setUsedIndices(prev => [...prev, index]);
  }

  function handleBackspace() {
    if (currentWord.length === 0) return;
    uiClickSound();
    setCurrentWord(prev => prev.slice(0, -1));
    setUsedIndices(prev => prev.slice(0, -1));
  }

  function handleClear() {
    setCurrentWord([]);
    setUsedIndices([]);
  }

  function handleShuffle() {
    uiClickSound();
    tapVibrate();
    setLetters(shuffleWithCenter([...puzzle.letters], centerLetter));
    setCurrentWord([]);
    setUsedIndices([]);
  }

  function handleSubmit() {
    const word = currentWord.join("").toLowerCase();

    if (word.length < 3) {
      showMessage("Too short! (3+ letters)", "error");
      tapVibrate();
      handleClear();
      return;
    }

    if (!word.includes(centerLetter.toLowerCase())) {
      showMessage(`Must contain "${centerLetter}"!`, "error");
      tapVibrate();
      handleClear();
      return;
    }

    if (foundWords.includes(word)) {
      showMessage("Already found!", "error");
      tapVibrate();
      handleClear();
      return;
    }

    if (allWords.includes(word)) {
      const points = word.length === 3 ? 1 : word.length === 4 ? 3 : word.length === 5 ? 5 : word.length === 6 ? 8 : 12;
      matchVibrate();
      matchSound();
      setFoundWords(prev => [...prev, word]);
      setLastFoundWord(word);
      setTimeout(() => setLastFoundWord(null), 1200);
      setScore(s => s + points);
      scoreHit();

      if (word.length >= 7) {
        showMessage(`🐝 BUZZ! +${points} pts!`, "success");
        sideCannons();
      } else if (word.length >= 5) {
        showMessage(`✨ Great! +${points} pts!`, "success");
        burst();
      } else {
        showMessage(`✅ +${points} pts`, "success");
        spark();
      }
    } else {
      showMessage("Not a valid word", "error");
      tapVibrate();
    }

    handleClear();
  }

  function newGame() {
    uiClickSound();
    const idx = getRandomPuzzleIndex(puzzleIndex);
    setPuzzleIndex(idx);
    setLetters(shuffleWithCenter([...PUZZLES[idx].letters], PUZZLES[idx].center));
    setCurrentWord([]);
    setUsedIndices([]);
    setFoundWords([]);
    setLastFoundWord(null);
    setScore(0);
    setMessage("");
    setGameOver(false);
    setTimeLeft(TIMED_DURATION);
    setTimerActive(!isRelaxed);
    setShowResetConfirm(false);
    gameStartRef.current = Date.now();
    statsRecordedRef.current = false;
  }

  function handleResetClick() {
    if (foundWords.length > 0 && !gameOver) {
      setShowResetConfirm(true);
    } else {
      newGame();
    }
  }

  function handleConfirmReset() {
    setShowResetConfirm(false);
    newGame();
  }

  const elapsedTime = gameStartRef.current ? Math.round((Date.now() - gameStartRef.current) / 1000) : 0;

  // ── MODE SELECT ──
  if (!started) {
    return <BuzzWordModeSelect onSelectMode={handleSelectMode} />;
  }

  // ── GAME OVER ──
  if (gameOver) {
    return (
      <BuzzWordGameOver
        score={score}
        foundWords={foundWords}
        allWords={allWords}
        isRelaxed={isRelaxed}
        elapsedTime={elapsedTime}
        onNewGame={newGame}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-yellow-950 to-amber-950 px-2 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <GameBackButton />
        <div className="text-xl sm:text-2xl font-black text-yellow-300">
          <BeeFlightTitle text="🐝 Buzz Word" size="text-xl" />
        </div>
        <div className="flex gap-1.5">
          <GameInstructions
            title="Buzz Word!"
            emoji="🐝"
            steps={[
              "Tap letters to build words (3+ letters).",
              `The GOLD center letter "${centerLetter}" must be in EVERY word you make!`,
              "Each letter tile can only be used once per word.",
              "Tap SUBMIT to check your word.",
              "Longer words earn more points! (3 = 1pt, 4 = 3pts, 5 = 5pts, 6 = 8pts, 7+ = 12pts)",
              "Use SHUFFLE to rearrange the outer letters (center stays put!).",
              isRelaxed ? "Take your time — no timer! ☕" : "Find all words before time runs out! ⏰",
            ]}
          />
          <button onClick={handleResetClick} className="bg-secondary text-foreground px-3 py-2 rounded-xl font-bold text-sm">🔄</button>
        </div>
      </div>

      {/* Status bar */}
      <BuzzWordStatusBar
        score={score}
        foundCount={foundWords.length}
        totalCount={allWords.length}
        timeLeft={timeLeft}
        isRelaxed={isRelaxed}
        gameStartTime={gameStartRef.current}
        gameOver={gameOver}
      />

      {/* Current word display */}
      <div className="bg-card border-2 border-border rounded-2xl px-4 py-3 mb-3 min-h-[56px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {currentWord.length > 0 ? (
            currentWord.map((letter, i) => (
              <motion.span
                key={`${i}-${letter}`}
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, y: -10 }}
                className="text-3xl font-black text-primary mx-0.5"
              >
                {letter}
              </motion.span>
            ))
          ) : (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg text-muted-foreground"
            >
              Use the gold letter <span className="text-yellow-400 font-black">{centerLetter}</span> in every word!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-center text-xl font-black mb-2 ${
              messageType === "success" ? "text-green-400" :
              messageType === "error" ? "text-red-400" :
              "text-primary"
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Honeycomb Letters */}
      <div className="flex justify-center mb-3">
        <LetterHoneycomb
          letters={letters}
          usedIndices={usedIndices}
          onLetterTap={handleLetterTap}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-center mb-4 max-w-sm mx-auto">
        <button
          onClick={handleBackspace}
          className="flex-1 bg-secondary text-foreground text-lg font-black py-3.5 rounded-xl border-2 border-border active:scale-95 transition-transform"
        >
          ⌫ Undo
        </button>
        <button
          onClick={handleShuffle}
          className="flex-1 bg-secondary text-foreground text-lg font-black py-3.5 rounded-xl border-2 border-border active:scale-95 transition-transform"
        >
          🔀 Shuffle
        </button>
        <button
          onClick={handleSubmit}
          disabled={currentWord.length < 3}
          className="flex-1 bg-primary text-primary-foreground text-lg font-black py-3.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
        >
          ✓ Submit
        </button>
      </div>

      {/* Word list */}
      <div className="bg-card border-2 border-border rounded-2xl p-4 max-w-sm mx-auto">
        <h3 className="text-lg font-black text-primary mb-3">
          📝 Words ({foundWords.length}/{allWords.length})
        </h3>
        <WordList foundWords={foundWords} allWords={allWords} lastFoundWord={lastFoundWord} />
      </div>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <BuzzWordResetDialog
            onConfirm={handleConfirmReset}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}