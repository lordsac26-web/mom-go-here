import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, RefreshCw, BookOpen } from "lucide-react";

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
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    const prof = profiles[0];
    if (!prof?.religion || prof.religion === "None") {
      navigate("/settings");
      return;
    }
    setReligion(prof.religion);
    fetchScripture(prof.religion);
  }

  async function fetchScripture(rel) {
    setLoading(true);
    setError(null);
    const response = await base44.functions.invoke("getScripture", {
      religion: rel,
      action: "random_chapter",
    });
    if (response.data?.error) {
      setError(response.data.error);
    } else {
      setScripture(response.data);
    }
    setLoading(false);
  }

  function handleRefresh() {
    if (religion) fetchScripture(religion);
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
      <div className="min-h-screen bg-background px-4 py-6 pb-24 flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-destructive font-bold">{error}</p>
        <button onClick={handleRefresh} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-lg">
          Try Again
        </button>
        <Link to="/" className="text-primary font-bold text-lg">← Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 shadow-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} className="text-primary" />
          <span className="text-lg font-bold text-primary">Back</span>
        </Link>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold shadow-lg disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          New Chapter
        </button>
      </div>

      {/* Title */}
      {meta && (
        <div className="text-center mb-6">
          <span className="text-5xl block mb-2">{meta.emoji}</span>
          <h1 className={`text-3xl font-black ${meta.color}`}>{meta.label}</h1>
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