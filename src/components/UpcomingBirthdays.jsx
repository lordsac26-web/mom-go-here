import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Gift, Heart, ChevronRight, CalendarDays } from "lucide-react";

function getDaysUntilBirthday(birthdayStr) {
  const [year, month, day] = birthdayStr.split("-").map(Number);
  const today = new Date();
  const thisYear = today.getFullYear();
  
  // Create birthday this year (local time, no UTC shift)
  let next = new Date(thisYear, month - 1, day);
  // Strip time from today for clean comparison
  const todayClean = new Date(thisYear, today.getMonth(), today.getDate());
  
  if (next < todayClean) {
    next = new Date(thisYear + 1, month - 1, day);
  }
  
  const diff = Math.round((next - todayClean) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatBirthday(birthdayStr) {
  const [year, month, day] = birthdayStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function UpcomingBirthdays({ userEmail }) {
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    loadContacts();
  }, [userEmail]);

  async function loadContacts() {
    const [contacts, personalEvents] = await Promise.all([
      base44.entities.Contact.filter({ user_email: userEmail }),
      base44.entities.PersonalEvent.filter({ user_email: userEmail }),
    ]);

    const events = [];

    contacts.forEach(c => {
      if (c.birthday) {
        events.push({
          ...c,
          eventType: "birthday",
          eventDate: c.birthday,
          daysUntil: getDaysUntilBirthday(c.birthday),
        });
      }
      if (c.anniversary) {
        events.push({
          ...c,
          eventType: "anniversary",
          eventDate: c.anniversary,
          daysUntil: getDaysUntilBirthday(c.anniversary),
        });
      }
    });

    // Add personal events (all upcoming)
    personalEvents.forEach(pe => {
      const days = getDaysUntilBirthday(pe.event_date);
      if (days >= 0) {
        events.push({
          id: pe.id,
          name: pe.title,
          eventType: "personal",
          eventDate: pe.event_date,
          daysUntil: days,
          description: pe.description,
        });
      }
    });

    const sorted = events.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
    setUpcoming(sorted);
    setLoading(false);
  }

  if (loading) return null;
  if (upcoming.length === 0) return (
    <Link
      to="/contacts"
      className="block bg-card border border-border rounded-2xl px-4 py-4 mb-4 shadow text-center"
    >
      <p className="text-lg font-bold text-foreground mb-1">🎂 Upcoming Reminders</p>
      <p className="text-muted-foreground text-base">Add friends & family to get birthday & anniversary reminders!</p>
      <span className="text-primary font-bold text-base mt-2 inline-block">+ Add Contacts →</span>
    </Link>
  );

  return (
    <div className="bg-card border border-border rounded-2xl mb-4 shadow overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className="text-primary" />
          <span className="text-lg font-bold text-foreground">Upcoming Events</span>
        </div>
        <Link to="/contacts" className="text-primary text-sm font-bold flex items-center gap-1">
          View All <ChevronRight size={16} />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {upcoming.map((c, i) => (
          <div key={`${c.id}-${c.eventType}-${i}`} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {c.eventType === "personal"
                  ? (c.daysUntil === 0 ? "🎉" : c.daysUntil <= 3 ? "📌" : "📅")
                  : c.eventType === "anniversary"
                  ? (c.daysUntil === 0 ? "💕" : c.daysUntil <= 7 ? "💍" : "💑")
                  : (c.daysUntil === 0 ? "🎉" : c.daysUntil <= 7 ? "🎂" : "🎈")}
              </span>
              <div>
                <p className="text-base font-bold text-foreground">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  {c.eventType === "personal" ? "Event" : c.eventType === "anniversary" ? "Anniversary" : "Birthday"} · {formatBirthday(c.eventDate)}{c.relationship ? ` · ${c.relationship}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              {c.daysUntil === 0 ? (
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-black">TODAY!</span>
              ) : (
                <span className="text-base font-bold text-muted-foreground">
                  {c.daysUntil === 1 ? "Tomorrow" : `${c.daysUntil} days`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}