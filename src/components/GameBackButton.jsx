import { Link } from "react-router-dom";

export default function GameBackButton({ className = "" }) {
  return (
    <Link
      to="/games"
      className={`text-primary text-xl font-bold ${className}`}
    >
      ← Back
    </Link>
  );
}