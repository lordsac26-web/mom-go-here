import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

const SPIN_INTERVAL = 60;

export default function SlotReel({ symbols, spinning, finalSymbols, reelIndex, onStop }) {
  const [displaySymbols, setDisplaySymbols] = useState(finalSymbols || symbols.slice(0, 3));
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const cellRefs = useRef([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (spinning) {
      setIsAnimating(true);

      // Start rapid symbol cycling
      intervalRef.current = setInterval(() => {
        const randSyms = [];
        for (let i = 0; i < 3; i++) {
          randSyms.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
        setDisplaySymbols(randSyms);
      }, SPIN_INTERVAL);

      // Stop after staggered delay per reel
      const stopDelay = 600 + reelIndex * 350;
      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        setDisplaySymbols(finalSymbols);
        setIsAnimating(false);

        // GSAP bounce-stop effect
        if (containerRef.current) {
          gsap.fromTo(containerRef.current, {
            y: -12,
          }, {
            y: 0,
            duration: 0.4,
            ease: "bounce.out",
          });
        }

        // Flash each cell on landing
        cellRefs.current.forEach((cell, i) => {
          if (cell) {
            gsap.fromTo(cell, {
              scale: 1.15,
              boxShadow: "0 0 20px rgba(234,179,8,0.6)",
            }, {
              scale: 1,
              boxShadow: "0 0 0px rgba(234,179,8,0)",
              duration: 0.4,
              delay: i * 0.05,
              ease: "power2.out",
            });
          }
        });

        onStop?.(reelIndex);
      }, stopDelay);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [spinning]);

  useEffect(() => {
    if (!spinning && finalSymbols) {
      setDisplaySymbols(finalSymbols);
    }
  }, [finalSymbols, spinning]);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-1 relative">
      {displaySymbols.map((sym, i) => (
        <div
          key={`${reelIndex}-${i}`}
          ref={el => cellRefs.current[i] = el}
          className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl rounded-lg border shadow-inner transition-all
            ${isAnimating
              ? "bg-gradient-to-b from-gray-700 to-gray-800 border-gray-600"
              : "bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900 border-yellow-700/40"
            }`}
        >
          <span className={isAnimating ? "blur-[2px] opacity-70" : "drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"}>
            {sym.emoji}
          </span>
        </div>
      ))}
      {/* Spin blur overlay */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)",
          }}
        />
      )}
    </div>
  );
}