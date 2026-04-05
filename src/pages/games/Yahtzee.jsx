import { useState } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import GameInstructions from "../../components/GameInstructions";

const DIE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const CATEGORIES = [
  { key: "ones", label: "Ones", desc: "Sum of all 1s" },
  { key: "twos", label: "Twos", desc: "Sum of all 2s" },
  { key: "threes", label: "Threes", desc: "Sum of all 3s" },
  { key: "fours", label: "Fours", desc: "Sum of all 4s" },
  { key: "fives", label: "Fives", desc: "Sum of all 5s" },
  { key: "sixes", label: "Sixes", desc: "Sum of all 6s" },
  { key: "threeofakind", label: "3 of a Kind", desc: "Sum of all dice" },
  { key: "fourofakind", label: "4 of a Kind", desc: "Sum of all dice" },
  { key: "fullhouse", label: "Full House", desc: "25 points" },
  { key: "smallstraight", label: "Small Straight", desc: "30 points" },
  { key: "largestraight", label: "Large Straight", desc: "40 points" },
  { key: "yahtzee", label: "YAHTZEE!", desc: "50 points" },
  { key: "chance", label: "Chance", desc: "Sum of all dice" },
];

function rollDie() { return Math.floor(Math.random() * 6) + 1; }

function calcScore(key, dice) {
  const counts = Array(7).fill(0);
  dice.forEach(d => counts[d]++);
  const sum = dice.reduce((a, b) => a + b, 0);
  const vals = counts.slice(1);
  const sorted = [...new Set(dice)].sort();
  switch (key) {
    case "ones": return counts[1] * 1;
    case "twos": return counts[2] * 2;
    case "threes": return counts[3] * 3;
    case "fours": return counts[4] * 4;
    case "fives": return counts[5] * 5;
    case "sixes": return counts[6] * 6;
    case "threeofakind": return vals.some(c => c >= 3) ? sum : 0;
    case "fourofakind": return vals.some(c => c >= 4) ? sum : 0;
    case "fullhouse": return (vals.some(c => c === 3) && vals.some(c => c === 2)) ? 25 : 0;
    case "smallstraight": {
      const u = [...new Set(dice)].sort();
      const str = u.join("");
      return (str.includes("1234") || str.includes("2345") || str.includes("3456")) ? 30 : 0;
    }
    case "largestraight": {
      const u = [...new Set(dice)].sort().join("");
      return (u === "12345" || u === "23456") ? 40 : 0;
    }
    case "yahtzee": return vals.some(c => c === 5) ? 50 : 0;
    case "chance": return sum;
    default: return 0;
  }
}

export default function Yahtzee() {
  useGameTimer();
  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [scores, setScores] = useState({});
  const [turn, setTurn] = useState(1);

  const totalTurns = 13;
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const gameOver = Object.keys(scores).length === totalTurns;

  function roll() {
    if (rollsLeft === 0) return;
    setDice(prev => prev.map((d, i) => held[i] ? d : rollDie()));
    setRollsLeft(r => r - 1);
  }

  function toggleHold(i) {
    if (rollsLeft === 3) return;
    setHeld(h => h.map((v, idx) => idx === i ? !v : v));
  }

  function scoreCategory(key) {
    if (scores[key] !== undefined || rollsLeft === 3) return;
    const s = calcScore(key, dice);
    setScores(prev => ({ ...prev, [key]: s }));
    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setTurn(t => t + 1);
  }

  function reset() {
    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setScores({});
    setTurn(1);
  }

  if (gameOver) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎲</div>
      <h1 className="text-4xl font-black text-primary mb-4">Game Over!</h1>
      <p className="text-3xl text-foreground mb-2">Final Score: <span className="text-primary font-black">{totalScore}</span></p>
      <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mt-6 mb-4">
        🔄 Play Again
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
        <div className="text-center">
          <div className="text-2xl font-black text-primary">🎲 Yahtzee</div>
          <div className="text-muted-foreground">Turn {turn}/{totalTurns} | Score: {totalScore}</div>
        </div>
        <div className="flex gap-2">
          <GameInstructions
            title="Yahtzee"
            emoji="🎲"
            steps={[
              "Tap 'Roll Dice' to roll all five dice (3 rolls per turn).",
              "After the first roll, tap any dice you want to HOLD (keep).",
              "Roll again to re-roll the dice you didn't hold.",
              "After rolling, tap a scoring category on the scorecard to lock in your points.",
              "Upper section (Ones–Sixes): scores the sum of matching dice.",
              "Lower section: 3/4 of a Kind, Full House (25 pts), Straights (30/40 pts), Yahtzee (50 pts!), or Chance.",
              "Play 13 turns — score as high as you can!"
            ]}
          />
          <button onClick={reset} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">🔄</button>
        </div>
      </div>

      {/* Dice */}
      <div className="bg-card border-2 border-border rounded-2xl p-4 mb-4">
        <div className="flex justify-center gap-3 mb-4">
          {dice.map((d, i) => (
            <button key={i} onClick={() => toggleHold(i)}
              className={`text-6xl p-2 rounded-xl border-4 transition-all ${held[i] ? "border-primary bg-primary/20 scale-95" : "border-border bg-secondary"}`}>
              {DIE_FACES[d]}
            </button>
          ))}
        </div>
        {rollsLeft < 3 && <p className="text-center text-muted-foreground text-lg mb-2">Tap dice to hold them 👆</p>}
        <button onClick={roll} disabled={rollsLeft === 0}
          className={`w-full text-2xl font-black py-4 rounded-2xl shadow-xl transition-all ${rollsLeft > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          🎲 Roll Dice ({rollsLeft} rolls left)
        </button>
      </div>

      {/* Scorecard */}
      <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
        <div className="bg-primary px-4 py-3 text-primary-foreground font-black text-xl text-center">📊 Scorecard</div>
        {CATEGORIES.map(cat => {
          const scored = scores[cat.key] !== undefined;
          const preview = !scored && rollsLeft < 3 ? calcScore(cat.key, dice) : null;
          return (
            <button key={cat.key} onClick={() => scoreCategory(cat.key)} disabled={scored || rollsLeft === 3}
              className={`w-full flex items-center justify-between px-4 py-4 border-b border-border text-left transition-all ${
                scored ? "opacity-60" : rollsLeft < 3 ? "hover:bg-muted cursor-pointer" : "cursor-default"
              }`}>
              <div>
                <div className="text-xl font-bold text-foreground">{cat.label}</div>
                <div className="text-muted-foreground text-base">{cat.desc}</div>
              </div>
              <div className={`text-2xl font-black min-w-[3rem] text-right ${scored ? "text-primary" : "text-green-400"}`}>
                {scored ? scores[cat.key] : preview !== null ? preview : "—"}
              </div>
            </button>
          );
        })}
        <div className="flex justify-between px-4 py-4 bg-primary/10">
          <span className="text-xl font-black text-foreground">Total</span>
          <span className="text-2xl font-black text-primary">{totalScore}</span>
        </div>
      </div>
    </div>
  );
}