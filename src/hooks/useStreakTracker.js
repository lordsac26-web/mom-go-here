import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const BADGE_DEFINITIONS = [
  { key: "daily_3", label: "Faithful Start", emoji: "🌱", desc: "3-day Daily streak", type: "daily", threshold: 3 },
  { key: "daily_7", label: "Weekly Devotion", emoji: "📖", desc: "7-day Daily streak", type: "daily", threshold: 7 },
  { key: "daily_14", label: "Steadfast Spirit", emoji: "🔥", desc: "14-day Daily streak", type: "daily", threshold: 14 },
  { key: "daily_30", label: "Month of Faith", emoji: "⭐", desc: "30-day Daily streak", type: "daily", threshold: 30 },
  { key: "daily_60", label: "Devoted Heart", emoji: "💎", desc: "60-day Daily streak", type: "daily", threshold: 60 },
  { key: "daily_100", label: "Century of Light", emoji: "👑", desc: "100-day Daily streak", type: "daily", threshold: 100 },
  { key: "memories_3", label: "Memory Keeper", emoji: "📝", desc: "3-day Memories streak", type: "memories", threshold: 3 },
  { key: "memories_7", label: "Weekly Chronicler", emoji: "📔", desc: "7-day Memories streak", type: "memories", threshold: 7 },
  { key: "memories_14", label: "Storyteller", emoji: "📚", desc: "14-day Memories streak", type: "memories", threshold: 14 },
  { key: "memories_30", label: "Memory Master", emoji: "🏆", desc: "30-day Memories streak", type: "memories", threshold: 30 },
  { key: "both_7", label: "Balanced Soul", emoji: "☯️", desc: "7-day streak on both", type: "both", threshold: 7 },
  { key: "both_30", label: "Harmony Champion", emoji: "🌟", desc: "30-day streak on both", type: "both", threshold: 30 },
];

export { BADGE_DEFINITIONS };

function computeStreak(dates) {
  if (!dates || !dates.length) return 0;
  const sorted = [...dates].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((prev - curr) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

function computeNewBadges(dailyStreak, memoriesStreak, existingBadges) {
  const earned = new Set(existingBadges || []);
  const newlyEarned = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (earned.has(badge.key)) continue;
    let qualifies = false;
    if (badge.type === "daily" && dailyStreak >= badge.threshold) qualifies = true;
    if (badge.type === "memories" && memoriesStreak >= badge.threshold) qualifies = true;
    if (badge.type === "both" && dailyStreak >= badge.threshold && memoriesStreak >= badge.threshold) qualifies = true;
    if (qualifies) {
      earned.add(badge.key);
      newlyEarned.push(badge);
    }
  }

  return { allBadges: [...earned], newlyEarned };
}

export default function useStreakTracker(userEmail, pageType) {
  const [streakData, setStreakData] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!userEmail || recordedRef.current) return;
    recordedRef.current = true;
    recordVisit();
  }, [userEmail]);

  async function recordVisit() {
    const today = new Date().toISOString().split("T")[0];
    const rows = await base44.entities.EngagementStreak.filter({ user_email: userEmail });
    let record = rows[0];

    if (!record) {
      record = await base44.entities.EngagementStreak.create({
        user_email: userEmail,
        daily_dates: [],
        memories_dates: [],
        daily_current_streak: 0,
        daily_best_streak: 0,
        memories_current_streak: 0,
        memories_best_streak: 0,
        badges: [],
      });
    }

    const field = pageType === "daily" ? "daily_dates" : "memories_dates";
    const dates = record[field] || [];

    if (!dates.includes(today)) {
      dates.push(today);
      // Keep last 120 days max
      const cutoff = new Date(Date.now() - 120 * 86400000).toISOString().split("T")[0];
      const trimmed = dates.filter(d => d >= cutoff);

      const dailyDates = pageType === "daily" ? trimmed : (record.daily_dates || []);
      const memDates = pageType === "memories" ? trimmed : (record.memories_dates || []);

      const dailyStreak = computeStreak(dailyDates);
      const memStreak = computeStreak(memDates);
      const { allBadges, newlyEarned } = computeNewBadges(dailyStreak, memStreak, record.badges);

      const update = {
        [field]: trimmed,
        daily_current_streak: dailyStreak,
        daily_best_streak: Math.max(record.daily_best_streak || 0, dailyStreak),
        memories_current_streak: memStreak,
        memories_best_streak: Math.max(record.memories_best_streak || 0, memStreak),
        badges: allBadges,
      };

      await base44.entities.EngagementStreak.update(record.id, update);
      record = { ...record, ...update };
      setNewBadges(newlyEarned);
    } else {
      // Already visited today, just recompute streaks for display
      const dailyStreak = computeStreak(record.daily_dates || []);
      const memStreak = computeStreak(record.memories_dates || []);
      record.daily_current_streak = dailyStreak;
      record.memories_current_streak = memStreak;
    }

    setStreakData(record);
    setLoading(false);
  }

  return { streakData, newBadges, loading };
}