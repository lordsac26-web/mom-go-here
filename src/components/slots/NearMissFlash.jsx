import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Near-Miss Flash — shows briefly when 2 high-value symbols align on the middle row.
 * Gives the classic "so close!" casino feel without misleading the player.
 */
export default function NearMissFlash({ visible, symbol, onDone }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!visible || !ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, scale: 0.7, y: 10 },
      {
        opacity: 1, scale: 1, y: 0,
        duration: 0.3, ease: "back.out(2)",
        onComplete: () => {
          setTimeout(() => {
            gsap.to(ref.current, {
              opacity: 0, y: -10, duration: 0.3,
              onComplete: () => onDone?.(),
            });
          }, 900);
        }
      }
    );
  }, [visible]);

  if (!visible) return null;

  return (
    <div ref={ref} className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ opacity: 0 }}>
      <div className="bg-gray-900/90 border-2 border-orange-500/70 rounded-2xl px-5 py-3 text-center shadow-[0_0_30px_rgba(249,115,22,0.4)]">
        <div className="text-2xl mb-0.5">{symbol?.emoji ?? "🎰"}{symbol?.emoji ?? "🎰"}</div>
        <div className="text-orange-400 font-black text-sm tracking-wider">SO CLOSE! 🔥</div>
        <div className="text-gray-400 text-[10px] mt-0.5">One more {symbol?.name ?? "symbol"} would've won!</div>
      </div>
    </div>
  );
}