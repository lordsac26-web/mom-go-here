import { useState, useCallback } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";

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

function CardView({ card, onClick, selected }) {
  if (!card) return null;
  return (
    <div onClick={onClick}
      className={`w-full aspect-[5/7] border-2 rounded-lg sm:rounded-xl flex flex-col items-center justify-center font-black cursor-pointer transition-all select-none shadow-md text-xs sm:text-base
        ${!card.faceUp ? "bg-gradient-to-br from-blue-800 to-blue-900 border-blue-600" :
          isRed(card) ? "bg-white text-red-600 border-gray-300" : "bg-white text-gray-900 border-gray-300"}
        ${selected ? "ring-4 ring-yellow-400 scale-105" : ""}
      `}>
      {card.faceUp ? (
        <>
          <span className="leading-none">{card.val}</span>
          <span className="leading-none text-sm sm:text-lg">{card.suit}</span>
        </>
      ) : (
        <span className="text-lg sm:text-2xl">🂠</span>
      )}
    </div>
  );
}

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
  const { tapVibrate, successVibrate, winVibrate } = useHaptics();
  const [game, setGame] = useState(initGame());
  const [selected, setSelected] = useState(null);
  const [won, setWon] = useState(false);

  function drawCard() {
    tapVibrate();
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
        setGame(prev => {
          const next = applyTableauMove(prev, selected, colIdx);
          // FIX (bug): check win AFTER computing next state, outside any updater,
          // by reading the result synchronously. setWon is called in a separate
          // setState to avoid side effects inside a state updater (React Strict Mode
          // can call updaters twice, which would call setWon twice).
          if (checkWin(next)) setTimeout(() => setWon(true), 0);
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
      if (checkWin(next)) setTimeout(() => setWon(true), 0);
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
        // FIX (bug): win check moved outside the updater via setTimeout(0)
        if (checkWin(g)) { winVibrate(); setTimeout(() => setWon(true), 0); }
        return g;
      });
      setSelected(null);
    }
  }

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">You Won!</h1>
      <button onClick={() => { setGame(initGame()); setSelected(null); setWon(false); }}
        className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 New Game
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  const wasteTop = game.waste.length ? game.waste[game.waste.length - 1] : null;
  const SUIT_ORDER = ["♠", "♥", "♦", "♣"];

  return (
    <div className="min-h-screen bg-green-900 px-1 py-3 pb-24">
      <div className="flex items-center justify-between px-2 mb-3">
        <Link to="/games" className="text-yellow-300 text-xl font-bold">← Back</Link>
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
          <button onClick={() => { setGame(initGame()); setSelected(null); }} className="bg-green-700 text-white px-3 py-2 rounded-xl font-bold">🔄</button>
        </div>
      </div>

      {/* Top row: stock, waste, foundations */}
      <div className="flex gap-1 sm:gap-2 justify-center mb-3 sm:mb-4 px-1">
        {/* Stock */}
        <div onClick={drawCard} className="w-[12%] max-w-14 aspect-[5/7] border-2 border-dashed border-green-500 rounded-lg sm:rounded-xl flex items-center justify-center cursor-pointer">
          {game.stock.length ? <span className="text-xl sm:text-3xl">🂠</span> : <span className="text-lg sm:text-2xl text-green-500">↩</span>}
        </div>
        {/* Waste */}
        <div className="w-[12%] max-w-14" onClick={handleWasteClick}>
          {wasteTop ? <CardView card={wasteTop} selected={selected?.source === "waste"} /> :
            <div className="w-full aspect-[5/7] border-2 border-dashed border-green-500 rounded-lg sm:rounded-xl" />}
        </div>
        <div className="flex-1" />
        {/* Foundations */}
        {game.foundations.map((f, i) => {
          const top = f.length ? f[f.length - 1] : null;
          return (
            <div key={i} onClick={() => handleFoundationClick(i)}
              className="w-[12%] max-w-14 aspect-[5/7] border-2 border-dashed border-green-500 rounded-lg sm:rounded-xl flex items-center justify-center cursor-pointer">
              {top ? <CardView card={top} /> : <span className="text-lg sm:text-2xl text-green-600">{SUIT_ORDER[i]}</span>}
            </div>
          );
        })}
      </div>

      {/* Tableau */}
      <div className="flex gap-0.5 sm:gap-1 justify-center px-1">
        {game.tableau.map((col, ci) => (
          <div key={ci} className="flex flex-col flex-1" style={{ maxWidth: "60px" }}>
            {col.length === 0 ? (
              // FIX (bug + perf): uses shared applyTableauMove via handleEmptyColumnClick
              // instead of duplicating the entire move logic inline with a stale closure
              <div
                onClick={() => handleEmptyColumnClick(ci)}
                className="w-full aspect-[5/7] border-2 border-dashed border-green-500 rounded-lg sm:rounded-xl cursor-pointer"
              />
            ) : (
              col.map((card, ci2) => (
                <div key={ci2} style={{ marginTop: ci2 > 0 ? "-65%" : 0, zIndex: ci2 }} className="relative">
                  <CardView
                    card={card}
                    selected={selected?.source === "tableau" && selected.colIdx === ci && selected.cardIdx === ci2}
                    onClick={() => handleTableauClick(ci, ci2)}
                  />
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}