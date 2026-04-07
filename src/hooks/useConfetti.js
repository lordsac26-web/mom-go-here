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

export default function useConfetti() {

  // Tiny burst — small celebration (word found, pair matched)
  function spark(origin = { x: 0.5, y: 0.5 }) {
    confetti({
      particleCount: 30,
      spread: 50,
      startVelocity: 20,
      decay: 0.95,
      scalar: 0.8,
      origin,
      colors: GOLD_COLORS,
      ticks: 80,
      gravity: 0.8,
    });
  }

  // Medium burst — milestone (halfway done, score threshold)
  function burst(origin = { x: 0.5, y: 0.4 }) {
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 30,
      decay: 0.92,
      scalar: 1,
      origin,
      colors: RAINBOW,
      ticks: 120,
    });
  }

  // Full shower — major win (game complete)
  function shower() {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: PARTY,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: PARTY,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  // Fireworks — ultimate achievement (perfect score, all words found)
  function fireworks() {
    const duration = 3000;
    const end = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    (function frame() {
      const timeLeft = end - Date.now();
      if (timeLeft <= 0) return;

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: RAINBOW,
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: PARTY,
      });

      requestAnimationFrame(frame);
    })();
  }

  // Side cannons — dramatic entrance from left and right
  function sideCannons() {
    const count = 100;
    const defaults = { origin: { y: 0.7 }, colors: RAINBOW };

    confetti({
      ...defaults,
      particleCount: count,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    });
    confetti({
      ...defaults,
      particleCount: count,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
    });
  }

  // Emoji rain — themed emoji confetti
  function emojiRain(emojis = ["🎉", "⭐", "🏆"]) {
    const shapes = emojis.map(e => confetti.shapeFromText({ text: e, scalar: 2 }));
    
    confetti({
      particleCount: 30,
      spread: 120,
      origin: { y: 0.3 },
      scalar: 2,
      shapes,
      ticks: 150,
    });
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