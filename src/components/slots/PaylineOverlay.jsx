import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PAYLINES, PAYLINE_COLORS } from "./slotConfig";

/**
 * GSAP-powered payline overlay with path-drawing animation.
 * Winning lines animate in with a stroke-dashoffset reveal,
 * then pulse with a neon glow.
 */
export default function PaylineOverlay({ activePaylines, winningLines, gridRect }) {
  const svgRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    // Kill any running timeline
    if (tlRef.current) { tlRef.current.kill(); tlRef.current = null; }
    if (!svgRef.current || !gridRect || !winningLines.length) return;

    const paths = svgRef.current.querySelectorAll(".win-line");
    const glows = svgRef.current.querySelectorAll(".win-glow");
    const dots = svgRef.current.querySelectorAll(".win-dot");

    if (!paths.length) return;

    const tl = gsap.timeline();
    tlRef.current = tl;

    // Set up each path for draw-on
    paths.forEach((path, i) => {
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      gsap.set(glows[i], { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    });

    // Stagger draw each winning line
    paths.forEach((path, i) => {
      const len = path.getTotalLength();
      tl.to(path, {
        strokeDashoffset: 0,
        duration: 0.6,
        ease: "power2.out",
      }, i * 0.15);

      // Glow follows slightly behind
      tl.to(glows[i], {
        strokeDashoffset: 0,
        opacity: 0.5,
        duration: 0.6,
        ease: "power2.out",
      }, i * 0.15 + 0.1);
    });

    // After all drawn, pulse dots at intersections
    tl.to(dots, {
      scale: 1.5,
      opacity: 1,
      duration: 0.3,
      stagger: 0.02,
      ease: "back.out(3)",
    }, "-=0.2");

    // Continuous pulse loop
    tl.to(paths, {
      opacity: 0.5,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.05,
    }, "+=0.2");

    tl.to(glows, {
      opacity: 0.2,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.05,
    }, "<");

    tl.to(dots, {
      scale: 1,
      duration: 0.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.03,
    }, "<");

    return () => { tl.kill(); };
  }, [winningLines, gridRect]);

  if (!gridRect || !winningLines.length) return null;

  const cellW = gridRect.width / 5;
  const cellH = gridRect.height / 3;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-20"
      width={gridRect.width}
      height={gridRect.height}
      viewBox={`0 0 ${gridRect.width} ${gridRect.height}`}
    >
      <defs>
        {winningLines.map((lineIdx) => {
          const color = PAYLINE_COLORS[lineIdx];
          return (
            <filter key={`f-${lineIdx}`} id={`glow-${lineIdx}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor={color} floodOpacity="0.8" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          );
        })}
      </defs>

      {winningLines.map((lineIdx) => {
        const line = PAYLINES[lineIdx];
        const color = PAYLINE_COLORS[lineIdx];
        const d = line.map((row, reel) => {
          const x = reel * cellW + cellW / 2;
          const y = row * cellH + cellH / 2;
          return `${reel === 0 ? "M" : "L"} ${x} ${y}`;
        }).join(" ");

        return (
          <g key={lineIdx}>
            {/* Glow layer */}
            <path
              className="win-glow"
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0"
              filter={`url(#glow-${lineIdx})`}
            />
            {/* Main line */}
            <path
              className="win-line"
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0"
            />
            {/* Dots at each reel position */}
            {line.map((row, reel) => (
              <circle
                key={`d-${lineIdx}-${reel}`}
                className="win-dot"
                cx={reel * cellW + cellW / 2}
                cy={row * cellH + cellH / 2}
                r="5"
                fill={color}
                opacity="0"
                style={{ transformOrigin: `${reel * cellW + cellW / 2}px ${row * cellH + cellH / 2}px` }}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}