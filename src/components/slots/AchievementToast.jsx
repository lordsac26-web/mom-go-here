import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * GSAP-animated toast that slides in when a new badge is earned.
 */
export default function AchievementToast({ badge }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!badge || !ref.current) return;
    const el = ref.current;

    gsap.fromTo(el,
      { y: -80, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }
    );
    // Glow pulse
    gsap.to(el, {
      boxShadow: "0 0 30px rgba(234,179,8,0.6), 0 0 60px rgba(234,179,8,0.3)",
      duration: 0.6,
      yoyo: true,
      repeat: 3,
      ease: "sine.inOut",
      delay: 0.3,
    });
    // Exit
    gsap.to(el, {
      y: -80, opacity: 0, scale: 0.8,
      duration: 0.4, ease: "power2.in", delay: 2.2,
    });
  }, [badge]);

  if (!badge) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[60] flex justify-center pointer-events-none px-4">
      <div
        ref={ref}
        className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 text-gray-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-yellow-300"
        style={{ opacity: 0 }}
      >
        <span className="text-4xl">{badge.emoji}</span>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider opacity-70">Achievement Unlocked!</div>
          <div className="text-lg font-black leading-tight">{badge.title}</div>
        </div>
      </div>
    </div>
  );
}