import { useState, useCallback, useRef } from "react";

const STORAGE_KEY = "slots_stats";

const ACHIEVEMENTS = [
  { key: "first_spin", emoji: "🎰", title: "First Spin", desc: "Complete your first spin", check: s => s.totalSpins >= 1 },
  { key: "first_win", emoji: "🏆", title: "First Win", desc: "Win your first payout", check: s => s.totalWins >= 1 },
  { key: "ten_spins", emoji: "🔄", title: "Getting Started", desc: "Spin 10 times", check: s => s.totalSpins >= 10 },
  { key: "fifty_spins", emoji: "🎡", title: "Regular Player", desc: "Spin 50 times", check: s => s.totalSpins >= 50 },
  { key: "hundred_spins", emoji: "💫", title: "Spin Master", desc: "Spin 100 times", check: s => s.totalSpins >= 100 },
  { key: "five_hundred_spins", emoji: "🌀", title: "Slot Addict", desc: "Spin 500 times", check: s => s.totalSpins >= 500 },
  { key: "big_spender", emoji: "💸", title: "Big Spender", desc: "Spend 10,000 credits total", check: s => s.totalSpent >= 10000 },
  { key: "whale", emoji: "🐋", title: "The Whale", desc: "Spend 100,000 credits total", check: s => s.totalSpent >= 100000 },
  { key: "high_roller", emoji: "🎩", title: "High Roller", desc: "Place a bet of 5,000 or more", check: s => s.maxBet >= 5000 },
  { key: "small_win", emoji: "✨", title: "Lucky Break", desc: "Win 1,000+ on a single spin", check: s => s.biggestWin >= 1000 },
  { key: "big_win", emoji: "🌟", title: "Big Winner", desc: "Win 5,000+ on a single spin", check: s => s.biggestWin >= 5000 },
  { key: "mega_win", emoji: "🎆", title: "Mega Jackpot", desc: "Win 25,000+ on a single spin", check: s => s.biggestWin >= 25000 },
  { key: "ten_wins", emoji: "🔥", title: "On a Roll", desc: "Win 10 times", check: s => s.totalWins >= 10 },
  { key: "fifty_wins", emoji: "👑", title: "King of Slots", desc: "Win 50 times", check: s => s.totalWins >= 50 },
  { key: "scatter_win", emoji: "💰", title: "Scatter Master", desc: "Hit a scatter bonus", check: s => s.scatterWins >= 1 },
  { key: "five_line_win", emoji: "🎯", title: "Multi-Liner", desc: "Win on 5+ lines in one spin", check: s => s.maxLinesWon >= 5 },
  { key: "total_earned_50k", emoji: "💎", title: "Diamond Earner", desc: "Earn 50,000 total credits", check: s => s.totalEarned >= 50000 },
  { key: "streak_5", emoji: "⚡", title: "Hot Streak", desc: "Win 5 spins in a row", check: s => s.bestWinStreak >= 5 },
];

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function defaultStats() {
  return {
    totalSpins: 0,
    totalWins: 0,
    totalSpent: 0,
    totalEarned: 0,
    biggestWin: 0,
    maxBet: 0,
    scatterWins: 0,
    maxLinesWon: 0,
    bestWinStreak: 0,
    currentWinStreak: 0,
    unlockedKeys: [],
  };
}

export { ACHIEVEMENTS };

export default function useSlotAchievements() {
  const [stats, setStats] = useState(() => loadStats() || defaultStats());
  const [newBadge, setNewBadge] = useState(null);
  const badgeQueueRef = useRef([]);
  const showingRef = useRef(false);

  const saveStats = useCallback((updated) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  const showNextBadge = useCallback(() => {
    if (badgeQueueRef.current.length === 0) {
      showingRef.current = false;
      return;
    }
    showingRef.current = true;
    const next = badgeQueueRef.current.shift();
    setNewBadge(next);
    setTimeout(() => {
      setNewBadge(null);
      setTimeout(() => showNextBadge(), 300);
    }, 2500);
  }, []);

  const checkAchievements = useCallback((updated) => {
    const newUnlocks = [];
    for (const ach of ACHIEVEMENTS) {
      if (!updated.unlockedKeys.includes(ach.key) && ach.check(updated)) {
        updated.unlockedKeys.push(ach.key);
        newUnlocks.push(ach);
      }
    }
    if (newUnlocks.length > 0) {
      badgeQueueRef.current.push(...newUnlocks);
      if (!showingRef.current) showNextBadge();
    }
    return updated;
  }, [showNextBadge]);

  const recordSpin = useCallback((betAmount) => {
    setStats(prev => {
      const updated = {
        ...prev,
        totalSpins: prev.totalSpins + 1,
        totalSpent: prev.totalSpent + betAmount,
        maxBet: Math.max(prev.maxBet, betAmount),
      };
      const checked = checkAchievements(updated);
      saveStats(checked);
      return checked;
    });
  }, [checkAchievements, saveStats]);

  const recordWin = useCallback((winAmount, lineWins, hasScatter) => {
    setStats(prev => {
      const newStreak = prev.currentWinStreak + 1;
      const updated = {
        ...prev,
        totalWins: prev.totalWins + 1,
        totalEarned: prev.totalEarned + winAmount,
        biggestWin: Math.max(prev.biggestWin, winAmount),
        scatterWins: prev.scatterWins + (hasScatter ? 1 : 0),
        maxLinesWon: Math.max(prev.maxLinesWon, lineWins),
        currentWinStreak: newStreak,
        bestWinStreak: Math.max(prev.bestWinStreak, newStreak),
      };
      const checked = checkAchievements(updated);
      saveStats(checked);
      return checked;
    });
  }, [checkAchievements, saveStats]);

  const recordLoss = useCallback(() => {
    setStats(prev => {
      const updated = { ...prev, currentWinStreak: 0 };
      saveStats(updated);
      return updated;
    });
  }, [saveStats]);

  return { stats, recordSpin, recordWin, recordLoss, newBadge, ACHIEVEMENTS };
}