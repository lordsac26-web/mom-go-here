import { useState } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import GameInstructions from "../../components/GameInstructions";

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

export default function Solitaire() {
  useGameTimer();
  const [game, setGame] = useState(initGame());
  const [selected, setSelected] = useState(null); // { source: 'tableau'|'waste', colIdx, cardIdx }
  const [won, setWon] = useState(false);

  function drawCard() {
    setGame(prev => {
      const g = JSON.parse(JSON.stringify(prev));
      if (!g.stock.length) {
        g.stock = g.waste.reverse().map(c => ({ ...c, faceUp: false }));
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

  function checkWin(g) {
    return g.foundations.every(f => f.length === 13);
  }

  function handleTableauClick(colIdx, cardIdx) {
    const card = game.tableau[colIdx][cardIdx];
    if (!card.faceUp) return;

    if (selected) {
      // Try to move
      const target = game.tableau[colIdx][game.tableau[colIdx].length - 1];
      const targetIsEmpty = game.tableau[colIdx].length === 0;
      const movingCard = selected.source === 'waste'
        ? game.waste[game.waste.length - 1]
        : game.tableau[selected.colIdx][selected.cardIdx];

      if (canPlaceOnTableau(movingCard, targetIsEmpty ? null : target)) {
        setGame(prev => {
          const g = JSON.parse(JSON.stringify(prev));
          let cards;
          if (selected.source === 'waste') {
            cards = [g.waste.pop()];
          } else {
            cards = g.tableau[selected.colIdx].splice(selected.cardIdx);
            if (g.tableau[selected.colIdx].length) g.tableau[selected.colIdx][g.tableau[selected.colIdx].length - 1].faceUp = true;
          }
          g.tableau[colIdx].push(...cards);
          if (checkWin(g)) setWon(true);
          return g;
        });
        setSelected(null);
        return;
      }
      setSelected(null);
    }

    if (cardIdx === game.tableau[colIdx].length - 1 || card.faceUp) {
      setSelected({ source: 'tableau', colIdx, cardIdx });
    }
  }

  function handleWasteClick() {
    if (!game.waste.length) return;
    if (selected?.source === 'waste') { setSelected(null); return; }
    setSelected({ source: 'waste' });
  }

  function handleFoundationClick(fIdx) {
    if (!selected) return;
    const movingCard = selected.source === 'waste'
      ? game.waste[game.waste.length - 1]
      : game.tableau[selected.colIdx][game.tableau[selected.colIdx].length - 1];
    if (!movingCard) return;
    if (selected.source === 'tableau' && selected.cardIdx !== game.tableau[selected.colIdx].length - 1) return;

    if (canPlaceOnFoundation(movingCard, game.foundations[fIdx])) {
      setGame(prev => {
        const g = JSON.parse(JSON.stringify(prev));
        let card;
        if (selected.source === 'waste') {
          card = g.waste.pop();
        } else {
          card = g.tableau[selected.colIdx].pop();
          if (g.tableau[selected.colIdx].length) g.tableau[selected.colIdx][g.tableau[selected.colIdx].length - 1].faceUp = true;
        }
        g.foundations[fIdx].push(card);
        if (checkWin(g)) setWon(true);
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
          {wasteTop ? <CardView card={wasteTop} selected={selected?.source === 'waste'} /> :
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
              <div onClick={() => {
                if (selected && canPlaceOnTableau(
                  selected.source === 'waste' ? game.waste[game.waste.length - 1] : game.tableau[selected.colIdx][selected.cardIdx], null
                )) {
                  setGame(prev => {
                    const g = JSON.parse(JSON.stringify(prev));
                    let cards;
                    if (selected.source === 'waste') cards = [g.waste.pop()];
                    else { cards = g.tableau[selected.colIdx].splice(selected.cardIdx); if (g.tableau[selected.colIdx].length) g.tableau[selected.colIdx][g.tableau[selected.colIdx].length - 1].faceUp = true; }
                    g.tableau[ci].push(...cards);
                    return g;
                  });
                  setSelected(null);
                }
              }}
                className="w-full aspect-[5/7] border-2 border-dashed border-green-500 rounded-lg sm:rounded-xl" />
            ) : (
              col.map((card, ci2) => (
                <div key={ci2} style={{ marginTop: ci2 > 0 ? "-65%" : 0, zIndex: ci2 }} className="relative">
                  <CardView card={card}
                    selected={selected?.source === 'tableau' && selected.colIdx === ci && selected.cardIdx === ci2}
                    onClick={() => handleTableauClick(ci, ci2)} />
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}