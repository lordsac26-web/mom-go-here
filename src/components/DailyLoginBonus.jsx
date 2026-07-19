import * as React from "react";
const { useState, useEffect, useRef } = React;
import gsap from "gsap";
import { base44 } from "@/api/base44Client";
import { useDailyMissions } from "../hooks/useDailyMissions";

// 7-day reward cycle — repeats after day 7
const DAILY_REWARDS = [
  { day: 1, credits: 2000, emoji: "🎁", label: "Welcome Back!" },
  { day: 2, credits: 3000, emoji: "🔥", label: "On Fire!" },
  { day: 3, credits: 4000, emoji: "⚡", label: "Powered Up!" },
  { day: 4, credits: 5000, emoji: "💎", label: "Diamond Day!" },
  { day: 5, credits: 7500, emoji: "🌟", label: "Superstar!" },
  { day: 6, credits: 10000, emoji: "👑", label: "Royal Bonus!" },
  { day: 7, credits: 25000, emoji: "🏆", label: "JACKPOT DAY!" },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function DailyLoginBonus({ userEmail }) {
  const [show, setShow] = useState(false);
  const [record, setRecord] = useState(null);
  const [reward, setReward] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [streakDay, setStreakDay] = useState(1);
  const overlayRef = useRef(null);
  const cardRefs = useRef([]);
  const claimRef = useRef(null);
  const { reportMissionProgress } = useDailyMissions();

  useEffect(() => {
    if (!userEmail) return;
    checkBonus();
  }, [userEmail]);

  async function checkBonus() {
    const today = getTodayKey();
    const records = await base44.entities.DailyLoginBonus.filter({ user_email: userEmail });
    let rec = records[0] || null;

    if (!rec) {
      rec = await base44.entities.DailyLoginBonus.create({
        user_email: userEmail,
        current_streak: 0,
        best_streak: 0,
        last_claim_date: "",
        total_claimed: 0,
        total_days_claimed: 0,
      });
    }

    setRecord(rec);

    if (rec.last_claim_date === today) return; // Already claimed

    // Calculate streak
    const yesterday = getYesterdayKey();
    const newStreak = rec.last_claim_date === yesterday ? (rec.current_streak || 0) + 1 : 1;
    const dayIndex = ((newStreak - 1) % 7);
    const todayReward = DAILY_REWARDS[dayIndex];

    setStreakDay(newStreak);
    setReward(todayReward);
    setShow(true);
  }

  useEffect(() => {
    if (!show || !overlayRef.current) return;

    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });

    // Stagger day cards
    const cards = cardRefs.current.filter(Boolean);
    gsap.fromTo(cards,
      { y: 30, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.06, ease: "back.out(2)", delay: 0.3 }
    );

    // Pulse the claim button
    if (claimRef.current) {
      gsap.fromTo(claimRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.4)", delay: 0.9 }
      );
    }
  }, [show]);

  async function handleClaim() {
    if (!record || !reward || claimed) return;
    setClaimed(true);

    const today = getTodayKey();
    const newBest = Math.max(record.best_streak || 0, streakDay);

    await base44.entities.DailyLoginBonus.update(record.id, {
      current_streak: streakDay,
      best_streak: newBest,
      last_claim_date: today,
      total_claimed: (record.total_claimed || 0) + reward.credits,
      total_days_claimed: (record.total_days_claimed || 0) + 1,
    });

    // Also add to slots balance in localStorage
    try {
      const current = parseInt(localStorage.getItem("slots_balance") || "0", 10);
      localStorage.setItem("slots_balance", (current + reward.credits).toString());
    } catch {}

    // Credit shop currency via the secure economy function (PlayerCoins is read-only client-side)
    try {
      await base44.functions.invoke("economy", { action: "credit", amount: reward.credits });
    } catch {}

    // Report to daily missions
    reportMissionProgress("daily_login");

    // Celebrate animation
    if (claimRef.current) {
      gsap.to(claimRef.current, {
        scale: 1.2, duration: 0.2, yoyo: true, repeat: 1,
        ease: "power2.out",
      });
    }

    // Close after delay
    setTimeout(() => {
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0, duration: 0.3, onComplete: () => setShow(false),
        });
      }
    }, 1500);
  }

  if (!show || !reward) return null;

  const currentDayIndex = ((streakDay - 1) % 7);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] bg-black/85 flex items-center justify-center px-4 py-4 overflow-y-auto"
      style={{ opacity: 0, paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="w-full max-w-sm my-auto max-h-full overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">📅</div>
          <h2 className="text-3xl font-black text-primary">Daily Bonus!</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Come back every day for bigger rewards!
          </p>
          {streakDay > 1 && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-300 px-3 py-1 rounded-full text-sm font-bold">
              🔥 {streakDay}-Day Streak!
            </div>
          )}
          {(record?.best_streak || 0) > 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              Best streak: {record.best_streak} days
            </p>
          )}
        </div>

        {/* 7-Day Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 mb-5">
          {DAILY_REWARDS.map((day, i) => {
            const isToday = i === currentDayIndex;
            const isPast = i < currentDayIndex;
            return (
              <div
                key={i}
                ref={el => cardRefs.current[i] = el}
                className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all ${
                  isToday
                    ? "border-primary bg-primary/20 shadow-[0_0_16px_rgba(234,179,8,0.3)] scale-110 relative z-10"
                    : isPast
                      ? "border-green-500/40 bg-green-900/20"
                      : "border-border/50 bg-card/30"
                }`}
                style={{ opacity: 0 }}
              >
                <span className="text-lg">{isPast ? "✅" : day.emoji}</span>
                <span className={`text-[10px] font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  Day {day.day}
                </span>
                <span className={`text-[9px] font-black ${isToday ? "text-foreground" : "text-muted-foreground"}`}>
                  {day.credits >= 1000 ? `${day.credits / 1000}K` : day.credits}
                </span>
              </div>
            );
          })}
        </div>

        {/* Today's Reward Card */}
        <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-2xl p-4 border-2 border-yellow-300 mb-4 text-center">
          <span className="text-4xl">{reward.emoji}</span>
          <div className="text-xs font-bold text-yellow-900/80 uppercase tracking-wider mt-1">
            {reward.label}
          </div>
          <div className="text-3xl font-black text-gray-900 mt-1">
            +{reward.credits.toLocaleString()}
          </div>
          <div className="text-xs text-yellow-900/70">Free Credits!</div>
        </div>

        {/* Claim Button */}
        <button
          ref={claimRef}
          onClick={handleClaim}
          disabled={claimed}
          className={`w-full text-xl font-black py-4 rounded-2xl border-2 transition-all active:scale-95 ${
            claimed
              ? "bg-green-600 border-green-400 text-white"
              : "bg-primary border-yellow-300 text-primary-foreground hover:brightness-110"
          }`}
          style={{ opacity: 0 }}
        >
          {claimed ? "✅ Claimed!" : `🎁 Claim +${reward.credits.toLocaleString()}`}
        </button>

        {/* Skip button */}
        {!claimed && (
          <button
            onClick={() => {
              if (overlayRef.current) {
                gsap.to(overlayRef.current, {
                  opacity: 0, duration: 0.2, onComplete: () => setShow(false),
                });
              }
            }}
            className="w-full text-center text-sm text-muted-foreground mt-3 py-2 hover:text-foreground transition-colors"
          >
            Remind me later
          </button>
        )}
      </div>
    </div>
  );
}