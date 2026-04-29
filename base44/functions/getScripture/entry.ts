import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Free APIs used:
// Bible (Christianity/Catholicism): bible-api.com (no key)
// Quran (Islam): api.alquran.cloud (no key)
// Torah (Judaism): sefaria.org API (no key)
// Gita (Hinduism): bhagavadgitaapi.in (no key)
// Dhammapada (Buddhism): bundled selection
// Guru Granth Sahib (Sikhism): bundled selection

const BIBLE_BOOKS = [
  { ref: "Genesis", chapters: 50 }, { ref: "Exodus", chapters: 40 },
  { ref: "Psalms", chapters: 150 }, { ref: "Proverbs", chapters: 31 },
  { ref: "Isaiah", chapters: 66 }, { ref: "Matthew", chapters: 28 },
  { ref: "Mark", chapters: 16 }, { ref: "Luke", chapters: 24 },
  { ref: "John", chapters: 21 }, { ref: "Romans", chapters: 16 },
  { ref: "1 Corinthians", chapters: 16 }, { ref: "Philippians", chapters: 4 },
  { ref: "James", chapters: 5 }, { ref: "Revelation", chapters: 22 },
];

const TORAH_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Psalms", "Proverbs", "Isaiah", "Jeremiah", "Ecclesiastes",
];

const DHAMMAPADA_VERSES = [
  { chapter: "The Twin Verses", text: "Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a corrupt mind, suffering follows, as the wheel follows the hoof of the ox pulling a cart." },
  { chapter: "The Twin Verses", text: "Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a pure mind, happiness follows, like a shadow that never departs." },
  { chapter: "Heedfulness", text: "Heedfulness is the path to the deathless; heedlessness is the path to death. The heedful do not die; the heedless are as if already dead." },
  { chapter: "Heedfulness", text: "The wise ones, ever meditative and steadfastly persevering, alone experience Nibbana, the incomparable freedom from bondage." },
  { chapter: "The Mind", text: "Just as a fletcher straightens an arrow shaft, even so the discerning man straightens his mind — so fickle and unsteady, so difficult to guard." },
  { chapter: "The Mind", text: "Wonderful, indeed, it is to subdue the mind, so difficult to subdue, ever swift, and seizing whatever it desires. A tamed mind brings happiness." },
  { chapter: "Flowers", text: "Who shall overcome this earth, this realm of Yama, and this sphere of men and gods? Who shall bring to perfection the well-taught path of wisdom as an expert garland-maker would his floral design?" },
  { chapter: "The Fool", text: "Long is the night to the sleepless; long is the road to the weary; long is worldly existence to fools who know not the sublime truth." },
  { chapter: "The Wise", text: "Should a seeker not find a companion who is better or equal, let them resolutely pursue a solitary course; there is no fellowship with the fool." },
  { chapter: "The Saint", text: "Even the gods envy those awakened ones who are intent on meditation, who are wise, and who delight in the peace of renunciation." },
  { chapter: "Happiness", text: "Happy indeed we live, we who possess nothing. Feeders on joy we shall be, like the Radiant Gods." },
  { chapter: "The World", text: "Do not pursue the past. Do not lose yourself in the future. The past no longer is. The future has not yet come. Looking deeply at life as it is in the very here and now, the practitioner dwells in stability and freedom." },
  { chapter: "Anger", text: "Overcome anger by non-anger, overcome wrong by goodness, overcome the miser by generosity, overcome the liar by truth." },
  { chapter: "Impurity", text: "By degrees, little by little, from time to time, a wise person should remove their own impurities, as a smith removes the dross of silver." },
  { chapter: "The Path", text: "Of all paths the Eightfold Path is the best; of all truths the Four Noble Truths are the best; of all things passionlessness is the best; of men the Seeing One (the Buddha) is the best." },
];

const GURBANI_VERSES = [
  { section: "Japji Sahib", text: "There is One God. True is His Name, creative His personality and immortal His form. He is without fear, without enmity. Unborn, self-illumined. By the Guru's grace He is obtained." },
  { section: "Japji Sahib", text: "By thinking, He cannot be reduced to thought, even by thinking hundreds of thousands of times. By being silent, inner silence is not obtained, even by remaining lovingly absorbed deep within." },
  { section: "Japji Sahib", text: "The value of His virtues cannot be estimated; neither can His ways be described. Neither can His bounty be appraised, nor His mercy calculated." },
  { section: "Asa di Var", text: "Nanak says: By the Guru's teachings, some come to understand. They become the beloveds of the Lord's Court; they are approved by the Guru." },
  { section: "Rehras Sahib", text: "That Lord is inaccessible, unfathomable, all-powerful, and omnipotent. He Himself is the wealth, He Himself is the enjoyer. Only You Yourself know Your own ways." },
  { section: "Sukhmani Sahib", text: "God Himself is the Creator, and He Himself is the Enjoyer. He Himself is the Giver, and He Himself is the Receiver." },
  { section: "Sukhmani Sahib", text: "Remember, remember, remember Him in meditation, and find peace. Worry and anguish shall be dispelled from your body." },
  { section: "Anand Sahib", text: "O my mind, remain always with the Lord. Remain always with the Lord, O my mind, and all sufferings will be forgotten." },
  { section: "Guru Granth Sahib", text: "From woman, man is born; within woman, man is conceived; to woman he is engaged and married. Woman becomes his friend; through woman, the future generations come." },
  { section: "Guru Granth Sahib", text: "O Nanak, only the one who is full of all virtues, is called a true yogi. What can anyone do, when all beings belong to God?" },
  { section: "Guru Granth Sahib", text: "When the hands, feet, and body are dirty, water can wash away the dirt. When the clothes are soiled, soap can wash them clean. But when the intellect is stained and polluted by sin, it can only be cleansed by the Love of the Name." },
  { section: "Guru Granth Sahib", text: "Let compassion be your cotton, contentment your thread, modesty your knot, and truth your twist. This is the sacred thread of the soul; if you have it, then go ahead and put it on me." },
];

// Seeded pseudo-random so the same seed always gives the same sequence,
// but a different seed (e.g. different day or explicit refresh) gives variety.
function seededRandom(seed) {
  let h = seed;
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function randomInt(max, rng) {
  return Math.floor((rng ? rng() : Math.random()) * max);
}

async function fetchBible(book, chapter) {
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}`);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    source: `${book} ${chapter}`,
    translation: data.translation_name || "World English Bible",
    verses: data.verses?.map(v => ({ number: v.verse, text: v.text.trim() })) || [],
  };
}

async function fetchQuran(surah) {
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surah}/en.asad`);
  if (!res.ok) return null;
  const data = await res.json();
  const s = data.data;
  return {
    source: `Surah ${s.englishName} (${s.name}) — ${s.englishNameTranslation}`,
    translation: "Muhammad Asad Translation",
    verses: s.ayahs?.map(a => ({ number: a.numberInSurah, text: a.text.trim() })) || [],
  };
}

async function fetchTorah(book, chapter) {
  const res = await fetch(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(book)}.${chapter}?version=english`);
  if (!res.ok) return null;
  const data = await res.json();
  const version = data.versions?.[0];
  if (!version?.text) return null;
  return {
    source: `${book} ${chapter}`,
    translation: version.shortVersionTitle || version.versionTitle || "Sefaria",
    verses: version.text.map((t, i) => ({
      number: i + 1,
      text: typeof t === "string" ? t.replace(/<[^>]*>/g, "").trim() : "",
    })).filter(v => v.text),
  };
}

async function fetchGita(chapter) {
  // Fetch individual verses from vedicscriptures.github.io
  const CHAPTER_VERSES = [47,72,43,42,29,47,30,28,34,42,55,20,35,27,20,24,28,78];
  const maxVerse = CHAPTER_VERSES[chapter - 1] || 20;
  const versesToFetch = Math.min(maxVerse, 20);
  const promises = [];
  for (let v = 1; v <= versesToFetch; v++) {
    promises.push(
      fetch(`https://vedicscriptures.github.io/slok/${chapter}/${v}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    );
  }
  const results = await Promise.all(promises);
  const verses = results
    .filter(r => r != null)
    .map(r => ({
      number: r.verse,
      text: (r.siva?.et || r.purohit?.et || r.gambir?.et || r.adi?.et || r.san?.et || "").trim(),
    }))
    .filter(v => v.text);
  if (!verses.length) return null;
  return {
    source: `Bhagavad Gita, Chapter ${chapter}`,
    translation: "Swami Sivananda / Various",
    verses,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { religion, action, forceRandom } = body;
    // action: "random_chapter" — returns a full chapter/surah/section

    // Build a seed: date-based for consistency within a day, or truly random on refresh
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const seedStr = forceRandom
      ? `${religion}-${Date.now()}-${Math.random()}`
      : `${religion}-${today}`;
    const rng = seededRandom(hashString(seedStr));

    if (religion === "Christianity" || religion === "Catholicism") {
      const book = BIBLE_BOOKS[randomInt(BIBLE_BOOKS.length, rng)];
      const chapter = randomInt(book.chapters, rng) + 1;
      const result = await fetchBible(book.ref, chapter);
      if (result) return Response.json(result);
      // fallback
      const fb = await fetchBible("John", 3);
      return Response.json(fb || { source: "Error", verses: [], translation: "" });
    }

    if (religion === "Islam") {
      const surah = randomInt(114, rng) + 1;
      const result = await fetchQuran(surah);
      if (result) return Response.json(result);
      const fb = await fetchQuran(1);
      return Response.json(fb || { source: "Error", verses: [], translation: "" });
    }

    if (religion === "Judaism") {
      const book = TORAH_BOOKS[randomInt(TORAH_BOOKS.length, rng)];
      const maxCh = { Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34, Psalms: 150, Proverbs: 31, Isaiah: 66, Jeremiah: 52, Ecclesiastes: 12 };
      const chapter = randomInt(maxCh[book] || 10, rng) + 1;
      const result = await fetchTorah(book, chapter);
      if (result) return Response.json(result);
      const fb = await fetchTorah("Genesis", 1);
      return Response.json(fb || { source: "Error", verses: [], translation: "" });
    }

    if (religion === "Hinduism") {
      const chapter = randomInt(18, rng) + 1;
      const result = await fetchGita(chapter);
      if (result && result.verses.length > 0) return Response.json(result);
      // fallback to bundled
      return Response.json({
        source: "Bhagavad Gita",
        translation: "Various",
        verses: [{ number: 1, text: "Whenever dharma declines and the purpose of life is forgotten, I manifest myself on earth. I am born in every age to protect the good, to destroy evil, and to reestablish dharma. — Lord Krishna (4.7-8)" }],
      });
    }

    if (religion === "Buddhism") {
      const startIdx = randomInt(Math.max(1, DHAMMAPADA_VERSES.length - 4), rng);
      const selection = DHAMMAPADA_VERSES.slice(startIdx, startIdx + 5);
      return Response.json({
        source: `Dhammapada — ${selection[0].chapter}`,
        translation: "Translated from Pali",
        verses: selection.map((v, i) => ({ number: startIdx + i + 1, text: v.text })),
      });
    }

    if (religion === "Sikhism") {
      const startIdx = randomInt(Math.max(1, GURBANI_VERSES.length - 4), rng);
      const selection = GURBANI_VERSES.slice(startIdx, startIdx + 5);
      return Response.json({
        source: `Guru Granth Sahib — ${selection[0].section}`,
        translation: "English Translation",
        verses: selection.map((v, i) => ({ number: startIdx + i + 1, text: v.text })),
      });
    }

    return Response.json({ error: "Unsupported religion" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});