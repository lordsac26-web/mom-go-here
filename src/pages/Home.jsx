import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import HistoryFact from "../components/HistoryFact";
import TiltCard from "../components/TiltCard";
import UpcomingBirthdays from "../components/UpcomingBirthdays";

const NAV_CARDS = [
  { path: "/games", label: "Games", emoji: "🎮", desc: "Play fun brain games", gradient: "bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800", glare: "#a855f7", iconBg: "bg-purple-400/30" },
  { path: "/daily", label: "Daily", emoji: "⭐", desc: "Today's inspiration", gradient: "bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-700", glare: "#fbbf24", iconBg: "bg-yellow-400/30" },
  { path: "/memories", label: "Memories", emoji: "📔", desc: "Your photo journal", gradient: "bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-700", glare: "#3b82f6", iconBg: "bg-blue-400/30" },
  { path: "/progress", label: "Progress", emoji: "📊", desc: "Track your activity", gradient: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700", glare: "#22c55e", iconBg: "bg-green-400/30" },
  { path: "/contacts", label: "Contacts", emoji: "👥", desc: "Friends & family birthdays", gradient: "bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-700", glare: "#f43f5e", iconBg: "bg-rose-400/30" },
  { path: "/settings", label: "Settings", emoji: "⚙️", desc: "Customize your app", gradient: "bg-gradient-to-br from-orange-500 via-orange-600 to-red-700", glare: "#f97316", iconBg: "bg-orange-400/30" },
  { path: "/games/memory", label: "Memory Match", emoji: "🧠", desc: "Quick brain exercise", gradient: "bg-gradient-to-br from-pink-500 via-rose-600 to-fuchsia-700", glare: "#ec4899", iconBg: "bg-pink-400/30" },
];

const MOTIVATIONAL_QUOTES = [
  { quote: "Every day is a new beginning. Take a deep breath and start again.", author: "Unknown" },
  { quote: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Keep your face always toward the sunshine, and shadows will fall behind you.", author: "Walt Whitman" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { quote: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
  { quote: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { quote: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { quote: "Don't go through life, grow through life.", author: "Eric Butterworth" },
  { quote: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
];



const RELIGION_LABELS = {
  Christianity: { label: "Daily Scripture", emoji: "✝️" },
  Catholicism: { label: "Daily Scripture", emoji: "⛪" },
  Judaism: { label: "Daily Torah Reading", emoji: "✡️" },
  Islam: { label: "Daily Quranic Verse", emoji: "☪️" },
  Hinduism: { label: "Daily Gita Teaching", emoji: "🕉️" },
  Buddhism: { label: "Daily Dharma", emoji: "☸️" },
  Sikhism: { label: "Daily Hukamnama", emoji: "🪯" },
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    const prof = profiles[0] || null;

    // Redirect to onboarding if first time
    if (!prof?.display_name) {
      navigate("/onboarding");
      return;
    }

    setProfile(prof);

    const today = new Date().toDateString();
    let idx = prof?.last_quote_index ?? 0;
    if (prof?.last_quote_date !== today) {
      idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
      await base44.entities.UserProfile.update(prof.id, { last_quote_date: today, last_quote_index: idx });
    }
    setQuote(MOTIVATIONAL_QUOTES[idx]);
    setLoading(false);
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const religionInfo = profile?.religion && RELIGION_LABELS[profile.religion];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      {/* Greeting */}
      <div className="text-center mb-4">
        <h1 className="text-4xl font-black text-primary mb-1">
          {greeting()}, {profile?.display_name || user?.full_name?.split(" ")[0] || "Friend"}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">Tap a card to explore!</p>
      </div>

      {/* Quote of the Day */}
      {quote && (
        <div className="bg-card border border-border rounded-2xl px-4 py-3 mb-4 shadow">
          <p className="text-base text-foreground italic text-center leading-snug">
            💛 "{quote.quote}" <span className="text-muted-foreground not-italic">— {quote.author}</span>
          </p>
        </div>
      )}

      {/* Daily Inspiration link */}
      {religionInfo && (
        <Link
          to="/daily"
          className="block bg-card border-2 border-primary rounded-2xl p-5 text-center shadow-xl mb-4"
        >
          <span className="text-4xl">{religionInfo.emoji}</span>
          <p className="text-2xl font-black text-primary mt-2">{religionInfo.label}</p>
          <p className="text-muted-foreground text-lg">Tap to read today's reading</p>
        </Link>
      )}

      {/* Upcoming Birthdays */}
      <UpcomingBirthdays userEmail={user?.email} />

      {/* This Day in History */}
      <div className="mb-6">
        <HistoryFact birthday={profile?.birthday} location={{ city: profile?.city, latitude: profile?.latitude, longitude: profile?.longitude }} />
      </div>

      {/* 3D Tilt Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto mb-6">
        {NAV_CARDS.map((card) => (
          <TiltCard
            key={card.path}
            to={card.path}
            emoji={card.emoji}
            label={card.label}
            description={card.desc}
            gradient={card.gradient}
            glareColor={card.glare}
            iconBg={card.iconBg}
          />
        ))}
      </div>

    </div>
  );
}