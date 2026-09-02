import { RefreshCw } from "lucide-react";

export default function WidgetErrorState({ message = "Connection trouble — your progress is saved!", onRetry, emoji = "😕" }) {
  return (
    <div className="mb-4 rounded-2xl border-2 border-primary bg-card px-5 py-6 text-center shadow">
      <span className="mb-2 block text-4xl">{emoji}</span>
      <p className="mb-3 text-xl font-bold text-foreground">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary px-5 text-lg font-black text-primary-foreground">
          <RefreshCw size={20} /> Try Again
        </button>
      )}
    </div>
  );
}