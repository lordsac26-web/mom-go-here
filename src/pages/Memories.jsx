import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus } from "lucide-react";
import JournalEntryForm from "../components/JournalEntryForm";
import JournalTimeline from "../components/JournalTimeline";

export default function Memories() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadEntries() {
    if (!user) return;
    const data = await base44.entities.JournalEntry.filter(
      { user_email: user.email },
      "-entry_date",
      100
    );
    setEntries(data);
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
  }, [user]);

  function handleSaved() {
    setShowForm(false);
    loadEntries();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black text-primary">📔 My Memories</h1>
        <p className="text-muted-foreground text-xl mt-1">Your daily photo journal</p>
      </div>

      {/* New entry button / form */}
      {showForm ? (
        <div className="mb-6">
          <JournalEntryForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-primary text-primary-foreground text-2xl font-black py-5 rounded-2xl shadow-xl mb-6 flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <Plus size={28} /> New Memory
        </button>
      )}

      {/* Timeline */}
      <JournalTimeline entries={entries} />
    </div>
  );
}