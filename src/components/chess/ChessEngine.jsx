/**
 * Lightweight chess engine.
 * Board: 8x8 array, row 0 = top (black home rank), row 7 = bottom (white home rank).
 * Player 1 = white (bottom, moves up), Player 2 = black (top, moves down).
 * Piece: { player: 1|2, type: "p"|"n"|"b"|"r"|"q"|"k", moved?: boolean }
 *
 * Supports: all standard moves, castling, en passant, promotion (auto-queen),
 * check / checkmate / stalemate detection, and a minimax AI with alpha-beta pruning.
 */

const DIRS = {
  rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  bishop: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  king: [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]],
  knight: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
};

export function initBoard() {
  const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { player: 2, type: back[c], moved: false };
    board[1][c] = { player: 2, type: "p", moved: false };
    board[6][c] = { player: 1, type: "p", moved: false };
    board[7][c] = { player: 1, type: back[c], moved: false };
  }
  return board;
}

function cloneBoard(board) {
  return board.map(row => row.map(p => (p ? { ...p } : null)));
}

const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

/** Find the king position for a player. */
function findKing(board, player) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.player === player && p.type === "k") return [r, c];
    }
  return null;
}

/** Is square (r,c) attacked by `attacker` player? (ignores en passant / castling) */
export function isSquareAttacked(board, r, c, attacker) {
  // Pawn attacks
  const pd = attacker === 1 ? -1 : 1; // white pawns attack upward
  for (const dc of [-1, 1]) {
    const pr = r - pd, pc = c - dc; // reverse: which pawn square would attack (r,c)
    if (inBounds(pr, pc)) {
      const p = board[pr][pc];
      if (p && p.player === attacker && p.type === "p") return true;
    }
  }
  // Knight
  for (const [dr, dc] of DIRS.knight) {
    const nr = r + dr, nc = c + dc;
    if (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.player === attacker && p.type === "n") return true;
    }
  }
  // King
  for (const [dr, dc] of DIRS.king) {
    const nr = r + dr, nc = c + dc;
    if (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.player === attacker && p.type === "k") return true;
    }
  }
  // Sliding: rook/queen
  for (const [dr, dc] of DIRS.rook) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.player === attacker && (p.type === "r" || p.type === "q")) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  // Sliding: bishop/queen
  for (const [dr, dc] of DIRS.bishop) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.player === attacker && (p.type === "b" || p.type === "q")) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  return false;
}

export function inCheck(board, player) {
  const k = findKing(board, player);
  if (!k) return false;
  return isSquareAttacked(board, k[0], k[1], player === 1 ? 2 : 1);
}

/**
 * Pseudo-legal moves for a single piece (before check filtering).
 * enPassant = [r, c] of the square a pawn can capture into, or null.
 */
function pieceMoves(board, r, c, enPassant) {
  const piece = board[r][c];
  if (!piece) return [];
  const moves = [];
  const me = piece.player;
  const push = (tr, tc, extra = {}) => moves.push({ from: [r, c], to: [tr, tc], ...extra });

  if (piece.type === "p") {
    const dir = me === 1 ? -1 : 1;
    const startRow = me === 1 ? 6 : 1;
    const oneR = r + dir;
    // forward
    if (inBounds(oneR, c) && !board[oneR][c]) {
      push(oneR, c, { promo: oneR === 0 || oneR === 7 });
      const twoR = r + 2 * dir;
      if (r === startRow && !board[twoR][c]) push(twoR, c, { double: true });
    }
    // captures
    for (const dc of [-1, 1]) {
      const tr = r + dir, tc = c + dc;
      if (!inBounds(tr, tc)) continue;
      const t = board[tr][tc];
      if (t && t.player !== me) push(tr, tc, { promo: tr === 0 || tr === 7, capture: true });
      // en passant
      else if (enPassant && enPassant[0] === tr && enPassant[1] === tc) {
        push(tr, tc, { enPassant: true, capture: true });
      }
    }
  } else if (piece.type === "n") {
    for (const [dr, dc] of DIRS.knight) {
      const tr = r + dr, tc = c + dc;
      if (!inBounds(tr, tc)) continue;
      const t = board[tr][tc];
      if (!t || t.player !== me) push(tr, tc, { capture: !!t });
    }
  } else if (piece.type === "k") {
    for (const [dr, dc] of DIRS.king) {
      const tr = r + dr, tc = c + dc;
      if (!inBounds(tr, tc)) continue;
      const t = board[tr][tc];
      if (!t || t.player !== me) push(tr, tc, { capture: !!t });
    }
    // castling
    if (!piece.moved && !inCheck(board, me)) {
      const opp = me === 1 ? 2 : 1;
      // kingside
      const kr = board[r][7];
      if (kr && kr.type === "r" && !kr.moved && !board[r][5] && !board[r][6]
        && !isSquareAttacked(board, r, 5, opp) && !isSquareAttacked(board, r, 6, opp)) {
        push(r, 6, { castle: "k" });
      }
      // queenside
      const qr = board[r][0];
      if (qr && qr.type === "r" && !qr.moved && !board[r][1] && !board[r][2] && !board[r][3]
        && !isSquareAttacked(board, r, 3, opp) && !isSquareAttacked(board, r, 2, opp)) {
        push(r, 2, { castle: "q" });
      }
    }
  } else {
    const dirs = piece.type === "r" ? DIRS.rook : piece.type === "b" ? DIRS.bishop : DIRS.king;
    for (const [dr, dc] of dirs) {
      let tr = r + dr, tc = c + dc;
      while (inBounds(tr, tc)) {
        const t = board[tr][tc];
        if (!t) push(tr, tc);
        else { if (t.player !== me) push(tr, tc, { capture: true }); break; }
        tr += dr; tc += dc;
      }
    }
  }
  return moves;
}

/**
 * Apply a move to a fresh board. Returns { board, enPassant } where enPassant is
 * the target square available to the opponent next turn (or null).
 */
export function applyMove(board, move) {
  const nb = cloneBoard(board);
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = { ...nb[fr][fc] };

  let newEnPassant = null;

  // En passant capture — remove the pawn behind the target
  if (move.enPassant) {
    nb[fr][tc] = null;
  }

  nb[tr][tc] = piece;
  nb[fr][fc] = null;
  piece.moved = true;

  // Double pawn push → set en-passant target
  if (move.double) {
    newEnPassant = [(fr + tr) / 2, tc];
  }

  // Promotion (auto-queen)
  if (move.promo) piece.type = "q";

  // Castling — move the rook too
  if (move.castle === "k") {
    nb[tr][5] = { ...nb[tr][7], moved: true };
    nb[tr][7] = null;
  } else if (move.castle === "q") {
    nb[tr][3] = { ...nb[tr][0], moved: true };
    nb[tr][0] = null;
  }

  return { board: nb, enPassant: newEnPassant };
}

/** All fully-legal moves for a player (filtered so the king is not left in check). */
export function getAllMoves(board, player, enPassant = null) {
  const legal = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.player !== player) continue;
      for (const m of pieceMoves(board, r, c, enPassant)) {
        const { board: nb } = applyMove(board, m);
        if (!inCheck(nb, player)) legal.push(m);
      }
    }
  }
  return legal;
}

/** Legal moves originating from a specific square. */
export function getMovesFrom(board, r, c, player, enPassant = null) {
  return getAllMoves(board, player, enPassant).filter(m => m.from[0] === r && m.from[1] === c);
}

export function getGameStatus(board, player, enPassant = null) {
  const moves = getAllMoves(board, player, enPassant);
  if (moves.length > 0) return "playing";
  return inCheck(board, player) ? "checkmate" : "stalemate";
}

// ── AI: minimax with alpha-beta pruning ──

const PIECE_VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-square tables (from white's perspective; flipped for black)
const PST = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  b: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  r: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  q: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  k: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
};

/** Static evaluation from AI's (player 2 / black) perspective — positive = good for black. */
function evaluate(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const base = PIECE_VALUE[p.type];
      // For white, PST uses row r directly; for black, mirror the row.
      const pst = p.player === 1 ? PST[p.type][r][c] : PST[p.type][7 - r][c];
      const val = base + pst;
      score += p.player === 2 ? val : -val;
    }
  }
  return score;
}

function orderMoves(moves) {
  // Captures first for better pruning
  return [...moves].sort((a, b) => (b.capture ? 1 : 0) - (a.capture ? 1 : 0));
}

function minimax(board, depth, alpha, beta, maximizing, enPassant) {
  const player = maximizing ? 2 : 1;
  const moves = getAllMoves(board, player, enPassant);

  if (moves.length === 0) {
    // Checkmate or stalemate
    if (inCheck(board, player)) return maximizing ? -100000 - depth : 100000 + depth;
    return 0; // stalemate
  }
  if (depth === 0) return evaluate(board);

  const ordered = orderMoves(moves);
  if (maximizing) {
    let best = -Infinity;
    for (const m of ordered) {
      const { board: nb, enPassant: ep } = applyMove(board, m);
      const val = minimax(nb, depth - 1, alpha, beta, false, ep);
      best = Math.max(best, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of ordered) {
      const { board: nb, enPassant: ep } = applyMove(board, m);
      const val = minimax(nb, depth - 1, alpha, beta, true, ep);
      best = Math.min(best, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

/**
 * Choose the AI move (always plays player 2 / black).
 * difficulty: "easy" | "medium" | "hard"
 *   easy   → depth 1 with 45% random move (blunders often)
 *   medium → depth 2
 *   hard   → depth 3
 */
export function computerMove(board, enPassant = null, difficulty = "medium") {
  const moves = getAllMoves(board, 2, enPassant);
  if (moves.length === 0) return null;

  if (difficulty === "easy" && Math.random() < 0.45) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = difficulty === "easy" ? 1 : difficulty === "hard" ? 3 : 2;

  let bestVal = -Infinity;
  let bestMoves = [];
  for (const m of orderMoves(moves)) {
    const { board: nb, enPassant: ep } = applyMove(board, m);
    const val = minimax(nb, depth - 1, -Infinity, Infinity, false, ep);
    if (val > bestVal) { bestVal = val; bestMoves = [m]; }
    else if (val === bestVal) bestMoves.push(m);
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}