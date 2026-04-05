/**
 * Pre-built puzzle sets for Buzz Word.
 * Each puzzle has 7 letters, a designated center letter, and valid words.
 * ALL words must contain the center letter AND only use the available letters.
 * Each letter can only be used once per word (unless duplicated in the set).
 */

function validatePuzzle(puzzle) {
  const available = puzzle.letters.map(l => l.toLowerCase());
  const center = puzzle.center.toLowerCase();
  return {
    ...puzzle,
    words: puzzle.words.filter(word => {
      const w = word.toLowerCase();
      // Must contain center
      if (!w.includes(center)) return false;
      // Each letter in word must be available (respecting count)
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
];

// Validate all puzzles at import time — strip any invalid words
const PUZZLES = RAW_PUZZLES.map(validatePuzzle);

export default PUZZLES;