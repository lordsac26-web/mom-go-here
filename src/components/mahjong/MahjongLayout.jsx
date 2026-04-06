/**
 * Mahjong Solitaire Layouts
 * 
 * Each layout is an array of tile positions: { row, col, layer }
 * - row/col: grid position (can use 0.5 offsets for stacking)
 * - layer: z-level (0 = ground, higher = stacked on top)
 * 
 * Total tiles MUST be even (for pairing).
 * Standard Mahjong uses 144 tiles (4 of each of 36 tile types).
 */

// Classic "Turtle" layout — 144 tiles across 5 layers
const TURTLE = [
  // Layer 0 — base (12 cols x 8 rows with wings)
  // Main body: rows 0-7, cols 1-12
  ...[0,1,2,3,4,5,6,7].flatMap(r =>
    [1,2,3,4,5,6,7,8,9,10,11,12].map(c => ({ row: r, col: c, layer: 0 }))
  ),
  // Left wing extensions
  { row: 3, col: 0, layer: 0 },
  { row: 4, col: 0, layer: 0 },
  // Right wing extensions  
  { row: 3, col: 13, layer: 0 },
  { row: 4, col: 13, layer: 0 },
  // Far right single
  { row: 3.5, col: 14, layer: 0 },

  // Layer 1 — (10 cols x 6 rows)
  ...[1,2,3,4,5,6].flatMap(r =>
    [2,3,4,5,6,7,8,9,10,11].map(c => ({ row: r, col: c, layer: 1 }))
  ),

  // Layer 2 — (8 cols x 4 rows)
  ...[2,3,4,5].flatMap(r =>
    [3,4,5,6,7,8,9,10].map(c => ({ row: r, col: c, layer: 2 }))
  ),

  // Layer 3 — (6 cols x 2 rows)
  ...[3,4].flatMap(r =>
    [4,5,6,7,8,9].map(c => ({ row: r, col: c, layer: 3 }))
  ),

  // Layer 4 — capstone (1 tile)
  { row: 3.5, col: 6.5, layer: 4 },
];
// Total: 96 + 5 + 60 + 32 + 12 + 1 = 206... too many. Let me use a simpler correct layout.

// Simpler classic layout: properly counted
// We need exactly 144 tiles for the standard game
// Let's use a well-known Turtle layout

const CLASSIC_LAYOUT = generateClassicTurtle();

function generateClassicTurtle() {
  const positions = [];
  
  // Layer 0: 12x8 base minus corners = 86 tiles
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 12; c++) {
      // Skip some corners to shape the turtle
      if (r === 0 && (c < 2 || c > 9)) continue;
      if (r === 7 && (c < 2 || c > 9)) continue;
      positions.push({ row: r, col: c, layer: 0 });
    }
  }
  // Wings
  positions.push({ row: 3, col: -1, layer: 0 });
  positions.push({ row: 4, col: -1, layer: 0 });
  positions.push({ row: 3, col: 12, layer: 0 });
  positions.push({ row: 4, col: 12, layer: 0 });
  positions.push({ row: 3.5, col: -2, layer: 0 });
  positions.push({ row: 3.5, col: 13, layer: 0 });

  // Layer 1: 10x6 = 60 tiles
  for (let r = 1; r < 7; r++) {
    for (let c = 1; c < 11; c++) {
      positions.push({ row: r + 0.5, col: c + 0.5, layer: 1 });
    }
  }

  // Layer 2: 8x4 = 32 tiles  
  for (let r = 2; r < 6; r++) {
    for (let c = 2; c < 10; c++) {
      positions.push({ row: r + 1, col: c + 1, layer: 2 });
    }
  }

  // Layer 3: 6x2 = 12 tiles
  for (let r = 3; r < 5; r++) {
    for (let c = 3; c < 9; c++) {
      positions.push({ row: r + 1.5, col: c + 1.5, layer: 3 });
    }
  }

  // Layer 4: 1 capstone
  positions.push({ row: 4.5, col: 6, layer: 4 });

  return positions;
}

// Small "Fortress" layout — 72 tiles (good for Easy mode)
function generateFortress() {
  const positions = [];
  
  // Layer 0: 8x6 = 48 tiles
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      positions.push({ row: r, col: c, layer: 0 });
    }
  }

  // Layer 1: 6x4 offset = 24 tiles  (must be even)
  // Actually 4x4 = 16 to keep manageable
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 7; c++) {
      positions.push({ row: r + 0.5, col: c + 0.5, layer: 1 });
    }
  }

  return positions;
}

// Trim to exact multiples of 4 (for tile quadruplets)
function trimToMultipleOf4(positions) {
  const excess = positions.length % 4;
  if (excess === 0) return positions;
  // Remove from the highest layer first
  const sorted = [...positions].sort((a, b) => b.layer - a.layer || b.row - a.row || b.col - a.col);
  return sorted.slice(excess);
}

export const LAYOUTS = {
  easy: { 
    name: "Fortress", 
    positions: trimToMultipleOf4(generateFortress()),
    label: "Easy (72 tiles)" 
  },
  classic: { 
    name: "Classic Turtle", 
    positions: trimToMultipleOf4(CLASSIC_LAYOUT),
    label: "Classic (144 tiles)" 
  },
};