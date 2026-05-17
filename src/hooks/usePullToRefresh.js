import { useRef, useEffect, useReducer } from "react";

const THRESHOLD = 80;

// useReducer instead of useState — uses the app's React import directly,
// avoiding the null-dispatcher crash from the SDK's bundled React chunk.
function reducer(state, action) {
  switch (action.type) {
    case "pull": return { ...state, pullDistance: action.d };
    case "start_refresh": return { pullDistance: THRESHOLD, refreshing: true };
    case "end_refresh": return { pullDistance: 0, refreshing: false };
    default: return state;
  }
}

export default function usePullToRefresh(onRefresh) {
  const [state, dispatch] = useReducer(reducer, { pullDistance: 0, refreshing: false });
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDistRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep callback ref fresh
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

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
        dispatch({ type: "pull", d });
      }
    }

    async function handleTouchEnd() {
      if (pullDistRef.current >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true;
        dispatch({ type: "start_refresh" });
        await onRefreshRef.current();
        refreshingRef.current = false;
        dispatch({ type: "end_refresh" });
      } else {
        pullingRef.current = false;
        pullDistRef.current = 0;
        dispatch({ type: "pull", d: 0 });
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

  return { containerRef, pullDistance: state.pullDistance, refreshing: state.refreshing };
}