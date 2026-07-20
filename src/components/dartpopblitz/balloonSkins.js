/**
 * Balloon skin application.
 *
 * The shop sells cosmetic balloon skins (see shopCatalog BALLOON_SKINS).
 * Each skin has a `preview` that is either a hex color or the string "rainbow".
 *
 * We apply the equipped skin's color to the GENERIC balloon types (basic + small)
 * so the change is clearly visible, while leaving the special types
 * (tough / gold / bomb / ghost / speed / magnet) with their meaningful colors so
 * players can still recognize them at a glance.
 */
import { BALLOON_SKINS } from "@/components/shop/shopCatalog";

const SKIN_MAP = Object.fromEntries(BALLOON_SKINS.map((s) => [s.id, s]));

// Balloon types that get recolored by the equipped skin.
const SKINNABLE_TYPES = new Set(["basic", "small"]);

// A vivid palette used for "rainbow" skins.
const RAINBOW_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#a855f7", "#ec4899",
];

/**
 * Returns the hex color to use for a generic balloon under the given skin,
 * or null to keep the balloon's default color.
 */
export function getSkinColor(skinId, index = 0) {
  const skin = SKIN_MAP[skinId];
  if (!skin || skin.id === "default" || !skin.preview) return null;
  if (skin.preview === "rainbow") {
    return RAINBOW_PALETTE[index % RAINBOW_PALETTE.length];
  }
  return skin.preview;
}

/**
 * Apply the equipped skin to an array of balloons in place.
 * Only recolors generic (basic/small) balloons.
 */
export function applyBalloonSkin(balloons, skinId) {
  if (!skinId || skinId === "default") return balloons;
  balloons.forEach((b, i) => {
    if (!SKINNABLE_TYPES.has(b.type)) return;
    const c = getSkinColor(skinId, i);
    if (c) b.color = c;
  });
  return balloons;
}