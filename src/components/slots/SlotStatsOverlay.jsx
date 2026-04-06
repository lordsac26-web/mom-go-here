import { X, Trophy } from "lucide-react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { ACHIEVEMENTS } from "../../hooks/useSlotAchievements";

export default function SlotStatsOverlay({ open, onClose, stats }) {
  const panelRef = useRef(null);
  const badgeRefs = useRef([]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    gsap.fromTo(panelRef.current,
      { y: "100%", opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.2)" }
    );
    // Stagger badges
    const badges = badgeRefs.current.filter(Boolean);
    gsap.fromTo(badges,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, stagger: 0.04, ease: "back.out(2)", delay: 0.2 }
    );
  }, [open]);

  if (!open) return null;

  const unlocked = stats.unlockedKeys || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        ref={panelRef}
        className="bg-gray-900 border-t-4 sm:border-4 border-yellow-600 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Trophy size={24} className="text-yellow-400" />
            <h2 className="text-2xl font-black text-yellow-400">Player Stats</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800">
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard label="Total Spins" value={stats.totalSpins} emoji="🎰" />
            <StatCard label="Total Wins" value={stats.totalWins} emoji="🏆" />
            <StatCard label="Credits Spent" value={stats.totalSpent.toLocaleString()} emoji="💸" />
            <StatCard label="Credits Earned" value={stats.totalEarned.toLocaleString()} emoji="💰" />
            <StatCard label="Biggest Win" value={stats.biggestWin.toLocaleString()} emoji="🌟" />
            <StatCard label="Best Streak" value={stats.bestWinStreak} emoji="⚡" />
          </div>

          {/* Achievements */}
          <h3 className="text-xl font-black text-yellow-400 mb-3">
            🏅 Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
          </h3>
          <div className="grid grid-cols-3 gap-3 pb-4">
            {ACHIEVEMENTS.map((ach, i) => {
              const earned = unlocked.includes(ach.key);
              return (
                <div
                  key={ach.key}
                  ref={el => badgeRefs.current[i] = el}
                  className={`flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all ${
                    earned
                      ? "bg-yellow-900/30 border-yellow-600 shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                      : "bg-gray-800/50 border-gray-700 opacity-40"
                  }`}
                >
                  <span className={`text-3xl mb-1 ${earned ? "" : "grayscale"}`}>
                    {earned ? ach.emoji : "🔒"}
                  </span>
                  <span className={`text-xs font-bold leading-tight ${earned ? "text-white" : "text-gray-500"}`}>
                    {ach.title}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">{ach.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, emoji }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
      <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-black text-white flex items-center gap-1.5 mt-1">
        <span>{emoji}</span>
        <span>{value}</span>
      </div>
    </div>
  );
}