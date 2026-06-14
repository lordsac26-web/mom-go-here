import { useState, useRef } from "react";
import { Lightbulb } from "lucide-react";

const COOLDOWN_MS = 5000;

export default function WordSearchHintButton({ onHint, disabled, theme }) {
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
      className="px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] active:scale-95 transition-all"
      style={{
        background: cooldown || disabled ? "rgba(128,128,128,0.3)" : (theme?.cell || "hsl(220,35%,15%)"),
        color: cooldown || disabled ? "rgba(128,128,128,0.6)" : (theme?.cellText || "#fff"),
        opacity: cooldown || disabled ? 0.6 : 1,
      }}
      title="Get a hint"
    >
      <Lightbulb size={18} />
    </button>
  );
}