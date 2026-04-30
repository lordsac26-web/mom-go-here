import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const UPPER_KEYS = ["ones", "twos", "threes", "fours", "fives", "sixes"];
const LOWER_KEYS = ["threeofakind", "fourofakind", "fullhouse", "smallstraight", "largestraight", "yahtzee", "chance"];

const CATEGORIES = {
  ones: { label: "Ones", desc: "Sum of all 1s" },
  twos: { label: "Twos", desc: "Sum of all 2s" },
  threes: { label: "Threes", desc: "Sum of all 3s" },
  fours: { label: "Fours", desc: "Sum of all 4s" },
  fives: { label: "Fives", desc: "Sum of all 5s" },
  sixes: { label: "Sixes", desc: "Sum of all 6s" },
  threeofakind: { label: "3 of a Kind", desc: "Sum of all dice" },
  fourofakind: { label: "4 of a Kind", desc: "Sum of all dice" },
  fullhouse: { label: "Full House", desc: "25 points" },
  smallstraight: { label: "Sm. Straight", desc: "30 points" },
  largestraight: { label: "Lg. Straight", desc: "40 points" },
  yahtzee: { label: "YAHTZEE!", desc: "50 points" },
  chance: { label: "Chance", desc: "Sum of all dice" },
};

const UPPER_BONUS_TARGET = 63;
const UPPER_BONUS_VALUE = 35;

export default function YahtzeeScorecard({
  scores, scorePreviews, rollsLeft, yahtzeeBonus, onScoreCategory,
  totalScore, upperSubtotal, lowerSubtotal, upperBonusEarned,
}) {
  const [justScored, setJustScored] = useState(null);
  const [confirmKey, setConfirmKey] = useState(null);
  const canScore = rollsLeft < 3;

  function handleCategoryTap(key) {
    if (scores[key] !== undefined || !canScore) return;
    // Show confirmation
    setConfirmKey(key);
    // Auto-dismiss after 4 seconds
    setTimeout(() => setConfirmKey(prev => prev === key ? null : prev), 4000);
  }

  function confirmScore(key) {
    setConfirmKey(null);
    setJustScored(key);
    setTimeout(() => setJustScored(null), 1200);
    onScoreCategory(key);
  }

  function renderRow(key) {
    const cat = CATEGORIES[key];
    const scored = scores[key] !== undefined;
    const preview = !scored && canScore ? (scorePreviews[key] ?? null) : null;
    const isJust = justScored === key;
    const isConfirming = confirmKey === key;

    return (
      <div key={key} className="relative">
        <button
          onClick={() => isConfirming ? confirmScore(key) : handleCategoryTap(key)}
          disabled={scored || !canScore}
          className={`w-full flex items-center justify-between px-4 py-3 border-b border-border text-left transition-all ${
            isConfirming ? "bg-primary/20 border-primary" :
            scored ? "opacity-50" : canScore ? "hover:bg-muted active:bg-muted/80 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-foreground">{cat.label}</div>
            <div className="text-muted-foreground text-sm">{cat.desc}</div>
          </div>
          <div className="flex items-center gap-2">
            {isConfirming && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-primary bg-primary/20 px-2 py-1 rounded-lg whitespace-nowrap"
              >
                Tap to confirm
              </motion.span>
            )}
            <motion.div
              className={`text-xl font-black min-w-[3rem] text-right ${
                isJust ? "text-green-400" : scored ? "text-primary" : preview !== null && preview > 0 ? "text-green-400" : preview === 0 ? "text-red-400/60" : "text-muted-foreground"
              }`}
              animate={isJust ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {scored ? scores[key] : preview !== null ? preview : "—"}
            </motion.div>
          </div>
        </button>
        {/* Cancel confirm on tap elsewhere handled by confirmKey auto-clear */}
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 380px)' }}>
      <div className="bg-primary px-4 py-2.5 text-primary-foreground font-black text-lg text-center shrink-0">📊 Scorecard</div>
      <div className="overflow-y-auto flex-1 overscroll-contain">
        {/* Upper Section */}
        <div className="bg-secondary/30 px-4 py-2 border-b border-border flex items-center justify-between">
          <span className="text-sm font-black text-muted-foreground">▲ UPPER SECTION</span>
          <span className="text-sm font-bold text-muted-foreground">{upperSubtotal} / {UPPER_BONUS_TARGET}</span>
        </div>
        {UPPER_KEYS.map(renderRow)}

        {/* Upper Bonus Row */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-b-2 border-primary/30 ${
          upperBonusEarned ? "bg-green-900/30" : "bg-secondary/20"
        }`}>
          <div>
            <span className="text-sm font-black text-foreground">🎁 Bonus</span>
            <span className="text-xs text-muted-foreground ml-2">
              {upperBonusEarned ? "Earned!" : `${Math.max(0, UPPER_BONUS_TARGET - upperSubtotal)} more needed`}
            </span>
          </div>
          <span className={`text-lg font-black ${upperBonusEarned ? "text-green-400" : "text-muted-foreground"}`}>
            {upperBonusEarned ? `+${UPPER_BONUS_VALUE}` : "—"}
          </span>
        </div>

        {/* Lower Section */}
        <div className="bg-secondary/30 px-4 py-2 border-b border-border">
          <span className="text-sm font-black text-muted-foreground">▼ LOWER SECTION</span>
        </div>
        {LOWER_KEYS.map(renderRow)}

        {/* Yahtzee Bonus Row */}
        {scores.yahtzee !== undefined && (
          <div className={`flex items-center justify-between px-4 py-2.5 border-b border-border ${
            yahtzeeBonus > 0 ? "bg-yellow-900/30" : "bg-secondary/20"
          }`}>
            <div>
              <span className="text-sm font-black text-foreground">🎲 Yahtzee Bonus</span>
              <span className="text-xs text-muted-foreground ml-2">+100 each extra Yahtzee</span>
            </div>
            <span className={`text-lg font-black ${yahtzeeBonus > 0 ? "text-yellow-400" : "text-muted-foreground"}`}>
              {yahtzeeBonus > 0 ? `+${yahtzeeBonus}` : "—"}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between px-4 py-3 bg-primary/10 shrink-0 border-t-2 border-border">
        <span className="text-lg font-black text-foreground">Total</span>
        <span className="text-xl font-black text-primary">{totalScore}</span>
      </div>
    </div>
  );
}