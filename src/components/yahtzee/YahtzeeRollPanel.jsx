import { motion } from "framer-motion";
import Dice2DRoller from "@/components/Dice2DRoller";

export default function YahtzeeRollPanel({ rollerRef, held, isRolling, rollsLeft, turn, onRoll, onRollComplete, onToggleHold }) {
  const hint = rollsLeft < 3 && rollsLeft > 0 ? "Tap dice to hold or release them" : rollsLeft === 3 && turn > 1 ? "Roll the dice to start your turn" : "";
  const disabled = rollsLeft === 0 || isRolling;
  return (
    <section className="mb-3 space-y-3 overflow-hidden rounded-3xl border-2 border-red-400/30 bg-card p-3 shadow-[0_14px_35px_rgba(127,29,29,0.2)]">
      <Dice2DRoller ref={rollerRef} onRollComplete={onRollComplete} held={held} onToggleHold={onToggleHold} />
      <p className="min-h-5 text-center text-sm font-bold text-muted-foreground">{hint}</p>
      <motion.button whileTap={disabled ? {} : { scale: 0.97 }} onClick={onRoll} disabled={disabled} className={`w-full rounded-2xl py-4 text-xl font-black shadow-lg ${disabled ? "bg-muted text-muted-foreground" : "bg-red-600 text-white shadow-red-950/50"}`}>
        {isRolling ? "🎲 Rolling..." : rollsLeft === 0 ? "Pick a category below ↓" : `🎲 Roll Dice (${rollsLeft} left)`}
      </motion.button>
    </section>
  );
}