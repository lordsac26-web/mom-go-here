import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useDailyMissions } from "../hooks/useDailyMissions";
import { RefreshCw, BookmarkPlus, Check } from "lucide-react";
import WarmLoader from "../components/WarmLoader";
import useStreakTracker from "../hooks/useStreakTracker";
import StreakBanner from "../components/StreakBanner";

const RELIGION_CONFIG = {
  Christianity: { label: "Daily Scripture", emoji: "✝️" },
  Catholicism: { label: "Daily Scripture", emoji: "⛪" },
  Judaism: { label: "Daily Torah Reading", emoji: "✡️" },
  Islam: { label: "Daily Quranic Verse", emoji: "☪️" },
  Hinduism: { label: "Daily Gita Teaching", emoji: "🕉️" },
  Buddhism: { label: "Daily Dharma", emoji: "☸️" },
  Sikhism: { label: "Daily Hukamnama", emoji: "🪯" },
};

export default function Daily() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const { streakData, newBadges } = useStreakTracker(user?.email, "daily");
  const { reportMissionProgress } = useDailyMissions();

  useEffect(() => {
    // This page doubles as the scripture/daily reading page
    reportMissionProgress("visit_page", "/daily");
  }, []);

  useEffect(() => {
    if (user?.email) loadProfile();
  }, [user]);

  async function loadProfile() {
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    const prof = profiles[0] || null;
    setProfile(prof);
    if (prof?.religion && prof.religion !== "None") {
      await fetchVerse(prof.religion);
    } else {
      setLoading(false);
    }
  }

  async function fetchVerse(religion) {
    setRefreshing(true);
    const res = await base44.functions.invoke("getDailyVerse", { religion });
    setVerse(res.data.verse);
    setLoading(false);
    setRefreshing(false);
  }

  async function handleRefresh() {
    if (!profile?.religion || refreshing) return;
    setSaved(false);
    await fetchVerse(profile.religion);
  }

  async function handleSaveToMemories() {
    if (!verse || !user?.email || saved) return;
    await base44.entities.JournalEntry.create({
      user_email: user.email,
      entry_date: new Date().toISOString().split("T")[0],
      memory_text: `${verse.text}\n\n— ${verse.reference}`,
      prompt: verse.reflection || "",
    });
    setSaved(true);
  }

  const config = profile?.religion ? RELIGION_CONFIG[profile.religion] : null;

  if (loading) return <WarmLoader message="Loading your inspiration..." />;

  if (!config) {
    return (
      <div className="min-h-screen px-4 py-6 pb-24 text-center">
        <h1 className="text-4xl font-black text-primary mb-4">⭐ Daily Inspiration</h1>
        <div className="bg-card border border-border rounded-2xl p-6 shadow">
          <p className="text-xl text-foreground mb-4">No faith preference set yet.</p>
          <Link to="/settings" className="text-primary text-lg font-bold underline">
            Go to Settings to choose your daily reading →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <div className="text-center mb-6">
        <span className="text-5xl">{config.emoji}</span>
        <h1 className="text-4xl font-black text-primary mt-2">{config.label}</h1>
      </div>

      <StreakBanner streakData={streakData} pageType="daily" newBadges={newBadges} />

      {verse ? (
        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl space-y-4">
          {verse.theme && (
            <span className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold uppercase">
              {verse.theme}
            </span>
          )}
          <p className="text-2xl font-bold text-foreground leading-snug italic">
            "{verse.text}"
          </p>
          <p className="text-lg text-primary font-black">— {verse.reference}</p>
          {verse.reflection && (
            <div className="border-t border-border pt-4">
              <p className="text-base text-muted-foreground leading-relaxed">
                💭 {verse.reflection}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary text-foreground text-lg font-bold py-4 rounded-2xl disabled:opacity-50"
            >
              <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
              New Verse
            </button>
            <button
              onClick={handleSaveToMemories}
              disabled={saved}
              className={`flex-1 flex items-center justify-center gap-2 text-lg font-bold py-4 rounded-2xl ${
                saved
                  ? "bg-green-700 text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {saved ? <Check size={20} /> : <BookmarkPlus size={20} />}
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground text-xl">
          <p>Could not load today's reading. Tap below to try again.</p>
          <button
            onClick={handleRefresh}
            className="mt-4 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-lg"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}