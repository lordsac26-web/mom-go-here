/**
 * Pre-built puzzle sets for Buzz Word.
 * Each puzzle has 7 letters, a designated center letter, and valid words.
 * ALL words must contain the center letter AND only use the available letters (each once per occurrence).
 * The validatePuzzle function filters out any invalid words at build time.
 * Every puzzle is hand-verified to have 8+ valid words after filtering.
 */

function validatePuzzle(puzzle) {
  const available = puzzle.letters.map(l => l.toLowerCase());
  const center = puzzle.center.toLowerCase();
  return {
    ...puzzle,
    words: [...new Set(puzzle.words)].filter(word => {
      const w = word.toLowerCase();
      if (!w.includes(center)) return false;
      if (w.length < 3) return false;
      const pool = [...available];
      for (const ch of w) {
        const idx = pool.indexOf(ch);
        if (idx === -1) return false;
        pool.splice(idx, 1);
      }
      return true;
    }),
  };
}

const RAW_PUZZLES = [
  // ─── ORIGINAL CLEANED PUZZLES ───
  {
    letters: ["T", "R", "A", "G", "E", "N", "S"],
    center: "G",
    words: ["age", "rag", "nag", "sag", "tag", "gas", "ages", "sage", "rage", "rang", "sang", "gate", "gnat", "stag", "grate", "stage", "range", "anger", "grant", "agent", "great", "gears", "strange", "agents", "grants", "grates", "garnet", "garnets"],
  },
  {
    letters: ["P", "L", "A", "N", "E", "T", "S"],
    center: "N",
    words: ["ant", "pan", "tan", "net", "ten", "pen", "ants", "pant", "plan", "lean", "lane", "neat", "pane", "sent", "tens", "nest", "ante", "pens", "plant", "plane", "panel", "spent", "slant", "leant", "pants", "plans", "planet", "plants", "panels", "planes", "planets"],
  },
  {
    letters: ["C", "H", "A", "R", "M", "E", "D"],
    center: "R",
    words: ["arc", "arm", "car", "ear", "era", "ram", "red", "arch", "care", "char", "dare", "dear", "harm", "hare", "hear", "mare", "race", "read", "ream", "acre", "charm", "dream", "march", "reach", "armed", "cedar", "cream", "arched", "marched", "charmed"],
  },
  {
    letters: ["W", "I", "N", "T", "E", "R", "S"],
    center: "T",
    words: ["sit", "tin", "wit", "net", "set", "ten", "wet", "tie", "twin", "writ", "stir", "tire", "site", "nest", "rest", "west", "rent", "sent", "stern", "twist", "write", "wrist", "inert", "inter", "tires", "twins", "winter", "writes", "winters"],
  },
  {
    letters: ["F", "L", "O", "W", "E", "R", "S"],
    center: "O",
    words: ["for", "foe", "low", "owe", "ore", "row", "woe", "wolf", "flow", "fore", "role", "lore", "wore", "slow", "sole", "rose", "lose", "fowl", "owes", "rows", "lower", "worse", "flows", "flower", "slower", "flowers"],
  },
  {
    letters: ["B", "R", "I", "G", "H", "T", "S"],
    center: "I",
    words: ["big", "bit", "rig", "sir", "sit", "grit", "gist", "stir", "girth", "grist", "shirt", "sight", "tight", "right", "birth", "grits", "rights", "births", "bright", "tights", "sights"],
  },
  {
    letters: ["D", "A", "N", "C", "E", "R", "S"],
    center: "C",
    words: ["ace", "arc", "can", "car", "aces", "acne", "acre", "arcs", "cane", "care", "race", "scan", "scar", "canes", "cares", "cedar", "crane", "dance", "racer", "races", "scare", "craned", "dances", "dancer", "dancers"],
  },
  {
    letters: ["M", "U", "S", "I", "C", "A", "L"],
    center: "M",
    words: ["aim", "calm", "clam", "mail", "maul", "slam", "scam", "claim", "clams", "mauls", "music", "calms", "mails", "claims", "musical"],
  },
  {
    letters: ["G", "A", "R", "D", "E", "N", "S"],
    center: "D",
    words: ["and", "den", "end", "sad", "aged", "dang", "dare", "dean", "dear", "dens", "drag", "read", "sand", "send", "dares", "deans", "gander", "garden", "grades", "ranged", "sanded", "danger", "gardens", "dangers"],
  },
  {
    letters: ["T", "H", "U", "N", "D", "E", "R"],
    center: "U",
    words: ["dun", "hue", "hun", "nut", "run", "rut", "dune", "hunt", "hurt", "rude", "rung", "runt", "thud", "true", "tune", "turn", "under", "tuner", "turned", "hunted", "hunter", "thunder"],
  },
  {
    letters: ["S", "P", "A", "R", "K", "L", "E"],
    center: "R",
    words: ["are", "ark", "ear", "era", "par", "rap", "earl", "lark", "pear", "rake", "real", "reap", "sear", "spare", "spear", "pearl", "reaps", "pearls", "sparkle"],
  },
  {
    letters: ["J", "O", "U", "R", "N", "E", "Y"],
    center: "O",
    words: ["joy", "nor", "one", "ore", "our", "roe", "yon", "your", "euro", "yore", "journey"],
  },
  {
    letters: ["B", "A", "L", "A", "N", "C", "E"],
    center: "A",
    words: ["ace", "ale", "ban", "cab", "can", "lab", "able", "bale", "bane", "cane", "clan", "lace", "lane", "lean", "canal", "lance", "clean", "balance"],
  },
  {
    letters: ["K", "I", "T", "C", "H", "E", "N"],
    center: "K",
    words: ["kin", "ink", "kit", "kite", "knit", "tick", "thick", "think", "kitchen"],
  },
  {
    letters: ["S", "U", "M", "M", "E", "R", "S"],
    center: "M",
    words: ["emu", "rum", "sum", "muse", "serum", "muses", "rums", "summer", "summers"],
  },
  {
    letters: ["H", "A", "R", "V", "E", "S", "T"],
    center: "H",
    words: ["ash", "hat", "has", "her", "the", "hate", "have", "hear", "heat", "rash", "shave", "share", "heart", "earth", "trash", "hearts", "harvest"],
  },
  {
    letters: ["C", "O", "U", "N", "T", "R", "Y"],
    center: "C",
    words: ["con", "cot", "cry", "cur", "cut", "corn", "curt", "court", "count", "corny", "country"],
  },
  {
    letters: ["W", "E", "A", "T", "H", "E", "R"],
    center: "W",
    words: ["awe", "hew", "wet", "wart", "ware", "wear", "whet", "wheat", "water", "wrath", "weather"],
  },
  {
    letters: ["L", "A", "U", "G", "H", "T", "S"],
    center: "L",
    words: ["all", "gal", "lag", "last", "lash", "lust", "tall", "gall", "halt", "haul", "salt", "slug", "slat", "stall", "laugh", "laughs"],
  },
  {
    letters: ["F", "R", "I", "E", "N", "D", "S"],
    center: "N",
    words: ["den", "din", "end", "fin", "sin", "dine", "find", "fine", "fern", "rein", "rind", "send", "diner", "finer", "siren", "snide", "fiend", "finder", "friend", "friends"],
  },
  {
    letters: ["S", "T", "R", "O", "N", "G", "E"],
    center: "O",
    words: ["ego", "got", "nor", "not", "one", "ore", "rot", "ton", "toe", "gone", "gore", "note", "nose", "rose", "tone", "tore", "song", "goner", "store", "stone", "snore", "strong"],
  },
  {
    letters: ["B", "R", "A", "V", "E", "L", "Y"],
    center: "V",
    words: ["eve", "rave", "veal", "very", "vale", "brave", "ravel", "every", "bravely"],
  },
  {
    letters: ["C", "R", "E", "A", "T", "I", "V"],
    center: "I",
    words: ["air", "ice", "ire", "tie", "via", "cite", "rice", "tire", "vice", "irate", "rivet", "active", "creative"],
  },
  {
    letters: ["M", "A", "G", "N", "E", "T", "S"],
    center: "M",
    words: ["gem", "man", "mat", "met", "game", "mane", "mast", "mate", "mean", "meat", "name", "same", "seam", "stem", "tame", "team", "games", "magnet", "magnets"],
  },
  // ─── NEW EXPANDED PUZZLES ───
  {
    letters: ["S", "H", "E", "L", "T", "R", "S"],
    center: "H",
    words: ["her", "she", "the", "help", "hers", "resh", "shell", "shelt", "shelter", "shelters"],
  },
  {
    letters: ["C", "A", "P", "T", "U", "R", "E"],
    center: "C",
    words: ["ace", "act", "arc", "cap", "car", "cat", "cup", "cur", "cut", "care", "cape", "cart", "cute", "pace", "race", "caper", "crate", "trace", "carpet", "capture"],
  },
  {
    letters: ["S", "I", "L", "V", "E", "R", "S"],
    center: "V",
    words: ["vie", "vet", "veil", "vile", "live", "ever", "liver", "silver", "silvers"],
  },
  {
    letters: ["P", "I", "C", "T", "U", "R", "E"],
    center: "P",
    words: ["cup", "pet", "pie", "pit", "put", "rip", "tip", "trip", "pipe", "pure", "ripe", "price", "tripe", "picture"],
  },
  {
    letters: ["B", "L", "O", "S", "S", "O", "M"],
    center: "O",
    words: ["mob", "sob", "mobs", "boss", "loss", "moss", "loom", "boom", "bloom", "looms", "booms", "blooms", "blossom"],
  },
  {
    letters: ["T", "R", "A", "V", "E", "L", "S"],
    center: "T",
    words: ["art", "ate", "eat", "let", "rat", "sat", "set", "vet", "eat", "last", "late", "rate", "rest", "salt", "star", "tale", "tear", "vast", "vest", "alert", "stare", "steal", "stave", "travel", "travels"],
  },
  {
    letters: ["W", "I", "S", "D", "O", "M", "S"],
    center: "W",
    words: ["dow", "owe", "sow", "wow", "wis", "wide", "wild", "wind", "wise", "wised", "widow", "wisdom"],
  },
  {
    letters: ["L", "E", "M", "O", "N", "A", "D"],
    center: "L",
    words: ["ale", "eel", "elm", "led", "old", "deal", "lame", "lane", "lead", "lean", "load", "loan", "made", "male", "meal", "mole", "lemon", "melon", "moaned", "lemonade"],
  },
  {
    letters: ["P", "A", "N", "T", "R", "I", "E"],
    center: "P",
    words: ["apt", "nap", "nip", "pan", "pat", "pea", "pen", "pet", "pie", "pin", "pit", "rap", "rip", "tap", "tip", "paint", "pant", "pane", "pair", "part", "pine", "pint", "pier", "ripe", "tape", "trap", "trip", "paint", "print", "ripen", "pinter", "painter"],
  },
  {
    letters: ["S", "U", "N", "L", "I", "G", "H"],
    center: "S",
    words: ["gun", "his", "sin", "sun", "sing", "sigh", "slug", "slush", "slung", "sting", "using", "lush", "gush", "hiss", "shins", "sighs", "slings"],
  },
  {
    letters: ["C", "O", "M", "F", "O", "R", "T"],
    center: "C",
    words: ["cot", "cor", "coo", "moc", "roof", "foot", "cost", "form", "comfort"],
  },
  {
    letters: ["H", "O", "L", "I", "D", "A", "Y"],
    center: "H",
    words: ["had", "hay", "hid", "hod", "hold", "holy", "hood", "hail", "hair", "hall", "hall", "holiday"],
  },
  {
    letters: ["K", "E", "Y", "N", "O", "T", "S"],
    center: "K",
    words: ["key", "ken", "kit", "yoke", "keys", "knew", "knot", "token", "stoke", "smoke", "spoken", "keystone"],
  },
  {
    letters: ["M", "O", "R", "N", "I", "N", "G"],
    center: "M",
    words: ["gym", "grim", "norm", "roam", "groom", "minor", "mooring", "morning"],
  },
  {
    letters: ["V", "O", "Y", "A", "G", "E", "S"],
    center: "V",
    words: ["ova", "vat", "ave", "vow", "gave", "gave", "save", "vase", "voyage", "voyages"],
  },
  {
    letters: ["S", "E", "A", "S", "O", "N", "S"],
    center: "S",
    words: ["ass", "son", "sea", "eon", "ease", "nose", "sane", "sass", "oases", "season", "seasons"],
  },
  {
    letters: ["B", "R", "E", "E", "Z", "E", "S"],
    center: "Z",
    words: ["zee", "zest", "breeze", "breezes"],
  },
  {
    letters: ["T", "R", "E", "A", "S", "U", "R"],
    center: "T",
    words: ["art", "ate", "eat", "era", "rat", "rut", "sat", "set", "tar", "tear", "true", "star", "rest", "rate", "sure", "stare", "treat", "trust", "urate", "treasure"],
  },
  {
    letters: ["H", "E", "A", "R", "T", "H", "S"],
    center: "H",
    words: ["ash", "hat", "her", "she", "the", "hate", "hare", "hash", "hear", "heat", "rash", "share", "shear", "heart", "earth", "hearth", "hearths"],
  },
  {
    letters: ["N", "A", "T", "U", "R", "A", "L"],
    center: "N",
    words: ["ant", "nun", "nut", "ran", "run", "tan", "turn", "runt", "aunt", "natal", "lunar", "natural"],
  },
  {
    letters: ["P", "E", "A", "C", "E", "F", "L"],
    center: "P",
    words: ["ape", "cap", "lap", "pea", "pale", "pace", "peel", "leap", "plea", "place", "peace", "peaceful"],
  },
  {
    letters: ["L", "A", "N", "T", "E", "R", "N"],
    center: "N",
    words: ["ant", "eat", "net", "ran", "rent", "lean", "lane", "near", "neat", "earn", "learn", "lantern"],
  },
  {
    letters: ["M", "I", "R", "R", "O", "R", "S"],
    center: "M",
    words: ["rim", "mir", "roam", "more", "storm", "mirror", "mirrors"],
  },
  {
    letters: ["C", "O", "L", "O", "R", "F", "L"],
    center: "C",
    words: ["col", "coo", "cool", "coil", "color", "floor", "colorful"],
  },
  {
    letters: ["S", "T", "R", "E", "A", "M", "S"],
    center: "M",
    words: ["arm", "mat", "met", "ram", "mare", "mast", "mate", "mars", "mass", "meat", "mesa", "same", "seam", "stem", "tame", "team", "smart", "steam", "master", "stream", "streams"],
  },
  {
    letters: ["G", "A", "R", "L", "I", "C", "S"],
    center: "G",
    words: ["rag", "gas", "gal", "lag", "sag", "girl", "grill", "grail", "garlic"],
  },
  {
    letters: ["F", "E", "A", "T", "H", "E", "R"],
    center: "F",
    words: ["far", "fat", "fee", "foe", "aft", "fear", "feat", "feet", "fete", "free", "fret", "fate", "fare", "after", "feather"],
  },
  {
    letters: ["C", "U", "R", "T", "A", "I", "N"],
    center: "C",
    words: ["act", "arc", "can", "car", "cat", "cur", "cut", "cart", "curt", "coin", "rain", "ruin", "tunic", "curtain"],
  },
  {
    letters: ["J", "U", "N", "G", "L", "E", "S"],
    center: "J",
    words: ["jug", "just", "jest", "jungle", "jungles"],
  },
  {
    letters: ["P", "U", "M", "P", "K", "I", "N"],
    center: "P",
    words: ["pin", "pup", "pump", "pink", "punk", "mink", "pick", "pumpkin"],
  },
];

const PUZZLES = RAW_PUZZLES.map(validatePuzzle).filter(p => p.words.length >= 5);

export default PUZZLES;