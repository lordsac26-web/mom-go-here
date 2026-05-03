import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useDailyMissions } from "../hooks/useDailyMissions";
import { Zap, Check } from "lucide-react";
import SubPageHeader from "../components/SubPageHeader";
import WarmLoader from "../components/WarmLoader";
import ZenWeeklyChart from "../components/ZenWeeklyChart";
import { getDailyGame, getTodayStr } from "../utils/dailyGame";



export default function DailyChallenge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [weekRecords, setWeekRecords] = useState([]);
  const [totalZen, setTotalZen] = useState(0);
  const [marking, setMarking] = useState(false);

  const todayStr = getTodayStr();
  const dailyGame = getDailyGame(todayStr);

  useEffect(() => {
    if (user?.email) loadData();
  }, [user]);

  async function loadData() {
    const allRecords = await base44.entities.ZenPoints.filter(
      { user_email: user.email },
      "-date",
      30
    );

    const today = allRecords.find(r => r.date === todayStr);
    setTodayRecord(today || null);

    // Last 7 days
    const weekDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekDates.push(d.toISOString().split("T")[0]);
    }
    setWeekRecords(allRecords.filter(r => weekDates.includes(r.date)));

    // Total lifetime points
    const total = allRecords.reduce((sum, r) => sum + (r.points_earned || 0), 0);
    setTotalZen(total);
    setLoading(false);
  }

  async function handlePlayChallenge() {
    // Create the record if it doesn't exist yet (marks the game was assigned)
    if (!todayRecord) {
      const record = await base44.entities.ZenPoints.create({
        user_email: user.email,
        date: todayStr,
        game_path: dailyGame.path,
        game_name: dailyGame.name,
        game_emoji: dailyGame.emoji,
        completed: false,
        points_earned: 0,
      });
      setTodayRecord(record);
    }
    // Navigate to the game
    navigate(dailyGame.path);
  }

  const { reportMissionProgress } = useDailyMissions();

  async function handleMarkComplete() {
    setMarking(true);
    // Report daily challenge mission
    reportMissionProgress("daily_challenge");
    if (todayRecord && !todayRecord.completed) {
      await base44.entities.ZenPoints.update(todayRecord.id, {
        completed: true,
        points_earned: 10,
      });
      setTodayRecord({ ...todayRecord, completed: true, points_earned: 10 });
      setTotalZen(prev => prev + 10);
      setWeekRecords(prev =>
        prev.map(r => r.date === todayStr ? { ...r, completed: true, points_earned: 10 } : r)
          .concat(prev.find(r => r.date === todayStr) ? [] : [{ date: todayStr, completed: true, points_earned: 10, game_emoji: dailyGame.emoji }])
      );
    } else if (!todayRecord) {
      const record = await base44.entities.ZenPoints.create({
        user_email: user.email,
        date: todayStr,
        game_path: dailyGame.path,
        game_name: dailyGame.name,
        game_emoji: dailyGame.emoji,
        completed: true,
        points_earned: 10,
      });
      setTodayRecord(record);
      setTotalZen(prev => prev + 10);
      setWeekRecords(prev => [...prev, { date: todayStr, completed: true, points_earned: 10, game_emoji: dailyGame.emoji }]);
    }
    setMarking(false);
  }

  const completed = todayRecord?.completed;

  if (loading) return <WarmLoader message="Preparing your brain challenge..." />;

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <SubPageHeader backTo="/" title="Daily Brain Challenge" emoji="🧠" />

      <div className="text-center mb-6">
        <h1 className="text-4xl font-black text-primary">🧠 Daily Brain Challenge</h1>
        <p className="text-muted-foreground text-lg mt-1">One game a day keeps the mind sharp!</p>
      </div>

      {/* Zen Points Total */}
      <div className="bg-card border-2 border-primary rounded-3xl p-5 mb-6 shadow-2xl max-w-lg mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Zap size={32} className="text-primary" />
          <span className="text-5xl font-black text-primary">{totalZen}</span>
        </div>
        <p className="text-xl font-bold text-foreground">Total Zen Points</p>
        <p className="text-muted-foreground text-base">Earn 10 points for each daily challenge</p>
      </div>

      {/* Today's Challenge Card */}
      <div className="max-w-lg mx-auto mb-6">
        <div className={`bg-gradient-to-r ${dailyGame.color} rounded-3xl p-6 shadow-2xl border-2 ${completed ? "border-green-400" : "border-white/20"}`}>
          <div className="text-center">
            <p className="text-white/80 text-lg font-bold mb-1">Today's Challenge</p>
            <span className="text-7xl block mb-3">{dailyGame.emoji}</span>
            <h2 className="text-3xl font-black text-white mb-1">{dailyGame.name}</h2>
            <p className="text-white/80 text-lg mb-4">{dailyGame.desc}</p>

            {completed ? (
              <div className="bg-green-600/30 border-2 border-green-400 rounded-2xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <Check size={28} className="text-green-300" />
                  <span className="text-2xl font-black text-white">Challenge Complete! +10 🧘</span>
                </div>
                <button
                  onClick={() => navigate(dailyGame.path)}
                  className="mt-3 bg-white/20 text-white text-lg font-bold py-3 px-6 rounded-xl"
                >
                  Play Again for Fun →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handlePlayChallenge}
                  className="w-full bg-white text-gray-900 text-2xl font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-transform"
                >
                  🎮 Play Challenge
                </button>
                {todayRecord && !todayRecord.completed && (
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="w-full bg-green-500 text-white text-xl font-black py-4 rounded-2xl disabled:opacity-50"
                  >
                    {marking ? "Marking..." : "✅ I Played It — Claim 10 Zen Points"}
                  </button>
                )}
                {!todayRecord && (
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="w-full bg-white/20 text-white text-lg font-bold py-3 rounded-xl border border-white/30 disabled:opacity-50"
                  >
                    {marking ? "Marking..." : "Already played today? Claim points →"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="max-w-lg mx-auto mb-6">
        <ZenWeeklyChart records={weekRecords} />
      </div>

      {/* Motivation */}
      <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-5 text-center">
        <p className="text-lg text-foreground font-bold">
          {completed
            ? "🌟 Great job today! Come back tomorrow for a new challenge."
            : "🧘 Complete today's challenge to earn Zen Points and keep your streak alive!"}
        </p>
      </div>
    </div>
  );
}