import { useState } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import GameInstructions from "../../components/GameInstructions";

function checkWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line: [a,b,c] };
  }
  return null;
}

function bestMove(board) {
  // Simple AI: win if possible, block, else random center/corner/edge
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (let [a,b,c] of lines) {
    if (board[a] === "O" && board[b] === "O" && !board[c]) return c;
    if (board[a] === "O" && board[c] === "O" && !board[b]) return b;
    if (board[b] === "O" && board[c] === "O" && !board[a]) return a;
  }
  for (let [a,b,c] of lines) {
    if (board[a] === "X" && board[b] === "X" && !board[c]) return c;
    if (board[a] === "X" && board[c] === "X" && !board[b]) return b;
    if (board[b] === "X" && board[c] === "X" && !board[a]) return a;
  }
  if (!board[4]) return 4;
  const corners = [0,2,6,8].filter(i => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const empty = board.map((v,i) => !v ? i : null).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToe() {
  useGameTimer();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState("");

  const result = checkWinner(board);

  function handleClick(i) {
    if (board[i] || gameOver || !xIsNext) return;
    const newBoard = [...board];
    newBoard[i] = "X";
    const res = checkWinner(newBoard);
    if (res) { setBoard(newBoard); setStatus("🎉 You Win!"); setGameOver(true); return; }
    if (newBoard.every(Boolean)) { setBoard(newBoard); setStatus("🤝 It's a Draw!"); setGameOver(true); return; }
    setXIsNext(false);
    setBoard(newBoard);

    setTimeout(() => {
      const move = bestMove(newBoard);
      if (move === undefined) return;
      const b2 = [...newBoard];
      b2[move] = "O";
      const r2 = checkWinner(b2);
      setBoard(b2);
      if (r2) { setStatus("🤖 Computer Wins!"); setGameOver(true); }
      else if (b2.every(Boolean)) { setStatus("🤝 It's a Draw!"); setGameOver(true); }
      else setXIsNext(true);
    }, 600);
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setGameOver(false);
    setStatus("");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24">
      <div className="flex items-center justify-between w-full px-4 mb-4">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
        <GameInstructions
          title="Tic Tac Toe"
          emoji="❌"
          steps={[
            "You play as ❌ and the computer plays as ⭕.",
            "Tap any empty square to place your X.",
            "Get three in a row (horizontal, vertical, or diagonal) to win!",
            "The computer will try to block you and win — think ahead!",
            "If all squares fill up with no winner, it's a draw."
          ]}
        />
      </div>
      <div className="text-6xl mb-2">❌⭕</div>
      <h1 className="text-4xl font-black text-primary mb-2">Tic Tac Toe</h1>
      <p className="text-xl text-muted-foreground mb-2">You are ❌ — Computer is ⭕</p>

      {gameOver ? (
        <div className="text-4xl font-black text-primary my-6">{status}</div>
      ) : (
        <div className="text-2xl text-foreground font-bold my-4">
          {xIsNext ? "👆 Your turn (❌)" : "🤖 Computer thinking..."}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8 max-w-xs mx-auto w-full px-4">
        {board.map((val, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`aspect-square text-4xl sm:text-6xl font-black rounded-2xl border-4 shadow-xl transition-all ${
              result?.line?.includes(i) ? "bg-primary border-primary text-primary-foreground" :
              val === "X" ? "bg-blue-700 border-blue-400 text-white" :
              val === "O" ? "bg-red-700 border-red-400 text-white" :
              "bg-card border-border hover:border-primary"
            }`}
          >
            {val}
          </button>
        ))}
      </div>

      <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl">
        🔄 New Game
      </button>
    </div>
  );
}