import moment from "moment";
import { BookOpen, Sparkles } from "lucide-react";

export default function JournalTimeline({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl">📔</span>
        <p className="text-xl font-bold text-foreground mt-4">No memories yet</p>
        <p className="text-muted-foreground text-lg mt-1">Tap the button above to create your first memory!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg">
          {/* Photo */}
          {entry.photo_url && (
            <img
              src={entry.photo_url}
              alt="Memory"
              className="w-full max-h-72 object-cover"
              loading="lazy"
            />
          )}

          <div className="p-4">
            {/* Prompt */}
            {entry.prompt && (
              <div className="flex items-start gap-2 mb-2">
                <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
                <p className="text-base text-primary italic font-semibold leading-snug">"{entry.prompt}"</p>
              </div>
            )}

            {/* Memory text */}
            {entry.memory_text && (
              <p className="text-lg text-foreground leading-relaxed">{entry.memory_text}</p>
            )}

            {/* Date */}
            <p className="text-sm text-muted-foreground mt-3 font-bold">
              {moment(entry.entry_date).format("dddd, MMMM D, YYYY")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}