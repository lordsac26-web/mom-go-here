import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "../stores/gameStore";

/**
 * Convenience hook combining common game state operations.
 * Uses useState + subscribe pattern instead of hook selectors
 * to avoid null-dispatcher crashes in the Base44 SDK React context.
 */
export function useGameState() {
  const [state, setState] = useState(() => useGameStore.getState());

  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => setState({ ...s }));
    return unsub;
  }, []);

  const currentRound    = state.currentRound;
  const activePlayers   = state.activePlayers;
  const gameStatus      = state.gameStatus;
  const rollingStatus   = state.rollingStatus;
  const gameHistory     = state.gameHistory;
  const currentPlayer   = useGameStore.getState().getCurrentPlayer();
  const leaderboard     = useGameStore.getState().getLeaderboard();

  const startPlayerRoll = useCallback((playerId) => {
    useGameStore.getState().setRollingStatus(playerId, true);
  }, []);

  const completePlayerRoll = useCallback((playerId, playerName, result, score) => {
    const store = useGameStore.getState();
    store.setRollingStatus(playerId, false);
    store.addHistoryEntry({
      round: useGameStore.getState().currentRound,
      playerId,
      playerName,
      action: "roll",
      result,
    });
    if (score !== undefined) {
      store.updatePlayerScore(playerId, score);
    }
  }, []);

  const advanceTurn = useCallback(() => {
    useGameStore.getState().nextRound();
  }, []);

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
    initializeGame:     useGameStore.getState().initializeGame,
    startPlayerRoll,
    completePlayerRoll,
    advanceTurn,
    updatePlayerScore:  (id, s) => useGameStore.getState().updatePlayerScore(id, s),
    setPlayerScore:     (id, s) => useGameStore.getState().setPlayerScore(id, s),
    addHistoryEntry:    (e)     => useGameStore.getState().addHistoryEntry(e),
    setGameStatus:      (s)     => useGameStore.getState().setGameStatus(s),
    resetGame:          ()      => useGameStore.getState().resetGame(),
  };
}