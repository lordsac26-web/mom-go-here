import * as React from "react";
const { useCallback } = React;

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

// Module-level state — avoids useState/useRef null-dispatcher crash from Base44 SDK React conflict
let _stats = loadStats() || defaultStats();
let _badgeQueue = [];
let _showing = false;
let _listeners = [];

function notifyListeners() {
  _listeners.forEach(fn => fn({ ..._stats }));
}

function subscribe(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

function saveStats(updated) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
}

function checkAchievements(updated, onBadge) {
  for (const ach of ACHIEVEMENTS) {
    if (!updated.unlockedKeys.includes(ach.key) && ach.check(updated)) {
      updated.unlockedKeys.push(ach.key);
      _badgeQueue.push(ach);
    }
  }
  if (_badgeQueue.length > 0 && !_showing) showNextBadge(onBadge);
  return updated;
}

function showNextBadge(onBadge) {
  if (_badgeQueue.length === 0) { _showing = false; return; }
  _showing = true;
  const next = _badgeQueue.shift();
  if (onBadge) onBadge(next);
  setTimeout(() => {
    if (onBadge) onBadge(null);
    setTimeout(() => showNextBadge(onBadge), 300);
  }, 2500);
}

export { ACHIEVEMENTS };

export default function useSlotAchievements(onBadge) {
  const recordSpin = useCallback((betAmount) => {
    _stats = {
      ..._stats,
      totalSpins: _stats.totalSpins + 1,
      totalSpent: _stats.totalSpent + betAmount,
      maxBet: Math.max(_stats.maxBet, betAmount),
    };
    _stats = checkAchievements(_stats, onBadge);
    saveStats(_stats);
    notifyListeners();
  }, [onBadge]);

  const recordWin = useCallback((winAmount, lineWins, hasScatter) => {
    const newStreak = _stats.currentWinStreak + 1;
    _stats = {
      ..._stats,
      totalWins: _stats.totalWins + 1,
      totalEarned: _stats.totalEarned + winAmount,
      biggestWin: Math.max(_stats.biggestWin, winAmount),
      scatterWins: _stats.scatterWins + (hasScatter ? 1 : 0),
      maxLinesWon: Math.max(_stats.maxLinesWon, lineWins),
      currentWinStreak: newStreak,
      bestWinStreak: Math.max(_stats.bestWinStreak, newStreak),
    };
    _stats = checkAchievements(_stats, onBadge);
    saveStats(_stats);
    notifyListeners();
  }, [onBadge]);

  const recordLoss = useCallback(() => {
    _stats = { ..._stats, currentWinStreak: 0 };
    saveStats(_stats);
    notifyListeners();
  }, []);

  return { stats: _stats, recordSpin, recordWin, recordLoss, ACHIEVEMENTS, subscribe };
}