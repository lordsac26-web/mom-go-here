import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Reusable header with back button for sub-pages.
 * Props:
 *   - backTo: path to navigate back to (default "/")
 *   - title: page title string
 *   - emoji: optional emoji before title
 *   - icon: optional lucide icon component
 *   - rightSlot: optional JSX for right side of header
 */
export default function SubPageHeader({ backTo = "/", title, emoji, icon: Icon, rightSlot }) {
  return (
    <div className="flex items-center justify-between px-4 pt-6 pb-4">
      <div className="flex items-center gap-3">
        <Link
          to={backTo}
          className="bg-secondary flex items-center justify-center rounded-xl min-w-[44px] min-h-[44px] w-11 h-11 active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </Link>
        <div className="flex items-center gap-2">
          {emoji && <span className="text-2xl">{emoji}</span>}
          {Icon && <Icon size={28} className="text-primary" />}
          <h1 className="text-2xl sm:text-3xl font-black text-primary">{title}</h1>
        </div>
      </div>
      {rightSlot && <div>{rightSlot}</div>}
    </div>
  );
}