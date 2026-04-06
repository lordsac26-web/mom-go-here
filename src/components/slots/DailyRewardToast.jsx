import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

const DAILY_KEY = "slots_daily_reward";
const DAILY_REWARD = 5000;
const STREAK_BONUS = 1000; // extra per consecutive day

function getDayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function loadDailyData() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDailyData(data) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(data)); } catch {}
}

/**
 * Checks if a daily reward is due, grants it, returns { reward, streak } or null.
 */
export function checkDailyReward() {
  const today = getDayKey();
  const data = loadDailyData() || { lastClaim: null, streak: 0 };

  if (data.lastClaim === today) return null; // Already claimed today

  // Check streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);

  const newStreak = data.lastClaim === yKey ? data.streak + 1 : 1;
  const streakBonus = Math.min(newStreak - 1, 7) * STREAK_BONUS; // max 7 day bonus
  const reward = DAILY_REWARD + streakBonus;

  saveDailyData({ lastClaim: today, streak: newStreak });
  return { reward, streak: newStreak };
}

export default function DailyRewardToast({ reward, streak, onDismiss }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !reward) return;
    const el = ref.current;

    gsap.fromTo(el,
      { y: -100, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }
    );
    // Sparkle glow
    gsap.to(el, {
      boxShadow: "0 0 40px rgba(234,179,8,0.7), 0 0 80px rgba(234,179,8,0.3)",
      duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut", delay: 0.4,
    });
  }, [reward]);

  if (!reward) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[60] flex justify-center pointer-events-none px-4">
      <div
        ref={ref}
        className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-green-300 pointer-events-auto max-w-sm w-full"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">🎁</span>
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-green-100">
              Daily Reward!
            </div>
            <div className="text-2xl font-black leading-tight">
              +{reward.toLocaleString()} Credits
            </div>
            {streak > 1 && (
              <div className="text-xs text-green-100 mt-0.5">
                🔥 {streak}-day streak bonus!
              </div>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="bg-white/20 text-white text-sm font-bold px-3 py-2 rounded-xl hover:bg-white/30"
          >
            Claim!
          </button>
        </div>
      </div>
    </div>
  );
}