import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import SubPageHeader from "../components/SubPageHeader";
import WarmLoader from "../components/WarmLoader";
import EventForm from "../components/EventForm";
import EventList from "../components/EventList";
import WidgetErrorState from "../components/WidgetErrorState";

const RELATIONSHIPS = ["Family", "Friend", "Neighbor", "Coworker", "Other"];

function getDaysUntilBirthday(birthdayStr) {
  const [year, month, day] = birthdayStr.split("-").map(Number);
  const today = new Date();
  const thisYear = today.getFullYear();
  let next = new Date(thisYear, month - 1, day);
  const todayClean = new Date(thisYear, today.getMonth(), today.getDate());
  if (next < todayClean) next = new Date(thisYear + 1, month - 1, day);
  return Math.round((next - todayClean) / (1000 * 60 * 60 * 24));
}

function formatBirthday(birthdayStr) {
  const [year, month, day] = birthdayStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function ContactForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [birthday, setBirthday] = useState(initial?.birthday || "");
  const [anniversary, setAnniversary] = useState(initial?.anniversary || "");
  const [relationship, setRelationship] = useState(initial?.relationship || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !birthday) return;
    setSaving(true);
    await onSave({ name: name.trim(), birthday, anniversary: anniversary || undefined, relationship, notes: notes.trim() });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border-2 border-primary rounded-2xl p-5 shadow-xl space-y-4">
      <h3 className="text-xl font-black text-primary">{initial ? "✏️ Edit Contact" : "➕ New Contact"}</h3>
      <div>
        <label className="block text-base font-bold text-foreground mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Aunt Susan"
          maxLength={100}
          className="w-full bg-secondary border-2 border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-base font-bold text-foreground mb-1">Birthday *</label>
        <input
          type="date"
          value={birthday}
          onChange={e => setBirthday(e.target.value)}
          className="w-full bg-secondary border-2 border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-base font-bold text-foreground mb-1">💍 Anniversary</label>
        <input
          type="date"
          value={anniversary}
          onChange={e => setAnniversary(e.target.value)}
          className="w-full bg-secondary border-2 border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-base font-bold text-foreground mb-1">Relationship</label>
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIPS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRelationship(relationship === r ? "" : r)}
              className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-all ${
                relationship === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-base font-bold text-foreground mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Likes gardening, favorite color is blue..."
          rows={2}
          maxLength={500}
          className="w-full bg-secondary border-2 border-border rounded-xl px-4 py-3 text-base text-foreground focus:outline-none focus:border-primary resize-none"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!name.trim() || !birthday || saving}
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

export default function Contacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [tab, setTab] = useState("contacts");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    if (user) {
      loadContacts();
      loadEvents();
    }
  }, [user]);

  async function loadContacts() {
    setError(false);
    try {
      const list = await base44.entities.Contact.filter({ user_email: user.email });
      list.sort((a, b) => {
        if (!a.birthday) return 1;
        if (!b.birthday) return -1;
        return getDaysUntilBirthday(a.birthday) - getDaysUntilBirthday(b.birthday);
      });
      setContacts(list);
    } catch (loadError) {
      console.error("Could not load contacts:", loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(data) {
    if (editingContact) {
      await base44.entities.Contact.update(editingContact.id, data);
    } else {
      await base44.entities.Contact.create({ user_email: user.email, ...data });
    }
    setShowForm(false);
    setEditingContact(null);
    loadContacts();
  }

  async function handleDelete(id) {
    await base44.entities.Contact.delete(id);
    loadContacts();
  }

  function startEdit(contact) {
    setEditingContact(contact);
    setShowForm(true);
  }

  async function loadEvents() {
    try {
      const list = await base44.entities.PersonalEvent.filter({ user_email: user.email });
      setEvents(list);
    } catch (loadError) {
      console.error("Could not load events:", loadError);
      setError(true);
    }
  }

  async function handleEventSave(data) {
    const isEdit = !!editingEvent;
    // Optimistic update for new events
    if (!isEdit) {
      const optimistic = { id: `temp-${Date.now()}`, user_email: user.email, ...data, notified_day_before: false, notified_day_of: false };
      setEvents(prev => [optimistic, ...prev]);
    }
    setShowEventForm(false);
    setEditingEvent(null);
    if (isEdit) {
      await base44.entities.PersonalEvent.update(editingEvent.id, { ...data, notified_day_before: false, notified_day_of: false });
    } else {
      await base44.entities.PersonalEvent.create({ user_email: user.email, ...data, notified_day_before: false, notified_day_of: false });
    }
    loadEvents();
  }

  async function handleEventDelete(id) {
    await base44.entities.PersonalEvent.delete(id);
    loadEvents();
  }

  function startEditEvent(ev) {
    setEditingEvent(ev);
    setShowEventForm(true);
  }

  if (loading) return <WarmLoader message="Loading your contacts..." />;
  if (error) return <div className="min-h-screen px-4 py-12"><WidgetErrorState onRetry={() => { setLoading(true); loadContacts(); loadEvents(); }} emoji="👥" /></div>;

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <SubPageHeader backTo="/" title="Contacts & Events" emoji="👥" />

      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-primary">👥 Contacts & Events</h1>
          <p className="text-muted-foreground text-lg mt-1">Birthdays, anniversaries & personal events</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("contacts")}
            className={`flex-1 py-3 rounded-2xl text-lg font-black text-center transition-all ${
              tab === "contacts" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            👥 Contacts
          </button>
          <button
            onClick={() => setTab("events")}
            className={`flex-1 py-3 rounded-2xl text-lg font-black text-center transition-all ${
              tab === "events" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            📅 Events
          </button>
        </div>

        {tab === "contacts" && (
          <>
            {/* Add button */}
            {!showForm && (
              <button
                onClick={() => { setEditingContact(null); setShowForm(true); }}
                className="w-full bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl mb-6 flex items-center justify-center gap-2 shadow-xl"
              >
                <Plus size={24} /> Add Contact
              </button>
            )}

            {/* Form */}
            {showForm && (
              <div className="mb-6">
                <ContactForm
                  initial={editingContact}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditingContact(null); }}
                />
              </div>
            )}

            {/* Contact List */}
            {contacts.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <span className="text-6xl block mb-4">🎂</span>
                <p className="text-xl font-bold text-foreground mb-2">No contacts yet!</p>
                <p className="text-muted-foreground text-lg">Add friends and family to get birthday reminders on your home screen.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map(c => {
                  const daysUntil = getDaysUntilBirthday(c.birthday);
                  return (
                    <div key={c.id} className="bg-card border border-border rounded-2xl p-4 shadow flex items-center gap-3">
                      <span className="text-3xl flex-shrink-0">
                        {daysUntil === 0 ? "🎉" : daysUntil <= 7 ? "🎂" : "👤"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-foreground truncate">{c.name}</p>
                        <p className="text-sm text-muted-foreground">
                          🎂 {formatBirthday(c.birthday)}
                          {c.relationship ? ` · ${c.relationship}` : ""}
                        </p>
                        {c.anniversary && (
                          <p className="text-sm text-muted-foreground">
                            💍 Anniversary: {formatBirthday(c.anniversary)}
                          </p>
                        )}
                        <p className="text-sm font-bold text-primary">
                          {daysUntil === 0 ? "🎉 Birthday TODAY!" : daysUntil === 1 ? "Tomorrow!" : `${daysUntil} days away`}
                        </p>
                        {c.notes && <p className="text-sm text-muted-foreground mt-1 truncate">{c.notes}</p>}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => startEdit(c)} className="p-2 rounded-lg bg-secondary hover:bg-muted">
                          <Edit2 size={18} className="text-foreground" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg bg-secondary hover:bg-destructive/20">
                          <Trash2 size={18} className="text-destructive" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "events" && (
          <>
            {!showEventForm && (
              <button
                onClick={() => { setEditingEvent(null); setShowEventForm(true); }}
                className="w-full bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl mb-6 flex items-center justify-center gap-2 shadow-xl"
              >
                <Plus size={24} /> Add Event
              </button>
            )}

            {showEventForm && (
              <div className="mb-6">
                <EventForm
                  initial={editingEvent}
                  onSave={handleEventSave}
                  onCancel={() => { setShowEventForm(false); setEditingEvent(null); }}
                />
              </div>
            )}

            {events.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <span className="text-6xl block mb-4">📅</span>
                <p className="text-xl font-bold text-foreground mb-2">No events yet!</p>
                <p className="text-muted-foreground text-lg">Add personal events like socials, appointments, and get email reminders!</p>
              </div>
            ) : (
              <EventList events={events} onEdit={startEditEvent} onDelete={handleEventDelete} />
            )}
          </>
        )}
      </div>
    </div>
  );
}