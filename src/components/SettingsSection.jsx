import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Collapsible settings section with emoji title and optional default-open state.
 */
export default function SettingsSection({ emoji, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <h2 className="text-xl font-black text-foreground">{title}</h2>
        </div>
        {open ? (
          <ChevronUp size={24} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={24} className="text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          {children}
        </div>
      )}
    </div>
  );
}