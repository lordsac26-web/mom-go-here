import { PAYLINES, PAYLINE_COLORS } from "./slotConfig";

/**
 * Renders SVG payline indicators over the reel grid.
 * Shows winning paylines with animated glow.
 */
export default function PaylineOverlay({ activePaylines, winningLines, gridRect }) {
  if (!gridRect) return null;

  const cellW = gridRect.width / 5;
  const cellH = gridRect.height / 3;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-20"
      width={gridRect.width}
      height={gridRect.height}
      viewBox={`0 0 ${gridRect.width} ${gridRect.height}`}
    >
      {winningLines.map((lineIdx) => {
        const line = PAYLINES[lineIdx];
        const color = PAYLINE_COLORS[lineIdx];
        const points = line.map((row, reel) => {
          const x = reel * cellW + cellW / 2;
          const y = row * cellH + cellH / 2;
          return `${x},${y}`;
        }).join(" ");

        return (
          <g key={lineIdx}>
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            >
              <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
            </polyline>
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.2"
            >
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur="1s" repeatCount="indefinite" />
            </polyline>
          </g>
        );
      })}
    </svg>
  );
}