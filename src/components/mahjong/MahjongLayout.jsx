/**
 * Mahjong Solitaire Layouts
 * 
 * Each layout is an array of tile positions: { row, col, layer }
 * - row/col: grid position (can use 0.5 offsets for stacking)
 * - layer: z-level (0 = ground, higher = stacked on top)
 * 
 * Total tiles MUST be even (for pairing) and divisible by 2.
 */

// ── Classic "Turtle" layout — exactly 144 tiles across 5 layers ──
function generateClassicTurtle() {
  const positions = [];
  
  // Layer 0: shaped base — 86 tiles
  // Main body rows 0-7, cols 0-11
  // Row 0: cols 2-9 (8 tiles)
  // Row 1: cols 1-10 (10 tiles)
  // Row 2: cols 0-11 (12 tiles)
  // Row 3: cols 0-11 (12 tiles) + left wing at -1 + far left at -2
  // Row 4: cols 0-11 (12 tiles) + right extension at 12
  // Row 5: cols 0-11 (12 tiles)
  // Row 6: cols 1-10 (10 tiles)
  // Row 7: cols 2-9 (8 tiles)
  
  const layer0Rows = [
    { row: 0, cols: [2,3,4,5,6,7,8,9] },           // 8
    { row: 1, cols: [1,2,3,4,5,6,7,8,9,10] },       // 10
    { row: 2, cols: [0,1,2,3,4,5,6,7,8,9,10,11] },  // 12
    { row: 3, cols: [0,1,2,3,4,5,6,7,8,9,10,11] },  // 12
    { row: 4, cols: [0,1,2,3,4,5,6,7,8,9,10,11] },  // 12
    { row: 5, cols: [0,1,2,3,4,5,6,7,8,9,10,11] },  // 12
    { row: 6, cols: [1,2,3,4,5,6,7,8,9,10] },       // 10
    { row: 7, cols: [2,3,4,5,6,7,8,9] },            // 8
  ];
  // That's 8+10+12+12+12+12+10+8 = 84
  for (const { row, cols } of layer0Rows) {
    for (const col of cols) {
      positions.push({ row, col, layer: 0 });
    }
  }
  // Wings: left side
  positions.push({ row: 3, col: -1, layer: 0 });
  positions.push({ row: 4, col: -1, layer: 0 });
  // Wings: right side
  positions.push({ row: 3, col: 12, layer: 0 });
  positions.push({ row: 4, col: 12, layer: 0 });
  // Layer 0 total: 84 + 4 = 88

  // Layer 1: 6x8 = 48 tiles (rows 1-6, cols 2-9)
  for (let r = 1; r <= 6; r++) {
    for (let c = 2; c <= 9; c++) {
      positions.push({ row: r + 0.5, col: c + 0.5, layer: 1 });
    }
  }
  // Running total: 88 + 48 = 136

  // Layer 2: 2x4 = 8 tiles (rows 3-4, cols 4-7, offset)
  // Need exactly 8 more to hit 144
  // Actually let's do a small layer
  // We need 144 - 136 = 8 more tiles
  // Layer 2: small 2x4 block
  for (let r = 3; r <= 4; r++) {
    for (let c = 4; c <= 7; c++) {
      positions.push({ row: r + 1, col: c + 1, layer: 2 });
    }
  }
  // Total: 136 + 8 = 144 ✓

  return positions;
}

// ── Medium "Pagoda" layout — exactly 108 tiles across 3 layers ──
function generatePagoda() {
  const positions = [];
  
  // Layer 0: 8x10 minus corners = 72 tiles
  const layer0Rows = [
    { row: 0, cols: [1,2,3,4,5,6,7,8] },             // 8
    { row: 1, cols: [0,1,2,3,4,5,6,7,8,9] },          // 10
    { row: 2, cols: [0,1,2,3,4,5,6,7,8,9] },          // 10
    { row: 3, cols: [0,1,2,3,4,5,6,7,8,9] },          // 10
    { row: 4, cols: [0,1,2,3,4,5,6,7,8,9] },          // 10
    { row: 5, cols: [0,1,2,3,4,5,6,7,8,9] },          // 10
    { row: 6, cols: [0,1,2,3,4,5,6,7,8,9] },          // 10
    { row: 7, cols: [1,2,3,4,5,6,7,8] },             // 8
  ];
  // 8+10+10+10+10+10+10+8 = 76
  for (const { row, cols } of layer0Rows) {
    for (const col of cols) {
      positions.push({ row, col, layer: 0 });
    }
  }

  // Layer 1: 6x4 = 24 tiles
  for (let r = 2; r <= 5; r++) {
    for (let c = 2; c <= 7; c++) {
      positions.push({ row: r + 0.5, col: c + 0.5, layer: 1 });
    }
  }
  // 76 + 24 = 100

  // Layer 2: 2x4 = 8 tiles
  for (let r = 3; r <= 4; r++) {
    for (let c = 3; c <= 6; c++) {
      positions.push({ row: r + 1, col: c + 1, layer: 2 });
    }
  }
  // 100 + 8 = 108 ✓

  return positions;
}

// ── Small "Fortress" layout — exactly 72 tiles across 2 layers ──
function generateFortress() {
  const positions = [];
  
  // Layer 0: 8x6 = 48 tiles
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      positions.push({ row: r, col: c, layer: 0 });
    }
  }

  // Layer 1: 6x4 = 24 tiles
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 7; c++) {
      positions.push({ row: r + 0.5, col: c + 0.5, layer: 1 });
    }
  }
  // 48 + 24 = 72 ✓

  return positions;
}

// Verify even count (safety net)
function ensureEven(positions) {
  if (positions.length % 2 !== 0) {
    // Remove one from highest layer
    const sorted = [...positions].sort((a, b) => b.layer - a.layer || b.row - a.row || b.col - a.col);
    return sorted.slice(1);
  }
  return positions;
}

export const LAYOUTS = {
  easy: { 
    name: "Fortress", 
    positions: ensureEven(generateFortress()),
    label: "Easy (72 tiles)",
    tileCount: 72,
  },
  medium: {
    name: "Pagoda",
    positions: ensureEven(generatePagoda()),
    label: "Medium (108 tiles)",
    tileCount: 108,
  },
  classic: { 
    name: "Classic Turtle", 
    positions: ensureEven(generateClassicTurtle()),
    label: "Classic (144 tiles)",
    tileCount: 144,
  },
};