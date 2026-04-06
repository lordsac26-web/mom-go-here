import { Edit2, Trash2 } from "lucide-react";

function getDaysUntilEvent(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const eventDate = new Date(year, month - 1, day);
  const today = new Date();
  const todayClean = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((eventDate - todayClean) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventList({ events, onEdit, onDelete }) {
  if (events.length === 0) return null;

  // Sort: upcoming first, then past
  const sorted = [...events].sort((a, b) => {
    const dA = getDaysUntilEvent(a.event_date);
    const dB = getDaysUntilEvent(b.event_date);
    // Future events first (ascending), past events after
    if (dA >= 0 && dB >= 0) return dA - dB;
    if (dA < 0 && dB < 0) return dB - dA;
    return dA >= 0 ? -1 : 1;
  });

  return (
    <div className="space-y-3">
      {sorted.map(ev => {
        const daysUntil = getDaysUntilEvent(ev.event_date);
        const isPast = daysUntil < 0;
        const isToday = daysUntil === 0;
        const isTomorrow = daysUntil === 1;

        let emoji = "📅";
        if (isToday) emoji = "🎉";
        else if (isTomorrow) emoji = "⏰";
        else if (daysUntil <= 7 && daysUntil > 0) emoji = "📌";
        else if (isPast) emoji = "✅";

        return (
          <div
            key={ev.id}
            className={`bg-card border rounded-2xl p-4 shadow flex items-center gap-3 ${
              isToday ? "border-primary border-2" : isPast ? "border-border opacity-60" : "border-border"
            }`}
          >
            <span className="text-3xl flex-shrink-0">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-foreground truncate">{ev.title}</p>
              <p className="text-sm text-muted-foreground">{formatDate(ev.event_date)}</p>
              {ev.description && (
                <p className="text-sm text-muted-foreground mt-1 truncate">{ev.description}</p>
              )}
              <p className={`text-sm font-bold mt-1 ${isToday ? "text-primary" : isPast ? "text-muted-foreground" : "text-foreground"}`}>
                {isToday ? "🎉 TODAY!" : isTomorrow ? "⏰ Tomorrow!" : isPast ? `${Math.abs(daysUntil)} days ago` : `${daysUntil} days away`}
              </p>
              <div className="flex gap-2 mt-1">
                {ev.notify_day_before && <span className="text-xs bg-secondary rounded px-2 py-0.5 text-muted-foreground">🔔 Day before</span>}
                {ev.notify_day_of && <span className="text-xs bg-secondary rounded px-2 py-0.5 text-muted-foreground">🔔 Day of</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => onEdit(ev)} className="p-2 rounded-lg bg-secondary hover:bg-muted">
                <Edit2 size={18} className="text-foreground" />
              </button>
              <button onClick={() => onDelete(ev.id)} className="p-2 rounded-lg bg-secondary hover:bg-destructive/20">
                <Trash2 size={18} className="text-destructive" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}