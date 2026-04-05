import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const RELIGIONS = [
  { value: "None", label: "No Preference", emoji: "🌍", sub: "Motivational quotes only" },
  { value: "Christianity", label: "Christianity", emoji: "✝️", sub: "Bible & Scripture" },
  { value: "Catholicism", label: "Catholicism", emoji: "⛪", sub: "Catholic Scripture" },
  { value: "Judaism", label: "Judaism", emoji: "✡️", sub: "Torah Readings" },
  { value: "Islam", label: "Islam", emoji: "☪️", sub: "Quranic Verses" },
  { value: "Hinduism", label: "Hinduism", emoji: "🕉️", sub: "Gita Teachings" },
  { value: "Buddhism", label: "Buddhism", emoji: "☸️", sub: "Dharma Teachings" },
  { value: "Sikhism", label: "Sikhism", emoji: "🪯", sub: "Hukamnama" },
];

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [religion, setReligion] = useState("None");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProfile(); }, [user]);

  async function loadProfile() {
    if (!user) return;
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (profiles[0]) {
      setProfile(profiles[0]);
      setDisplayName(profiles[0].display_name || "");
      setBirthday(profiles[0].birthday || "");
      setReligion(profiles[0].religion || "None");
    }
    setLoading(false);
  }

  async function saveProfile() {
    const data = { display_name: displayName, birthday, religion };
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, data);
    } else {
      const p = await base44.entities.UserProfile.create({ user_email: user.email, ...data });
      setProfile(p);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <h1 className="text-4xl font-black text-primary text-center mb-2">⚙️ Settings</h1>
      <p className="text-center text-muted-foreground text-xl mb-6">Update your preferences</p>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Name & Birthday */}
        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-black text-foreground mb-4">👤 Your Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-black text-foreground mb-2">What should we call you?</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name or nickname"
                className="w-full bg-secondary border-2 border-border rounded-2xl px-5 py-4 text-xl font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-lg font-black text-foreground mb-2">🎂 Birthday</label>
              <input
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                className="w-full bg-secondary border-2 border-border rounded-2xl px-5 py-4 text-xl font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Religion */}
        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-black text-foreground mb-2">📖 Daily Reading</h2>
          <p className="text-muted-foreground text-lg mb-4">Choose your faith for daily inspiration</p>
          <div className="space-y-3">
            {RELIGIONS.map(r => (
              <button
                key={r.value}
                onClick={() => setReligion(r.value)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                  religion === r.value ? "border-primary bg-primary/10" : "border-border bg-secondary"
                }`}
              >
                <span className="text-3xl">{r.emoji}</span>
                <div>
                  <p className="text-xl font-black text-foreground">{r.label}</p>
                  <p className="text-muted-foreground text-sm">{r.sub}</p>
                </div>
                {religion === r.value && <span className="ml-auto text-2xl">✅</span>}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={saveProfile}
          className="w-full bg-primary text-primary-foreground text-2xl font-black py-5 rounded-2xl shadow-xl"
        >
          💾 Save Changes
        </button>

        {saved && (
          <div className="bg-green-700 text-white text-center text-xl font-bold py-4 rounded-2xl">
            ✅ Saved successfully!
          </div>
        )}

        <button
          onClick={() => base44.auth.logout()}
          className="w-full bg-destructive text-destructive-foreground text-2xl font-black py-5 rounded-2xl shadow-xl"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}