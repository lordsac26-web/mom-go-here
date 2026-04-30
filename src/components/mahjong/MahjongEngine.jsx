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
 *    - Flowers: all 4 flowers match each other
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
 * Generate tiles for a given layout with guaranteed pair integrity.
 * Every tile in the pool has at least one matching partner.
 * @param {Array} positions - Array of {row, col, layer}
 * @returns {Array} tiles with id, position, tile data, and state
 */
export function generateTiles(positions) {
  const count = positions.length;
  const pairsNeeded = count / 2;
  let pool = [];

  // Build a pool of exactly count tiles with proper pairing
  // Strategy: pick tile types, add them in pairs (2 copies each)
  const allTypes = shuffle([...BASE_TILES, ...BASE_TILES, ...BASE_TILES]); // 34*3 = 102 types (allows up to 102 pairs)
  // Also include flowers/seasons as matchable pairs
  const bonusTypes = [...FLOWERS, ...SEASONS]; // 8 extra single types (but they match by group)

  // For flowers/seasons, they match each other in groups of 4, so add as pairs
  // flower: plum+orchid, chrysanthemum+bamboo_flower → 2 natural pairs
  // season: spring+summer, autumn+winter → 2 natural pairs
  
  if (count === 144) {
    // Standard set: 4 of each base (34×4=136) + 4 flowers + 4 seasons = 144
    for (const tile of BASE_TILES) {
      pool.push(tile, tile, tile, tile);
    }
    pool.push(...FLOWERS, ...SEASONS);
  } else {
    // For non-standard counts, build pairs from base tiles only
    const shuffledBase = shuffle([...BASE_TILES]);
    for (let i = 0; i < pairsNeeded && i < shuffledBase.length; i++) {
      pool.push({ ...shuffledBase[i] }, { ...shuffledBase[i] });
    }
    // If we need more pairs than 34, cycle through again
    let idx = 0;
    while (pool.length < count) {
      pool.push({ ...BASE_TILES[idx % BASE_TILES.length] }, { ...BASE_TILES[idx % BASE_TILES.length] });
      idx++;
    }
    // Trim to exact count (should already be exact)
    pool = pool.slice(0, count);
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
  
  // Check: is any tile on top? (any higher layer, overlapping position)
  // Two tiles overlap if their row AND col are within 0.9 units
  const hasAbove = active.some(t => {
    if (t.layer <= tile.layer) return false;
    return Math.abs(t.row - tile.row) < 0.9 && Math.abs(t.col - tile.col) < 0.9;
  });
  if (hasAbove) return false;
  
  // Check: is left OR right clear?
  // Left neighbor: same layer, overlapping row (within 0.9), col is ~1 unit to the left
  const hasLeft = active.some(t => {
    if (t.layer !== tile.layer) return false;
    const colDiff = tile.col - t.col;
    return colDiff > 0.1 && colDiff < 1.9 && Math.abs(t.row - tile.row) < 0.9;
  });
  
  const hasRight = active.some(t => {
    if (t.layer !== tile.layer) return false;
    const colDiff = t.col - tile.col;
    return colDiff > 0.1 && colDiff < 1.9 && Math.abs(t.row - tile.row) < 0.9;
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
 * Find one valid matching pair from free tiles (for hint system).
 * Returns [tile1, tile2] or null if no match exists.
 */
export function findHintPair(allTiles) {
  const free = getFreeTiles(allTiles);
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (canMatch(free[i], free[j])) return [free[i], free[j]];
    }
  }
  return null;
}

/**
 * Count remaining (non-removed) tiles.
 */
export function remainingCount(allTiles) {
  return allTiles.filter(t => !t.removed).length;
}