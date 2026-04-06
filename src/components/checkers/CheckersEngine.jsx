/**
 * Checkers game engine with authentic American Checkers rules.
 * 
 * RULES:
 * 1. Regular pieces move diagonally forward one square.
 * 2. Kings can move diagonally forward or backward one square.
 * 3. Captures are mandatory — if a jump is available, you must take it.
 * 4. Multi-jump: after capturing, if the same piece can capture again, it must continue.
 * 5. A piece reaching the opposite end becomes a King. In American checkers, 
 *    promotion ends the turn (no continuing jumps after crowning).
 * 6. Player 1 = red (bottom, moves up), Player 2 = black (top, moves down).
 */

export function initBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = { player: 2, king: false };
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = { player: 1, king: false };
  return board;
}

/**
 * Get moves for a single piece.
 * @param {boolean} jumpOnly - If true, only return jumps (for multi-jump chains)
 */
export function getMoves(board, r, c, jumpOnly = false) {
  const piece = board[r][c];
  if (!piece) return [];
  const dirs = piece.king ? [-1, 1] : piece.player === 1 ? [-1] : [1];
  const moves = [];

  for (const dr of dirs) {
    for (const dc of [-1, 1]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;

      if (!board[nr][nc] && !jumpOnly) {
        moves.push({ from: [r, c], to: [nr, nc], jumps: [] });
      } else if (board[nr][nc] && board[nr][nc].player !== piece.player) {
        const jr = r + 2 * dr, jc = c + 2 * dc;
        if (jr >= 0 && jr <= 7 && jc >= 0 && jc <= 7 && !board[jr][jc]) {
          moves.push({ from: [r, c], to: [jr, jc], jumps: [[nr, nc]] });
        }
      }
    }
  }
  return moves;
}

/**
 * Get ALL possible multi-jump sequences for a piece starting at (r, c).
 * Returns array of moves, each with a `jumps` array listing all captured positions.
 */
export function getJumpChains(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];

  const chains = [];

  function dfs(currentBoard, row, col, capturedSoFar, wasKing) {
    const singleJumps = getMoves(currentBoard, row, col, true);
    
    if (singleJumps.length === 0) {
      // No more jumps — record chain if we captured at least one
      if (capturedSoFar.length > 0) {
        chains.push({
          from: [r, c],
          to: [row, col],
          jumps: [...capturedSoFar],
        });
      }
      return;
    }

    for (const jump of singleJumps) {
      const [tr, tc] = jump.to;
      const [jr, jc] = jump.jumps[0];

      // Apply this single jump on a temporary board
      const tempBoard = currentBoard.map(row => row.map(p => p ? { ...p } : null));
      tempBoard[tr][tc] = { ...tempBoard[row][col] };
      tempBoard[row][col] = null;
      tempBoard[jr][jc] = null;

      // Check promotion: in American checkers, promotion ends the turn
      const promoted = !wasKing && (
        (piece.player === 1 && tr === 0) ||
        (piece.player === 2 && tr === 7)
      );
      if (promoted) {
        tempBoard[tr][tc].king = true;
        // Promotion ends turn — record this chain and stop
        chains.push({
          from: [r, c],
          to: [tr, tc],
          jumps: [...capturedSoFar, [jr, jc]],
          promoted: true,
        });
      } else {
        dfs(tempBoard, tr, tc, [...capturedSoFar, [jr, jc]], tempBoard[tr][tc].king);
      }
    }
  }

  dfs(board, r, c, [], piece.king);
  return chains;
}

/**
 * Get all legal moves for a player. If any jump exists, only jumps are returned.
 * Jump moves include full multi-jump chains.
 */
export function getAllMoves(board, player) {
  // First check if any jumps exist
  let allJumps = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.player === player) {
        const chains = getJumpChains(board, r, c);
        allJumps.push(...chains);
      }
    }
  }

  if (allJumps.length > 0) return allJumps;

  // No jumps — return simple moves
  const simpleMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.player === player) {
        const moves = getMoves(board, r, c, false).filter(m => m.jumps.length === 0);
        simpleMoves.push(...moves);
      }
    }
  }
  return simpleMoves;
}

/**
 * Apply a move (including multi-jump) to the board.
 */
export function applyMove(board, move) {
  const nb = board.map(row => row.map(p => p ? { ...p } : null));
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;

  nb[tr][tc] = { ...nb[fr][fc] };
  nb[fr][fc] = null;

  // Remove all jumped pieces
  for (const [jr, jc] of move.jumps) {
    nb[jr][jc] = null;
  }

  // King promotion
  if (nb[tr][tc].player === 1 && tr === 0) nb[tr][tc].king = true;
  if (nb[tr][tc].player === 2 && tr === 7) nb[tr][tc].king = true;

  return nb;
}

/**
 * Simple AI: prioritize jumps with most captures, then random.
 */
export function computerMove(board) {
  const moves = getAllMoves(board, 2);
  if (!moves.length) return null;

  // Prefer the longest jump chain
  const maxJumps = Math.max(...moves.map(m => m.jumps.length));
  const best = moves.filter(m => m.jumps.length === maxJumps);
  
  // Among equal chains, prefer king-making moves
  const kingMakers = best.filter(m => m.to[0] === 7);
  const pool = kingMakers.length > 0 ? kingMakers : best;

  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Count pieces for each player.
 */
export function countPieces(board) {
  let p1 = 0, p1k = 0, p2 = 0, p2k = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.player === 1) { p1++; if (p.king) p1k++; }
      else { p2++; if (p.king) p2k++; }
    }
  }
  return { p1, p1k, p2, p2k };
}