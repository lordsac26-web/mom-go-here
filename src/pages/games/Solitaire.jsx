import { useState, useCallback, useEffect, useRef } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import GameBackButton from "../../components/GameBackButton";
import { motion, AnimatePresence } from "framer-motion";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import SolitaireCard from "../../components/solitaire/SolitaireCard";
import StackedCardDeck from "../../components/solitaire/StackedCardDeck";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import useConfetti from "../../hooks/useConfetti";
import { useGameActivity } from "../../hooks/useGameActivity";

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

// FIX (perf + bug): replaced JSON.parse/JSON.stringify deep-clone with a
// lightweight structural clone that only copies what we mutate. This avoids
// cloning the entire game tree on every state update and eliminates the risk
// of silently dropping non-serializable values.
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

function hasAnyMoves(g) {
  // Can draw from stock?
  if (g.stock.length > 0) return true;

  // Can recycle waste to stock?
  if (g.waste.length > 0 && g.stock.length === 0) return true;

  // Check waste top card
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

  // Check tableau face-up cards
  for (let ci = 0; ci < g.tableau.length; ci++) {
    const col = g.tableau[ci];
    for (let cardIdx = 0; cardIdx < col.length; cardIdx++) {
      const card = col[cardIdx];
      if (!card.faceUp) continue;

      // Can move to foundation? (only top card)
      if (cardIdx === col.length - 1) {
        for (const f of g.foundations) {
          if (canPlaceOnFoundation(card, f)) return true;
        }
      }

      // Can move stack to another column?
      for (let ti = 0; ti < g.tableau.length; ti++) {
        if (ti === ci) continue;
        const target = g.tableau[ti].length ? g.tableau[ti][g.tableau[ti].length - 1] : null;
        if (canPlaceOnTableau(card, target)) return true;
      }
    }
  }

  return false;
}

// CardView replaced by SolitaireCard component with 3D flip

// FIX (perf + bug): extracted the move-card-to-tableau logic into a shared
// helper so the empty-column handler and the normal column handler stay in sync.
// Previously the empty-column case duplicated the logic inline, meaning any fix
// to one path wouldn't apply to the other.
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
  const { fireworks, emojiRain } = useConfetti();
  const { reportWin, reportLoss } = useGameActivity();
  const gameStartRef = useRef(Date.now());
  const statsRecordedRef = useRef(false);
  const [game, setGame] = useState(initGame());
  const [selected, setSelected] = useState(null);
  const [won, setWon] = useState(false);
  const [drawKey, setDrawKey] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [cardBackKey, setCardBackKey] = useState("classic_blue");
  const [winTime, setWinTime] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ user_email: user.email }).then(profiles => {
      if (profiles[0]?.card_back_design) setCardBackKey(profiles[0].card_back_design);
    });
  }, [user]);

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
      const won = (s.games_won || 0) + (didWin ? 1 : 0);
      const best = didWin ? Math.min(s.best_time_seconds || Infinity, elapsed) : (s.best_time_seconds || null);
      const streak = didWin ? (s.current_streak || 0) + 1 : 0;
      const bestStreak = Math.max(s.best_streak || 0, streak);
      await base44.entities.SolitaireStats.update(s.id, {
        games_played: played,
        games_won: won,
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
    if (didWin) setWinTime(elapsed);
  }

  function drawCard() {
    tapVibrate();
    uiClickSound();
    setDrawKey(k => k + 1);
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
      if (!hasAnyMoves(g)) setTimeout(() => { setStuck(true); recordStats(false); }, 300);
      return g;
    });
    setSelected(null);
  }

  function handleTableauClick(colIdx, cardIdx) {
    const card = game.tableau[colIdx][cardIdx];
    if (!card.faceUp) return;

    if (selected) {
      const col = game.tableau[colIdx];
      const targetCard = col.length ? col[col.length - 1] : null;
      const movingCard = selected.source === "waste"
        ? game.waste[game.waste.length - 1]
        : game.tableau[selected.colIdx][selected.cardIdx];

      if (canPlaceOnTableau(movingCard, targetCard)) {
        successVibrate();
        matchSound();
        setGame(prev => {
          const next = applyTableauMove(prev, selected, colIdx);
          if (checkWin(next)) setTimeout(() => { setWon(true); winVibrate(); winSound(); fireworks(); emojiRain(["♠", "♥", "♦", "♣"]); recordStats(true); }, 0);
          return next;
        });
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
    if (!selected) return;
    const movingCard = selected.source === "waste"
      ? game.waste[game.waste.length - 1]
      : game.tableau[selected.colIdx]?.[selected.cardIdx];
    if (!movingCard || !canPlaceOnTableau(movingCard, null)) return;

    successVibrate();
    // FIX (bug): use the shared helper instead of duplicating move logic inline.
    // This also fixes the stale-closure issue: the previous inline handler
    // captured `selected` from the outer render scope directly inside setGame,
    // which could bake in a stale value if selected changed between renders.
    setGame(prev => {
      const next = applyTableauMove(prev, selected, colIdx);
      if (checkWin(next)) setTimeout(() => { setWon(true); fireworks(); recordStats(true); }, 0);
      return next;
    });
    setSelected(null);
  }

  function handleWasteClick() {
    if (!game.waste.length) return;
    if (selected?.source === "waste") { setSelected(null); return; }
    setSelected({ source: "waste" });
  }

  function handleFoundationClick(fIdx) {
    if (!selected) return;
    const movingCard = selected.source === "waste"
      ? game.waste[game.waste.length - 1]
      : game.tableau[selected.colIdx]?.[game.tableau[selected.colIdx].length - 1];
    if (!movingCard) return;
    if (selected.source === "tableau" && selected.cardIdx !== game.tableau[selected.colIdx].length - 1) return;

    if (canPlaceOnFoundation(movingCard, game.foundations[fIdx])) {
      successVibrate();
      matchSound();
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
        if (checkWin(g)) { setTimeout(() => { setWon(true); winVibrate(); winSound(); fireworks(); emojiRain(["♠", "♥", "♦", "♣"]); recordStats(true); }, 0); }
        return g;
      });
      setSelected(null);
    }
  }

  function resetGame() {
    tapVibrate();
    uiClickSound();
    setGame(initGame());
    setSelected(null);
    setWon(false);
    setStuck(false);
    setDrawKey(0);
    setWinTime(null);
    gameStartRef.current = Date.now();
    statsRecordedRef.current = false;
  }

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">You Won!</h1>
      {winTime != null && (
        <p className="text-2xl font-bold text-muted-foreground mb-4">
          ⏱️ Time: {Math.floor(winTime / 60)}:{(winTime % 60).toString().padStart(2, "0")}
        </p>
      )}
      <button onClick={resetGame}
        className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 New Game
      </button>
      <GameBackButton />
    </div>
  );

  const wasteTop = game.waste.length ? game.waste[game.waste.length - 1] : null;
  const SUIT_ORDER = ["♠", "♥", "♦", "♣"];

  return (
    <div className="min-h-screen bg-green-900 px-1 py-3 pb-24">
      <div className="flex items-center justify-between px-2 mb-3">
        <GameBackButton className="text-yellow-300" />
        <div className="text-2xl font-black text-yellow-300">♠ Solitaire</div>
        <div className="flex gap-2">
          <GameInstructions
            title="Solitaire"
            emoji="♠️"
            steps={[
              "Goal: Move all cards to the four foundation piles (top right), sorted by suit from Ace to King.",
              "Tap the deck (top left) to draw a card to the waste pile.",
              "Tap the waste card to select it, then tap a column or foundation to place it.",
              "In columns, stack cards in descending order and alternating colors (red on black).",
              "Only Kings can be placed on empty column spaces.",
              "Tap a face-up card in a column to select it and its stack, then tap another column to move.",
              "Keep going until all cards are on the foundations — you win!"
            ]}
          />
          <button onClick={resetGame} className="bg-green-700 text-white px-3 py-2 rounded-xl font-bold">🔄</button>
        </div>
      </div>

      {/* Top row: stock, waste, foundations */}
      <div className="flex gap-1 sm:gap-2 justify-center mb-3 sm:mb-4 px-1">
        {/* Stock — Stacked Card Deck */}
        <div className="w-[12%] max-w-14 relative">
          <StackedCardDeck
            stockCount={game.stock.length}
            onDraw={drawCard}
            drawKey={drawKey}
            cardBackKey={cardBackKey}
          />
        </div>
        {/* Waste */}
        <div className="w-[12%] max-w-14" onClick={handleWasteClick}>
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
          return (
            <motion.div
              key={i}
              onClick={() => handleFoundationClick(i)}
              whileTap={{ scale: 0.92 }}
              className="w-[12%] max-w-14 aspect-[5/7] border-2 border-dashed border-green-500 rounded-lg sm:rounded-xl flex items-center justify-center cursor-pointer overflow-hidden"
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
        {game.tableau.map((col, ci) => (
          <div key={ci} className="flex flex-col flex-1" style={{ maxWidth: "60px" }}>
            {col.length === 0 ? (
              <motion.div
                onClick={() => handleEmptyColumnClick(ci)}
                whileTap={{ scale: 0.95 }}
                className="w-full aspect-[5/7] border-2 border-dashed border-green-500 rounded-lg sm:rounded-xl cursor-pointer"
              />
            ) : (
              col.map((card, ci2) => (
                <motion.div
                  key={`${ci}-${ci2}-${card.val}-${card.suit}`}
                  initial={false}
                  animate={{ y: 0, opacity: 1 }}
                  style={{ marginTop: ci2 > 0 ? "-65%" : 0, zIndex: ci2 }}
                  className="relative"
                >
                  <SolitaireCard
                    card={card}
                    selected={selected?.source === "tableau" && selected.colIdx === ci && selected.cardIdx === ci2}
                    onClick={() => handleTableauClick(ci, ci2)}
                    cardBackKey={cardBackKey}
                  />
                </motion.div>
              ))
            )}
          </div>
        ))}
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
              <p className="text-muted-foreground text-lg mb-6">There are no more available moves. Start a new game?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStuck(false)}
                  className="flex-1 bg-secondary text-foreground text-lg font-bold py-3 rounded-2xl"
                >
                  Keep Looking
                </button>
                <button
                  onClick={resetGame}
                  className="flex-1 bg-primary text-primary-foreground text-lg font-black py-3 rounded-2xl"
                >
                  🔄 New Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}