import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * GSAP-02 Path Drawing: Animated strike-through line for the winning combination.
 */

// Map cell index to center position in a 3x3 grid
function cellCenter(index, gridSize) {
  const third = gridSize / 3;
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: col * third + third / 2,
    y: row * third + third / 2,
  };
}

export default function SVGWinLine({ line, gridSize = 300 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!line || line.length < 2) return;

    const path = svgRef.current.querySelector(".win-line");
    if (!path) return;

    const length = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length,
    });

    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 0.5,
      delay: 0.15,
      ease: "power2.inOut",
    });
  }, [line]);

  if (!line || line.length < 2) return null;

  const start = cellCenter(line[0], gridSize);
  const end = cellCenter(line[line.length - 1], gridSize);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      width={gridSize}
      height={gridSize}
      className="absolute inset-0"
      style={{ pointerEvents: "none", zIndex: 20 }}
    >
      <line
        className="win-line"
        x1={start.x} y1={start.y}
        x2={end.x} y2={end.y}
        stroke="hsl(var(--primary))"
        strokeWidth="6"
        strokeLinecap="round"
        filter="drop-shadow(0 0 12px hsl(var(--primary)))"
      />
    </svg>
  );
}