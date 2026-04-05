import { useState } from "react";
import { Link } from "react-router-dom";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameInstructions from "../../components/GameInstructions";

function initBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = { player: 2, king: false };
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = { player: 1, king: false };
  return board;
}

function getMoves(board, r, c, jumpOnly = false) {
  const piece = board[r][c];
  if (!piece) return [];
  const dirs = piece.king ? [-1, 1] : piece.player === 1 ? [-1] : [1];
  const moves = [];

  for (const dr of dirs) {
    for (const dc of [-1, 1]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      if (!board[nr][nc]) {
        if (!jumpOnly) moves.push({ from: [r, c], to: [nr, nc], jump: null });
      } else if (board[nr][nc].player !== piece.player) {
        const jr = r + 2 * dr, jc = c + 2 * dc;
        if (jr >= 0 && jr <= 7 && jc >= 0 && jc <= 7 && !board[jr][jc]) {
          moves.push({ from: [r, c], to: [jr, jc], jump: [nr, nc] });
        }
      }
    }
  }
  return moves;
}

function getAllMoves(board, player) {
  const all = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.player === player)
        all.push(...getMoves(board, r, c));
  const jumps = all.filter(m => m.jump);
  return jumps.length ? jumps : all;
}

function applyMove(board, move) {
  const nb = board.map(row => row.map(p => p ? { ...p } : null));
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  nb[tr][tc] = { ...nb[fr][fc] };
  nb[fr][fc] = null;
  if (move.jump) nb[move.jump[0]][move.jump[1]] = null;
  if (tr === 0 && nb[tr][tc].player === 1) nb[tr][tc].king = true;
  if (tr === 7 && nb[tr][tc].player === 2) nb[tr][tc].king = true;
  return nb;
}

function computerMove(board) {
  const moves = getAllMoves(board, 2);
  if (!moves.length) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

export default function Checkers() {
  useGameTimer();
  const [board, setBoard] = useState(initBoard());
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState("Your turn! (🔴 pieces)");
  const [gameOver, setGameOver] = useState(false);

  function handleClick(r, c) {
    if (turn !== 1 || gameOver) return;
    const piece = board[r][c];
    const playerMoves = getAllMoves(board, 1);

    if (selected) {
      const move = playerMoves.find(m => m.from[0] === selected[0] && m.from[1] === selected[1] && m.to[0] === r && m.to[1] === c);
      if (move) {
        const newBoard = applyMove(board, move);
        setBoard(newBoard);
        setSelected(null);
        // Check if computer has moves
        const compMoves = getAllMoves(newBoard, 2);
        if (!compMoves.length) { setMessage("🎉 You win!"); setGameOver(true); return; }
        setTurn(2);
        setMessage("🤖 Computer thinking...");
        setTimeout(() => {
          const cm = computerMove(newBoard);
          if (!cm) { setMessage("🎉 You win!"); setGameOver(true); return; }
          const b2 = applyMove(newBoard, cm);
          setBoard(b2);
          const playerMovesAfter = getAllMoves(b2, 1);
          if (!playerMovesAfter.length) { setMessage("😔 Computer wins!"); setGameOver(true); return; }
          setTurn(1);
          setMessage("Your turn! (🔴 pieces)");
        }, 800);
        return;
      }
    }

    if (piece?.player === 1 && playerMoves.some(m => m.from[0] === r && m.from[1] === c)) {
      setSelected([r, c]);
    } else {
      setSelected(null);
    }
  }

  function reset() {
    setBoard(initBoard());
    setSelected(null);
    setTurn(1);
    setMessage("Your turn! (🔴 pieces)");
    setGameOver(false);
  }

  const validMoves = selected ? getAllMoves(board, 1).filter(m => m.from[0] === selected[0] && m.from[1] === selected[1]) : [];
  const validTargets = new Set(validMoves.map(m => `${m.to[0]},${m.to[1]}`));

  return (
    <div className="min-h-screen bg-background px-2 py-4 pb-24">
      <div className="flex items-center justify-between px-2 mb-4">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
        <div className="text-2xl font-black text-primary">⬛ Checkers</div>
        <div className="flex gap-2">
          <GameInstructions
            title="Checkers"
            emoji="⬛"
            steps={[
              "You play as the red pieces (🔴) at the bottom.",
              "Tap one of your pieces to select it — possible moves light up in yellow.",
              "Tap a highlighted square to move your piece diagonally forward.",
              "Jump over the computer's pieces to capture them!",
              "If a jump is available, you must take it.",
              "Reach the far side to make your piece a King (👑) — kings can move backwards too!",
              "Capture all of the computer's pieces to win."
            ]}
          />
          <button onClick={reset} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">🔄</button>
        </div>
      </div>

      <div className={`text-center text-2xl font-black mb-4 py-3 rounded-2xl mx-2 ${gameOver ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>
        {message}
      </div>

      <div className="flex justify-center px-2">
        <div className="border-4 border-foreground rounded-xl overflow-hidden w-full max-w-sm">
          {board.map((row, r) => (
            <div key={r} className="flex">
              {row.map((piece, c) => {
                const dark = (r + c) % 2 === 1;
                const isSel = selected && selected[0] === r && selected[1] === c;
                const isTarget = dark && validTargets.has(`${r},${c}`);
                return (
                  <button key={c} onClick={() => handleClick(r, c)}
                    className={`flex-1 aspect-square flex items-center justify-center transition-all ${
                      dark ? "bg-amber-900" : "bg-amber-100"
                    } ${isTarget ? "ring-4 ring-inset ring-yellow-400" : ""}`}>
                    {piece && (
                      <div className={`checker-piece w-[75%] aspect-square flex items-center justify-center text-xs sm:text-lg font-black ${
                        piece.player === 1 ? "bg-red-600" : "bg-gray-800"
                      } ${isSel ? "ring-4 ring-yellow-300" : ""}`}>
                        {piece.king ? "👑" : ""}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="text-center mt-4">
        <span className="text-muted-foreground text-lg">🔴 = You &nbsp;&nbsp; ⚫ = Computer</span>
      </div>
    </div>
  );
}