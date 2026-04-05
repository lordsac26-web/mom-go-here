import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * GSAP-02 Path Drawing: Draws the tic-tac-toe grid lines with a hand-drawn stroke animation.
 * Four lines animate in sequentially, then onComplete fires.
 */
export default function SVGBoard({ size = 300, onDrawComplete }) {
  const svgRef = useRef(null);
  const hasDrawn = useRef(false);

  useEffect(() => {
    if (hasDrawn.current) return;
    hasDrawn.current = true;

    const lines = svgRef.current.querySelectorAll(".board-line");

    // Set up each line for stroke drawing
    lines.forEach((line) => {
      const length = line.getTotalLength();
      gsap.set(line, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });
    });

    // Staggered draw-in
    const tl = gsap.timeline({
      onComplete: () => onDrawComplete?.(),
    });

    lines.forEach((line, i) => {
      const length = line.getTotalLength();
      tl.to(
        line,
        {
          strokeDashoffset: 0,
          duration: 0.45,
          ease: "power2.inOut",
        },
        i * 0.15
      );
    });
  }, [onDrawComplete]);

  const third = size / 3;
  const pad = 4;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    >
      {/* Vertical lines */}
      <line className="board-line" x1={third} y1={pad} x2={third} y2={size - pad} stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <line className="board-line" x1={third * 2} y1={pad} x2={third * 2} y2={size - pad} stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      {/* Horizontal lines */}
      <line className="board-line" x1={pad} y1={third} x2={size - pad} y2={third} stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <line className="board-line" x1={pad} y1={third * 2} x2={size - pad} y2={third * 2} stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}