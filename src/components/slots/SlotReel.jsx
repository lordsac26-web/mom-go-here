import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SPIN_SYMBOLS_COUNT = 20; // extra symbols during spin animation

export default function SlotReel({ symbols, spinning, finalSymbols, reelIndex, onStop }) {
  const [displaySymbols, setDisplaySymbols] = useState(finalSymbols || symbols.slice(0, 3));
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (spinning) {
      setIsAnimating(true);
      // Rapid cycle through random symbols
      let tick = 0;
      intervalRef.current = setInterval(() => {
        const randSyms = [];
        for (let i = 0; i < 3; i++) {
          randSyms.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
        setDisplaySymbols(randSyms);
        tick++;
      }, 80);

      // Stop after staggered delay per reel
      const stopDelay = 800 + reelIndex * 400;
      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        setDisplaySymbols(finalSymbols);
        setIsAnimating(false);
        onStop?.(reelIndex);
      }, stopDelay);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [spinning]);

  // Update display when finalSymbols change (new game)
  useEffect(() => {
    if (!spinning && finalSymbols) {
      setDisplaySymbols(finalSymbols);
    }
  }, [finalSymbols, spinning]);

  return (
    <div className="flex flex-col items-center gap-0.5 relative">
      {displaySymbols.map((sym, i) => (
        <motion.div
          key={`${reelIndex}-${i}-${sym.id}-${isAnimating ? Math.random() : 'stable'}`}
          initial={isAnimating ? { y: -20, opacity: 0.5 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.06 }}
          className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 shadow-inner"
        >
          <span className={isAnimating ? "blur-[1px]" : ""}>{sym.emoji}</span>
        </motion.div>
      ))}
      {isAnimating && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent pointer-events-none animate-pulse opacity-30 rounded-lg" />
      )}
    </div>
  );
}