import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import WarmLoader from "../components/WarmLoader";
import ACHIEVEMENTS, { CATEGORIES } from "../components/achievementDefinitions";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import SubPageHeader from "../components/SubPageHeader";

function BadgeCard({ ach, earned, index }) {
  const isEarned = !!earned;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 200, damping: 20 }}
      className={`rounded-2xl border-2 p-4 transition-all ${
        isEarned
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
          : "border-border bg-card/50 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-3xl flex-shrink-0 ${isEarned ? "" : "grayscale"}`}>
          {ach.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-black leading-tight ${isEarned ? "text-foreground" : "text-muted-foreground"}`}>
            {ach.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>
          {isEarned && earned.earned_date && (
            <p className="text-xs text-primary font-bold mt-1">
              ✅ Earned {new Date(earned.earned_date).toLocaleDateString()}
            </p>
          )}
        </div>
        {isEarned && (
          <span className="text-xl flex-shrink-0">✅</span>
        )}
      </div>
    </motion.div>
  );
}

export default function Achievements() {
  const { user } = useAuth();
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Achievement.filter({ user_email: user.email })
      .then(setEarned)
      .finally(() => setLoading(false));
  }, [user]);

  const earnedMap = useMemo(() => {
    const map = {};
    earned.forEach(a => { map[a.achievement_key] = a; });
    return map;
  }, [earned]);

  const earnedCount = earned.length;
  const totalCount = ACHIEVEMENTS.length;
  const pct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const filtered = activeCategory
    ? ACHIEVEMENTS.filter(a => a.category === activeCategory)
    : ACHIEVEMENTS;

  // Count earned per category
  const categoryCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach(cat => {
      const total = ACHIEVEMENTS.filter(a => a.category === cat).length;
      const done = ACHIEVEMENTS.filter(a => a.category === cat && earnedMap[a.key]).length;
      counts[cat] = { total, done };
    });
    return counts;
  }, [earnedMap]);

  if (loading) return <WarmLoader message="Loading achievements..." />;

  return (
    <div className="min-h-screen pb-24">
      <SubPageHeader backTo="/" title="Achievements" icon={Trophy} />

      <div className="px-4">
        {/* Summary card */}
        <div className="bg-card border-2 border-primary rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-3xl font-black text-foreground">{earnedCount} / {totalCount}</p>
              <p className="text-sm text-muted-foreground font-bold">Badges Earned</p>
            </div>
            <div className="text-5xl">🏅</div>
          </div>
          {/* Overall progress bar */}
          <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-yellow-400 to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-bold text-right mt-1">{pct}% complete</p>
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            All ({earnedCount}/{totalCount})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {cat} ({categoryCounts[cat]?.done}/{categoryCounts[cat]?.total})
            </button>
          ))}
        </div>
      </div>

      {/* Badge grid */}
      <div className="px-4 space-y-3">
        {filtered.map((ach, i) => (
          <BadgeCard
            key={ach.key}
            ach={ach}
            earned={earnedMap[ach.key]}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}