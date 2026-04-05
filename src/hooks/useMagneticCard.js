import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

/**
 * GSAP Magnetic Card Effect — cards subtly follow cursor/touch movement
 * with smooth spring physics. Supports both mouse and touch.
 *
 * @param {Object} options
 * @param {number} options.strength - Movement strength multiplier (default 0.3)
 * @param {number} options.rotationStrength - Rotation intensity (default 0.15)
 * @param {number} options.scale - Scale on hover (default 1.05)
 * @param {number} options.duration - Return-to-rest duration (default 0.6)
 * @returns {{ cardRef: React.RefObject }}
 */
export default function useMagneticCard({
  strength = 0.3,
  rotationStrength = 0.15,
  scale = 1.05,
  duration = 0.6,
} = {}) {
  const cardRef = useRef(null);
  const bounds = useRef(null);
  const isHovering = useRef(false);

  const handleMove = useCallback((clientX, clientY) => {
    const el = cardRef.current;
    if (!el || !bounds.current) return;

    const { left, top, width, height } = bounds.current;
    const cx = left + width / 2;
    const cy = top + height / 2;

    // Normalized offset from center (-1 to 1)
    const dx = (clientX - cx) / (width / 2);
    const dy = (clientY - cy) / (height / 2);

    gsap.to(el, {
      x: dx * width * strength * 0.15,
      y: dy * height * strength * 0.15,
      rotateY: dx * 12 * rotationStrength,
      rotateX: -dy * 12 * rotationStrength,
      scale,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [strength, rotationStrength, scale]);

  const handleReset = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    isHovering.current = false;

    gsap.to(el, {
      x: 0,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration,
      ease: "elastic.out(1, 0.4)",
      overwrite: "auto",
    });
  }, [duration]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Set transform origin and perspective on parent
    gsap.set(el, { transformPerspective: 800, transformOrigin: "center center" });

    const onMouseEnter = () => {
      isHovering.current = true;
      bounds.current = el.getBoundingClientRect();
    };

    const onMouseMove = (e) => {
      if (!isHovering.current) return;
      handleMove(e.clientX, e.clientY);
    };

    const onMouseLeave = () => handleReset();

    // Touch support
    const onTouchStart = (e) => {
      isHovering.current = true;
      bounds.current = el.getBoundingClientRect();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e) => {
      if (!isHovering.current) return;
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = () => handleReset();

    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleMove, handleReset]);

  return { cardRef };
}