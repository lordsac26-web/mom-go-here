import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const RELIGIONS = [
  { value: "Christianity", label: "Christianity", emoji: "✝️", sub: "Bible & Scripture" },
  { value: "Catholicism",  label: "Catholicism",  emoji: "⛪", sub: "Catholic Scripture" },
  { value: "Judaism",      label: "Judaism",      emoji: "✡️", sub: "Torah Readings" },
  { value: "Islam",        label: "Islam",        emoji: "☪️", sub: "Quranic Verses" },
  { value: "Hinduism",     label: "Hinduism",     emoji: "🕉️", sub: "Gita Teachings" },
  { value: "Buddhism",     label: "Buddhism",     emoji: "☸️", sub: "Dharma Teachings" },
  { value: "Sikhism",      label: "Sikhism",      emoji: "🪯", sub: "Hukamnama" },
  { value: "None",         label: "No Preference",emoji: "🌍", sub: "Motivational quotes only" },
];

// FIX (bug): path corrected from "/games/spotdiff" → "/games/artstudio" to match
// Games.jsx and the actual route. The old value was being saved to the user's
// favorite_games array, so the AI Art Studio card could never be matched/filtered.
const ALL_GAMES = [
  { name: "Memory Match",  emoji: "🧠", path: "/games/memory" },
  { name: "Mahjong",       emoji: "🀄", path: "/games/mahjong" },
  { name: "Solitaire",     emoji: "♠️", path: "/games/solitaire" },
  { name: "Tic Tac Toe",   emoji: "❌", path: "/games/tictactoe" },
  { name: "Word Search",   emoji: "🔤", path: "/games/wordsearch" },
  { name: "Sudoku",        emoji: "🔢", path: "/games/sudoku" },
  { name: "Checkers",      emoji: "⬛", path: "/games/checkers" },
  { name: "Yahtzee",       emoji: "🎲", path: "/games/yahtzee" },
  { name: "AI Art Studio", emoji: "🎨", path: "/games/artstudio" },
  { name: "Buzz Word!",    emoji: "🐝", path: "/games/buzzword" },
  { name: "Lucky Slots",   emoji: "🎰", path: "/games/slots" },
];

// FIX (security): cap display name length and strip leading/trailing whitespace
const MAX_NAME_LENGTH = 50;

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.full_name?.split(" ")[0] || "");
  const [birthday, setBirthday] = useState("");
  const [religion, setReligion] = useState("None");
  const [favoriteGames, setFavoriteGames] = useState(ALL_GAMES.map(g => g.path));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [chatbotName, setChatbotName] = useState("");

  function toggleGame(path) {
    setFavoriteGames(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  }

  async function finish() {
    setSaving(true);
    setError(null);
    // FIX (bug): try/catch so a failed save doesn't leave the button stuck on "Saving..."
    try {
      // FIX (security): trim and cap display name before saving
      const safeName = displayName.trim().slice(0, MAX_NAME_LENGTH);

      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const data = {
        user_email: user.email,
        display_name: safeName,
        birthday,
        religion,
        favorite_games: favoriteGames,
        chatbot_name: chatbotName.trim() || "Rosie",
      };
      if (profiles[0]) {
        await base44.entities.UserProfile.update(profiles[0].id, data);
      } else {
        await base44.entities.UserProfile.create(data);
      }
      navigate("/");
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError("Could not save your preferences. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-3 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`w-4 h-4 rounded-full transition-all ${s === step ? "bg-primary scale-125" : s < step ? "bg-primary/50" : "bg-border"}`} />
          ))}
        </div>

        {/* Step 1: Name & Birthday */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-7xl mb-4">🌸</div>
            <h1 className="text-4xl font-black text-primary mb-2">Welcome!</h1>
            <p className="text-xl text-muted-foreground mb-8">Let's get to know you a little</p>

            <div className="space-y-5 text-left">
              <div>
                <label className="block text-xl font-black text-foreground mb-2">What should we call you?</label>
                <input
                  type="text"
                  value={displayName}
                  // FIX (security): enforce max length in the input itself too
                  onChange={e => setDisplayName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                  placeholder="Your first name or nickname"
                  maxLength={MAX_NAME_LENGTH}
                  className="w-full bg-card border-2 border-border rounded-2xl px-5 py-4 text-2xl font-bold text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xl font-black text-foreground mb-2">Your Birthday 🎂</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                  className="w-full bg-card border-2 border-border rounded-2xl px-5 py-4 text-2xl font-bold text-foreground focus:outline-none focus:border-primary"
                />
                <p className="text-muted-foreground text-base mt-1 ml-1">We'll share a special history fact from your birthday!</p>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!displayName.trim()}
              className="w-full mt-8 bg-primary text-primary-foreground text-2xl font-black py-5 rounded-2xl shadow-xl disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Religion */}
        {step === 2 && (
          <div className="text-center">
            <div className="text-7xl mb-4">🙏</div>
            <h1 className="text-4xl font-black text-primary mb-2">Daily Inspiration</h1>
            <p className="text-xl text-muted-foreground mb-6">Choose your faith for daily readings</p>

            <div className="space-y-3">
              {RELIGIONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReligion(r.value)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                    religion === r.value ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <span className="text-4xl">{r.emoji}</span>
                  <div>
                    <p className="text-xl font-black text-foreground">{r.label}</p>
                    <p className="text-muted-foreground text-base">{r.sub}</p>
                  </div>
                  {religion === r.value && <span className="ml-auto text-3xl">✅</span>}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 bg-secondary text-foreground text-xl font-black py-4 rounded-2xl">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl shadow-xl">Next →</button>
            </div>
          </div>
        )}

        {/* Step 3: Name Your AI Assistant */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-7xl mb-4">🌸</div>
            <h1 className="text-4xl font-black text-primary mb-2">Name Your Helper</h1>
            <p className="text-xl text-muted-foreground mb-6">Give your AI assistant a name!</p>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xl font-black text-foreground mb-2">Assistant's Name</label>
                <input
                  type="text"
                  value={chatbotName}
                  onChange={e => setChatbotName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                  placeholder="Rosie"
                  maxLength={MAX_NAME_LENGTH}
                  className="w-full bg-card border-2 border-border rounded-2xl px-5 py-4 text-2xl font-bold text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <p className="text-muted-foreground text-base">Leave blank and we'll call her <span className="font-bold text-primary">Rosie</span> 🌸</p>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(2)} className="flex-1 bg-secondary text-foreground text-xl font-black py-4 rounded-2xl">← Back</button>
              <button onClick={() => setStep(4)} className="flex-1 bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl shadow-xl">Next →</button>
            </div>
          </div>
        )}

        {/* Step 4: Favorite Games */}
        {step === 4 && (
          <div className="text-center">
            <div className="text-7xl mb-4">🎮</div>
            <h1 className="text-4xl font-black text-primary mb-2">Your Games</h1>
            <p className="text-xl text-muted-foreground mb-6">Pick which games to show on your home page</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {ALL_GAMES.map(g => {
                const selected = favoriteGames.includes(g.path);
                return (
                  <button
                    key={g.path}
                    onClick={() => toggleGame(g.path)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                      selected ? "border-primary bg-primary/10" : "border-border bg-card opacity-50"
                    }`}
                  >
                    <span className="text-4xl">{g.emoji}</span>
                    <span className="text-sm font-black text-foreground leading-tight">{g.name}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-muted-foreground text-lg mb-4">{favoriteGames.length} of {ALL_GAMES.length} selected</p>

            {/* FIX (bug): surface save errors to the user */}
            {error && (
              <p className="text-red-500 font-bold text-lg mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 bg-secondary text-foreground text-xl font-black py-4 rounded-2xl">← Back</button>
              <button
                onClick={finish}
                disabled={saving || favoriteGames.length === 0}
                className="flex-1 bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl shadow-xl disabled:opacity-40"
              >
                {saving ? "Saving..." : "Let's Go! 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}