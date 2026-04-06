import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";

/**
 * Wraps a trigger button and shows a volume slider popover on hover/tap.
 * Props:
 *   - volume: 0–1
 *   - onVolumeChange: (val) => void
 *   - label: string (e.g. "SFX" or "Music")
 *   - emoji: string
 *   - children: the trigger button element
 *   - disabled: if true, no popover
 */
export default function VolumePopover({ volume, onVolumeChange, label, emoji, children, disabled }) {
  const [show, setShow] = useState(false);
  const containerRef = useRef(null);
  const hideTimerRef = useRef(null);

  function scheduleHide() {
    hideTimerRef.current = setTimeout(() => setShow(false), 400);
  }

  function cancelHide() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function handleEnter() {
    if (disabled) return;
    cancelHide();
    setShow(true);
  }

  function handleLeave() {
    scheduleHide();
  }

  // Close on outside tap (mobile)
  useEffect(() => {
    if (!show) return;
    function handleTouch(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShow(false);
      }
    }
    document.addEventListener("touchstart", handleTouch);
    return () => document.removeEventListener("touchstart", handleTouch);
  }, [show]);

  // Cleanup timer on unmount
  useEffect(() => () => cancelHide(), []);

  const pct = Math.round(volume * 100);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Trigger — tap also toggles popover on mobile */}
      <div onTouchStart={() => { if (!disabled) setShow(prev => !prev); }}>
        {children}
      </div>

      {show && (
        <div
          className="absolute right-0 top-full mt-2 z-50 bg-card border-2 border-border rounded-2xl p-3 shadow-2xl min-w-[180px]"
          onMouseEnter={cancelHide}
          onMouseLeave={handleLeave}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{emoji}</span>
            <span className="text-sm font-bold text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground ml-auto">{pct}%</span>
          </div>
          <Slider
            value={[volume * 100]}
            min={0}
            max={100}
            step={5}
            onValueChange={(vals) => onVolumeChange(vals[0] / 100)}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}