import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const VERSES = {
  Christianity: [
    { text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", ref: "John 3:16" },
    { text: "I can do all this through him who gives me strength.", ref: "Philippians 4:13" },
    { text: "The Lord is my shepherd, I lack nothing.", ref: "Psalm 23:1" },
    { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
    { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", ref: "Joshua 1:9" },
    { text: "And we know that in all things God works for the good of those who love him.", ref: "Romans 8:28" },
    { text: "Peace I leave with you; my peace I give you.", ref: "John 14:27" },
  ],
  Catholicism: [
    { text: "Hail Mary, full of grace, the Lord is with thee.", ref: "Luke 1:28" },
    { text: "Do not let your hearts be troubled. You believe in God; believe also in me.", ref: "John 14:1" },
    { text: "Whatever you do, work heartily, as for the Lord and not for men.", ref: "Colossians 3:23" },
    { text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.", ref: "Psalm 34:18" },
    { text: "Ask and it will be given to you; seek and you will find.", ref: "Matthew 7:7" },
    { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
    { text: "He gives strength to the weary and increases the power of the weak.", ref: "Isaiah 40:29" },
  ],
  Judaism: [
    { text: "Hear, O Israel: The Lord our God, the Lord is one.", ref: "Deuteronomy 6:4" },
    { text: "The Lord bless you and keep you; the Lord make his face shine on you.", ref: "Numbers 6:24-25" },
    { text: "Be strong and courageous, because you will lead these people to inherit the land.", ref: "Joshua 1:6" },
    { text: "Where you go I will go, and where you stay I will stay.", ref: "Ruth 1:16" },
    { text: "Create in me a pure heart, O God, and renew a steadfast spirit within me.", ref: "Psalm 51:10" },
    { text: "This is the day the Lord has made; let us rejoice and be glad in it.", ref: "Psalm 118:24" },
    { text: "Love your neighbor as yourself.", ref: "Leviticus 19:18" },
  ],
  Islam: [
    { text: "Indeed, with hardship comes ease.", ref: "Quran 94:5" },
    { text: "Allah does not burden a soul beyond that it can bear.", ref: "Quran 2:286" },
    { text: "And He found you lost and guided you.", ref: "Quran 93:7" },
    { text: "So remember Me; I will remember you.", ref: "Quran 2:152" },
    { text: "Verily, in the remembrance of Allah do hearts find rest.", ref: "Quran 13:28" },
    { text: "And when My servants ask you concerning Me, indeed I am near.", ref: "Quran 2:186" },
    { text: "He knows what is in the heavens and earth and knows what you conceal and what you declare.", ref: "Quran 64:4" },
  ],
  Hinduism: [
    { text: "You have the right to perform your actions, but you are not entitled to the fruits of the actions.", ref: "Bhagavad Gita 2:47" },
    { text: "The soul is never born nor dies at any time.", ref: "Bhagavad Gita 2:20" },
    { text: "Let a man lift himself by his own self alone, let him not lower himself.", ref: "Bhagavad Gita 6:5" },
    { text: "One who sees inaction in action and action in inaction is intelligent among men.", ref: "Bhagavad Gita 4:18" },
    { text: "He who has no attachments can really love others, for his love is pure and divine.", ref: "Bhagavad Gita 3:19" },
    { text: "The mind is restless and difficult to restrain, but it is subdued by practice.", ref: "Bhagavad Gita 6:35" },
    { text: "Perform all thy actions with mind concentrated on the Divine.", ref: "Bhagavad Gita 9:27" },
  ],
  Buddhism: [
    { text: "Peace comes from within. Do not seek it without.", ref: "The Buddha" },
    { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", ref: "The Buddha" },
    { text: "If your compassion does not include yourself, it is incomplete.", ref: "Jack Kornfield" },
    { text: "Every morning we are born again. What we do today is what matters most.", ref: "The Buddha" },
    { text: "Happiness never decreases by being shared.", ref: "The Buddha" },
    { text: "To understand everything is to forgive everything.", ref: "The Buddha" },
    { text: "In the end, only three things matter: how much you loved, how gently you lived, and how gracefully you let go.", ref: "The Buddha" },
  ],
  Sikhism: [
    { text: "There is but One God. His name is Truth; He is the Creator.", ref: "Guru Granth Sahib, Japji Sahib" },
    { text: "Recognize the Lord's Light within all, and do not consider social class or status.", ref: "Guru Granth Sahib 349" },
    { text: "Whatever pleases God is a good deed.", ref: "Guru Granth Sahib 540" },
    { text: "He alone is a friend who walks with you on the difficult path.", ref: "Guru Granth Sahib" },
    { text: "True love does not break, even if the body is broken.", ref: "Guru Granth Sahib" },
    { text: "Within my mind and body, the Lord abides.", ref: "Guru Granth Sahib 1189" },
    { text: "One who has faith, has all.", ref: "Guru Granth Sahib" },
  ],
};

const READING_LABEL = {
  Christianity: "Today's Scripture",
  Catholicism: "Today's Scripture",
  Judaism: "Today's Torah Reading",
  Islam: "Today's Quranic Verse",
  Hinduism: "Today's Gita Teaching",
  Buddhism: "Today's Dharma Teaching",
  Sikhism: "Today's Hukamnama",
};

const RELIGION_EMOJI = {
  Christianity: "✝️", Catholicism: "⛪", Judaism: "✡️",
  Islam: "☪️", Hinduism: "🕉️", Buddhism: "☸️", Sikhism: "🪯",
};

export default function Daily() {
  const { user } = useAuth();
  const [verse, setVerse] = useState(null);
  const [religion, setReligion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerse();
  }, [user]);

  async function loadVerse() {
    if (!user) return;
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    const prof = profiles[0];
    if (!prof || !prof.religion || prof.religion === "None") {
      setLoading(false);
      return;
    }
    setReligion(prof.religion);
    const verses = VERSES[prof.religion] || [];
    const today = new Date().toDateString();
    let idx = prof.last_verse_index ?? 0;
    if (prof.last_verse_date !== today) {
      idx = Math.floor(Math.random() * verses.length);
      await base44.entities.UserProfile.update(prof.id, { last_verse_date: today, last_verse_index: idx });
    }
    setVerse(verses[idx % verses.length]);
    setLoading(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!religion || religion === "None") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24 text-center">
      <Link to="/" className="absolute top-4 left-4 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 shadow-lg hover:bg-muted transition-colors">
        <ArrowLeft size={20} className="text-primary" />
        <span className="text-xl">🌸</span>
        <span className="text-lg font-bold text-primary">Mom, Go Here</span>
      </Link>
      <div className="text-8xl mb-6">📖</div>
      <h1 className="text-4xl font-black text-primary mb-4">Daily Verse</h1>
      <p className="text-2xl text-muted-foreground mb-8">Select a religion in Settings to receive a daily verse from your scripture.</p>
      <Link to="/settings" className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl">
        ⚙️ Go to Settings
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      {/* Back Navigation */}
      <Link to="/" className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 mb-6 shadow-lg hover:bg-muted transition-colors">
        <ArrowLeft size={20} className="text-primary" />
        <span className="text-xl">🌸</span>
        <span className="text-lg font-bold text-primary">Mom, Go Here</span>
      </Link>

      <div className="max-w-lg w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-7xl mb-3">{RELIGION_EMOJI[religion]}</div>
          <h1 className="text-4xl font-black text-primary">{READING_LABEL[religion] || `Today's ${religion} Reading`}</h1>
          <p className="text-muted-foreground text-lg mt-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-primary/30" />
          <span className="text-2xl">✨</span>
          <div className="h-px w-12 bg-primary/30" />
        </div>

        {/* Verse Card */}
        <div className="relative bg-card border-2 border-primary/40 rounded-3xl p-8 shadow-2xl overflow-hidden">
          {/* Corner decorations */}
          <div className="absolute top-3 left-4 text-3xl opacity-20">❝</div>
          <div className="absolute bottom-3 right-4 text-3xl opacity-20">❞</div>

          <div className="text-5xl text-center mb-5">🕊️</div>
          <p className="text-2xl font-bold text-foreground text-center italic leading-relaxed mb-6 px-2">
            "{verse?.text}"
          </p>
          <div className="text-center">
            <span className="inline-block bg-primary/15 border border-primary/30 text-primary px-5 py-2 rounded-full text-lg font-black">
              📜 {verse?.ref}
            </span>
          </div>
        </div>

        {/* Reflection prompt */}
        <div className="mt-6 bg-card/60 border border-border rounded-2xl p-5 text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            🙏 Take a moment to reflect on today's reading.
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-base">A new verse appears each day. Come back tomorrow! 🌅</p>
        </div>

        {/* Back home button */}
        <Link
          to="/"
          className="block mt-6 bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl text-center shadow-xl"
        >
          🌸 Back to Home
        </Link>
      </div>
    </div>
  );
}