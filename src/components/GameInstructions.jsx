import { useState } from "react";
import { X, HelpCircle } from "lucide-react";

export default function GameInstructions({ title, emoji, steps }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-secondary text-foreground px-3 rounded-xl font-bold flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] active:scale-95 transition-transform"
        aria-label="How to play"
      >
        <HelpCircle size={20} /> <span className="hidden sm:inline">Help</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setOpen(false)}>
          <div
            className="bg-card border-2 border-primary rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-4xl">{emoji}</span>
                <h2 className="text-2xl font-black text-primary">How to Play</h2>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-xl hover:bg-muted flex items-center justify-center min-w-[44px] min-h-[44px] active:scale-95 transition-transform" aria-label="Close">
                <X size={24} className="text-foreground" />
              </button>
            </div>
            <h3 className="text-xl font-black text-foreground mb-3">{title}</h3>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-lg font-black shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-lg text-foreground leading-snug pt-1">{step}</p>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setOpen(false)}
              className="w-full mt-6 bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl"
            >
              Got it! 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}