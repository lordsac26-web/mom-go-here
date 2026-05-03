import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Check, Loader2 } from "lucide-react";

export default function PromptImprover({ currentPrompt, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  async function handleImprove() {
    if (!currentPrompt.trim() || loading) return;
    setLoading(true);
    setSuggestions([]);
    setSelected(null);

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
    setLoading(false);
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
          className="flex items-center gap-2 text-sm font-bold text-primary disabled:text-muted-foreground disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Thinking of improvements...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              ✨ Improve my prompt with AI
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-black text-foreground">✨ Pick an improved version:</p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handlePick(s)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all active:scale-[0.98] ${
                selected === s.prompt
                  ? "bg-primary/15 border-primary"
                  : "bg-secondary border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selected === s.prompt ? "bg-primary border-primary" : "border-muted-foreground"
                }`}>
                  {selected === s.prompt && <Check size={12} className="text-primary-foreground" />}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-primary uppercase">{s.label}</span>
                  <p className="text-sm text-foreground leading-snug mt-0.5">{s.prompt}</p>
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => { setSuggestions([]); setSelected(null); }}
            className="text-xs text-muted-foreground font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}