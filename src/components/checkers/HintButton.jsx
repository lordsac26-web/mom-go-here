/**
 * Hint button that briefly highlights a random valid move.
 */
import { useState, useCallback } from "react";
import { Lightbulb } from "lucide-react";

export default function HintButton({ moves, onHint, disabled }) {
  const [cooldown, setCooldown] = useState(false);

  const showHint = useCallback(() => {
    if (!moves?.length || cooldown || disabled) return;
    // Pick a random valid move
    const move = moves[Math.floor(Math.random() * moves.length)];
    onHint?.(move);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);
  }, [moves, cooldown, disabled, onHint]);

  if (!moves?.length) return null;

  return (
    <button
      onClick={showHint}
      disabled={cooldown || disabled}
      className={`bg-secondary text-foreground px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1 transition-all ${
        cooldown ? "opacity-40" : ""
      }`}
      aria-label="Show hint"
    >
      <Lightbulb size={16} />
      <span className="hidden sm:inline">Hint</span>
    </button>
  );
}