import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameBackButton from "../../components/GameBackButton";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameStore } from "../../stores/gameStore";
import useConfetti from "../../hooks/useConfetti";
import BoardSquare from "../../components/checkers/BoardSquare";
import ScoreBar from "../../components/checkers/ScoreBar";
import {
  initBoard, getAllMoves, applyMove, computerMove, countPieces,
} from "../../components/checkers/CheckersEngine";
import { useGameActivity } from "../../hooks/useGameActivity";

export default function Checkers() {
  useGameTimer();
  const { tapVibrate, moveMade, pieceJumped, winVibrate, lossVibrate } = useHaptics();
  const { checkerFlipSound, matchSound, winSound, uiClickSound } = useGameAudio();
  const { spark, shower, fireworks, emojiRain } = useConfetti();
  const { reportWin, reportLoss } = useGameActivity();

  const [board, setBoard] = useState(initBoard);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState("Your turn! Tap a red piece.");
  const [gameOver, setGameOver] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [lastMove, setLastMove] = useState(null); // {from, to}

  const moveCountRef = useRef(0);
  const thinkingRef = useRef(false);
  const zustandInitRef = useRef(false);

  const initializeGame = useGameStore(s => s.initializeGame);
  const addHistoryEntry = useGameStore(s => s.addHistoryEntry);
  const setPlayerScore = useGameStore(s => s.setPlayerScore);
  const gameStatus = useGameStore(s => s.gameStatus);

  useEffect(() => {
    if (gameStatus === "setup" && !zustandInitRef.current) {
      zustandInitRef.current = true;
      initializeGame(
        [{ id: "player-1", name: "You" }, { id: "computer", name: "Computer" }],
        1
      );
    }
  }, [gameStatus, initializeGame]);

  const counts = useMemo(() => countPieces(board), [board]);

  const playerMoves = useMemo(() => {
    if (turn !== 1 || gameOver) return [];
    return getAllMoves(board, 1);
  }, [board, turn, gameOver]);

  const isJumpTurn = playerMoves.length > 0 && playerMoves[0].jumps.length > 0;

  const validTargets = useMemo(() => {
    if (!selected) return {};
    const targets = {};
    playerMoves
      .filter(m => m.from[0] === selected[0] && m.from[1] === selected[1])
      .forEach(m => {
        targets[`${m.to[0]},${m.to[1]}`] = m.jumps.length > 0;
      });
    return targets;
  }, [playerMoves, selected]);

  // Pieces that can move (highlight them)
  const movablePieces = useMemo(() => {
    const set = new Set();
    playerMoves.forEach(m => set.add(`${m.from[0]},${m.from[1]}`));
    return set;
  }, [playerMoves]);

  function handleClick(r, c) {
    if (turn !== 1 || gameOver || thinkingRef.current) return;
    const piece = board[r][c];

    if (selected) {
      const targetKey = `${r},${c}`;
      if (targetKey in validTargets) {
        // Execute this move
        const move = playerMoves.find(
          m => m.from[0] === selected[0] && m.from[1] === selected[1] &&
               m.to[0] === r && m.to[1] === c
        );
        executeMove(move, 1);
        return;
      }
    }

    // Select a piece
    if (piece?.player === 1 && movablePieces.has(`${r},${c}`)) {
      tapVibrate();
      setSelected([r, c]);
    } else {
      setSelected(null);
    }
  }

  function executeMove(move, player) {
    checkerFlipSound();
    if (move.jumps.length > 0) { pieceJumped(); spark(); } else moveMade();

    const newBoard = applyMove(board, move);
    setBoard(newBoard);
    setSelected(null);
    setLastMove({ from: move.from, to: move.to });

    const newMoveCount = moveCountRef.current + 1;
    moveCountRef.current = newMoveCount;
    setMoveCount(newMoveCount);

    addHistoryEntry({
      round: 1,
      playerId: player === 1 ? "player-1" : "computer",
      playerName: player === 1 ? "You" : "Computer",
      action: "move",
      result: { from: move.from, to: move.to, captures: move.jumps.length },
    });

    // Check if opponent has moves
    const opponent = player === 1 ? 2 : 1;
    const oppMoves = getAllMoves(newBoard, opponent);

    if (!oppMoves.length) {
      if (player === 1) {
        winVibrate(); winSound(); fireworks(); emojiRain(["👑", "🏆", "⭐"]);
        setMessage("🎉 You win! All enemy pieces captured!");
        setPlayerScore("player-1", moveCountRef.current);
        reportWin("Checkers");
      } else {
        lossVibrate();
        setMessage("😔 Computer wins! Better luck next time.");
        setPlayerScore("computer", moveCountRef.current);
        reportLoss();
      }
      setGameOver(true);
      return;
    }

    if (player === 1) {
      // Computer's turn
      setTurn(2);
      setMessage("🤖 Computer is thinking...");
      thinkingRef.current = true;

      setTimeout(() => {
        const cm = computerMove(newBoard);
        if (!cm) {
          winVibrate(); winSound(); fireworks(); emojiRain(["👑", "🏆", "⭐"]);
          setMessage("🎉 You win!");
          setGameOver(true);
          setPlayerScore("player-1", moveCountRef.current);
          reportWin("Checkers");
          thinkingRef.current = false;
          return;
        }

        const b2 = applyMove(newBoard, cm);
        setBoard(b2);
        setLastMove({ from: cm.from, to: cm.to });

        addHistoryEntry({
          round: 1, playerId: "computer", playerName: "Computer",
          action: "move",
          result: { from: cm.from, to: cm.to, captures: cm.jumps.length },
        });

        if (cm.jumps.length > 0) spark();

        const playerMovesAfter = getAllMoves(b2, 1);
        if (!playerMovesAfter.length) {
          lossVibrate();
          setMessage("😔 Computer wins!");
          setGameOver(true);
          setPlayerScore("computer", moveCountRef.current);
          reportLoss();
          thinkingRef.current = false;
          return;
        }

        setTurn(1);
        const hasJumps = playerMovesAfter[0].jumps.length > 0;
        setMessage(hasJumps ? "Your turn! You must jump! ⚡" : "Your turn! Tap a red piece.");
        thinkingRef.current = false;
      }, 700);
    }
  }

  function reset() {
    tapVibrate(); uiClickSound();
    setBoard(initBoard());
    setSelected(null);
    setTurn(1);
    setMessage("Your turn! Tap a red piece.");
    setGameOver(false);
    setMoveCount(0);
    setLastMove(null);
    moveCountRef.current = 0;
    thinkingRef.current = false;
  }

  // Win/lose screen
  if (gameOver) {
    const won = message.includes("You win");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
        <div className="text-8xl mb-4">{won ? "🏆" : "😔"}</div>
        <h1 className="text-4xl font-black text-primary mb-2">{won ? "Victory!" : "Defeat"}</h1>
        <p className="text-xl text-foreground mb-1">Moves: {moveCount}</p>
        <p className="text-lg text-muted-foreground mb-6">
          Captured: {12 - counts.p2} black · Lost: {12 - counts.p1} red
        </p>
        <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
          🔄 Play Again
        </button>
        <GameBackButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-3">
        <GameBackButton />
        <div className="text-xl font-black text-primary">♟️ Checkers</div>
        <div className="flex gap-2">
          <GameInstructions
            title="Checkers"
            emoji="♟️"
            steps={[
              "You play as red (bottom). Tap a glowing red piece to select it.",
              "Tap a highlighted square to move diagonally forward.",
              "Jumps are mandatory — if you can capture, you must!",
              "Multi-jumps: after a capture, if you can jump again, you must continue.",
              "Reach the top row to crown your piece into a King 👑 — kings move in all diagonal directions.",
              "Capture all enemy pieces or block them to win!",
            ]}
          />
          <button onClick={reset} className="bg-secondary text-foreground px-3 py-2 rounded-xl font-bold text-sm">🔄</button>
        </div>
      </div>

      {/* Score Bar */}
      <ScoreBar counts={counts} turn={turn} gameOver={gameOver} />

      {/* Status Message */}
      <div className={`text-center text-lg font-black mb-3 py-2.5 rounded-2xl mx-2 transition-all ${
        isJumpTurn ? "bg-orange-900/40 border-2 border-orange-500 text-orange-300" :
        turn === 2 ? "bg-card border-2 border-border text-muted-foreground" :
        "bg-card border-2 border-primary/30 text-foreground"
      }`}>
        {message}
      </div>

      {/* Board */}
      <div className="flex justify-center px-2">
        <div
          className="rounded-xl overflow-hidden w-full max-w-sm shadow-2xl"
          style={{
            border: "4px solid #5c3a1e",
            boxShadow: "0 0 0 2px #3a2510, 0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {board.map((row, r) => (
            <div key={r} className="grid grid-cols-8">
              {row.map((piece, c) => {
                const dark = (r + c) % 2 === 1;
                const isSel = selected && selected[0] === r && selected[1] === c;
                const targetKey = `${r},${c}`;
                const isTarget = targetKey in validTargets;
                const isJumpTarget = validTargets[targetKey] === true;
                const isLastMove = lastMove && (
                  (lastMove.from[0] === r && lastMove.from[1] === c) ||
                  (lastMove.to[0] === r && lastMove.to[1] === c)
                );
                const canMove = piece?.player === 1 && movablePieces.has(`${r},${c}`) && turn === 1;

                return (
                  <div key={c} className="relative">
                    {/* Movable piece glow ring */}
                    {canMove && !isSel && (
                      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                        <div className="w-[78%] aspect-square rounded-full ring-2 ring-yellow-400/40 animate-pulse" />
                      </div>
                    )}
                    <BoardSquare
                      dark={dark}
                      piece={piece}
                      selected={isSel}
                      isTarget={isTarget}
                      isJumpTarget={isJumpTarget}
                      lastMove={isLastMove}
                      onClick={() => handleClick(r, c)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-700" /> You
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-800" /> CPU
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-400/50" /> Move
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-400/60" /> Jump
        </span>
      </div>

      {/* Move counter */}
      <p className="text-center text-sm text-muted-foreground mt-2">Moves: {moveCount}</p>
    </div>
  );
}