import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * GSAP 3D Grid Reveal — wraps grid children and animates them in
 * with a randomized 3D flip + scale entrance on mount/key change.
 *
 * Props:
 *  - cols: number of grid columns (for stagger calculation)
 *  - pattern: "spiral" | "diagonal" | "random" | "center" | "wave"
 *  - className: additional classes for the grid container
 *  - style: inline styles for the grid container
 *  - children: grid items
 *  - revealKey: change this to re-trigger the animation
 */

const PATTERNS = {
  // Spiral from outside in
  spiral: (items, cols) => {
    const rows = Math.ceil(items.length / cols);
    const center = { x: (cols - 1) / 2, y: (rows - 1) / 2 };
    return items.map((_, i) => {
      const x = i % cols;
      const y = Math.floor(i / cols);
      const dist = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
      const maxDist = Math.sqrt(center.x ** 2 + center.y ** 2);
      return (maxDist - dist) / maxDist; // outside first
    });
  },

  // Diagonal wave from top-left
  diagonal: (items, cols) => {
    const maxDiag = cols + Math.ceil(items.length / cols);
    return items.map((_, i) => {
      const x = i % cols;
      const y = Math.floor(i / cols);
      return (x + y) / maxDiag;
    });
  },

  // Random scatter
  random: (items) => {
    return items.map(() => Math.random());
  },

  // Center burst outward
  center: (items, cols) => {
    const rows = Math.ceil(items.length / cols);
    const center = { x: (cols - 1) / 2, y: (rows - 1) / 2 };
    return items.map((_, i) => {
      const x = i % cols;
      const y = Math.floor(i / cols);
      const dist = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
      const maxDist = Math.sqrt(center.x ** 2 + center.y ** 2);
      return dist / maxDist; // center first
    });
  },

  // Horizontal wave
  wave: (items, cols) => {
    return items.map((_, i) => {
      const x = i % cols;
      const y = Math.floor(i / cols);
      return (x + Math.sin(y * 0.8) * 2) / (cols + 2);
    });
  },
};

export default function GridRevealWrapper({
  cols = 4,
  pattern = "center",
  className = "",
  style = {},
  children,
  revealKey = 0,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.children);
    if (items.length === 0) return;

    // Kill any running animations on these elements
    items.forEach((el) => gsap.killTweensOf(el));

    // Pick pattern (cycle through on each revealKey)
    const patternNames = Object.keys(PATTERNS);
    const patternName = pattern === "auto"
      ? patternNames[revealKey % patternNames.length]
      : pattern;
    const getOrder = PATTERNS[patternName] || PATTERNS.center;
    const orderValues = getOrder(items, cols);

    // Normalize order to 0–1 range for stagger delays
    const min = Math.min(...orderValues);
    const max = Math.max(...orderValues);
    const range = max - min || 1;
    const delays = orderValues.map((v) => ((v - min) / range) * 0.8);

    // Random 3D rotation axis per tile for variety
    const randomRotations = items.map(() => ({
      rotateX: (Math.random() - 0.5) * 180,
      rotateY: (Math.random() - 0.5) * 180,
      rotateZ: (Math.random() - 0.5) * 40,
    }));

    // Set initial state — hidden, scaled down, rotated
    items.forEach((el, i) => {
      gsap.set(el, {
        opacity: 0,
        scale: 0.3,
        rotateX: randomRotations[i].rotateX,
        rotateY: randomRotations[i].rotateY,
        rotateZ: randomRotations[i].rotateZ,
        transformPerspective: 800,
        transformOrigin: "center center",
      });
    });

    // Animate in with staggered delays based on pattern
    items.forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        duration: 0.7,
        delay: delays[i],
        ease: "back.out(1.4)",
        clearProps: "transform",
      });
    });

    return () => {
      items.forEach((el) => gsap.killTweensOf(el));
    };
  }, [revealKey, cols, pattern]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...style, perspective: "1000px" }}
    >
      {children}
    </div>
  );
}