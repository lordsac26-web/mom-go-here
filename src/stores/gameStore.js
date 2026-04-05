import { create } from "zustand";

/**
 * Centralized game state management using Zustand.
 * Tracks: current round, active players, rolling status, and game history.
 */
export const useGameStore = create((set, get) => ({
  // State
  currentRound: 1,
  activePlayers: [], // [{ id, name, score, turnOrder }]
  rollingStatus: {}, // { playerId: boolean }
  gameHistory: [], // [{ round, playerId, playerName, action, result, timestamp }]
  gameStatus: "setup", // "setup" | "playing" | "paused" | "over"
  maxRounds: 13,

  // Actions
  initializeGame: (players, maxRounds = 13) => {
    const activePlayers = players.map((p, idx) => ({
      id: p.id || `player-${idx}`,
      name: p.name || `Player ${idx + 1}`,
      score: 0,
      turnOrder: idx,
    }));
    const rollingStatus = {};
    activePlayers.forEach((p) => {
      rollingStatus[p.id] = false;
    });
    set({
      activePlayers: activePlayers,
      rollingStatus,
      gameStatus: "playing",
      currentRound: 1,
      gameHistory: [],
      maxRounds,
    });
  },

  setRollingStatus: (playerId, isRolling) => {
    set((state) => ({
      rollingStatus: { ...state.rollingStatus, [playerId]: isRolling },
    }));
  },

  addHistoryEntry: (entry) => {
    set((state) => ({
      gameHistory: [
        ...state.gameHistory,
        {
          timestamp: new Date().toISOString(),
          ...entry,
        },
      ],
    }));
  },

  updatePlayerScore: (playerId, scoreChange) => {
    set((state) => ({
      activePlayers: state.activePlayers.map((p) =>
        p.id === playerId ? { ...p, score: p.score + scoreChange } : p
      ),
    }));
  },

  setPlayerScore: (playerId, score) => {
    set((state) => ({
      activePlayers: state.activePlayers.map((p) =>
        p.id === playerId ? { ...p, score } : p
      ),
    }));
  },

  nextRound: () => {
    set((state) => {
      const newRound = state.currentRound + 1;
      const isGameOver = newRound > state.maxRounds;
      return {
        currentRound: newRound,
        gameStatus: isGameOver ? "over" : "playing",
      };
    });
  },

  setGameStatus: (status) => {
    set({ gameStatus: status });
  },

  resetGame: () => {
    set({
      currentRound: 1,
      activePlayers: [],
      rollingStatus: {},
      gameHistory: [],
      gameStatus: "setup",
    });
  },

  // Selectors (computed values)
  getCurrentPlayer: () => {
    const state = get();
    if (!state.activePlayers.length) return null;
    const currentPlayerIdx =
      (state.currentRound - 1) % state.activePlayers.length;
    return state.activePlayers[currentPlayerIdx];
  },

  getLeaderboard: () => {
    const state = get();
    return [...state.activePlayers].sort((a, b) => b.score - a.score);
  },

  getRoundHistory: (round) => {
    const state = get();
    return state.gameHistory.filter((entry) => entry.round === round);
  },

  getPlayerHistory: (playerId) => {
    const state = get();
    return state.gameHistory.filter((entry) => entry.playerId === playerId);
  },
}));

// Custom hooks for common selectors
export const useCurrentRound = () =>
  useGameStore((state) => state.currentRound);

export const useActivePlayer = () =>
  useGameStore((state) => state.getCurrentPlayer());

export const useActivePlayerList = () =>
  useGameStore((state) => state.activePlayers);

export const useRollingStatus = () =>
  useGameStore((state) => state.rollingStatus);

export const useLeaderboard = () =>
  useGameStore((state) => state.getLeaderboard());

export const useGameHistory = () =>
  useGameStore((state) => state.gameHistory);

export const useGameStatus = () =>
  useGameStore((state) => state.gameStatus);