import { useRef, useCallback } from "react";
import gsap from "gsap";

/**
 * GSAP Grid Pattern Reveal — multiple reveal patterns for NxN grids.
 * Returns a ref to attach to the grid container, and a `reveal(pattern)` function.
 *
 * Patterns: spiral, wave, diagonal, random, ripple, cascade, snake, checkerboard
 */

// Sort helpers — return ordered indices for each pattern
function spiralOrder(rows, cols) {
  const result = [];
  let top = 0, bottom = rows - 1, left = 0, right = cols - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) result.push([top, c]);
    top++;
    for (let r = top; r <= bottom; r++) result.push([r, right]);
    right--;
    if (top <= bottom) { for (let c = right; c >= left; c--) result.push([bottom, c]); bottom--; }
    if (left <= right) { for (let r = bottom; r >= top; r--) result.push([r, left]); left++; }
  }
  return result;
}

function waveOrder(rows, cols) {
  const result = [];
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++)
      result.push([r, c]);
  return result;
}

function diagonalOrder(rows, cols) {
  const result = [];
  for (let d = 0; d < rows + cols - 1; d++)
    for (let r = Math.max(0, d - cols + 1); r <= Math.min(d, rows - 1); r++)
      result.push([r, d - r]);
  return result;
}

function randomOrder(rows, cols) {
  const result = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result.push([r, c]);
  return result.sort(() => Math.random() - 0.5);
}

function rippleOrder(rows, cols) {
  const cx = (rows - 1) / 2, cy = (cols - 1) / 2;
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push({ r, c, dist: Math.sqrt((r - cx) ** 2 + (c - cy) ** 2) });
  cells.sort((a, b) => a.dist - b.dist);
  return cells.map(({ r, c }) => [r, c]);
}

function cascadeOrder(rows, cols) {
  const result = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result.push([r, c]);
  return result;
}

function snakeOrder(rows, cols) {
  const result = [];
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 0) for (let c = 0; c < cols; c++) result.push([r, c]);
    else for (let c = cols - 1; c >= 0; c--) result.push([r, c]);
  }
  return result;
}

function checkerboardOrder(rows, cols) {
  const evens = [], odds = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      ((r + c) % 2 === 0 ? evens : odds).push([r, c]);
  return [...evens, ...odds];
}

const PATTERNS = {
  spiral: spiralOrder,
  wave: waveOrder,
  diagonal: diagonalOrder,
  random: randomOrder,
  ripple: rippleOrder,
  cascade: cascadeOrder,
  snake: snakeOrder,
  checkerboard: checkerboardOrder,
};

export const PATTERN_LIST = [
  { key: "spiral", name: "Spiral", emoji: "🌀" },
  { key: "wave", name: "Wave", emoji: "🌊" },
  { key: "diagonal", name: "Diagonal", emoji: "↘️" },
  { key: "ripple", name: "Ripple", emoji: "💧" },
  { key: "cascade", name: "Cascade", emoji: "⬇️" },
  { key: "snake", name: "Snake", emoji: "🐍" },
  { key: "checkerboard", name: "Checker", emoji: "♟️" },
  { key: "random", name: "Random", emoji: "🎲" },
];

export default function useGridReveal(rows, cols) {
  const gridRef = useRef(null);
  const tlRef = useRef(null);

  const reveal = useCallback((pattern = "spiral") => {
    const container = gridRef.current;
    if (!container) return;
    const cells = container.children;
    if (!cells.length) return;

    // Kill any running timeline
    if (tlRef.current) tlRef.current.kill();

    const orderFn = PATTERNS[pattern] || PATTERNS.spiral;
    const ordered = orderFn(rows, cols);

    // Reset all cells instantly
    gsap.set(cells, { opacity: 0, scale: 0.3, rotateX: 90, y: 20 });

    const tl = gsap.timeline({
      defaults: { ease: "back.out(1.7)", duration: 0.35 },
    });

    // Stagger based on ordered indices
    ordered.forEach(([r, c], i) => {
      const idx = r * cols + c;
      if (idx < cells.length) {
        tl.to(cells[idx], {
          opacity: 1,
          scale: 1,
          rotateX: 0,
          y: 0,
          duration: 0.3 + Math.random() * 0.1,
        }, i * 0.018); // tight stagger for fluid feel
      }
    });

    tlRef.current = tl;
  }, [rows, cols]);

  return { gridRef, reveal };
}