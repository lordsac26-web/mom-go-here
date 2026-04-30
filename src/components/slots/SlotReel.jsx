import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

const SPIN_INTERVAL = 60;

export default function SlotReel({ symbols, spinning, finalSymbols, reelIndex, onStop, winPositions }) {
  const [displaySymbols, setDisplaySymbols] = useState(finalSymbols || symbols.slice(0, 3));
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const cellRefs = useRef([]);
  const containerRef = useRef(null);
  const stoppedRef = useRef(false);
  const glowTimelinesRef = useRef([]);

  // Main spin/stop effect
  useEffect(() => {
    if (spinning) {
      stoppedRef.current = false;
      setIsAnimating(true);

      // Kill any leftover win glow animations
      glowTimelinesRef.current.forEach(tl => tl?.kill());
      glowTimelinesRef.current = [];

      intervalRef.current = setInterval(() => {
        const randSyms = [];
        for (let i = 0; i < 3; i++) {
          randSyms.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
        setDisplaySymbols(randSyms);
      }, SPIN_INTERVAL);

      const stopDelay = 600 + reelIndex * 350;
      timeoutRef.current = setTimeout(() => {
        if (stoppedRef.current) return;
        stoppedRef.current = true;

        clearInterval(intervalRef.current);
        setDisplaySymbols(finalSymbols);
        setIsAnimating(false);

        // GSAP bounce-stop
        if (containerRef.current) {
          gsap.fromTo(containerRef.current, { y: -12 }, {
            y: 0, duration: 0.4, ease: "bounce.out",
          });
        }

        // Flash each cell on landing
        cellRefs.current.forEach((cell, i) => {
          if (cell) {
            gsap.fromTo(cell, {
              scale: 1.15, boxShadow: "0 0 20px rgba(234,179,8,0.6)",
            }, {
              scale: 1, boxShadow: "0 0 0px rgba(234,179,8,0)",
              duration: 0.4, delay: i * 0.05, ease: "power2.out",
            });
          }
        });

        onStop?.(reelIndex);
      }, stopDelay);
    } else {
      stoppedRef.current = true;
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [spinning]);

  // Sync final symbols when not spinning
  useEffect(() => {
    if (!spinning && finalSymbols) {
      setDisplaySymbols(finalSymbols);
    }
  }, [finalSymbols, spinning]);

  // Win glow animation on winning cells
  useEffect(() => {
    // Clean up old glows
    glowTimelinesRef.current.forEach(tl => tl?.kill());
    glowTimelinesRef.current = [];

    if (!winPositions || winPositions.length === 0 || spinning) return;

    winPositions.forEach(rowIdx => {
      const cell = cellRefs.current[rowIdx];
      if (!cell) return;

      const tl = gsap.timeline({ repeat: -1 });
      tl.to(cell, {
        boxShadow: "0 0 24px 6px rgba(250,204,21,0.8), inset 0 0 12px rgba(250,204,21,0.3)",
        scale: 1.12,
        duration: 0.4,
        ease: "sine.inOut",
      }).to(cell, {
        boxShadow: "0 0 8px 2px rgba(250,204,21,0.3), inset 0 0 4px rgba(250,204,21,0.1)",
        scale: 1.0,
        duration: 0.4,
        ease: "sine.inOut",
      });

      glowTimelinesRef.current.push(tl);
    });

    return () => {
      glowTimelinesRef.current.forEach(tl => tl?.kill());
      glowTimelinesRef.current = [];
    };
  }, [winPositions, spinning]);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-1 relative">
      {displaySymbols.map((sym, i) => {
        const isWinning = winPositions?.includes(i) && !spinning && !isAnimating;
        return (
          <div
            key={`${reelIndex}-${i}`}
            ref={el => cellRefs.current[i] = el}
            className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl rounded-lg border shadow-inner transition-all
              ${isAnimating
                ? "bg-gradient-to-b from-gray-700 to-gray-800 border-gray-600"
                : isWinning
                ? "bg-gradient-to-b from-yellow-900/60 to-amber-900/40 border-yellow-400"
                : "bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900 border-yellow-700/40"
              }`}
          >
            <span className={
              isAnimating
                ? "blur-[2px] opacity-70"
                : isWinning
                ? "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-110 transition-transform"
                : "drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"
            }>
              {sym.emoji}
            </span>
          </div>
        );
      })}
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