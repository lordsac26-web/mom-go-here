import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * GSAP-02 Path Drawing: Draws an X or O mark with animated stroke.
 * X = two crossing lines, O = circle arc.
 */
export default function SVGMark({ type, size = 80, isWinning = false }) {
  const svgRef = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current || !type) return;
    animated.current = true;

    const paths = svgRef.current.querySelectorAll(".mark-path");
    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });
    });

    const tl = gsap.timeline();
    paths.forEach((path, i) => {
      const length = path.getTotalLength();
      tl.to(
        path,
        {
          strokeDashoffset: 0,
          duration: 0.35,
          ease: "power3.out",
        },
        i * 0.12
      );
    });
  }, [type]);

  // Winning glow pulse
  useEffect(() => {
    if (!isWinning || !svgRef.current) return;
    const paths = svgRef.current.querySelectorAll(".mark-path");
    gsap.to(paths, {
      filter: "drop-shadow(0 0 8px hsl(var(--primary)))",
      strokeWidth: 7,
      duration: 0.4,
      yoyo: true,
      repeat: 2,
      ease: "power1.inOut",
    });
  }, [isWinning]);

  if (!type) return null;

  const center = size / 2;
  const pad = size * 0.18;
  const stroke = type === "X" ? "#60a5fa" : "#f87171";

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
    >
      {type === "X" ? (
        <>
          <line
            className="mark-path"
            x1={pad} y1={pad}
            x2={size - pad} y2={size - pad}
            stroke={stroke}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            className="mark-path"
            x1={size - pad} y1={pad}
            x2={pad} y2={size - pad}
            stroke={stroke}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <circle
          className="mark-path"
          cx={center}
          cy={center}
          r={center - pad}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}