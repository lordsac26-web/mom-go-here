/**
 * Pre-built puzzle sets for Buzz Word.
 * Each puzzle has 7 letters, a designated center letter, and valid words.
 * ALL words must contain the center letter AND only use the available letters.
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
  // === NEW PUZZLES ===
  {
    letters: ["S", "P", "A", "R", "K", "L", "E"],
    center: "R",
    words: ["are", "ark", "ear", "era", "par", "rap", "earl", "lake", "lark", "leak", "pear", "rake", "real", "reap", "sear", "spare", "spear", "pearl", "parks", "drape", "leaps", "reaps", "pearls", "sparkle"],
  },
  {
    letters: ["J", "O", "U", "R", "N", "E", "Y"],
    center: "O",
    words: ["joy", "nor", "one", "ore", "our", "roe", "yon", "your", "euro", "jury", "loner", "rune", "yore", "journey"],
  },
  {
    letters: ["B", "A", "L", "A", "N", "C", "E"],
    center: "A",
    words: ["ace", "ale", "ban", "cab", "can", "lab", "able", "bale", "bane", "cane", "clan", "lace", "lane", "lean", "canal", "lance", "clean", "balance"],
  },
  {
    letters: ["K", "I", "T", "C", "H", "E", "N"],
    center: "K",
    words: ["kin", "ink", "kit", "kick", "kite", "knit", "tick", "thick", "think", "kitchen"],
  },
  {
    letters: ["S", "U", "M", "M", "E", "R", "S"],
    center: "M",
    words: ["emu", "rum", "sum", "use", "muse", "seem", "serum", "summer", "summers"],
  },
  {
    letters: ["P", "U", "Z", "Z", "L", "E", "S"],
    center: "Z",
    words: ["zap", "zee", "zip", "zeal", "zone", "buzz", "fuzz", "puzzle", "puzzles"],
  },
  {
    letters: ["H", "A", "R", "V", "E", "S", "T"],
    center: "H",
    words: ["ash", "hat", "has", "her", "the", "hash", "hate", "have", "hear", "heat", "rash", "shave", "share", "heart", "earth", "trash", "shaver", "hearts", "harvest"],
  },
  {
    letters: ["C", "O", "U", "N", "T", "R", "Y"],
    center: "C",
    words: ["con", "cop", "cor", "cot", "cry", "cur", "cut", "corn", "cost", "curt", "coat", "cart", "court", "count", "corny", "crouton", "country"],
  },
  {
    letters: ["W", "E", "A", "T", "H", "E", "R"],
    center: "W",
    words: ["awe", "hew", "new", "raw", "sew", "wet", "wart", "ware", "wear", "whet", "whew", "wheat", "where", "water", "wrath", "weather"],
  },
  {
    letters: ["L", "A", "U", "G", "H", "T", "S"],
    center: "L",
    words: ["all", "gal", "lag", "last", "lash", "lust", "tall", "gall", "halt", "haul", "salt", "slug", "slat", "stall", "laugh", "laughs"],
  },
  {
    letters: ["F", "R", "I", "E", "N", "D", "S"],
    center: "N",
    words: ["den", "din", "end", "fin", "inn", "sin", "dine", "find", "fine", "fern", "rein", "rind", "send", "diner", "finer", "inner", "siren", "snide", "fiend", "finder", "dinner", "friend", "friends"],
  },
  {
    letters: ["S", "T", "R", "O", "N", "G", "E"],
    center: "O",
    words: ["ego", "got", "nor", "not", "one", "ore", "rot", "ton", "toe", "gone", "gore", "note", "nose", "rose", "tone", "tore", "wore", "song", "goner", "store", "stone", "snore", "strong"],
  },
  {
    letters: ["B", "R", "A", "V", "E", "L", "Y"],
    center: "V",
    words: ["eve", "rave", "veal", "verb", "very", "vale", "rave", "brave", "ravel", "lever", "every", "bravely"],
  },
  {
    letters: ["C", "R", "E", "A", "T", "I", "V"],
    center: "I",
    words: ["air", "ice", "ire", "tie", "via", "cite", "rice", "tire", "vice", "vita", "crate", "irate", "rivet", "trace", "active", "creative"],
  },
  {
    letters: ["M", "A", "G", "N", "E", "T", "S"],
    center: "M",
    words: ["gem", "gum", "ham", "jam", "man", "mat", "met", "game", "mane", "mast", "mate", "mean", "meat", "name", "same", "seam", "stem", "tame", "team", "games", "magnet", "magnets"],
  },
];

const PUZZLES = RAW_PUZZLES.map(validatePuzzle);

export default PUZZLES;