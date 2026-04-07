import { RefreshCw } from "lucide-react";

export default function WidgetErrorState({ message = "Something went wrong", onRetry, emoji = "😕" }) {
  return (
    <div className="bg-card border border-border rounded-2xl mb-4 shadow px-4 py-5 text-center">
      <span className="text-3xl block mb-1">{emoji}</span>
      <p className="text-base font-bold text-foreground mb-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-primary text-sm font-bold mt-1"
        >
          <RefreshCw size={14} /> Tap to retry
        </button>
      )}
    </div>
  );
}