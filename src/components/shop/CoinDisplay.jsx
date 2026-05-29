export default function CoinDisplay({ coins, size = "md" }) {
  const sizes = {
    sm: "text-sm gap-1 px-2 py-0.5",
    md: "text-base gap-1.5 px-3 py-1",
    lg: "text-xl gap-2 px-4 py-2",
  };
  return (
    <span className={`inline-flex items-center font-black rounded-full bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 ${sizes[size]}`}>
      🪙 {coins?.toLocaleString() ?? "—"}
    </span>
  );
}