import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameBackButton from "../../components/GameBackButton";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameStore } from "../../stores/gameStore";
import useConfetti from "../../hooks/useConfetti";
import { useGameActivity } from "../../hooks/useGameActivity";
import { base44 } from "@/api/base44Client";
import { saveGameScore } from "@/lib/scoreSaver";
import { awardCoinsForStars } from "@/lib/awardCoins";
import ChessSquare from "../../components/chess/ChessSquare";
import ChessScoreBar from "../../components/chess/ChessScoreBar";
import DifficultySelect from "../../components/chess/DifficultySelect";
import ResetConfirmDialog from "../../components/checkers/ResetConfirmDialog";
import GameVictoryScreen from "../../components/games/GameVictoryScreen";
import {
  initBoard, getAllMoves, applyMove, computerMove,
  inCheck, getGameStatus,
} from "../../components/chess/ChessEngine";

// Coins awarded for beating each difficulty
const COIN_REWARD = { easy: 15, medium: 25, hard: 40 };

export default function Chess() {
  useGameTimer();
  const { tapVibrate, moveMade, pieceJumped, winVibrate, lossVibrate } = useHaptics();
  const { checkerFlipSound, winSound, uiClickSound } = useGameAudio();
  const { fireworks, emojiRain } = useConfetti();
  const { reportWin, reportLoss } = useGameActivity();

  // ── Flow state ──
  const [difficulty, setDifficulty] = useState(null); // null = show selector

  // ── Core game state ──
  const [board, setBoard] = useState(initBoard);
  const [enPassant, setEnPassant] = useState(null);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState("Your move! Tap a piece.");
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null); // "win" | "loss" | "draw"
  const [moveCount, setMoveCount] = useState(0);
  const [lastMove, setLastMove] = useState(null);
  const [animatingSquare, setAnimatingSquare] = useState(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [coinsWon, setCoinsWon] = useState(0);

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

  useEffect(() => {
    base44.auth.me().then(user => { if (user?.email) setUserEmail(user.email); }).catch(() => {});
  }, []);

  // ── Legal moves for the current player (used for highlights) ──
  const playerMoves = useMemo(() => {
    if (turn !== 1 || gameOver) return [];
    return getAllMoves(board, 1, enPassant);
  }, [board, turn, gameOver, enPassant]);

  const movablePieces = useMemo(() => {
    const set = new Set();
    playerMoves.forEach(m => set.add(`${m.from[0]},${m.from[1]}`));
    return set;
  }, [playerMoves]);

  const validTargets = useMemo(() => {
    if (!selected) return {};
    const targets = {};
    playerMoves
      .filter(m => m.from[0] === selected[0] && m.from[1] === selected[1])
      .forEach(m => { targets[`${m.to[0]},${m.to[1]}`] = !!m.capture; });
    return targets;
  }, [playerMoves, selected]);

  const checkSquare = useMemo(() => {
    const player = turn;
    if (gameOver || !inCheck(board, player)) return null;
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.player === player && p.type === "k") return `${r},${c}`;
      }
    return null;
  }, [board, turn, gameOver]);

  function flashSquare(r, c) {
    setAnimatingSquare(`${r},${c}`);
    setTimeout(() => setAnimatingSquare(null), 300);
  }

  // ── End states ──
  function endAsWin() {
    winVibrate(); winSound(); fireworks(); emojiRain(["♔", "🏆", "⭐"]);
    setMessage("🎉 Checkmate! You win!");
    setResult("win");
    setGameOver(true);
    setPlayerScore("player-1", moveCountRef.current);
    reportWin("Chess");
    if (userEmail) {
      saveGameScore({ game_name: "Chess", score: moveCountRef.current, completed: true });
      awardCoinsForStars(3, COIN_REWARD[difficulty] || 25).then(setCoinsWon);
    }
  }

  function endAsLoss() {
    lossVibrate();
    setMessage("😔 Checkmate! Computer wins.");
    setResult("loss");
    setGameOver(true);
    setPlayerScore("computer", moveCountRef.current);
    reportLoss("Chess");
  }

  function endAsDraw() {
    setMessage("🤝 Stalemate — it's a draw!");
    setResult("draw");
    setGameOver(true);
  }

  // ── Execute a player or computer move ──
  function performMove(currentBoard, currentEp, move, player) {
    checkerFlipSound();
    if (move.capture) { pieceJumped(); } else moveMade();

    const { board: nb, enPassant: newEp } = applyMove(currentBoard, move);

    const newMoveCount = moveCountRef.current + 1;
    moveCountRef.current = newMoveCount;
    setMoveCount(newMoveCount);

    addHistoryEntry({
      round: 1,
      playerId: player === 1 ? "player-1" : "computer",
      playerName: player === 1 ? "You" : "Computer",
      action: "move",
      result: { from: move.from, to: move.to, capture: !!move.capture },
    });

    return { nb, newEp };
  }

  function handlePlayerMove(move) {
    const { nb, newEp } = performMove(board, enPassant, move, 1);
    setBoard(nb);
    setEnPassant(newEp);
    setSelected(null);
    setLastMove({ from: move.from, to: move.to });
    flashSquare(move.to[0], move.to[1]);

    // Evaluate computer's position
    const status = getGameStatus(nb, 2, newEp);
    if (status === "checkmate") { endAsWin(); return; }
    if (status === "stalemate") { endAsDraw(); return; }

    // Computer's turn
    setTurn(2);
    setMessage(inCheck(nb, 2) ? "🤖 Computer is in check..." : "🤖 Computer is thinking...");
    thinkingRef.current = true;

    const thinkTime = difficulty === "hard" ? 350 : 500 + Math.random() * 500;
    setTimeout(() => {
      const cm = computerMove(nb, newEp, difficulty);
      if (!cm) {
        // No moves — checkmate or stalemate for computer
        if (inCheck(nb, 2)) endAsWin(); else endAsDraw();
        thinkingRef.current = false;
        return;
      }
      const { board: b2, enPassant: ep2 } = applyMove(nb, cm);
      if (cm.capture) pieceJumped(); else moveMade();
      checkerFlipSound();
      setBoard(b2);
      setEnPassant(ep2);
      setLastMove({ from: cm.from, to: cm.to });
      flashSquare(cm.to[0], cm.to[1]);
      moveCountRef.current += 1;
      setMoveCount(moveCountRef.current);

      addHistoryEntry({
        round: 1, playerId: "computer", playerName: "Computer",
        action: "move", result: { from: cm.from, to: cm.to, capture: !!cm.capture },
      });

      const playerStatus = getGameStatus(b2, 1, ep2);
      if (playerStatus === "checkmate") { endAsLoss(); thinkingRef.current = false; return; }
      if (playerStatus === "stalemate") { endAsDraw(); thinkingRef.current = false; return; }

      setTurn(1);
      setMessage(inCheck(b2, 1) ? "⚠️ You're in check!" : "Your move! Tap a piece.");
      thinkingRef.current = false;
    }, thinkTime);
  }

  // ── Click handler ──
  function handleClick(r, c) {
    if (turn !== 1 || gameOver || thinkingRef.current) return;
    const piece = board[r][c];

    if (selected) {
      const targetKey = `${r},${c}`;
      if (targetKey in validTargets) {
        const move = playerMoves.find(
          m => m.from[0] === selected[0] && m.from[1] === selected[1] &&
               m.to[0] === r && m.to[1] === c
        );
        if (move) { handlePlayerMove(move); return; }
      }
    }

    if (piece?.player === 1 && movablePieces.has(`${r},${c}`)) {
      tapVibrate();
      setSelected([r, c]);
    } else {
      setSelected(null);
    }
  }

  function confirmReset() {
    setShowResetConfirm(false);
    doReset();
  }

  function doReset() {
    tapVibrate(); uiClickSound();
    setBoard(initBoard());
    setEnPassant(null);
    setSelected(null);
    setTurn(1);
    setMessage("Your move! Tap a piece.");
    setGameOver(false);
    setResult(null);
    setMoveCount(0);
    setLastMove(null);
    setAnimatingSquare(null);
    moveCountRef.current = 0;
    thinkingRef.current = false;
    setCoinsWon(0);
  }

  function backToMenu() {
    doReset();
    setDifficulty(null);
  }

  const startGame = useCallback((level) => {
    setDifficulty(level);
    doReset();
  }, []);

  // ── Difficulty selector ──
  if (!difficulty) {
    return <DifficultySelect title="Chess" emoji="♟️" onSelect={startGame} />;
  }

  // ── Game over screen ──
  if (gameOver) {
    const won = result === "win";
    const isDraw = result === "draw";
    const resultEmoji = won ? "🏆" : isDraw ? "🤝" : "😔";
    const resultTitle = won ? "Checkmate — Victory!" : isDraw ? "Stalemate!" : "Checkmate — Defeat";
    const accent = won
      ? "from-amber-500 to-orange-600"
      : isDraw ? "from-slate-500 to-gray-600" : "from-red-500 to-rose-700";
    return (
      <GameVictoryScreen
        emoji={resultEmoji}
        title={resultTitle}
        accent={accent}
        coins={won ? coinsWon : 0}
        stats={[
          { label: "Moves", value: moveCount },
          { label: "Difficulty", value: { easy: "Easy", medium: "Medium", hard: "Hard" }[difficulty] },
        ]}
        primaryLabel="🔄 Play Again"
        onPrimary={doReset}
        secondaryLabel="⚙️ Change Difficulty"
        onSecondary={backToMenu}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-amber-950 to-slate-950 px-2 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-3">
        <GameBackButton />
        <div className="text-xl font-black text-white">♟️ Chess</div>
        <div className="flex gap-1.5">
          <GameInstructions
            title="Chess"
            emoji="♟️"
            steps={[
              "You play White (the light pieces at the bottom).",
              "Tap one of your pieces to select it — its legal moves light up.",
              "Tap a highlighted square to move there.",
              "Capture the opponent's pieces by moving onto their square.",
              "Protect your King ♔ — if it's attacked, you're in check and must respond.",
              "Trap the enemy King with no escape to win by checkmate!",
              "Castling, en passant, and pawn promotion to Queen are all supported.",
            ]}
          />
          <button
            onClick={() => moveCount > 0 ? setShowResetConfirm(true) : doReset()}
            aria-label="Reset game"
            className="bg-secondary text-foreground rounded-xl font-bold text-sm flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-transform"
          >🔄</button>
        </div>
      </div>

      {/* Score Bar */}
      <ChessScoreBar board={board} turn={turn} gameOver={gameOver} difficulty={difficulty} />

      {/* Status Message */}
      <div className={`text-center text-lg font-black mb-3 py-2.5 rounded-2xl mx-2 transition-all ${
        checkSquare ? "bg-red-900/40 border-2 border-red-500 text-red-300" :
        turn === 2 ? "bg-card border-2 border-border text-muted-foreground" :
        "bg-card border-2 border-primary/30 text-foreground"
      }`}>
        {message}
      </div>

      {/* Board */}
      <div className="flex justify-center px-2">
        <div className="rounded-xl overflow-hidden w-full max-w-sm shadow-2xl border-4 border-amber-900"
          style={{ boxShadow: "0 0 0 2px #78350f, 0 8px 32px rgba(0,0,0,0.5)" }}>
          {board.map((row, r) => (
            <div key={r} className="grid grid-cols-8">
              {row.map((piece, c) => {
                const dark = (r + c) % 2 === 1;
                const isSel = selected && selected[0] === r && selected[1] === c;
                const targetKey = `${r},${c}`;
                const isTarget = targetKey in validTargets;
                const isCapture = validTargets[targetKey] === true;
                const isLastMove = lastMove && (
                  (lastMove.from[0] === r && lastMove.from[1] === c) ||
                  (lastMove.to[0] === r && lastMove.to[1] === c)
                );
                const isCheck = checkSquare === `${r},${c}`;
                const isAnimating = animatingSquare === `${r},${c}`;
                const canMove = piece?.player === 1 && movablePieces.has(`${r},${c}`) && turn === 1;

                return (
                  <div key={c} className="relative">
                    {canMove && !isSel && (
                      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                        <div className="w-[82%] aspect-square rounded-lg ring-2 ring-yellow-400/30" />
                      </div>
                    )}
                    <ChessSquare
                      dark={dark}
                      piece={piece}
                      selected={isSel}
                      isTarget={isTarget}
                      isCapture={isCapture}
                      isLastMove={isLastMove}
                      isCheck={isCheck}
                      onClick={() => handleClick(r, c)}
                      animating={isAnimating}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Move counter */}
      <p className="text-center text-sm text-muted-foreground mt-3">Moves: {moveCount}</p>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <ResetConfirmDialog onConfirm={confirmReset} onCancel={() => setShowResetConfirm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}