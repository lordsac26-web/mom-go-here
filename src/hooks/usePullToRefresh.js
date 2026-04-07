import { useState, useRef, useCallback, useEffect } from "react";

const THRESHOLD = 80;

export default function usePullToRefresh(onRefresh) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDistRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep refs fresh without re-registering listeners
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);
  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleTouchStart(e) {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
        pullingRef.current = true;
      }
    }

    function handleTouchMove(e) {
      if (!pullingRef.current) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) {
        const d = Math.min(diff * 0.5, 120);
        pullDistRef.current = d;
        setPullDistance(d);
      }
    }

    async function handleTouchEnd() {
      if (pullDistRef.current >= THRESHOLD && !refreshingRef.current) {
        setRefreshing(true);
        refreshingRef.current = true;
        setPullDistance(THRESHOLD);
        await onRefreshRef.current();
        setRefreshing(false);
        refreshingRef.current = false;
      }
      pullingRef.current = false;
      pullDistRef.current = 0;
      setPullDistance(0);
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []); // register once — no stale closures thanks to refs

  return { containerRef, pullDistance, refreshing };
}