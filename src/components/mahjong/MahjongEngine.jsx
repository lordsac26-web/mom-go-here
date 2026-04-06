/**
 * Mahjong Solitaire game engine.
 * Handles tile generation, free-tile detection, and matching rules.
 * 
 * RULES:
 * 1. A tile is "free" only if it has NO tile on top AND at least one side (left OR right) is clear.
 * 2. Only free tiles can be selected.
 * 3. Two tiles match if they have the same "match group":
 *    - Suited tiles: same suit + same value
 *    - Winds: same wind
 *    - Dragons: same dragon
 *    - Flowers (seasons): all 4 flowers match each other
 *    - Seasons: all 4 seasons match each other
 * 4. Standard set: 4 copies of each of 34 base tiles + 4 flowers + 4 seasons = 144
 */

// 34 base tile types (each appears 4x in a standard set)
const BASE_TILES = [
  // Characters 1-9
  ...Array.from({ length: 9 }, (_, i) => ({ suit: "characters", value: i + 1, matchKey: `char-${i + 1}` })),
  // Circles 1-9
  ...Array.from({ length: 9 }, (_, i) => ({ suit: "circles", value: i + 1, matchKey: `circ-${i + 1}` })),
  // Bamboo 1-9
  ...Array.from({ length: 9 }, (_, i) => ({ suit: "bamboo", value: i + 1, matchKey: `bamb-${i + 1}` })),
  // Winds
  { suit: "wind", value: "east", matchKey: "wind-east" },
  { suit: "wind", value: "south", matchKey: "wind-south" },
  { suit: "wind", value: "west", matchKey: "wind-west" },
  { suit: "wind", value: "north", matchKey: "wind-north" },
  // Dragons
  { suit: "dragon", value: "red", matchKey: "dragon-red" },
  { suit: "dragon", value: "green", matchKey: "dragon-green" },
  { suit: "dragon", value: "white", matchKey: "dragon-white" },
];

// Flowers and Seasons (each unique tile, but all 4 flowers match each other, all 4 seasons match)
const FLOWERS = [
  { suit: "flower", value: "plum", matchKey: "flower" },
  { suit: "flower", value: "orchid", matchKey: "flower" },
  { suit: "flower", value: "chrysanthemum", matchKey: "flower" },
  { suit: "flower", value: "bamboo_flower", matchKey: "flower" },
];

const SEASONS = [
  { suit: "season", value: "spring", matchKey: "season" },
  { suit: "season", value: "summer", matchKey: "season" },
  { suit: "season", value: "autumn", matchKey: "season" },
  { suit: "season", value: "winter", matchKey: "season" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate tiles for a given layout.
 * @param {Array} positions - Array of {row, col, layer}
 * @returns {Array} tiles with id, position, tile data, and state
 */
export function generateTiles(positions) {
  const count = positions.length;
  
  // Build the tile pool: need count tiles total, in matched pairs/quads
  let pool = [];
  
  if (count <= 72) {
    // For smaller layouts, use a subset of base tiles (no flowers/seasons)
    const needed = count / 2; // pairs needed
    const available = [];
    // Each base tile can provide 2 pairs (4 copies = 2 pairs)
    for (const tile of BASE_TILES) {
      available.push({ ...tile });
      available.push({ ...tile });
      if (available.length >= needed) break;
    }
    pool = shuffle(available).slice(0, needed);
    pool = [...pool, ...pool]; // duplicate to get pairs
  } else {
    // Standard 144: 4 of each base + flowers + seasons
    for (const tile of BASE_TILES) {
      pool.push(tile, tile, tile, tile);
    }
    pool.push(...FLOWERS, ...SEASONS);
    
    // If layout needs fewer, trim (keep even)
    while (pool.length > count) {
      // Remove 4 at a time from the end
      pool.splice(pool.length - 4, 4);
    }
    // If layout needs more (shouldn't happen), pad
    while (pool.length < count) {
      const extra = BASE_TILES[Math.floor(Math.random() * BASE_TILES.length)];
      pool.push(extra, extra);
    }
  }
  
  pool = shuffle(pool);
  
  return positions.map((pos, i) => ({
    id: i,
    row: pos.row,
    col: pos.col,
    layer: pos.layer,
    suit: pool[i].suit,
    value: pool[i].value,
    matchKey: pool[i].matchKey,
    removed: false,
  }));
}

/**
 * Check if a tile is "free" (can be selected).
 * A tile is free if:
 * 1. No tile sits on top of it (overlapping in the layer above)
 * 2. At least one side (left or right) is clear of adjacent tiles on the same layer
 */
export function isTileFree(tile, allTiles) {
  const active = allTiles.filter(t => !t.removed && t.id !== tile.id);
  
  // Check: is any tile on top? (layer above, overlapping position)
  // A tile on top overlaps if its row/col ranges intersect
  const hasAbove = active.some(t => {
    if (t.layer <= tile.layer) return false;
    // Tiles overlap if within 1 unit of each other in both row and col
    return Math.abs(t.row - tile.row) < 1 && Math.abs(t.col - tile.col) < 1;
  });
  if (hasAbove) return false;
  
  // Check: is left OR right clear?
  // Left neighbor: same layer, same row (within 0.5), col is exactly 1 less
  const hasLeft = active.some(t => {
    if (t.layer !== tile.layer) return false;
    return Math.abs(t.row - tile.row) < 1 && Math.abs(t.col - (tile.col - 1)) < 0.5;
  });
  
  const hasRight = active.some(t => {
    if (t.layer !== tile.layer) return false;
    return Math.abs(t.row - tile.row) < 1 && Math.abs(t.col - (tile.col + 1)) < 0.5;
  });
  
  // Free if at least one side is open
  return !hasLeft || !hasRight;
}

/**
 * Check if two tiles can be matched.
 */
export function canMatch(tile1, tile2) {
  return tile1.id !== tile2.id && tile1.matchKey === tile2.matchKey;
}

/**
 * Get all currently free tiles.
 */
export function getFreeTiles(allTiles) {
  return allTiles.filter(t => !t.removed && isTileFree(t, allTiles));
}

/**
 * Check if any valid moves remain.
 */
export function hasValidMoves(allTiles) {
  const free = getFreeTiles(allTiles);
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (canMatch(free[i], free[j])) return true;
    }
  }
  return false;
}

/**
 * Count remaining (non-removed) tiles.
 */
export function remainingCount(allTiles) {
  return allTiles.filter(t => !t.removed).length;
}