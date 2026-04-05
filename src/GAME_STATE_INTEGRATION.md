# Game State Management with Zustand

## Overview
Centralized state store for tracking:
- **Current Round** — Game progression (1 to maxRounds)
- **Active Players** — Player list with scores and turn order
- **Rolling Status** — Which players are currently rolling/acting
- **Game History** — Complete log of actions, rolls, and scores
- **Game Status** — "setup" | "playing" | "paused" | "over"

## Quick Start

### 1. Initialize Game
```jsx
import { useGameStore } from "@/stores/gameStore";

function GameSetup() {
  const initializeGame = useGameStore((state) => state.initializeGame);

  const handleStart = () => {
    const players = [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" }
    ];
    initializeGame(players, 13); // 13 rounds max
  };

  return <button onClick={handleStart}>Start Game</button>;
}
```

### 2. Track Player Actions
```jsx
import { useGameState } from "@/hooks/useGameState";

function PlayerTurn() {
  const { currentPlayer, startPlayerRoll, completePlayerRoll, currentRound } = useGameState();

  const handleRoll = async () => {
    startPlayerRoll(currentPlayer.id);
    
    // Simulate roll/action
    const result = Math.floor(Math.random() * 6) + 1;
    await new Promise(r => setTimeout(r, 1000));

    completePlayerRoll(
      currentPlayer.id,
      currentPlayer.name,
      { diceValue: result },
      result * 10 // score
    );
  };

  return (
    <div>
      <p>Round {currentRound}: {currentPlayer?.name}'s turn</p>
      <button onClick={handleRoll}>Roll Dice</button>
    </div>
  );
}
```

### 3. Display Leaderboard
```jsx
import { useLeaderboard } from "@/stores/gameStore";

function Leaderboard() {
  const leaderboard = useLeaderboard();

  return (
    <div>
      {leaderboard.map((player, idx) => (
        <div key={player.id}>
          {idx + 1}. {player.name} — {player.score} pts
        </div>
      ))}
    </div>
  );
}
```

### 4. View Game History
```jsx
import { useGameHistory } from "@/stores/gameStore";

function History() {
  const history = useGameHistory();

  return (
    <div>
      {history.map((entry, idx) => (
        <p key={idx}>
          Round {entry.round}: {entry.playerName} → {JSON.stringify(entry.result)}
        </p>
      ))}
    </div>
  );
}
```

## Store API

### State
- `currentRound: number` — Current round (1 to maxRounds)
- `activePlayers: Array` — List of active players with scores
- `rollingStatus: Object` — { playerId: boolean }
- `gameHistory: Array` — Complete action log
- `gameStatus: string` — "setup" | "playing" | "paused" | "over"
- `maxRounds: number` — Total rounds in game

### Actions
- `initializeGame(players, maxRounds)` — Start new game
- `setRollingStatus(playerId, isRolling)` — Track active roller
- `addHistoryEntry(entry)` — Log action with timestamp
- `updatePlayerScore(playerId, scoreChange)` — Add/subtract from score
- `setPlayerScore(playerId, score)` — Set absolute score
- `nextRound()` — Advance to next round (auto-ends if maxRounds exceeded)
- `setGameStatus(status)` — Update game state
- `resetGame()` — Clear all state

### Selectors (Computed)
- `getCurrentPlayer()` — Get player whose turn it is
- `getLeaderboard()` — Get players ranked by score
- `getRoundHistory(round)` — Get all actions in a round
- `getPlayerHistory(playerId)` — Get all actions by player

### Custom Hooks
- `useCurrentRound()` — Just the round number
- `useActivePlayer()` — Just current player
- `useActivePlayerList()` — Just player array
- `useRollingStatus()` — Just rolling state
- `useLeaderboard()` — Just leaderboard
- `useGameHistory()` — Just history
- `useGameStatus()` — Just game status

## Example: Full Yahtzee Integration

```jsx
import { useGameState } from "@/hooks/useGameState";

function YahtzeeGame() {
  const { 
    currentRound, 
    currentPlayer, 
    completePlayerRoll, 
    advanceTurn 
  } = useGameState();

  const handleScoreCategory = (category, score) => {
    completePlayerRoll(
      currentPlayer.id,
      currentPlayer.name,
      { category, score },
      score
    );
    advanceTurn();
  };

  return (
    <div>
      <p>Round {currentRound}: {currentPlayer?.name}</p>
      {/* Dice UI + scoring */}
      <button onClick={() => handleScoreCategory("yahtzee", 50)}>
        Score Yahtzee
      </button>
    </div>
  );
}
```

## Performance Tips
1. **Selectors** — Use custom hooks (`useCurrentRound()`) to minimize re-renders.
2. **Deep Updates** — Zustand auto-memoizes objects; only re-render when selected state changes.
3. **History Pruning** — For long games, periodically archive old history via backend.
4. **Persistence** — To save state across sessions, wrap store with localStorage middleware:
   ```js
   import { persist } from 'zustand/middleware';
   ```

## Next Steps
- Integrate with **Yahtzee, Checkers, or other turn-based games**
- Sync state with **Base44 GameScore entity** for persistence
- Add **real-time multiplayer** using Zustand + subscriptions