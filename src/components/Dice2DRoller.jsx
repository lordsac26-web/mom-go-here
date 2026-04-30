import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";

const DIE_PIPS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function DieFace({ value, held, rolling, onClick }) {
  const pips = DIE_PIPS[value] || DIE_PIPS[1];
  
  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 rounded-xl border-4 transition-all duration-200 ${
        held
          ? "border-primary bg-primary/20 shadow-lg shadow-primary/30 scale-105"
          : "border-amber-200/60 bg-gradient-to-br from-white to-gray-100 shadow-lg"
      } ${rolling && !held ? "animate-bounce" : ""}`}
      style={{ width: 64, height: 64 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="2" y="2" width="96" height="96" rx="16" ry="16"
          fill={held ? "hsl(43, 96%, 56%)" : "#fafaf8"}
          stroke={held ? "hsl(43, 96%, 40%)" : "#d4d4c8"}
          strokeWidth="3"
        />
        {pips.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="11"
            fill={held ? "#1a1a1a" : "#222"}
          />
        ))}
      </svg>
      {held && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
          🔒
        </div>
      )}
    </button>
  );
}

const Dice2DRoller = forwardRef(({ onRollComplete, held, onToggleHold }, ref) => {
  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  // Keep a ref to dice to avoid stale closure in settle callback
  const diceRef = useRef(dice);
  diceRef.current = dice;

  useImperativeHandle(ref, () => ({
    roll: () => {
      if (rolling) return;
      setRolling(true);

      intervalRef.current = setInterval(() => {
        setDice(prev =>
          prev.map((d, i) => (held[i] ? d : Math.floor(Math.random() * 6) + 1))
        );
      }, 80);

      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        // Use diceRef to get current held dice values (avoids stale closure)
        const currentDice = diceRef.current;
        const finalDice = held.map((h, i) =>
          h ? currentDice[i] : Math.floor(Math.random() * 6) + 1
        );
        setDice(finalDice);
        setRolling(false);
        onRollComplete(finalDice);
      }, 600);
    },
  }));

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="flex justify-center items-center gap-2.5 py-3 flex-wrap">
      {dice.map((d, i) => (
        <DieFace
          key={i}
          value={d}
          held={held[i]}
          rolling={rolling && !held[i]}
          onClick={() => onToggleHold?.(i)}
        />
      ))}
    </div>
  );
});

Dice2DRoller.displayName = "Dice2DRoller";
export default Dice2DRoller;