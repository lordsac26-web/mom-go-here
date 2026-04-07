import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
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

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// FIX (bug): rewrote shuffleWithCenter to avoid the parameter-mutation bug.
// The original code reassigned `allLetters` inside a closure over the loop variable,
// which caused the center detection to fail when the array contained duplicate letters.
// Now uses a clean immutable split: find the first occurrence of the center and remove it.
function shuffleWithCenter(allLetters, centerLetter) {
  const center = centerLetter.toUpperCase();
  const centerIndex = allLetters.findIndex(l => l.toUpperCase() === center);
  // Remove exactly the first occurrence of the center letter
  const otherLetters = allLetters.filter((_, i) => i !== centerIndex);
  const shuffled = shuffle(otherLetters);
  // Insert center letter at index 3 (visual center of honeycomb)
  shuffled.splice(3, 0, center);
  return shuffled;
}

export default function WordWhomp() {
  useGameTimer();
  const { tapVibrate, matchVibrate, winVibrate, scoreHit } = useHaptics();
  const { matchSound, winSound, uiClickSound, cardFlipSound } = useGameAudio();
  const { spark, burst, shower, fireworks, sideCannons, emojiRain } = useConfetti();

  const [puzzleIndex, setPuzzleIndex] = useState(() => Math.floor(Math.random() * PUZZLES.length));
  const [letters, setLetters] = useState(() => {
    const p = PUZZLES[puzzleIndex];
    return shuffleWithCenter([...p.letters], p.center);
  });
  const [currentWord, setCurrentWord] = useState([]);
  const [usedIndices, setUsedIndices] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(true);

  const puzzle = PUZZLES[puzzleIndex];
  // FIX (perf): memoize allWords so it isn't re-derived on every render
  const allWords = useMemo(() => puzzle.words, [puzzleIndex]);
  const centerLetter = puzzle.center;

  // FIX (bug): restructured timer so the cleanup always runs, preventing timeout leaks.
  // The original code returned clearTimeout only inside the early-return branches,
  // leaving the happy-path effect with no cleanup — meaning every re-render that
  // didn't hit the early return leaked a timeout.
  useEffect(() => {
    if (!timerActive || gameOver || timeLeft <= 0) {
      if (timeLeft <= 0 && !gameOver) {
        setGameOver(true);
      }
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    // FIX (bug): cleanup always returned, not only on early return
    return () => clearTimeout(id);
  }, [timeLeft, timerActive, gameOver]);

  // Check win
  useEffect(() => {
    if (foundWords.length === allWords.length && allWords.length > 0) {
      winVibrate();
      winSound();
      fireworks();
      emojiRain(["🐝", "🏆", "⭐"]);
      setGameOver(true);
      setTimerActive(false);
    }
  }, [foundWords, allWords]);

  // Milestone celebration at 25%, 50%, 75%
  useEffect(() => {
    if (allWords.length === 0 || gameOver) return;
    const pct = foundWords.length / allWords.length;
    if (foundWords.length > 0 && (pct === 0.25 || pct === 0.5 || pct === 0.75)) {
      burst();
    }
  }, [foundWords, allWords, gameOver]);

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
    uiClickSound();
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
    const idx = (puzzleIndex + 1) % PUZZLES.length;
    setPuzzleIndex(idx);
    setLetters(shuffleWithCenter([...PUZZLES[idx].letters], PUZZLES[idx].center));
    setCurrentWord([]);
    setUsedIndices([]);
    setFoundWords([]);
    setScore(0);
    setMessage("");
    setGameOver(false);
    setTimeLeft(120);
    setTimerActive(true);
  }

  const timerColor = timeLeft <= 15 ? "text-red-400" : timeLeft <= 30 ? "text-yellow-400" : "text-primary";
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Game over screen
  if (gameOver) {
    const allFound = foundWords.length === allWords.length;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
        <div className="text-8xl mb-4">{allFound ? "🐝" : "⏰"}</div>
        <h1 className="text-4xl font-black text-primary mb-2">
          {allFound ? <BeeFlightTitle text="Perfect Buzz!" size="text-4xl" /> : "Time's Up!"}
        </h1>
        <p className="text-2xl text-foreground mb-1">Score: <span className="text-primary font-black">{score}</span></p>
        <p className="text-xl text-muted-foreground mb-6">
          Found {foundWords.length}/{allWords.length} words
        </p>

        {!allFound && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-6 max-w-sm w-full max-h-40 overflow-y-auto">
            <p className="text-sm font-bold text-muted-foreground mb-2">Missed words:</p>
            <div className="flex flex-wrap gap-1.5">
              {allWords.filter(w => !foundWords.includes(w)).map(w => (
                <span key={w} className="px-2 py-0.5 bg-red-900/30 border border-red-700/50 rounded text-sm text-red-300 font-bold">
                  {w.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={newGame}
          className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4"
        >
          🔄 New Puzzle
        </button>
        <GameBackButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <GameBackButton />
        <div className="text-center">
          <BeeFlightTitle text="🐝 Buzz Word!" size="text-xl" />
          <div className="text-muted-foreground text-sm">
            Score: {score} | {foundWords.length}/{allWords.length} words
          </div>
        </div>
        <div className="flex gap-2">
          <GameInstructions
            title="Buzz Word!"
            emoji="🐝"
            steps={[
              "Tap letters to build words (3+ letters).",
              `The GOLD center letter "${centerLetter}" must be in EVERY word you make!`,
              "Tap SUBMIT to check your word.",
              "Longer words earn more points! (3 letters = 1pt, 4 = 3pts, 5 = 5pts, 6 = 8pts, 7+ = 12pts)",
              "Use SHUFFLE to rearrange the outer letters (center stays put!).",
              "Find all words before time runs out! ⏰"
            ]}
          />
          <button onClick={newGame} className="bg-secondary text-foreground px-3 py-2 rounded-xl font-bold text-sm">🔄</button>
        </div>
      </div>

      {/* Timer */}
      <div className="text-center mb-3">
        <span className={`text-3xl font-black ${timerColor} tabular-nums`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Current word display */}
      <div className="bg-card border-2 border-border rounded-2xl px-4 py-3 mb-4 min-h-[56px] flex items-center justify-center">
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
            className={`text-center text-xl font-black mb-3 ${
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
      <div className="flex justify-center mb-4">
        <LetterHoneycomb
          letters={letters}
          usedIndices={usedIndices}
          onLetterTap={handleLetterTap}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-center mb-6 max-w-sm mx-auto">
        <button
          onClick={handleBackspace}
          className="flex-1 bg-secondary text-foreground text-lg font-black py-3 rounded-xl border-2 border-border"
        >
          ⌫ Undo
        </button>
        <button
          onClick={handleShuffle}
          className="flex-1 bg-secondary text-foreground text-lg font-black py-3 rounded-xl border-2 border-border"
        >
          🔀 Shuffle
        </button>
        <button
          onClick={handleSubmit}
          disabled={currentWord.length < 3}
          className="flex-1 bg-primary text-primary-foreground text-lg font-black py-3 rounded-xl disabled:opacity-40"
        >
          ✓ Submit
        </button>
      </div>

      {/* Word list */}
      <div className="bg-card border-2 border-border rounded-2xl p-4 max-w-sm mx-auto">
        <h3 className="text-lg font-black text-primary mb-3">
          📝 Words ({foundWords.length}/{allWords.length})
        </h3>
        <WordList foundWords={foundWords} allWords={allWords} />
      </div>
    </div>
  );
}