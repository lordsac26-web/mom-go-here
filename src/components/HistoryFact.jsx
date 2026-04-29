import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function HistoryFact({ birthday, location }) {
  const [todayFact, setTodayFact] = useState(null);
  const [birthdayFact, setBirthdayFact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacts();
  }, []);

  async function loadFacts() {
    const today = new Date();
    const monthDay = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const todayISO = today.toISOString().split("T")[0];
    const locationContext = location?.city ? ` in or near ${location.city}` : '';

    const [todayRes, bdayRes] = await Promise.allSettled([
      base44.integrations.Core.InvokeLLM({
        prompt: `Give me one fascinating "This Day in History" fact for ${monthDay}${locationContext}. Pick a random historical year — do NOT repeat the same event you may have given before. Today is ${todayISO}, nonce=${Math.random().toString(36).slice(2)}. Write 2 sentences, friendly and easy to read for an older adult.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            fact: { type: "string" },
            year: { type: "string" }
          }
        }
      }),
      birthday ? (() => {
        const [year, month, day] = birthday.split('-').map(Number);
        const bdayDate = new Date(year, month - 1, day);
        const bdayLabel = bdayDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });
        return base44.integrations.Core.InvokeLLM({
          prompt: `Give me one fascinating historical event that happened on ${bdayLabel} in any year in history. Pick a different event than you might have given before — surprise me! Today is ${todayISO}, nonce=${Math.random().toString(36).slice(2)}. Write 2 sentences, friendly and easy to read for an older adult.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              fact: { type: "string" },
              year: { type: "string" }
            }
          }
        });
      })() : Promise.reject()
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