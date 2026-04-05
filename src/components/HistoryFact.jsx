import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function HistoryFact({ birthday }) {
  const [todayFact, setTodayFact] = useState(null);
  const [birthdayFact, setBirthdayFact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacts();
  }, []);

  async function loadFacts() {
    const today = new Date();
    const monthDay = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

    const [todayRes, bdayRes] = await Promise.allSettled([
      base44.integrations.Core.InvokeLLM({
        prompt: `Give me one fascinating "This Day in History" fact for ${monthDay}. Pick a random historical year. Write 2 sentences, friendly and easy to read for an older adult.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            fact: { type: "string" },
            year: { type: "string" }
          }
        }
      }),
      birthday ? base44.integrations.Core.InvokeLLM({
        prompt: `Give me one fascinating historical event that happened on ${new Date(birthday).toLocaleDateString("en-US", { month: "long", day: "numeric" })} in any year in history. Write 2 sentences, friendly and easy to read for an older adult.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            fact: { type: "string" },
            year: { type: "string" }
          }
        }
      }) : Promise.reject()
    ]);

    if (todayRes.status === "fulfilled") setTodayFact(todayRes.value);
    if (bdayRes.status === "fulfilled") setBirthdayFact(bdayRes.value);
    setLoading(false);
  }

  const [expanded, setExpanded] = useState(false);

  if (loading) return (
    <div className="bg-card border border-border rounded-2xl px-4 py-3 mb-4 text-center animate-pulse">
      <p className="text-muted-foreground text-sm">🏛️ Loading history facts...</p>
    </div>
  );

  if (!todayFact && !birthdayFact) return null;

  return (
    <div className="bg-card border border-border rounded-2xl mb-4 shadow overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="text-base font-bold text-foreground">
          🏛️ This Day in History{todayFact?.year ? ` (${todayFact.year})` : ""}
        </span>
        {expanded ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {todayFact && (
            <p className="text-base text-foreground leading-snug">{todayFact.fact}</p>
          )}
          {birthdayFact && (
            <div className="border-t border-border pt-3">
              <p className="text-sm font-bold text-primary mb-1">🎂 On Your Birthday ({birthdayFact.year})</p>
              <p className="text-base text-foreground leading-snug">{birthdayFact.fact}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}