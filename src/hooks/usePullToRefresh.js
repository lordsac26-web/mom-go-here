import * as React from "react";

const THRESHOLD = 80;

export default function usePullToRefresh(onRefresh) {
  // Import useState/useRef directly from React module to bypass SDK dispatcher conflict
  const [pullDistance, setPullDistance] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const containerRef = React.useRef(null);
  const startYRef = React.useRef(0);
  const pullingRef = React.useRef(false);
  const pullDistRef = React.useRef(0);
  const refreshingRef = React.useRef(false);
  const onRefreshRef = React.useRef(onRefresh);

  onRefreshRef.current = onRefresh;

  React.useEffect(() => {
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
        refreshingRef.current = true;
        setRefreshing(true);
        setPullDistance(THRESHOLD);
        await onRefreshRef.current();
        refreshingRef.current = false;
        setRefreshing(false);
        setPullDistance(0);
      } else {
        setPullDistance(0);
      }
      pullingRef.current = false;
      pullDistRef.current = 0;
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return { containerRef, pullDistance, refreshing };
}