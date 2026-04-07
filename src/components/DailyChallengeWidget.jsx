import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Zap, Check } from "lucide-react";
import { getDailyGame, getTodayStr } from "../utils/dailyGame";
import WidgetErrorState from "./WidgetErrorState";



export default function DailyChallengeWidget({ userEmail, refreshKey }) {
  const [record, setRecord] = useState(null);
  const [totalZen, setTotalZen] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const todayStr = getTodayStr();
  const dailyGame = getDailyGame(todayStr);

  function fetchData() {
    if (!userEmail) return;
    setError(false);
    base44.entities.ZenPoints.filter({ user_email: userEmail }, "-date", 30).then(records => {
      setRecord(records.find(r => r.date === todayStr) || null);
      setTotalZen(records.reduce((s, r) => s + (r.points_earned || 0), 0));
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { fetchData(); }, [userEmail, refreshKey]);

  if (error) return <WidgetErrorState message="Couldn't load challenge" emoji="🧠" onRetry={fetchData} />;
  if (loading) return null;

  const completed = record?.completed;

  return (
    <Link
      to="/daily-challenge"
      className="block bg-card border-2 border-border rounded-2xl p-4 mb-4 shadow hover:border-primary transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{dailyGame.emoji}</span>
          <div>
            <p className="text-lg font-black text-foreground flex items-center gap-2">
              🧠 Daily Challenge
              {completed && <Check size={18} className="text-green-400" />}
            </p>
            <p className="text-sm text-muted-foreground">
              {completed ? `Completed: ${dailyGame.name}` : `Play ${dailyGame.name} today!`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-primary">
          <Zap size={18} />
          <span className="text-xl font-black">{totalZen}</span>
        </div>
      </div>
    </Link>
  );
}