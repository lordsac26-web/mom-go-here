import { useState, useCallback, useMemo } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import useConfetti from "../../hooks/useConfetti";
import SVGBoard from "../../components/tictactoe/SVGBoard";
import SVGMark from "../../components/tictactoe/SVGMark";
import SVGWinLine from "../../components/tictactoe/SVGWinLine";

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a,b,c] };
  }
  return null;
}

function bestMove(board) {
  // Win if possible
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] === "O" && board[b] === "O" && !board[c]) return c;
    if (board[a] === "O" && board[c] === "O" && !board[b]) return b;
    if (board[b] === "O" && board[c] === "O" && !board[a]) return a;
  }
  // Block player win
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] === "X" && board[b] === "X" && !board[c]) return c;
    if (board[a] === "X" && board[c] === "X" && !board[b]) return b;
    if (board[b] === "X" && board[c] === "X" && !board[a]) return a;
  }
  if (!board[4]) return 4;
  const corners = [0,2,6,8].filter(i => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const empty = board.map((v,i) => (!v ? i : null)).filter(v => v !== null);
  // FIX (bug): when the board is full, bestMove previously returned undefined
  // and the caller silently bailed without ever setting gameOver — a drawn game
  // initiated by the computer's path was never declared. Returning null (not
  // undefined) lets the caller distinguish "no move possible" from "bad value".
  return empty.length > 0 ? empty[Math.floor(Math.random() * empty.length)] : null;
}

export default function TicTacToe() {
  useGameTimer();
  const { tapVibrate, winVibrate } = useHaptics();
  const { uiClickSound, winSound } = useGameAudio();
  const { fireworks, emojiRain } = useConfetti();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState("");
  const [boardReady, setBoardReady] = useState(false);
  const [boardKey, setBoardKey] = useState(0);

  const onBoardDrawn = useCallback(() => setBoardReady(true), []);

  // FIX (perf): memoize the win result so checkWinner isn't called 9+ times
  // per render (once for result, then once per cell for result?.line?.includes).
  const result = useMemo(() => checkWinner(board), [board]);

  // FIX (perf): precompute the set of winning cell indices so the per-cell
  // check in the render loop is a Set.has() rather than array.includes().
  const winningCellSet = useMemo(
    () => new Set(result?.line ?? []),
    [result]
  );

  function handleClick(i) {
    if (!boardReady || board[i] || gameOver || !xIsNext) return;
    tapVibrate();
    uiClickSound();
    const newBoard = [...board];
    newBoard[i] = "X";
    const res = checkWinner(newBoard);
    if (res) {
      setBoard(newBoard);
      setStatus("🎉 You Win!");
      setGameOver(true);
      winVibrate(); winSound(); fireworks(); emojiRain(["❌", "🏆", "⭐"]);
      return;
    }
    if (newBoard.every(Boolean)) {
      setBoard(newBoard);
      setStatus("🤝 It's a Draw!");
      setGameOver(true);
      return;
    }
    setXIsNext(false);
    setBoard(newBoard);

    setTimeout(() => {
      // FIX (bug): read state functionally inside the timeout so we always operate
      // on the latest board. The previous code closed over `newBoard` from the
      // outer scope — if reset() fired during the 600ms window, the stale newBoard
      // would overwrite the fresh state.
      setBoard(prev => {
        // If the game was reset during the delay, bail out cleanly
        if (prev.every(v => v === null)) return prev;

        const move = bestMove(prev);
        // FIX (bug): null means no empty cell — declare a draw rather than
        // silently doing nothing (previously returned undefined which skipped
        // the draw declaration entirely).
        if (move === null) {
          setStatus("🤝 It's a Draw!");
          setGameOver(true);
          return prev;
        }
        const b2 = [...prev];
        b2[move] = "O";
        const r2 = checkWinner(b2);
        if (r2) {
          setStatus("🤖 Computer Wins!");
          setGameOver(true);
        } else if (b2.every(Boolean)) {
          setStatus("🤝 It's a Draw!");
          setGameOver(true);
        } else {
          setXIsNext(true);
        }
        return b2;
      });
    }, 600);
  }

  function reset() {
    setBoardReady(false);
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setGameOver(false);
    setStatus("");
    setBoardKey(k => k + 1);
  }

  const GRID_SIZE = 300;
  const CELL_SIZE = GRID_SIZE / 3;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24">
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
          {!boardReady ? "✏️ Drawing board..." : xIsNext ? "👆 Your turn (❌)" : "🤖 Computer thinking..."}
        </div>
      )}

      {/* SVG Game Board */}
      <div className="relative mb-8" style={{ width: GRID_SIZE, height: GRID_SIZE }}>
        <SVGBoard key={boardKey} size={GRID_SIZE} onDrawComplete={onBoardDrawn} />

        {result && <SVGWinLine line={result.line} gridSize={GRID_SIZE} />}

        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3" style={{ zIndex: 10 }}>
          {board.map((val, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!boardReady || !!val || gameOver}
              className={`flex items-center justify-center transition-colors rounded-lg ${
                !val && boardReady && !gameOver ? "hover:bg-primary/10 active:bg-primary/20" : ""
              }`}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
            >
              <SVGMark
                key={`${boardKey}-${i}-${val || "empty"}`}
                type={val}
                size={CELL_SIZE * 0.8}
                // FIX (perf): O(1) Set lookup instead of array.includes per cell
                isWinning={winningCellSet.has(i)}
              />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => { tapVibrate(); uiClickSound(); reset(); }}
        className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl"
      >
        🔄 New Game
      </button>
    </div>
  );
}