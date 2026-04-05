import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // State
  currentRound: 1,
  maxRounds: 13,
  activePlayers: [],
  currentPlayerIdx: 0,
  isRolling: false,
  diceValues: [1, 1, 1, 1, 1],
  gameHistory: [], // Array of { round, player, action, diceValues, timestamp }
  scores: {}, // { playerId: score }
  roundScores: {}, // { playerId: [score1, score2, ...] }

  // Actions
  setCurrentRound: (round) => set({ currentRound: round }),
  setActivePlayer: (idx) => set({ currentPlayerIdx: idx }),
  setIsRolling: (rolling) => set({ isRolling: rolling }),
  setDiceValues: (values) => set({ diceValues: values }),
  
  initializeGame: (playerIds) => {
    const scores = {};
    const roundScores = {};
    playerIds.forEach((id) => {
      scores[id] = 0;
      roundScores[id] = Array(13).fill(null);
    });
    set({
      activePlayers: playerIds,
      currentPlayerIdx: 0,
      currentRound: 1,
      isRolling: false,
      scores,
      roundScores,
      gameHistory: [],
      diceValues: [1, 1, 1, 1, 1],
    });
  },

  recordRoll: (playerId, action, diceValues) => {
    const state = get();
    const entry = {
      round: state.currentRound,
      player: playerId,
      action,
      diceValues,
      timestamp: Date.now(),
    };
    set((s) => ({
      gameHistory: [...s.gameHistory, entry],
    }));
  },

  recordScore: (playerId, roundIdx, score) => {
    set((s) => ({
      scores: { ...s.scores, [playerId]: s.scores[playerId] + score },
      roundScores: {
        ...s.roundScores,
        [playerId]: s.roundScores[playerId].map((v, i) =>
          i === roundIdx ? score : v
        ),
      },
    }));
  },

  nextPlayer: () => {
    set((s) => ({
      currentPlayerIdx: (s.currentPlayerIdx + 1) % s.activePlayers.length,
    }));
  },

  nextRound: () => {
    set((s) => ({
      currentRound: Math.min(s.currentRound + 1, s.maxRounds),
      currentPlayerIdx: 0,
    }));
  },

  resetGame: () =>
    set({
      currentRound: 1,
      currentPlayerIdx: 0,
      isRolling: false,
      diceValues: [1, 1, 1, 1, 1],
      gameHistory: [],
      scores: {},
      roundScores: {},
      activePlayers: [],
    }),

  // Selectors
  getCurrentPlayer: () => {
    const state = get();
    return state.activePlayers[state.currentPlayerIdx];
  },

  getCurrentScore: (playerId) => {
    const state = get();
    return state.scores[playerId] || 0;
  },

  getPlayerRoundScores: (playerId) => {
    const state = get();
    return state.roundScores[playerId] || [];
  },

  getRoundHistory: (round) => {
    const state = get();
    return state.gameHistory.filter((entry) => entry.round === round);
  },

  getPlayerHistory: (playerId) => {
    const state = get();
    return state.gameHistory.filter((entry) => entry.player === playerId);
  },

  isGameOver: () => {
    const state = get();
    return state.currentRound > state.maxRounds;
  },

  getLeaderboard: () => {
    const state = get();
    return state.activePlayers
      .map((id) => ({ playerId: id, score: state.scores[id] || 0 }))
      .sort((a, b) => b.score - a.score);
  },
}));