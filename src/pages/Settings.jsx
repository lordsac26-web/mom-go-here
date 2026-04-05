import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const RELIGIONS = [
  { value: "None", label: "None / Prefer not to say", emoji: "🌟" },
  { value: "Christianity", label: "Christianity", emoji: "✝️" },
  { value: "Catholicism", label: "Catholicism", emoji: "⛪" },
  { value: "Judaism", label: "Judaism", emoji: "✡️" },
  { value: "Islam", label: "Islam", emoji: "☪️" },
  { value: "Hinduism", label: "Hinduism", emoji: "🕉️" },
  { value: "Buddhism", label: "Buddhism", emoji: "☸️" },
  { value: "Sikhism", label: "Sikhism", emoji: "🪯" },
];

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [selected, setSelected] = useState("None");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    if (!user) return;
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (profiles[0]) {
      setProfile(profiles[0]);
      setSelected(profiles[0].religion || "None");
    }
    setLoading(false);
  }

  async function saveReligion(value) {
    setSelected(value);
    setSaved(false);
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, { religion: value });
    } else {
      const p = await base44.entities.UserProfile.create({ user_email: user.email, religion: value });
      setProfile(p);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <h1 className="text-4xl font-black text-primary text-center mb-2">⚙️ Settings</h1>
      <p className="text-center text-muted-foreground text-xl mb-8">Choose your faith for a daily verse</p>

      <div className="max-w-lg mx-auto">
        {/* User Info */}
        <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 shadow-xl">
          <div className="text-center">
            <div className="text-6xl mb-3">👤</div>
            <p className="text-2xl font-black text-foreground">{user?.full_name || "Friend"}</p>
            <p className="text-muted-foreground text-xl">{user?.email}</p>
          </div>
        </div>

        {/* Religion Selection */}
        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-black text-foreground mb-2 text-center">📖 Daily Verse Religion</h2>
          <p className="text-muted-foreground text-lg text-center mb-6">Select to receive a daily scripture verse</p>

          <div className="space-y-3">
            {RELIGIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => saveReligion(r.value)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all text-xl font-bold ${
                  selected === r.value
                    ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                    : "bg-secondary text-foreground border-border hover:border-primary"
                }`}
              >
                <span className="text-4xl">{r.emoji}</span>
                <span>{r.label}</span>
                {selected === r.value && <span className="ml-auto text-2xl">✓</span>}
              </button>
            ))}
          </div>

          {saved && (
            <div className="mt-6 bg-green-700 text-white text-center text-xl font-bold py-4 rounded-2xl">
              ✅ Saved! Check Daily tab for your verse.
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={() => base44.auth.logout()}
          className="w-full mt-6 bg-destructive text-destructive-foreground text-2xl font-black py-5 rounded-2xl shadow-xl"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}