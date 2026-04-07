export default function PullToRefreshIndicator({ pullDistance, refreshing }) {
  if (pullDistance <= 0 && !refreshing) return null;

  const ready = pullDistance >= 80;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all"
      style={{ height: `${pullDistance}px` }}
    >
      <div className={`transition-transform ${ready ? "scale-110" : "scale-100"}`}>
        {refreshing ? (
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className={`text-2xl transition-transform inline-block ${ready ? "rotate-180" : ""}`}>
            ⬇️
          </span>
        )}
      </div>
    </div>
  );
}