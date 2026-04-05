import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

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

  if (loading) return (
    <div className="bg-card border-2 border-border rounded-2xl p-5 mb-6 text-center animate-pulse">
      <span className="text-3xl">🏛️</span>
      <p className="text-muted-foreground text-lg mt-2">Loading history facts...</p>
    </div>
  );

  return (
    <div className="space-y-4 mb-6">
      {todayFact && (
        <div className="bg-card border-2 border-border rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🏛️</span>
            <div>
              <h3 className="text-xl font-black text-primary">This Day in History</h3>
              {todayFact.year && <p className="text-muted-foreground text-base">{todayFact.year}</p>}
            </div>
          </div>
          <p className="text-xl text-foreground leading-relaxed">{todayFact.fact}</p>
        </div>
      )}
      {birthdayFact && (
        <div className="bg-card border-2 border-amber-500 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🎂</span>
            <div>
              <h3 className="text-xl font-black text-primary">On Your Birthday in History</h3>
              {birthdayFact.year && <p className="text-muted-foreground text-base">{birthdayFact.year}</p>}
            </div>
          </div>
          <p className="text-xl text-foreground leading-relaxed">{birthdayFact.fact}</p>
        </div>
      )}
    </div>
  );
}