/**
 * Pre-built puzzle sets for Word Whomp.
 * Each puzzle has 7 letters and a curated list of valid words (3+ letters).
 * The center letter (index 3) must be in every word.
 */

const PUZZLES = [
  {
    letters: ["T", "R", "A", "G", "E", "N", "S"],
    center: "G",
    words: ["age", "rag", "gag", "nag", "sag", "tag", "gas", "ages", "sage", "rage", "rang", "gang", "sang", "gate", "gnat", "stag", "grate", "stage", "range", "anger", "grant", "agent", "great", "gears", "strange", "agents", "grants", "grates", "garnet", "garnets"],
  },
  {
    letters: ["P", "L", "A", "N", "E", "T", "S"],
    center: "N",
    words: ["ant", "pan", "tan", "net", "ten", "pen", "ants", "pant", "plan", "lean", "lane", "neat", "pane", "sent", "tens", "nest", "ante", "pens", "plant", "plane", "panel", "spent", "slant", "leant", "pants", "plans", "planet", "plants", "panels", "planes", "planets"],
  },
  {
    letters: ["C", "H", "A", "R", "M", "E", "D"],
    center: "R",
    words: ["arc", "arm", "car", "ear", "era", "ram", "red", "arch", "care", "char", "dare", "dear", "harm", "hare", "hear", "mare", "race", "read", "ream", "acre", "charm", "dream", "march", "reach", "armed", "cedar", "cream", "arched", "charge", "marched", "charmed"],
  },
  {
    letters: ["W", "I", "N", "T", "E", "R", "S"],
    center: "T",
    words: ["sit", "tin", "wit", "net", "set", "ten", "wet", "tie", "twin", "writ", "stir", "tire", "wire", "wise", "site", "nest", "rest", "west", "test", "rent", "sent", "stern", "twist", "write", "wrist", "inert", "inter", "tires", "twins", "winter", "twines", "winter", "writes", "winters"],
  },
  {
    letters: ["F", "L", "O", "W", "E", "R", "S"],
    center: "O",
    words: ["for", "foe", "low", "owe", "ore", "row", "woe", "wolf", "flow", "fore", "role", "lore", "wore", "slow", "sole", "rose", "lose", "fowl", "owes", "rows", "floss", "floor", "lower", "worse", "flows", "towers", "flower", "slower", "floors", "flowers"],
  },
  {
    letters: ["B", "R", "I", "G", "H", "T", "S"],
    center: "I",
    words: ["big", "bit", "fig", "gig", "hit", "rig", "sir", "sit", "grit", "gist", "this", "stir", "girth", "grist", "shirt", "sight", "tight", "right", "birth", "grits", "brigs", "grips", "trips", "rights", "births", "bright", "lights", "tights", "sights", "brights"],
  },
  {
    letters: ["D", "A", "N", "C", "E", "R", "S"],
    center: "C",
    words: ["ace", "arc", "can", "car", "sac", "aces", "acne", "acre", "arcs", "cane", "care", "case", "race", "scan", "scar", "canes", "cares", "cedar", "crane", "dance", "dunce", "racer", "races", "scald", "scare", "snack", "craned", "dances", "dancer", "dancer", "dancers"],
  },
  {
    letters: ["M", "U", "S", "I", "C", "A", "L"],
    center: "M",
    words: ["aim", "cam", "gum", "him", "jam", "aim", "calm", "clam", "mail", "maul", "slim", "slam", "scam", "claim", "clams", "mauls", "music", "calms", "mails", "meals", "smile", "slime", "claims", "musica", "musical"],
  },
  {
    letters: ["G", "A", "R", "D", "E", "N", "S"],
    center: "D",
    words: ["add", "and", "bad", "dad", "den", "end", "nod", "sad", "aged", "dang", "dare", "dead", "dean", "dear", "dens", "drag", "read", "sand", "send", "adder", "dares", "deans", "gander", "garden", "grades", "ranged", "sanded", "danger", "gander", "garden", "gardens", "dangers"],
  },
  {
    letters: ["T", "H", "U", "N", "D", "E", "R"],
    center: "U",
    words: ["dug", "fun", "gun", "hue", "hug", "hun", "nun", "nut", "run", "rut", "sun", "tun", "dune", "dung", "hunt", "hurt", "rude", "rung", "runt", "thud", "true", "tune", "turn", "under", "tuner", "trunk", "turned", "hunted", "hunter", "turned", "thunder"],
  },
];

export default PUZZLES;