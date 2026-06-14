import confetti from "canvas-confetti";

/**
 * RCON-01 Celebration System
 * Uses canvas-confetti to provide tiered celebration effects.
 *
 * Tiers:
 *  - spark()         – tiny burst for small wins (finding a word, matching a pair)
 *  - burst()         – medium burst for milestones (halfway, score thresholds)
 *  - shower()        – full-screen shower for major wins (game complete, perfect score)
 *  - fireworks()     – multi-shot firework sequence for ultimate achievements
 *  - side cannons()  – cannons from both sides of the screen
 */

const GOLD_COLORS = ["#f59e0b", "#fbbf24", "#fde68a", "#d97706"];
const RAINBOW = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const PARTY = ["#ff0a54", "#ff477e", "#ff7096", "#ff85a1", "#fbb1bd", "#f9bec7", "#3b82f6", "#22d3ee", "#a855f7"];

// Detect low-end / mobile to scale down particle counts
const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

export default function useConfetti() {

  // Tiny burst — small celebration (word found, pair matched)
  function spark(origin = { x: 0.5, y: 0.5 }) {
    confetti({
      particleCount: isMobile() ? 16 : 28,
      spread: 50,
      startVelocity: 18,
      decay: 0.94,
      scalar: 0.75,
      origin,
      colors: GOLD_COLORS,
      ticks: 60,
      gravity: 0.9,
    });
  }

  // Medium burst — milestone
  function burst(origin = { x: 0.5, y: 0.4 }) {
    confetti({
      particleCount: isMobile() ? 28 : 45,
      spread: 60,
      startVelocity: 26,
      decay: 0.91,
      scalar: 0.9,
      origin,
      colors: RAINBOW,
      ticks: 75,
    });
  }

  // Full shower — major win
  function shower() {
    const duration = 1600;
    const end = Date.now() + duration;
    const pc = isMobile() ? 2 : 4;

    (function frame() {
      confetti({ particleCount: pc, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: PARTY });
      confetti({ particleCount: pc, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: PARTY });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  // Fireworks — 2 bursts on mobile, 4 on desktop
  function fireworks() {
    function randomInRange(min, max) { return Math.random() * (max - min) + min; }
    const bursts = isMobile() ? 2 : 4;
    const pc = isMobile() ? 12 : 22;
    for (let i = 0; i < bursts; i++) {
      setTimeout(() => {
        confetti({ startVelocity: 24, spread: 360, ticks: 40, zIndex: 9999, particleCount: pc, origin: { x: randomInRange(0.1, 0.4), y: Math.random() * 0.4 }, colors: RAINBOW });
        confetti({ startVelocity: 24, spread: 360, ticks: 40, zIndex: 9999, particleCount: pc, origin: { x: randomInRange(0.6, 0.9), y: Math.random() * 0.4 }, colors: PARTY });
      }, i * 700);
    }
  }

  // Side cannons — significantly reduced on mobile
  function sideCannons() {
    const count = isMobile() ? 25 : 55;
    confetti({ particleCount: count, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: RAINBOW });
    confetti({ particleCount: count, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: RAINBOW });
  }

  // Emoji rain — on mobile just do a plain burst (shapeFromText is very expensive on Android)
  function emojiRain(emojis = ["🎉", "⭐", "🏆"]) {
    if (isMobile()) { burst(); return; }
    try {
      const shapes = emojis.slice(0, 2).map(e => confetti.shapeFromText({ text: e, scalar: 1.5 }));
      confetti({ particleCount: 16, spread: 90, origin: { y: 0.3 }, scalar: 1.5, shapes, ticks: 80 });
    } catch { burst(); }
  }

  return {
    spark,
    burst,
    shower,
    fireworks,
    sideCannons,
    emojiRain,
    // Alias used by several game pages
    fireConfetti: shower,
  };
}