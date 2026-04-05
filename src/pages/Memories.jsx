import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus } from "lucide-react";
import JournalEntryForm from "../components/JournalEntryForm";
import JournalTimeline from "../components/JournalTimeline";

// FIX (security): basic sanity check on email before using it as a query filter.
// Rejects clearly malformed values from tampered auth tokens.
function isValidEmail(value) {
  return typeof value === "string" && value.length > 0 && value.includes("@");
}

export default function Memories() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // FIX (bug): wrap in useCallback so handleSaved can reference it without a stale closure,
  // and so the function identity is stable across renders.
  const loadEntries = useCallback(async (signal) => {
    // FIX (security): validate email before using it as a filter value
    if (!user || !isValidEmail(user.email)) {
      setLoading(false);
      return;
    }

    setError(null);
    // FIX (bug): try/catch so a failed fetch doesn't freeze the spinner forever
    try {
      const data = await base44.entities.JournalEntry.filter(
        { user_email: user.email },
        "-entry_date",
        100
      );
      // FIX (bug): if this fetch was superseded by a newer one, discard the result
      if (signal?.aborted) return;
      setEntries(data);
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Failed to load journal entries:", err);
      setError("Could not load your memories. Please try again.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    // FIX (bug): abort controller prevents a slow in-flight fetch from overwriting
    // results from a newer fetch if user changes (e.g. auth refresh / re-login)
    const controller = new AbortController();
    loadEntries(controller.signal);
    return () => controller.abort();
  }, [loadEntries]);

  // FIX (perf): instead of re-fetching all 100 entries on every save, optimistically
  // prepend the new entry so the UI updates instantly with no extra network round-trip.
  // Pass the saved entry back from JournalEntryForm via onSaved(newEntry).
  function handleSaved(newEntry) {
    setShowForm(false);
    if (newEntry) {
      // Prepend and keep the list sorted by entry_date descending
      setEntries(prev => [newEntry, ...prev]);
    } else {
      // Fallback: if the form doesn't return the new entry, do a full reload
      loadEntries();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // FIX (bug): surface fetch errors to the user instead of showing an empty timeline
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <p className="text-xl text-destructive font-bold">{error}</p>
        <button
          onClick={() => { setLoading(true); loadEntries(); }}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-lg"
        >
          Try Again
        </button>
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