import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function HomeProgressPill({ userEmail }) {
  const [stats, setStats] = useState({ streak: 0, level: 1 });

  useEffect(() => {
    if (!userEmail) return;
    Promise.all([
      base44.entities.DailyLoginBonus.filter({ user_email: userEmail }),
      base44.entities.PlayerXP.filter({ user_email: userEmail }),
    ]).then(([bonus, xp]) => setStats({
      streak: bonus[0]?.current_streak || 0,
      level: xp[0]?.level || 1,
    }));
  }, [userEmail]);

  return (
    <div className="inline-flex min-h-[44px] items-center gap-3 rounded-full border-2 border-primary bg-primary/10 px-4 text-base font-black text-foreground">
      <span>🔥 {stats.streak} day{stats.streak === 1 ? "" : "s"}</span>
      <span aria-hidden="true">·</span>
      <span>⭐ Level {stats.level}</span>
    </div>
  );
}