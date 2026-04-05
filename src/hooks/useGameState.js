import { useCallback } from "react";
import { useGameStore } from "../stores/gameStore";

/**
 * Convenience hook combining common game state operations.
 * Reduces boilerplate in game components.
 */
export function useGameState() {
  const currentRound = useGameStore((state) => state.currentRound);
  const activePlayers = useGameStore((state) => state.activePlayers);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const rollingStatus = useGameStore((state) => state.rollingStatus);
  const gameHistory = useGameStore((state) => state.gameHistory);

  const setRollingStatus = useGameStore((state) => state.setRollingStatus);
  const updatePlayerScore = useGameStore((state) => state.updatePlayerScore);
  const setPlayerScore = useGameStore((state) => state.setPlayerScore);
  const addHistoryEntry = useGameStore((state) => state.addHistoryEntry);
  const nextRound = useGameStore((state) => state.nextRound);
  const setGameStatus = useGameStore((state) => state.setGameStatus);
  const resetGame = useGameStore((state) => state.resetGame);
  const initializeGame = useGameStore((state) => state.initializeGame);

  const currentPlayer = useGameStore((state) => state.getCurrentPlayer());
  const leaderboard = useGameStore((state) => state.getLeaderboard());

  // Helper: Start player roll
  const startPlayerRoll = useCallback(
    (playerId) => {
      setRollingStatus(playerId, true);
    },
    [setRollingStatus]
  );

  // Helper: Complete player roll and log it
  const completePlayerRoll = useCallback(
    (playerId, playerName, result, score) => {
      setRollingStatus(playerId, false);
      addHistoryEntry({
        round: currentRound,
        playerId,
        playerName,
        action: "roll",
        result,
      });
      if (score !== undefined) {
        updatePlayerScore(playerId, score);
      }
    },
    [currentRound, setRollingStatus, addHistoryEntry, updatePlayerScore]
  );

  // Helper: Advance to next turn/round
  const advanceTurn = useCallback(() => {
    nextRound();
  }, [nextRound]);

  return {
    // State
    currentRound,
    activePlayers,
    gameStatus,
    rollingStatus,
    gameHistory,
    currentPlayer,
    leaderboard,

    // Actions
    initializeGame,
    startPlayerRoll,
    completePlayerRoll,
    advanceTurn,
    updatePlayerScore,
    setPlayerScore,
    addHistoryEntry,
    setGameStatus,
    resetGame,
  };
}