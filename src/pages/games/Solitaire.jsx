import { useState, useCallback, useEffect, useRef } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameBackButton from "../../components/GameBackButton";
import { motion, AnimatePresence } from "framer-motion";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import SolitaireCard from "../../components/solitaire/SolitaireCard";
import StackedCardDeck from "../../components/solitaire/StackedCardDeck";
import SolitaireResetDialog from "../../components/solitaire/SolitaireResetDialog";
import SolitaireHintButton from "../../components/solitaire/SolitaireHintButton";
import SolitaireStatusBar from "../../components/solitaire/SolitaireStatusBar";
import { base44 } from "@/api/base44Client";
import { saveGameScore } from "@/lib/scoreSaver";
import { useAuth } from "@/lib/AuthContext";
import useConfetti from "../../hooks/useConfetti";
import { useGameActivity } from "../../hooks/useGameActivity";
import GameVictoryScreen from "../../components/games/GameVictoryScreen";
import { awardCoinsForStars, computeStars, coinsForStars } from "@/lib/awardCoins";

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RED = new Set(["♥", "♦"]);

function createDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const val of VALUES)
      deck.push({ suit, val, faceUp: false });
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(val) { return VALUES.indexOf(val); }
function isRed(card) { return RED.has(card.suit); }

function canPlaceOnTableau(card, target) {
  if (!target) return card.val === "K";
  return cardValue(card.val) === cardValue(target.val) - 1 && isRed(card) !== isRed(target);
}

function canPlaceOnFoundation(card, pile) {
  if (!pile.length) return card.val === "A";
  const top = pile[pile.length - 1];
  return card.suit === top.suit && cardValue(card.val) === cardValue(top.val) + 1;
}

function cloneGame(g) {
  return {
    tableau: g.tableau.map(col => col.map(card => ({ ...card }))),
    stock: g.stock.map(card => ({ ...card })),
    waste: g.waste.map(card => ({ ...card })),
    foundations: g.foundations.map(pile => pile.map(card => ({ ...card }))),
  };
}

function initGame() {
  const deck = createDeck();
  const tableau = Array(7).fill(null).map((_, i) => {
    const col = deck.splice(0, i + 1);
    col.forEach((c, j) => { c.faceUp = j === i; });
    return col;
  });
  deck.forEach(c => c.faceUp = false);
  return { tableau, stock: deck, waste: [], foundations: [[], [], [], []] };
}

function checkWin(g) {
  return g.foundations.every(f => f.length === 13);
}

// Check if all remaining cards are face-up (auto-complete candidate)
function canAutoComplete(g) {
  if (g.stock.length > 0 || g.waste.length > 0) return false;
  return g.tableau.every(col => col.every(c => c.faceUp));
}

function hasAnyMoves(g) {
  if (g.stock.length > 0) return true;
  if (g.waste.length > 0 && g.stock.length === 0) return true;

  const wasteCard = g.waste.length ? g.waste[g.waste.length - 1] : null;
  if (wasteCard) {
    for (const col of g.tableau) {
      const target = col.length ? col[col.length - 1] : null;
      if (canPlaceOnTableau(wasteCard, target)) return true;
    }
    for (const f of g.foundations) {
      if (canPlaceOnFoundation(wasteCard, f)) return true;
    }
  }

  for (let ci = 0; ci < g.tableau.length; ci++) {
    const col = g.tableau[ci];
    for (let cardIdx = 0; cardIdx < col.length; cardIdx++) {
      const card = col[cardIdx];
      if (!card.faceUp) continue;
      if (cardIdx === col.length - 1) {
        for (const f of g.foundations) {
          if (canPlaceOnFoundation(card, f)) return true;
        }
      }
      for (let ti = 0; ti < g.tableau.length; ti++) {
        if (ti === ci) continue;
        const target = g.tableau[ti].length ? g.tableau[ti][g.tableau[ti].length - 1] : null;
        if (canPlaceOnTableau(card, target)) return true;
      }
    }
  }

  return false;
}

// Find one valid move for the hint system
// Returns { type, from, to, card } or null
function findHint(g) {
  // 1. Check if any tableau top card can go to a foundation
  for (let ci = 0; ci < g.tableau.length; ci++) {
    const col = g.tableau[ci];
    if (!col.length) continue;
    const card = col[col.length - 1];
    if (!card.faceUp) continue;
    for (let fi = 0; fi < g.foundations.length; fi++) {
      if (canPlaceOnFoundation(card, g.foundations[fi])) {
        return { type: "toFoundation", fromCol: ci, toFoundation: fi, card };
      }
    }
  }

  // 2. Check if waste top can go to a foundation
  const wasteCard = g.waste.length ? g.waste[g.waste.length - 1] : null;
  if (wasteCard) {
    for (let fi = 0; fi < g.foundations.length; fi++) {
      if (canPlaceOnFoundation(wasteCard, g.foundations[fi])) {
        return { type: "wasteToFoundation", toFoundation: fi, card: wasteCard };
      }
    }
  }

  // 3. Check if waste top can go to a tableau column
  if (wasteCard) {
    for (let ci = 0; ci < g.tableau.length; ci++) {
      const target = g.tableau[ci].length ? g.tableau[ci][g.tableau[ci].length - 1] : null;
      if (canPlaceOnTableau(wasteCard, target)) {
        return { type: "wasteToTableau", toCol: ci, card: wasteCard };
      }
    }
  }

  // 4. Check tableau-to-tableau moves
  for (let ci = 0; ci < g.tableau.length; ci++) {
    const col = g.tableau[ci];
    for (let cardIdx = 0; cardIdx < col.length; cardIdx++) {
      const card = col[cardIdx];
      if (!card.faceUp) continue;
      for (let ti = 0; ti < g.tableau.length; ti++) {
        if (ti === ci) continue;
        const target = g.tableau[ti].length ? g.tableau[ti][g.tableau[ti].length - 1] : null;
        if (canPlaceOnTableau(card, target)) {
          return { type: "tableauToTableau", fromCol: ci, fromIdx: cardIdx, toCol: ti, card };
        }
      }
    }
  }

  return null;
}

function applyTableauMove(g, selected, targetColIdx) {
  const clone = cloneGame(g);
  let cards;
  if (selected.source === "waste") {
    cards = [clone.waste.pop()];
  } else {
    cards = clone.tableau[selected.colIdx].splice(selected.cardIdx);
    const srcCol = clone.tableau[selected.colIdx];
    if (srcCol.length) srcCol[srcCol.length - 1].faceUp = true;
  }
  clone.tableau[targetColIdx].push(...cards);
  return clone;
}

export default function Solitaire() {
  useGameTimer();
  const { user } = useAuth();
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();
  const { uiClickSound, matchSound, winSound } = useGameAudio();
  const { fireworks, emojiRain, spark } = useConfetti();
  const { reportWin, reportLoss } = useGameActivity();
  const gameStartRef = useRef(Date.now());
  const statsRecordedRef = useRef(false);
  const stuckTimeoutRef = useRef(null);

  const [game, setGame] = useState(initGame());
  const [selected, setSelected] = useState(null);
  const [won, setWon] = useState(false);
  const [drawKey, setDrawKey] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [cardBackKey, setCardBackKey] = useState("classic_blue");
  const [winTime, setWinTime] = useState(null);
  const [winStars, setWinStars] = useState(0);
  const [coinsWon, setCoinsWon] = useState(0);
  const [moves, setMoves] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [autoCompleting, setAutoCompleting] = useState(false);

  // Hint state
  const [hintHighlight, setHintHighlight] = useState(null);
  const hintTimerRef = useRef(null);

  // Undo state (last 5 moves)
  const [undoStack, setUndoStack] = useState([]);
  const MAX_UNDO = 5;

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ user_email: user.email }).then(profiles => {
      if (profiles[0]?.card_back_design) setCardBackKey(profiles[0].card_back_design);
    });
  }, [user]);

  // Save a snapshot for undo before making a move
  function pushUndo(currentGame, currentMoves) {
    setUndoStack(prev => {
      const next = [...prev, { game: cloneGame(currentGame), moves: currentMoves }];
      if (next.length > MAX_UNDO) next.shift();
      return next;
    });
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    tapVibrate();
    uiClickSound();
    const prev = undoStack[undoStack.length - 1];
    setGame(prev.game);
    setMoves(prev.moves);
    setSelected(null);
    setHintHighlight(null);
    setStuck(false);
    setUndoStack(stack => stack.slice(0, -1));
  }

  // Clear hint on state change
  useEffect(() => {
    setHintHighlight(null);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, [game, selected]);

  function handleHint() {
    const hint = findHint(game);
    if (!hint) return;
    tapVibrate();
    setHintHighlight(hint);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintHighlight(null), 2500);
  }

  // Record stats when game ends
  async function recordStats(didWin) {
    if (!user?.email || statsRecordedRef.current) return;
    statsRecordedRef.current = true;
    if (didWin) reportWin("Solitaire"); else reportLoss();
    const elapsed = Math.round((Date.now() - gameStartRef.current) / 1000);
    const rows = await base44.entities.SolitaireStats.filter({ user_email: user.email });
    const s = rows[0];
    if (s) {
      const played = (s.games_played || 0) + 1;
      const gamesWon = (s.games_won || 0) + (didWin ? 1 : 0);
      const best = didWin ? Math.min(s.best_time_seconds || Infinity, elapsed) : (s.best_time_seconds || null);
      const streak = didWin ? (s.current_streak || 0) + 1 : 0;
      const bestStreak = Math.max(s.best_streak || 0, streak);
      await base44.entities.SolitaireStats.update(s.id, {
        games_played: played,
        games_won: gamesWon,
        best_time_seconds: best,
        current_streak: streak,
        best_streak: bestStreak,
      });
    } else {
      await base44.entities.SolitaireStats.create({
        user_email: user.email,
        games_played: 1,
        games_won: didWin ? 1 : 0,
        best_time_seconds: didWin ? elapsed : null,
        current_streak: didWin ? 1 : 0,
        best_streak: didWin ? 1 : 0,
      });
    }
    // Also record to GameScore for Hall of Fame / XP / achievements
    if (didWin) {
      setWinTime(elapsed);

      // Star rating: faster win = more stars
      const stars = computeStars(elapsed, 180, 360, true);
      setWinStars(stars);

      const reward = coinsForStars(stars, 25);
      const awarded = await awardCoinsForStars(stars, 25);
      setCoinsWon(awarded);

      await saveGameScore({
        game_name: "Solitaire",
        score: moves,
        duration_seconds: elapsed,
        completed: true,
      });
    }
  }

  // Clear any stuck timeout
  function clearStuckTimeout() {
    if (stuckTimeoutRef.current) {
      clearTimeout(stuckTimeoutRef.current);
      stuckTimeoutRef.current = null;
    }
  }

  function scheduleStuckCheck(g) {
    clearStuckTimeout();
    stuckTimeoutRef.current = setTimeout(() => {
      if (!hasAnyMoves(g)) {
        setStuck(true);
        recordStats(false);
      }
    }, 300);
  }

  // Auto-complete: repeatedly move cards to foundations
  function runAutoComplete(g) {
    setAutoCompleting(true);
    let current = cloneGame(g);
    let step = 0;

    function doStep() {
      let moved = false;
      for (let ci = 0; ci < current.tableau.length; ci++) {
        const col = current.tableau[ci];
        if (!col.length) continue;
        const card = col[col.length - 1];
        for (let fi = 0; fi < current.foundations.length; fi++) {
          if (canPlaceOnFoundation(card, current.foundations[fi])) {
            current.tableau[ci].pop();
            current.foundations[fi].push(card);
            moved = true;
            step++;
            spark();
            setGame(cloneGame(current));
            setMoves(m => m + 1);
            break;
          }
        }
        if (moved) break;
      }

      if (moved && !checkWin(current)) {
        setTimeout(doStep, 150);
      } else {
        setAutoCompleting(false);
        if (checkWin(current)) {
          setWon(true);
          winVibrate();
          winSound();
          fireworks();
          emojiRain(["♠", "♥", "♦", "♣"]);
          recordStats(true);
        }
      }
    }

    setTimeout(doStep, 200);
  }

  function handleWin(g) {
    setTimeout(() => {
      setWon(true);
      winVibrate();
      winSound();
      fireworks();
      emojiRain(["♠", "♥", "♦", "♣"]);
      recordStats(true);
    }, 0);
  }

  // Check for foundation completion spark (per suit)
  function checkFoundationComplete(g) {
    for (const f of g.foundations) {
      if (f.length === 13) spark();
    }
  }

  // Auto-send card to foundation on double-tap
  const lastTapRef = useRef({ time: 0, cardKey: "" });

  function tryAutoFoundation(card, source, colIdx) {
    if (!card) return false;
    for (let fi = 0; fi < game.foundations.length; fi++) {
      if (canPlaceOnFoundation(card, game.foundations[fi])) {
        successVibrate();
        matchSound();
        pushUndo(game, moves);
        setGame(prev => {
          const g = cloneGame(prev);
          if (source === "waste") {
            g.waste.pop();
          } else {
            g.tableau[colIdx].pop();
            const srcCol = g.tableau[colIdx];
            if (srcCol.length) srcCol[srcCol.length - 1].faceUp = true;
          }
          g.foundations[fi].push(card);
          checkFoundationComplete(g);
          if (checkWin(g)) handleWin(g);
          else if (canAutoComplete(g)) setTimeout(() => runAutoComplete(g), 400);
          return g;
        });
        setMoves(m => m + 1);
        setSelected(null);
        return true;
      }
    }
    return false;
  }

  function handleDoubleTap(card, source, colIdx) {
    const cardKey = `${card.val}-${card.suit}`;
    const now = Date.now();
    if (lastTapRef.current.cardKey === cardKey && now - lastTapRef.current.time < 400) {
      // Double-tap detected
      lastTapRef.current = { time: 0, cardKey: "" };
      return tryAutoFoundation(card, source, colIdx);
    }
    lastTapRef.current = { time: now, cardKey };
    return false;
  }

  function drawCard() {
    tapVibrate();
    uiClickSound();
    clearStuckTimeout();
    setDrawKey(k => k + 1);
    pushUndo(game, moves);
    setGame(prev => {
      const g = cloneGame(prev);
      if (!g.stock.length) {
        g.stock = [...g.waste].reverse().map(c => ({ ...c, faceUp: false }));
        g.waste = [];
      } else {
        const card = g.stock.pop();
        card.faceUp = true;
        g.waste.push(card);
      }
      scheduleStuckCheck(g);
      return g;
    });
    setMoves(m => m + 1);
    setSelected(null);
  }

  function handleTableauClick(colIdx, cardIdx) {
    if (autoCompleting) return;
    const card = game.tableau[colIdx][cardIdx];
    if (!card.faceUp) return;

    // Double-tap: auto-send top card to foundation
    if (cardIdx === game.tableau[colIdx].length - 1) {
      if (handleDoubleTap(card, "tableau", colIdx)) return;
    }

    if (selected) {
      const col = game.tableau[colIdx];
      const targetCard = col.length ? col[col.length - 1] : null;
      const movingCard = selected.source === "waste"
        ? game.waste[game.waste.length - 1]
        : game.tableau[selected.colIdx][selected.cardIdx];

      if (canPlaceOnTableau(movingCard, targetCard)) {
        successVibrate();
        matchSound();
        clearStuckTimeout();
        pushUndo(game, moves);
        setGame(prev => {
          const next = applyTableauMove(prev, selected, colIdx);
          if (checkWin(next)) handleWin(next);
          else if (canAutoComplete(next)) setTimeout(() => runAutoComplete(next), 400);
          return next;
        });
        setMoves(m => m + 1);
        setSelected(null);
        return;
      }
      setSelected(null);
    }

    if (cardIdx === game.tableau[colIdx].length - 1 || card.faceUp) {
      setSelected({ source: "tableau", colIdx, cardIdx });
    }
  }

  function handleEmptyColumnClick(colIdx) {
    if (autoCompleting || !selected) return;
    const movingCard = selected.source === "waste"
      ? game.waste[game.waste.length - 1]
      : game.tableau[selected.colIdx]?.[selected.cardIdx];
    if (!movingCard || !canPlaceOnTableau(movingCard, null)) return;

    successVibrate();
    clearStuckTimeout();
    pushUndo(game, moves);
    setGame(prev => {
      const next = applyTableauMove(prev, selected, colIdx);
      if (checkWin(next)) handleWin(next);
      return next;
    });
    setMoves(m => m + 1);
    setSelected(null);
  }

  function handleWasteClick() {
    if (autoCompleting) return;
    if (!game.waste.length) return;
    const wasteCard = game.waste[game.waste.length - 1];

    // Double-tap: auto-send to foundation
    if (handleDoubleTap(wasteCard, "waste", null)) return;

    if (selected?.source === "waste") { setSelected(null); return; }
    setSelected({ source: "waste" });
  }

  function handleFoundationClick(fIdx) {
    if (autoCompleting || !selected) return;
    const movingCard = selected.source === "waste"
      ? game.waste[game.waste.length - 1]
      : game.tableau[selected.colIdx]?.[game.tableau[selected.colIdx].length - 1];
    if (!movingCard) return;
    if (selected.source === "tableau" && selected.cardIdx !== game.tableau[selected.colIdx].length - 1) return;

    if (canPlaceOnFoundation(movingCard, game.foundations[fIdx])) {
      successVibrate();
      matchSound();
      clearStuckTimeout();
      pushUndo(game, moves);
      setGame(prev => {
        const g = cloneGame(prev);
        let card;
        if (selected.source === "waste") {
          card = g.waste.pop();
        } else {
          card = g.tableau[selected.colIdx].pop();
          const srcCol = g.tableau[selected.colIdx];
          if (srcCol.length) srcCol[srcCol.length - 1].faceUp = true;
        }
        g.foundations[fIdx].push(card);
        checkFoundationComplete(g);
        if (checkWin(g)) handleWin(g);
        else if (canAutoComplete(g)) setTimeout(() => runAutoComplete(g), 400);
        return g;
      });
      setMoves(m => m + 1);
      setSelected(null);
    }
  }

  function doReset() {
    tapVibrate();
    uiClickSound();
    clearStuckTimeout();
    setGame(initGame());
    setSelected(null);
    setWon(false);
    setStuck(false);
    setDrawKey(0);
    setWinTime(null);
    setMoves(0);
    setUndoStack([]);
    setHintHighlight(null);
    setAutoCompleting(false);
    setShowResetConfirm(false);
    gameStartRef.current = Date.now();
    statsRecordedRef.current = false;
  }

  function handleResetClick() {
    if (moves > 0 && !won && !stuck) {
      setShowResetConfirm(true);
    } else {
      doReset();
    }
  }

  // Hint highlight helpers
  function isHintSource(source, colIdx, cardIdx) {
    if (!hintHighlight) return false;
    const h = hintHighlight;
    if (h.type === "wasteToFoundation" || h.type === "wasteToTableau") {
      return source === "waste";
    }
    if (h.type === "toFoundation") {
      return source === "tableau" && colIdx === h.fromCol && cardIdx !== undefined;
    }
    if (h.type === "tableauToTableau") {
      return source === "tableau" && colIdx === h.fromCol && cardIdx >= h.fromIdx;
    }
    return false;
  }

  function isHintTarget(source, colIdx, fIdx) {
    if (!hintHighlight) return false;
    const h = hintHighlight;
    if (h.type === "toFoundation" || h.type === "wasteToFoundation") {
      return source === "foundation" && fIdx === h.toFoundation;
    }
    if (h.type === "wasteToTableau" || h.type === "tableauToTableau") {
      return source === "tableau" && colIdx === h.toCol;
    }
    return false;
  }

  if (won) {
    const winMinutes = winTime != null ? Math.floor(winTime / 60) : null;
    const winSecs = winTime != null ? (winTime % 60).toString().padStart(2, "0") : null;
    return (
      <GameVictoryScreen
        emoji="♠️"
        title="You Won!"
        accent="from-emerald-500 to-green-600"
        stars={winStars}
        coins={coinsWon}
        stats={[
          ...(winTime != null ? [{ label: "Time", value: `${winMinutes}:${winSecs}` }] : []),
          { label: "Moves", value: moves },
        ]}
        primaryLabel="🔄 New Game"
        onPrimary={doReset}
      />
    );
  }

  const wasteTop = game.waste.length ? game.waste[game.waste.length - 1] : null;
  const SUIT_ORDER = ["♠", "♥", "♦", "♣"];

  return (
    <div className="min-h-screen bg-green-900 px-1 py-3 pb-[calc(env(safe-area-inset-bottom)+4rem)] select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <GameBackButton className="text-yellow-300" />
        <div className="text-xl sm:text-2xl font-black text-yellow-300">♠ Solitaire</div>
        <div className="flex gap-1.5">
          <GameInstructions
            title="Solitaire"
            emoji="♠️"
            steps={[
              "Goal: Move all cards to the four foundation piles (top right), sorted by suit from Ace to King.",
              "Tap the deck (top left) to draw a card to the waste pile.",
              "Tap the waste card to select it, then tap a column or foundation to place it.",
              "Double-tap a card to auto-send it to the foundation if possible.",
              "In columns, stack cards in descending order and alternating colors (red on black).",
              "Only Kings can be placed on empty column spaces.",
              "Use the ↩ Undo button to take back a move if you make a mistake.",
              "Use the 💡 Hint button if you're stuck — it highlights a valid move!",
              "Keep going until all cards are on the foundations — you win!"
            ]}
          />
          <SolitaireHintButton onHint={handleHint} disabled={autoCompleting || won || stuck} />
          {/* Undo button */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0 || autoCompleting}
            className={`px-3 rounded-xl font-bold text-sm flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-all ${
              undoStack.length > 0 && !autoCompleting
                ? "bg-green-700 text-white"
                : "bg-green-900/50 text-green-700 opacity-60"
            }`}
            aria-label="Undo last move"
          >
            ↩
          </button>
          <button onClick={handleResetClick} aria-label="Reset game" className="bg-green-700 text-white rounded-xl font-bold text-sm flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-transform">🔄</button>
        </div>
      </div>

      {/* Status bar */}
      <SolitaireStatusBar moves={moves} gameStartTime={gameStartRef.current} gameOver={won || stuck} />

      {/* Auto-complete banner */}
      {autoCompleting && (
        <div className="text-center text-lg font-black text-yellow-300 mb-2 animate-pulse">
          ✨ Auto-completing...
        </div>
      )}

      {/* Top row: stock, waste, foundations */}
      <div className="flex gap-1 sm:gap-2 justify-center mb-3 sm:mb-4 px-1">
        {/* Stock */}
        <div className="w-[13%] max-w-16 relative">
          <StackedCardDeck
            stockCount={game.stock.length}
            onDraw={drawCard}
            drawKey={drawKey}
            cardBackKey={cardBackKey}
          />
        </div>
        {/* Waste */}
        <div
          className={`w-[13%] max-w-16 ${isHintSource("waste") ? "ring-2 ring-cyan-400 rounded-xl animate-pulse" : ""}`}
          onClick={handleWasteClick}
        >
          <AnimatePresence mode="popLayout">
            {wasteTop ? (
              <motion.div
                key={`waste-${wasteTop.val}-${wasteTop.suit}`}
                initial={{ x: -30, opacity: 0, rotateY: -90 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <SolitaireCard card={wasteTop} selected={selected?.source === "waste"} cardBackKey={cardBackKey} />
              </motion.div>
            ) : (
              <div className="w-full aspect-[5/7] border-2 border-dashed border-green-500 rounded-lg sm:rounded-xl" />
            )}
          </AnimatePresence>
        </div>
        <div className="flex-1" />
        {/* Foundations */}
        {game.foundations.map((f, i) => {
          const top = f.length ? f[f.length - 1] : null;
          const isTarget = isHintTarget("foundation", null, i);
          return (
            <motion.div
              key={i}
              onClick={() => handleFoundationClick(i)}
              whileTap={{ scale: 0.92 }}
              className={`w-[13%] max-w-16 aspect-[5/7] border-2 border-dashed rounded-lg sm:rounded-xl flex items-center justify-center cursor-pointer overflow-hidden
                ${isTarget ? "border-cyan-400 ring-2 ring-cyan-400 animate-pulse" : "border-green-500"}
                ${f.length === 13 ? "bg-green-800/40" : ""}
              `}
            >
              <AnimatePresence mode="popLayout">
                {top ? (
                  <motion.div
                    key={`f${i}-${top.val}-${top.suit}`}
                    initial={{ y: -40, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                    className="w-full h-full"
                  >
                    <SolitaireCard card={top} cardBackKey={cardBackKey} />
                  </motion.div>
                ) : (
                  <span className="text-lg sm:text-2xl text-green-600">{SUIT_ORDER[i]}</span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Tableau */}
      <div className="flex gap-0.5 sm:gap-1 justify-center px-1">
        {game.tableau.map((col, ci) => {
          const colIsHintTarget = isHintTarget("tableau", ci, null);
          return (
            <div key={ci} className="flex flex-col flex-1" style={{ maxWidth: "68px" }}>
              {col.length === 0 ? (
                <motion.div
                  onClick={() => handleEmptyColumnClick(ci)}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full aspect-[5/7] border-2 border-dashed rounded-lg sm:rounded-xl cursor-pointer ${
                    colIsHintTarget ? "border-cyan-400 ring-2 ring-cyan-400 animate-pulse" : "border-green-500"
                  }`}
                />
              ) : (
                col.map((card, ci2) => {
                  const isSource = isHintSource("tableau", ci, ci2);
                  return (
                    <motion.div
                      key={`${ci}-${ci2}-${card.val}-${card.suit}`}
                      initial={false}
                      animate={{ y: 0, opacity: 1 }}
                      style={{ marginTop: ci2 > 0 ? "-58%" : 0, zIndex: ci2 }}
                      className={`relative ${isSource ? "ring-2 ring-cyan-400 rounded-lg animate-pulse z-20" : ""}`}
                    >
                      <SolitaireCard
                        card={card}
                        selected={selected?.source === "tableau" && selected.colIdx === ci && selected.cardIdx === ci2}
                        onClick={() => handleTableauClick(ci, ci2)}
                        cardBackKey={cardBackKey}
                      />
                    </motion.div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* No Moves Alert */}
      <AnimatePresence>
        {stuck && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setStuck(false)}
          >
            <motion.div
              className="bg-card border-2 border-primary rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-6xl mb-3">😔</div>
              <h2 className="text-2xl font-black text-foreground mb-2">No Moves Left!</h2>
              <p className="text-muted-foreground text-lg mb-6">Don't worry — it happens! Try a new game?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStuck(false)}
                  className="flex-1 bg-secondary text-foreground text-lg font-bold py-3 rounded-2xl"
                >
                  Keep Looking
                </button>
                <button
                  onClick={doReset}
                  className="flex-1 bg-primary text-primary-foreground text-lg font-black py-3 rounded-2xl"
                >
                  🔄 New Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <SolitaireResetDialog onConfirm={doReset} onCancel={() => setShowResetConfirm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}