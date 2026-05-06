const SPEED_OPTIONS = [
  { label: "0.5x", value: 0.5, color: "bg-green-600" },
  { label: "1x", value: 1.0, color: "bg-primary" },
  { label: "1.5x", value: 1.5, color: "bg-orange-500" },
  { label: "2x", value: 2.0, color: "bg-red-500" },
];

export default function AimSpeedSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 w-full max-w-[400px]">
      <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">AIM SPD</span>
      <div className="flex gap-1.5 flex-1">
        {SPEED_OPTIONS.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                active
                  ? `${opt.color} text-white shadow-lg scale-105`
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}