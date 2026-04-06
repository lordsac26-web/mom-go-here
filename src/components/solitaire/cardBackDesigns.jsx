/**
 * Card back design definitions used across Solitaire components and Settings.
 * Each design defines: key, label, emoji, gradient colors, border color,
 * inner border color, and an SVG pattern render function.
 */

const CARD_BACK_DESIGNS = [
  {
    key: "classic_blue",
    label: "Classic Blue",
    emoji: "💎",
    gradient: "from-blue-700 via-blue-800 to-blue-950",
    borderColor: "border-blue-500",
    innerBorder: "border-blue-400/30",
    innerBorder2: "border-blue-300/15",
    patternId: "cbClassic",
    pattern: () => (
      <pattern id="cbClassic" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M5 0L10 5L5 10L0 5Z" fill="white" />
      </pattern>
    ),
  },
  {
    key: "royal_red",
    label: "Royal Red",
    emoji: "♥️",
    gradient: "from-red-700 via-red-800 to-red-950",
    borderColor: "border-red-500",
    innerBorder: "border-red-400/30",
    innerBorder2: "border-red-300/15",
    patternId: "cbRed",
    pattern: () => (
      <pattern id="cbRed" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="6" r="2" fill="white" />
      </pattern>
    ),
  },
  {
    key: "emerald",
    label: "Emerald",
    emoji: "🍀",
    gradient: "from-emerald-700 via-emerald-800 to-emerald-950",
    borderColor: "border-emerald-500",
    innerBorder: "border-emerald-400/30",
    innerBorder2: "border-emerald-300/15",
    patternId: "cbEmerald",
    pattern: () => (
      <pattern id="cbEmerald" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 0L8 8M8 0L0 8" stroke="white" strokeWidth="0.5" />
      </pattern>
    ),
  },
  {
    key: "royal_purple",
    label: "Royal Purple",
    emoji: "👑",
    gradient: "from-purple-700 via-purple-800 to-purple-950",
    borderColor: "border-purple-500",
    innerBorder: "border-purple-400/30",
    innerBorder2: "border-purple-300/15",
    patternId: "cbPurple",
    pattern: () => (
      <pattern id="cbPurple" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect x="3" y="3" width="4" height="4" fill="white" transform="rotate(45 5 5)" />
      </pattern>
    ),
  },
  {
    key: "midnight_gold",
    label: "Midnight Gold",
    emoji: "✨",
    gradient: "from-gray-900 via-yellow-900 to-gray-950",
    borderColor: "border-yellow-600",
    innerBorder: "border-yellow-500/30",
    innerBorder2: "border-yellow-400/15",
    patternId: "cbGold",
    pattern: () => (
      <pattern id="cbGold" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
        <path d="M7 0L9 5L14 5L10 8L12 14L7 10L2 14L4 8L0 5L5 5Z" fill="white" />
      </pattern>
    ),
  },
  {
    key: "ocean",
    label: "Ocean Wave",
    emoji: "🌊",
    gradient: "from-cyan-700 via-sky-800 to-blue-950",
    borderColor: "border-cyan-500",
    innerBorder: "border-cyan-400/30",
    innerBorder2: "border-cyan-300/15",
    patternId: "cbOcean",
    pattern: () => (
      <pattern id="cbOcean" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 5Q5 0 10 5T20 5" fill="none" stroke="white" strokeWidth="1" />
      </pattern>
    ),
  },
];

export default CARD_BACK_DESIGNS;

export function getDesign(key) {
  return CARD_BACK_DESIGNS.find(d => d.key === key) || CARD_BACK_DESIGNS[0];
}