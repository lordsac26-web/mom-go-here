import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

/**
 * A wrapper component that applies a GSAP magnetic follow effect.
 * Cards subtly tilt and shift toward the cursor/touch with spring physics.
 */
export default function MagneticCard({
  children,
  className = "",
  style = {},
  strength = 0.3,
  rotationStrength = 0.15,
  hoverScale = 1.04,
  onClick,
}) {
  const cardRef = useRef(null);
  const bounds = useRef(null);
  const hovering = useRef(false);

  const move = useCallback((cx, cy) => {
    const el = cardRef.current;
    if (!el || !bounds.current) return;
    const { left, top, width, height } = bounds.current;
    const midX = left + width / 2;
    const midY = top + height / 2;
    const dx = (cx - midX) / (width / 2);
    const dy = (cy - midY) / (height / 2);

    gsap.to(el, {
      x: dx * width * strength * 0.12,
      y: dy * height * strength * 0.12,
      rotateY: dx * 10 * rotationStrength,
      rotateX: -dy * 10 * rotationStrength,
      scale: hoverScale,
      boxShadow: `${dx * 8}px ${dy * 8}px 24px rgba(0,0,0,0.35)`,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [strength, rotationStrength, hoverScale]);

  const reset = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    hovering.current = false;
    gsap.to(el, {
      x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 1,
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      duration: 0.6,
      ease: "elastic.out(1, 0.35)",
      overwrite: "auto",
    });
  }, []);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    gsap.set(el, { transformPerspective: 800, transformOrigin: "center center" });

    const enter = () => { hovering.current = true; bounds.current = el.getBoundingClientRect(); };
    const mouseMove = (e) => { if (hovering.current) move(e.clientX, e.clientY); };
    const leave = () => reset();
    const touchStart = (e) => { enter(); move(e.touches[0].clientX, e.touches[0].clientY); };
    const touchMove = (e) => { if (hovering.current) move(e.touches[0].clientX, e.touches[0].clientY); };
    const touchEnd = () => reset();

    el.addEventListener("mouseenter", enter);
    el.addEventListener("mousemove", mouseMove);
    el.addEventListener("mouseleave", leave);
    el.addEventListener("touchstart", touchStart, { passive: true });
    el.addEventListener("touchmove", touchMove, { passive: true });
    el.addEventListener("touchend", touchEnd);

    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mousemove", mouseMove);
      el.removeEventListener("mouseleave", leave);
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchmove", touchMove);
      el.removeEventListener("touchend", touchEnd);
    };
  }, [move, reset]);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ willChange: "transform", ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}