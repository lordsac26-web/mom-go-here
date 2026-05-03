import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { RefreshCw, BookOpen, WifiOff } from "lucide-react";
import SubPageHeader from "../components/SubPageHeader";
import offlineCache from "../lib/offlineCache";

const RELIGION_META = {
  Christianity: { emoji: "✝️", label: "Holy Bible", color: "text-blue-400" },
  Catholicism: { emoji: "⛪", label: "Holy Bible", color: "text-purple-400" },
  Judaism: { emoji: "✡️", label: "Torah & Tanakh", color: "text-yellow-400" },
  Islam: { emoji: "☪️", label: "Holy Quran", color: "text-emerald-400" },
  Hinduism: { emoji: "🕉️", label: "Bhagavad Gita", color: "text-orange-400" },
  Buddhism: { emoji: "☸️", label: "Dhammapada", color: "text-cyan-400" },
  Sikhism: { emoji: "🪯", label: "Guru Granth Sahib", color: "text-amber-400" },
};

export default function Scripture() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [religion, setReligion] = useState(null);
  const [scripture, setScripture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  async function loadProfile() {
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const prof = profiles[0];
      if (prof) {
        offlineCache.set(offlineCache.STORES.userProfile, user.email, prof);
      }
      if (!prof?.religion || prof.religion === "None") {
        navigate("/settings");
        return;
      }
      setReligion(prof.religion);
      fetchScripture(prof.religion);
    } catch {
      // Offline — try cached profile
      const cached = await offlineCache.get(offlineCache.STORES.userProfile, user.email);
      if (cached?.religion && cached.religion !== "None") {
        setReligion(cached.religion);
        fetchScripture(cached.religion);
      } else {
        setError("You're offline and no cached profile is available.");
        setLoading(false);
      }
    }
  }

  const [isOffline, setIsOffline] = useState(false);

  async function fetchScripture(rel, forceRandom = false) {
    setLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const response = await base44.functions.invoke("getScripture", {
        religion: rel,
        action: "random_chapter",
        forceRandom,
      });
      if (response.data?.error) {
        setError(response.data.error);
      } else {
        setScripture(response.data);
        // Cache to IndexedDB for offline use
        const cacheKey = `scripture_${rel}_latest`;
        offlineCache.set(offlineCache.STORES.scripture, cacheKey, response.data);
        // Also keep a small history of recent chapters
        const histKey = `scripture_${rel}_${Date.now()}`;
        offlineCache.set(offlineCache.STORES.scripture, histKey, response.data);
      }
    } catch (err) {
      // Network failed — try IndexedDB cache
      const cached = await offlineCache.get(offlineCache.STORES.scripture, `scripture_${rel}_latest`);
      if (cached) {
        setScripture(cached);
        setIsOffline(true);
      } else {
        setError("You're offline and no cached scripture is available. Connect to the internet and try again.");
      }
    }
    setLoading(false);
  }

  function handleRefresh() {
    if (religion) fetchScripture(religion, true);
  }

  const meta = religion ? RELIGION_META[religion] : null;

  if (loading && !scripture) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-lg font-bold">Opening scripture...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-6 pb-24 flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-destructive font-bold">{error}</p>
        <button onClick={handleRefresh} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-lg">
          Try Again
        </button>
        <Link to="/" className="text-primary font-bold text-lg">← Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <SubPageHeader
        backTo="/"
        title={meta?.label || "Scripture"}
        emoji={meta?.emoji}
        rightSlot={
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 min-h-[44px] rounded-xl font-bold shadow-lg disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">New Chapter</span>
          </button>
        }
      />

      {/* Title */}
      {meta && (
        <div className="text-center mb-6">
          <span className="text-5xl block mb-2">{meta.emoji}</span>
          <h1 className={`text-3xl font-black ${meta.color}`}>{meta.label}</h1>
          {isOffline && (
            <div className="flex items-center justify-center gap-2 mt-2 bg-amber-600/20 text-amber-400 rounded-xl px-3 py-1.5 text-sm font-bold mx-auto w-fit">
              <WifiOff size={14} /> Showing cached scripture
            </div>
          )}
          {scripture && (
            <>
              <p className="text-xl font-bold text-foreground mt-2">{scripture.source}</p>
              <p className="text-sm text-muted-foreground">{scripture.translation}</p>
            </>
          )}
        </div>
      )}

      {/* Verses */}
      {scripture?.verses?.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-4">
          {scripture.verses.map((v, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow">
              <div className="flex gap-3">
                <span className="text-primary font-black text-lg flex-shrink-0 min-w-[2rem] text-right">
                  {v.number}
                </span>
                <p className="text-foreground text-lg leading-relaxed">{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      <div className="text-center mt-8">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-card border-2 border-primary text-primary text-xl font-black px-8 py-4 rounded-2xl shadow-xl disabled:opacity-50 inline-flex items-center gap-2"
        >
          <BookOpen size={22} />
          Read Another Chapter
        </button>
      </div>
    </div>
  );
}