import { useState } from "react";
import { Check } from "lucide-react";

export default function EventForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [eventDate, setEventDate] = useState(initial?.event_date || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [notifyBefore, setNotifyBefore] = useState(initial?.notify_day_before ?? true);
  const [notifyOf, setNotifyOf] = useState(initial?.notify_day_of ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      event_date: eventDate,
      description: description.trim(),
      notify_day_before: notifyBefore,
      notify_day_of: notifyOf,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border-2 border-primary rounded-2xl p-5 shadow-xl space-y-4">
      <h3 className="text-xl font-black text-primary">{initial ? "✏️ Edit Event" : "📅 New Event"}</h3>
      <div>
        <label className="block text-base font-bold text-foreground mb-1">Event Name *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Nickel Social, Doctor Appointment"
          maxLength={150}
          className="w-full bg-secondary border-2 border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-base font-bold text-foreground mb-1">Date *</label>
        <input
          type="date"
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
          className="w-full bg-secondary border-2 border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-base font-bold text-foreground mb-1">Details</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Location, time, what to bring..."
          rows={2}
          maxLength={500}
          className="w-full bg-secondary border-2 border-border rounded-xl px-4 py-3 text-base text-foreground focus:outline-none focus:border-primary resize-none"
        />
      </div>
      <div>
        <label className="block text-base font-bold text-foreground mb-2">🔔 Reminders</label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyBefore}
              onChange={e => setNotifyBefore(e.target.checked)}
              className="w-6 h-6 rounded accent-primary"
            />
            <span className="text-lg text-foreground font-bold">1 day before</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOf}
              onChange={e => setNotifyOf(e.target.checked)}
              className="w-6 h-6 rounded accent-primary"
            />
            <span className="text-lg text-foreground font-bold">Day of event</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!title.trim() || !eventDate || saving}
          className="flex-1 bg-primary text-primary-foreground text-lg font-black py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Check size={20} /> {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-secondary text-foreground text-lg font-bold py-3 px-5 rounded-xl"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}