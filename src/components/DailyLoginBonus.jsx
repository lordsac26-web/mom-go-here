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
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
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

    rec = rec || {
      user_email: userEmail,
      current_streak: 0,
      best_streak: 0,
      last_claim_date: "",
      total_claimed: 0,
      total_days_claimed: 0,
    };

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
    if (!record || !reward || claimed || claiming) return;
    setClaiming(true);
    setClaimError("");
    try {
      const response = await base44.functions.invoke("economy", { action: "daily_login" });
      const result = response?.data;
      if (!result?.dailyLogin) throw new Error("Your reward could not be claimed.");
      setRecord(result.dailyLogin);
      setStreakDay(result.dailyLogin.current_streak);
      setClaimed(true);
      try {
        const current = parseInt(localStorage.getItem("slots_balance") || "0", 10);
        localStorage.setItem("slots_balance", (current + result.credited).toString());
      } catch {}
      reportMissionProgress("daily_login");
      if (claimRef.current) gsap.to(claimRef.current, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" });
      setTimeout(() => {
        if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, onComplete: () => setShow(false) });
      }, 1500);
    } catch (error) {
      setClaimError(error.message || "Your reward could not be claimed. Please try again.");
    } finally {
      setClaiming(false);
    }
  }

  if (!show || !reward) return null;

  const currentDayIndex = ((streakDay - 1) % 7);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black/85 px-4 py-3"
      style={{ opacity: 0, paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-3 text-center">
          <div className="mb-1 text-4xl">📅</div>
          <h2 className="text-2xl font-black text-primary">Daily Bonus!</h2>
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
        <div className="mb-3 grid grid-cols-7 gap-1">
          {DAILY_REWARDS.map((day, i) => {
            const isToday = i === currentDayIndex;
            const isPast = i < currentDayIndex;
            return (
              <div
                key={i}
                ref={el => cardRefs.current[i] = el}
                className={`flex flex-col items-center rounded-lg border-2 p-1 transition-all ${
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
        <div className="mb-3 rounded-2xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 p-3 text-center">
          <span className="text-3xl">{reward.emoji}</span>
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
          disabled={claimed || claiming}
          className={`w-full rounded-2xl border-2 py-3 text-lg font-black transition-all active:scale-95 ${
            claimed
              ? "bg-green-600 border-green-400 text-white"
              : "bg-primary border-yellow-300 text-primary-foreground hover:brightness-110"
          }`}
          style={{ opacity: 0 }}
        >
          {claiming ? "Claiming..." : claimed ? "✅ Claimed!" : `🎁 Claim +${reward.credits.toLocaleString()}`}
        </button>
        {claimError && <p className="mt-2 text-center text-sm font-bold text-red-300">{claimError}</p>}

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
            className="mt-2 w-full py-1 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Remind me later
          </button>
        )}
      </div>
    </div>
  );
}