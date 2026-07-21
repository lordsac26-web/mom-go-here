import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameBackButton from "../../components/GameBackButton";
import GameInstructions from "../../components/GameInstructions";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameStore } from "../../stores/gameStore";
import useConfetti from "../../hooks/useConfetti";
import BoardSquare from "../../components/checkers/BoardSquare";
import ScoreBar from "../../components/checkers/ScoreBar";
import HintButton from "../../components/checkers/HintButton";
import ResetConfirmDialog from "../../components/checkers/ResetConfirmDialog";
import {
  initBoard, getAllMoves, applyMove, computerMove, countPieces,
} from "../../components/checkers/CheckersEngine";
import { useGameActivity } from "../../hooks/useGameActivity";
import { base44 } from "@/api/base44Client";
import { saveGameScore } from "@/lib/scoreSaver";
import {
  BOARD_STYLES, PIECE_SKINS, rollRareDrops,
} from "../../components/checkers/cosmeticDefinitions";
import CosmeticPicker from "../../components/checkers/CosmeticPicker";
import GameVictoryScreen from "../../components/games/GameVictoryScreen";
import { awardCoinsForStars } from "@/lib/awardCoins";
import DifficultySelect from "../../components/chess/DifficultySelect";

// Coins awarded for beating each difficulty
const COIN_REWARD = { easy: 15, medium: 25, hard: 40 };

// Draw rule: after this many consecutive non-capture moves by both sides, it's a draw
const DRAW_MOVE_LIMIT = 40;

export default function Checkers() {
  useGameTimer();
  const { tapVibrate, moveMade, pieceJumped, winVibrate, lossVibrate } = useHaptics();
  const { checkerFlipSound, winSound, uiClickSound } = useGameAudio();
  const { spark, fireworks, emojiRain } = useConfetti();
  const { reportWin, reportLoss } = useGameActivity();

  // ── Flow state ──
  const [difficulty, setDifficulty] = useState(null); // null = show selector

  // ── Core game state ──
  const [board, setBoard] = useState(initBoard);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState("Your turn! Tap a piece to move.");
  const [gameOver, setGameOver] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [lastMove, setLastMove] = useState(null);
  const [nonCaptureMoves, setNonCaptureMoves] = useState(0);
  const [animatingSquare, setAnimatingSquare] = useState(null);

  // ── Hint state ──
  const [hintMove, setHintMove] = useState(null);
  const hintTimerRef = useRef(null);

  // ── UI modals ──
  const [showCosmetics, setShowCosmetics] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ── Cosmetics ──
  const [activeBoardStyle, setActiveBoardStyle] = useState(BOARD_STYLES[0]);
  const [activePieceSkin, setActivePieceSkin] = useState(PIECE_SKINS[0]);
  const [rareDropMsg, setRareDropMsg] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [coinsWon, setCoinsWon] = useState(0);

  // ── Refs ──
  const moveCountRef = useRef(0);
  const nonCaptureRef = useRef(0);
  const thinkingRef = useRef(false);
  const zustandInitRef = useRef(false);

  // ── Zustand integration ──
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

  // ── Load cosmetics on mount ──
  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user?.email) return;
      setUserEmail(user.email);
      base44.entities.CheckerCosmetic.filter({ user_email: user.email }).then(records => {
        const rec = records[0];
        if (rec) {
          setActiveBoardStyle(BOARD_STYLES.find(b => b.id === rec.active_board) || BOARD_STYLES[0]);
          setActivePieceSkin(PIECE_SKINS.find(p => p.id === rec.active_pieces) || PIECE_SKINS[0]);
        }
      });
    });
  }, []);

  function reloadCosmetics() {
    if (!userEmail) return;
    base44.entities.CheckerCosmetic.filter({ user_email: userEmail }).then(records => {
      const rec = records[0];
      if (rec) {
        setActiveBoardStyle(BOARD_STYLES.find(b => b.id === rec.active_board) || BOARD_STYLES[0]);
        setActivePieceSkin(PIECE_SKINS.find(p => p.id === rec.active_pieces) || PIECE_SKINS[0]);
      }
    });
  }

  // ── Persist checkers win to GameScore for cosmetic unlock tracking ──
  async function recordCheckersWin() {
    if (!userEmail) return;
    await saveGameScore({
      game_name: "Checkers",
      score: moveCountRef.current,
      completed: true,
    });
  }

  // ── Roll rare cosmetic drops on win ──
  async function checkRareDrops() {
    if (!userEmail) return;
    const records = await base44.entities.CheckerCosmetic.filter({ user_email: userEmail });
    const rec = records[0];
    const currentUnlocked = [...(rec?.unlocked_boards || ["classic"]), ...(rec?.unlocked_pieces || ["classic"])];
    const drops = rollRareDrops(currentUnlocked);
    if (drops.length === 0) return;

    const newBoards = drops.filter(d => BOARD_STYLES.some(b => b.id === d));
    const newPieces = drops.filter(d => PIECE_SKINS.some(p => p.id === d));

    if (rec) {
      await base44.entities.CheckerCosmetic.update(rec.id, {
        unlocked_boards: [...(rec.unlocked_boards || ["classic"]), ...newBoards],
        unlocked_pieces: [...(rec.unlocked_pieces || ["classic"]), ...newPieces],
      });
    } else {
      await base44.entities.CheckerCosmetic.create({
        user_email: userEmail,
        unlocked_boards: ["classic", ...newBoards],
        unlocked_pieces: ["classic", ...newPieces],
        active_board: "classic",
        active_pieces: "classic",
      });
    }

    const allDropNames = drops.map(d => {
      const b = BOARD_STYLES.find(x => x.id === d);
      if (b) return `${b.emoji} ${b.name} Board`;
      const p = PIECE_SKINS.find(x => x.id === d);
      if (p) return `${p.emoji} ${p.name} Pieces`;
      return d;
    });
    setRareDropMsg(`✨ You earned a special reward: ${allDropNames.join(", ")}!`);
    setTimeout(() => setRareDropMsg(null), 6000);
  }

  // ── Computed values ──
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
      .forEach(m => { targets[`${m.to[0]},${m.to[1]}`] = m.jumps.length > 0; });
    return targets;
  }, [playerMoves, selected]);

  const movablePieces = useMemo(() => {
    const set = new Set();
    playerMoves.forEach(m => set.add(`${m.from[0]},${m.from[1]}`));
    return set;
  }, [playerMoves]);

  // ── Clear hint on any state change ──
  useEffect(() => {
    setHintMove(null);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, [board, selected]);

  // ── Hint handler ──
  const handleHint = useCallback((move) => {
    setHintMove(move);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintMove(null), 2000);
  }, []);

  // ── Animate a square briefly after a move ──
  function flashSquare(r, c) {
    setAnimatingSquare(`${r},${c}`);
    setTimeout(() => setAnimatingSquare(null), 300);
  }

  // ── End game helpers ──
  function endAsWin() {
    winVibrate(); winSound(); fireworks(); emojiRain(["👑", "🏆", "⭐"]);
    setMessage("🎉 You win! Great game!");
    setGameOver(true);
    setPlayerScore("player-1", moveCountRef.current);
    reportWin("Checkers");
    recordCheckersWin();
    checkRareDrops();
    // Reward coins for beating the CPU (scaled by difficulty)
    if (userEmail) awardCoinsForStars(3, COIN_REWARD[difficulty] || 25).then(setCoinsWon);
  }

  function endAsLoss() {
    lossVibrate();
    setMessage("😔 Computer wins! Better luck next time.");
    setGameOver(true);
    setPlayerScore("computer", moveCountRef.current);
    reportLoss("Checkers");
  }

  function endAsDraw() {
    setMessage("🤝 It's a draw! Good game!");
    setGameOver(true);
    setIsDraw(true);
  }

  // ── Check draw condition ──
  function checkDraw(newNonCapture) {
    if (newNonCapture >= DRAW_MOVE_LIMIT) {
      endAsDraw();
      return true;
    }
    return false;
  }

  // ── Execute a move ──
  function executeMove(move, player) {
    checkerFlipSound();
    const isCapture = move.jumps.length > 0;
    if (isCapture) { pieceJumped(); spark(); } else moveMade();

    const newBoard = applyMove(board, move);
    setBoard(newBoard);
    setSelected(null);
    setLastMove({ from: move.from, to: move.to });
    flashSquare(move.to[0], move.to[1]);

    const newMoveCount = moveCountRef.current + 1;
    moveCountRef.current = newMoveCount;
    setMoveCount(newMoveCount);

    // Track non-capture moves for draw detection
    const newNonCapture = isCapture ? 0 : nonCaptureRef.current + 1;
    nonCaptureRef.current = newNonCapture;
    setNonCaptureMoves(newNonCapture);

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
      if (player === 1) endAsWin();
      else endAsLoss();
      return;
    }

    // Check draw
    if (checkDraw(newNonCapture)) return;

    if (player === 1) {
      // Computer's turn — variable thinking time for natural feel
      setTurn(2);
      setMessage("🤖 Computer is thinking...");
      thinkingRef.current = true;

      const thinkTime = 500 + Math.random() * 700; // 500–1200ms
      setTimeout(() => {
        const cm = computerMove(newBoard, difficulty);
        if (!cm) {
          endAsWin();
          thinkingRef.current = false;
          return;
        }

        const isCompCapture = cm.jumps.length > 0;
        const b2 = applyMove(newBoard, cm);
        setBoard(b2);
        setLastMove({ from: cm.from, to: cm.to });
        flashSquare(cm.to[0], cm.to[1]);

        // Update non-capture counter for computer moves too
        const compNonCapture = isCompCapture ? 0 : nonCaptureRef.current + 1;
        nonCaptureRef.current = compNonCapture;
        setNonCaptureMoves(compNonCapture);

        addHistoryEntry({
          round: 1, playerId: "computer", playerName: "Computer",
          action: "move",
          result: { from: cm.from, to: cm.to, captures: cm.jumps.length },
        });

        if (isCompCapture) spark();

        // Check draw after computer move
        if (compNonCapture >= DRAW_MOVE_LIMIT) {
          endAsDraw();
          thinkingRef.current = false;
          return;
        }

        const playerMovesAfter = getAllMoves(b2, 1);
        if (!playerMovesAfter.length) {
          endAsLoss();
          thinkingRef.current = false;
          return;
        }

        setTurn(1);
        const hasJumps = playerMovesAfter[0].jumps.length > 0;
        setMessage(hasJumps ? "Your turn! You must jump! ⚡" : "Your turn! Tap a piece to move.");
        thinkingRef.current = false;
      }, thinkTime);
    }
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
        executeMove(move, 1);
        return;
      }
    }

    if (piece?.player === 1 && movablePieces.has(`${r},${c}`)) {
      tapVibrate();
      setSelected([r, c]);
    } else {
      setSelected(null);
    }
  }

  // ── Reset with confirmation ──
  function confirmReset() {
    setShowResetConfirm(false);
    doReset();
  }

  function doReset() {
    tapVibrate(); uiClickSound();
    setBoard(initBoard());
    setSelected(null);
    setTurn(1);
    setMessage("Your turn! Tap a piece to move.");
    setGameOver(false);
    setIsDraw(false);
    setMoveCount(0);
    setLastMove(null);
    setNonCaptureMoves(0);
    setHintMove(null);
    setAnimatingSquare(null);
    moveCountRef.current = 0;
    nonCaptureRef.current = 0;
    thinkingRef.current = false;
    setCoinsWon(0);
  }

  function backToMenu() {
    doReset();
    setDifficulty(null);
  }

  function startGame(level) {
    setDifficulty(level);
    doReset();
  }

  // ── Difficulty selector ──
  if (!difficulty) {
    return <DifficultySelect title="Checkers" emoji="⬛" onSelect={startGame} />;
  }

  // ── Win/Lose/Draw screen ──
  if (gameOver) {
    const won = message.includes("You win");
    const resultEmoji = won ? "🏆" : isDraw ? "🤝" : "😔";
    const resultTitle = won ? "Victory!" : isDraw ? "Draw!" : "Defeat";
    const accent = won
      ? "from-amber-500 to-orange-600"
      : isDraw
        ? "from-slate-500 to-gray-600"
        : "from-red-500 to-rose-700";
    return (
      <GameVictoryScreen
        emoji={resultEmoji}
        title={resultTitle}
        accent={accent}
        coins={won ? coinsWon : 0}
        stats={[
          { label: "Moves", value: moveCount },
          { label: "Captured", value: 12 - counts.p2 },
          { label: "Lost", value: 12 - counts.p1 },
          { label: "Remaining", value: counts.p1 },
        ]}
        primaryLabel="🔄 Play Again"
        onPrimary={doReset}
        secondaryLabel="⚙️ Change Difficulty"
        onSecondary={backToMenu}
      >
        {rareDropMsg && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white text-center py-3 px-5 rounded-2xl font-bold text-sm mb-4 shadow-lg border-2 border-purple-300 animate-pulse">
            {rareDropMsg}
          </motion.div>
        )}
      </GameVictoryScreen>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-amber-950 to-slate-950 px-2 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-3">
        <GameBackButton />
        <div className="text-xl font-black text-white">
          ⬛ Checkers
          <span className="ml-1.5 text-xs font-bold text-primary align-middle">
            {{ easy: "🌱 Easy", medium: "🎯 Medium", hard: "🔥 Hard" }[difficulty]}
          </span>
        </div>
        <div className="flex gap-1.5">
          <GameInstructions
            title="Checkers"
            emoji="♟️"
            steps={[
              "You play as the bottom pieces. Tap a glowing piece to select it.",
              "Tap a highlighted square to move diagonally forward.",
              "Jumps are mandatory — if you can capture, you must!",
              "Multi-jumps: after a capture, if you can jump again, you must continue.",
              "Reach the top row to crown your piece into a King 👑 — kings move in all diagonal directions.",
              "Capture all opponent pieces or block them to win!",
              "Use the 💡 Hint button if you're stuck.",
            ]}
          />
          <HintButton
            moves={playerMoves}
            onHint={handleHint}
            disabled={turn !== 1 || thinkingRef.current}
          />
          <button onClick={() => setShowCosmetics(true)} aria-label="Cosmetics" className="bg-secondary text-foreground rounded-xl font-bold text-sm flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-transform">🎨</button>
          <button
            onClick={() => moveCount > 0 ? setShowResetConfirm(true) : doReset()}
            aria-label="Reset game"
            className="bg-secondary text-foreground rounded-xl font-bold text-sm flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-transform"
          >🔄</button>
        </div>
      </div>

      {/* Score Bar */}
      <ScoreBar counts={counts} turn={turn} gameOver={gameOver} pieceSkin={activePieceSkin} />

      {/* Status Message */}
      <div className={`text-center text-lg font-black mb-3 py-2.5 rounded-2xl mx-2 transition-all ${
        isJumpTurn ? "bg-orange-900/40 border-2 border-orange-500 text-orange-300" :
        turn === 2 ? "bg-card border-2 border-border text-muted-foreground" :
        "bg-card border-2 border-primary/30 text-foreground"
      }`}>
        {message}
      </div>

      {/* Draw warning */}
      {nonCaptureMoves >= 30 && !gameOver && (
        <div className="text-center text-sm text-muted-foreground mb-2 mx-2">
          ⚠️ Draw in {DRAW_MOVE_LIMIT - nonCaptureMoves} moves without a capture
        </div>
      )}

      {/* Rare Drop Banner */}
      <AnimatePresence>
        {rareDropMsg && (
          <div className="mx-2 mb-3 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white text-center py-3 px-4 rounded-2xl font-bold text-sm animate-pulse shadow-lg border-2 border-purple-300">
            {rareDropMsg}
          </div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="flex justify-center px-2">
        <div
          className="rounded-xl overflow-hidden w-full max-w-sm shadow-2xl"
          style={{
            border: `4px solid ${activeBoardStyle.borderColor}`,
            boxShadow: `0 0 0 2px ${activeBoardStyle.borderShadow}, 0 8px 32px rgba(0,0,0,0.5)`,
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

                // Hint highlights
                const isHintFrom = hintMove && hintMove.from[0] === r && hintMove.from[1] === c;
                const isHintTo = hintMove && hintMove.to[0] === r && hintMove.to[1] === c;
                const isAnimating = animatingSquare === `${r},${c}`;

                return (
                  <div key={c} className="relative">
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
                      boardStyle={activeBoardStyle}
                      pieceSkin={activePieceSkin}
                      hintFrom={isHintFrom}
                      hintTo={isHintTo}
                      animating={isAnimating}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend — skin-aware colors */}
      <div className="flex justify-center gap-4 mt-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-full shadow-sm"
            style={{ background: activePieceSkin?.p1?.gradient || "radial-gradient(circle, #dc2626, #991b1b)" }}
          /> You
        </span>
        <span className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-full shadow-sm"
            style={{ background: activePieceSkin?.p2?.gradient || "radial-gradient(circle, #1f2937, #111827)" }}
          /> CPU
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-yellow-400/50 border border-yellow-500/60" /> Move
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-orange-400/60 border border-orange-500/60" /> Jump
        </span>
      </div>

      {/* Move counter */}
      <p className="text-center text-sm text-muted-foreground mt-2">Moves: {moveCount}</p>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <ResetConfirmDialog onConfirm={confirmReset} onCancel={() => setShowResetConfirm(false)} />
        )}
      </AnimatePresence>

      {/* Cosmetic Picker */}
      <AnimatePresence>
        {showCosmetics && (
          <CosmeticPicker
            userEmail={userEmail}
            onSelect={reloadCosmetics}
            onClose={() => setShowCosmetics(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}