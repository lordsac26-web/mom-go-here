import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function PromptImprover({ currentPrompt, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  async function handleImprove() {
    if (!currentPrompt.trim() || loading) return;
    setLoading(true);
    setSuggestions([]);
    setSelected(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a user improve their AI image generation prompt. Their current prompt is:
"${currentPrompt.trim()}"

Generate exactly 3 improved versions of this prompt. Each should be more vivid, detailed, and descriptive — adding lighting, composition, mood, and visual details that will produce a better AI-generated image. Keep each under 200 characters. Keep the user's core idea intact, don't change the subject.

Return JSON with the improved prompts.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string", description: "A short 2-3 word label like 'Vivid & Warm' or 'Dramatic Mood'" },
                  prompt: { type: "string", description: "The improved prompt text" },
                },
              },
            },
          },
        },
      });
      setSuggestions(result.suggestions || []);
    } catch (err) {
      console.error("Prompt improvement failed:", err);
      toast.error("Couldn't improve prompt right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePick(suggestion) {
    setSelected(suggestion.prompt);
    onSelect(suggestion.prompt);
  }

  return (
    <div className="mt-3">
      {suggestions.length === 0 ? (
        <button
          onClick={handleImprove}
          disabled={loading || !currentPrompt.trim()}
          className="flex items-center gap-2 text-base font-bold text-primary bg-primary/10 px-4 py-2.5 rounded-xl border-2 border-primary/30 disabled:text-muted-foreground disabled:bg-muted disabled:border-border disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Thinking of improvements...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              ✨ Improve My Prompt
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-base font-black text-foreground">✨ Pick an improved version:</p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handlePick(s)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
                selected === s.prompt
                  ? "bg-primary/15 border-primary"
                  : "bg-secondary border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selected === s.prompt ? "bg-primary border-primary" : "border-muted-foreground"
                }`}>
                  {selected === s.prompt && <Check size={14} className="text-primary-foreground" />}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-black text-primary uppercase">{s.label}</span>
                  <p className="text-base text-foreground leading-snug mt-0.5">{s.prompt}</p>
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => { setSuggestions([]); setSelected(null); }}
            className="flex items-center gap-2 text-base text-muted-foreground font-bold bg-secondary px-4 py-2.5 rounded-xl border-2 border-border active:scale-95 transition-all"
          >
            <X size={16} /> Dismiss Suggestions
          </button>
        </div>
      )}
    </div>
  );
}