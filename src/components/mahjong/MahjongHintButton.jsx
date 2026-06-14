import { useState, useRef, useCallback } from "react";
import { Lightbulb } from "lucide-react";
import { findHintPair } from "./MahjongEngine";

const COOLDOWN_MS = 5000;

export default function MahjongHintButton({ tiles, onHint, disabled }) {
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef(null);

  const handleClick = useCallback(() => {
    if (cooldown || disabled) return;
    const pair = findHintPair(tiles);
    if (!pair) return;
    onHint(pair);
    setCooldown(true);
    timerRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
  }, [cooldown, disabled, tiles, onHint]);

  const pair = findHintPair(tiles);
  if (!pair) return null;

  return (
    <button
      onClick={handleClick}
      disabled={cooldown || disabled}
      className={`bg-secondary text-foreground px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] active:scale-95 transition-opacity ${
        cooldown ? "opacity-40" : ""
      }`}
      title="Show a matching pair"
    >
      <Lightbulb size={18} />
      <span className="hidden sm:inline">{cooldown ? "Wait..." : "Hint"}</span>
    </button>
  );
}