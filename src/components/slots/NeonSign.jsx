import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Animated neon sign for the slot machine header.
 * Flickers on load, then pulses continuously.
 */
export default function NeonSign({ text = "LUCKY SLOTS", spinning, winning = false }) {
  const signRef = useRef(null);
  const flickerDone = useRef(false);

  useEffect(() => {
    if (!signRef.current || flickerDone.current) return;
    flickerDone.current = true;

    const el = signRef.current;
    // Flicker on effect
    const tl = gsap.timeline();
    tl.set(el, { opacity: 0 });
    tl.to(el, { opacity: 1, duration: 0.05, delay: 0.2 });
    tl.to(el, { opacity: 0.2, duration: 0.05 });
    tl.to(el, { opacity: 1, duration: 0.05 });
    tl.to(el, { opacity: 0.3, duration: 0.08 });
    tl.to(el, { opacity: 1, duration: 0.05 });
    tl.to(el, { opacity: 0.6, duration: 0.05 });
    tl.to(el, { opacity: 1, duration: 0.1 });

    // Then gentle pulse
    tl.to(el, {
      textShadow: "0 0 20px rgba(234,179,8,0.9), 0 0 40px rgba(234,179,8,0.5), 0 0 80px rgba(234,179,8,0.3)",
      duration: 1.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }, []);

  // React to spin and win states
  useEffect(() => {
    if (!signRef.current) return;
    if (winning) {
      gsap.to(signRef.current, {
        color: "#fff",
        textShadow: "0 0 20px rgba(255,255,255,1), 0 0 50px rgba(255,220,0,0.9), 0 0 100px rgba(255,100,0,0.7)",
        duration: 0.2,
        yoyo: true,
        repeat: 6,
      });
    } else if (spinning) {
      gsap.to(signRef.current, {
        color: "#fde047",
        textShadow: "0 0 30px rgba(253,224,71,1), 0 0 60px rgba(253,224,71,0.7), 0 0 100px rgba(253,224,71,0.4)",
        duration: 0.3,
      });
    } else {
      gsap.to(signRef.current, {
        color: "#eab308",
        textShadow: "0 0 10px rgba(234,179,8,0.6), 0 0 30px rgba(234,179,8,0.3)",
        duration: 0.5,
      });
    }
  }, [spinning, winning]);

  return (
    <div
      ref={signRef}
      className="text-3xl sm:text-4xl font-black tracking-wider text-center select-none"
      style={{
        color: "#eab308",
        textShadow: "0 0 10px rgba(234,179,8,0.6), 0 0 30px rgba(234,179,8,0.3)",
        fontFamily: "'Nunito', sans-serif",
        opacity: 0,
      }}
    >
      🎰 {text} 🎰
    </div>
  );
}