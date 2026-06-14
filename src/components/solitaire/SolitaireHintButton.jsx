import { useState, useRef } from "react";
import { Lightbulb } from "lucide-react";

/**
 * Hint button for Solitaire — finds one valid move and calls onHint with it.
 * 5-second cooldown between hints.
 */
export default function SolitaireHintButton({ onHint, disabled }) {
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef(null);

  function handleClick() {
    if (cooldown || disabled) return;
    onHint();
    setCooldown(true);
    timerRef.current = setTimeout(() => setCooldown(false), 5000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={cooldown || disabled}
      className={`px-3 rounded-xl font-bold flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] active:scale-95 transition-all ${
        cooldown || disabled
          ? "bg-green-900/50 text-green-700 opacity-60"
          : "bg-green-700 text-white"
      }`}
      aria-label="Get a hint"
    >
      <Lightbulb size={18} />
      <span className="hidden sm:inline text-sm">Hint</span>
    </button>
  );
}