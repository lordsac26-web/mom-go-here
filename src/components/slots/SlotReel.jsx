import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

const CELL_SIZE = 72; // px per symbol cell
const VISIBLE = 3;    // visible rows

export default function SlotReel({ symbols, spinning, finalSymbols, reelIndex, onStop, winPositions }) {
  const stripRef = useRef(null);
  const containerRef = useRef(null);
  const glowRefs = useRef([]);
  const glowTimelines = useRef([]);
  const stoppedRef = useRef(false);
  const spinAnimRef = useRef(null);
  const spinTimeoutRef = useRef(null);

  // Display symbols shown in the strip (we keep extra cells for seamless loop)
  const [displaySyms, setDisplaySyms] = useState(() => finalSymbols || symbols.slice(0, 3));
  const [isSpinning, setIsSpinning] = useState(false);

  // ── Spin Effect ──
  useEffect(() => {
    if (spinning) {
      stoppedRef.current = false;
      setIsSpinning(true);

      // Kill old win glows
      glowTimelines.current.forEach(tl => tl?.kill());
      glowTimelines.current = [];

      // Build a long strip — 40 symbols for smooth multi-loop feel
      const stripSymbols = [];
      for (let i = 0; i < 40; i++) {
        stripSymbols.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
      setDisplaySyms(stripSymbols);

      // Wait one frame for DOM to update then animate
      let frameId;
      frameId = requestAnimationFrame(() => {
        if (!stripRef.current || stoppedRef.current) return;
        const el = stripRef.current;
        gsap.killTweensOf(el);
        gsap.set(el, { y: 0 });

        const totalH = stripSymbols.length * CELL_SIZE;
        const loopY = -(totalH - CELL_SIZE * VISIBLE);

        // Accelerate then hold speed — easeIn then linear hold
        spinAnimRef.current = gsap.to(el, {
          y: loopY,
          duration: 1.2 + reelIndex * 0.2,
          ease: "power2.in",
          // Do NOT auto-trigger stop here — the timeout owns that
        });
      });

      // Stop delay staggers per reel — feels like reels stopping one by one
      const stopDelay = 800 + reelIndex * 420;
      spinTimeoutRef.current = setTimeout(() => {
        triggerStop();
      }, stopDelay);

      return () => {
        cancelAnimationFrame(frameId);
      };
    } else {
      // External stop (e.g. component unmount) — clean up without calling onStop
      stoppedRef.current = true;
      if (spinAnimRef.current) { spinAnimRef.current.kill(); spinAnimRef.current = null; }
      if (spinTimeoutRef.current) { clearTimeout(spinTimeoutRef.current); spinTimeoutRef.current = null; }
    }
  }, [spinning]);

  function triggerStop() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    if (spinAnimRef.current) { spinAnimRef.current.kill(); spinAnimRef.current = null; }
    if (spinTimeoutRef.current) { clearTimeout(spinTimeoutRef.current); spinTimeoutRef.current = null; }

    // Snap to final symbols
    setDisplaySyms(finalSymbols);
    setIsSpinning(false);

    requestAnimationFrame(() => {
      if (!stripRef.current || !containerRef.current) {
        onStop?.(reelIndex);
        return;
      }
      gsap.set(stripRef.current, { y: 0 });

      // Elastic bounce-stop — overshoot down then spring up
      gsap.fromTo(stripRef.current,
        { y: -18 },
        {
          y: 0,
          duration: 0.45,
          ease: "elastic.out(1.2, 0.5)",
          onComplete: () => onStop?.(reelIndex),
        }
      );

      // Flash cells on landing
      glowRefs.current.forEach((cell, i) => {
        if (!cell) return;
        gsap.fromTo(cell,
          { scale: 1.18, filter: "brightness(1.8) saturate(1.4)" },
          { scale: 1, filter: "brightness(1) saturate(1)", duration: 0.35, delay: i * 0.04, ease: "power2.out" }
        );
      });
    });
  }

  // Sync final when stopped externally
  useEffect(() => {
    if (!spinning && finalSymbols) setDisplaySyms(finalSymbols);
  }, [finalSymbols, spinning]);

  // Win glow animation
  useEffect(() => {
    glowTimelines.current.forEach(tl => tl?.kill());
    glowTimelines.current = [];
    if (!winPositions?.length || spinning || isSpinning) return;

    winPositions.forEach(rowIdx => {
      const cell = glowRefs.current[rowIdx];
      if (!cell) return;
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(cell, {
        boxShadow: "0 0 28px 8px rgba(250,204,21,0.9), inset 0 0 16px rgba(250,204,21,0.4)",
        scale: 1.14,
        filter: "brightness(1.3) saturate(1.6)",
        duration: 0.38,
        ease: "sine.inOut",
      }).to(cell, {
        boxShadow: "0 0 6px 1px rgba(250,204,21,0.25), inset 0 0 4px rgba(250,204,21,0.1)",
        scale: 1.0,
        filter: "brightness(1) saturate(1)",
        duration: 0.38,
        ease: "sine.inOut",
      });
      glowTimelines.current.push(tl);
    });

    return () => { glowTimelines.current.forEach(tl => tl?.kill()); glowTimelines.current = []; };
  }, [winPositions, spinning, isSpinning]);

  const showCells = isSpinning ? displaySyms : (finalSymbols || displaySyms);
  const visibleCells = isSpinning ? showCells : showCells.slice(0, 3);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl"
      style={{ width: CELL_SIZE, height: CELL_SIZE * VISIBLE, minWidth: CELL_SIZE }}
    >
      {/* Gradient masks — top/bottom fade for depth */}
      <div className="absolute inset-x-0 top-0 h-8 z-10 pointer-events-none rounded-t-xl"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-8 z-10 pointer-events-none rounded-b-xl"
        style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />

      {/* Center row highlight line */}
      <div className="absolute inset-x-0 z-5 pointer-events-none border-y-2 border-yellow-400/40"
        style={{ top: CELL_SIZE, height: CELL_SIZE }} />

      {/* Symbol strip */}
      <div ref={stripRef} className="flex flex-col">
        {visibleCells.map((sym, i) => {
          const isWinning = winPositions?.includes(i) && !spinning && !isSpinning;
          return (
            <div
              key={`${reelIndex}-${i}-${sym?.id}`}
              ref={el => glowRefs.current[i] = el}
              style={{ width: CELL_SIZE, height: CELL_SIZE, flexShrink: 0 }}
              className={`flex items-center justify-center rounded-xl border transition-colors
                ${isSpinning
                  ? "bg-gradient-to-b from-gray-700 to-gray-800 border-gray-600"
                  : isWinning
                  ? "bg-gradient-to-b from-yellow-900/70 to-amber-900/50 border-yellow-400"
                  : "bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900 border-yellow-700/30"
                }`}
            >
              <span
                className={`text-4xl select-none leading-none
                  ${isSpinning ? "blur-[2.5px] opacity-60" : ""}
                  ${isWinning ? "drop-shadow-[0_0_10px_rgba(250,204,21,0.9)] scale-110 transition-transform" : "drop-shadow-[0_0_3px_rgba(255,255,255,0.25)]"}
                `}
                style={{ display: "block", lineHeight: 1 }}
              >
                {sym?.emoji}
              </span>
            </div>
          );
        })}
      </div>

      {/* Spin motion blur overlay */}
      {isSpinning && (
        <div className="absolute inset-0 rounded-xl pointer-events-none z-5"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.2) 100%)",
            backdropFilter: "blur(1px)",
          }}
        />
      )}
    </div>
  );
}