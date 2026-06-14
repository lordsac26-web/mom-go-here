import { Link } from "react-router-dom";

export default function GameBackButton({ className = "" }) {
  return (
    <Link
      to="/games"
      className={`text-primary text-xl font-bold inline-flex items-center min-h-[44px] px-3 -ml-3 rounded-xl active:scale-95 transition-transform ${className}`}
    >
      ← Back
    </Link>
  );
}