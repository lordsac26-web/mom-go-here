import { useState, useRef } from "react";
import { Lightbulb } from "lucide-react";

const COOLDOWN_MS = 5000;

export default function SudokuHintButton({ onHint, disabled }) {
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef(null);

  function handleClick() {
    if (cooldown || disabled) return;
    onHint();
    setCooldown(true);
    timerRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
  }

  return (
    <button
      onClick={handleClick}
      disabled={cooldown || disabled}
      className={`px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1 transition-all ${
        cooldown || disabled
          ? "bg-muted text-muted-foreground opacity-50"
          : "bg-secondary text-foreground"
      }`}
      title="Get a hint"
    >
      <Lightbulb size={18} />
    </button>
  );
}