import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

const VARIATION_SUFFIXES = [
  "with slightly different composition and lighting",
  "with a different color palette and subtle changes",
  "with an alternative perspective and mood",
  "reimagined with creative new details",
];

export default function VariationsGrid({ sourceUrl, prompt, style, onSelectVariation }) {
  const [variations, setVariations] = useState([]);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (generating || !prompt.trim()) return;
    setGenerating(true);
    setVariations([]);

    try {
      const results = await Promise.all(
        VARIATION_SUFFIXES.map(suffix =>
          base44.integrations.Core.GenerateImage({
            prompt: `${prompt}, ${suffix}. Style: ${style}`,
            existing_image_urls: [sourceUrl],
          })
        )
      );
      setVariations(results.map(r => r.url));
      toast.success("4 variations ready!");
    } catch {
      toast.error("Some variations failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <button
        onClick={handleGenerate}
        disabled={generating || !prompt.trim()}
        className={`w-full flex items-center justify-center gap-2 text-lg font-bold py-4 rounded-xl transition-all ${
          generating || !prompt.trim()
            ? "bg-muted text-muted-foreground"
            : "bg-secondary text-foreground border-2 border-border active:scale-95"
        }`}
      >
        {generating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Creating 4 variations...
          </>
        ) : (
          <>
            <Copy size={20} />
            🎲 Create Variations
          </>
        )}
      </button>

      {variations.length > 0 && (
        <div className="mt-3">
          <p className="text-base font-bold text-foreground mb-2">Tap a variation to use it:</p>
          <div className="grid grid-cols-2 gap-2">
            {variations.map((url, i) => (
              <button
                key={i}
                onClick={() => onSelectVariation(url)}
                className="rounded-xl overflow-hidden border-2 border-border hover:border-primary active:scale-95 transition-all"
              >
                <img src={url} alt={`Variation ${i + 1}`} className="w-full aspect-square object-cover" />
                <div className="bg-secondary py-2 text-center">
                  <span className="text-sm font-bold text-foreground">Variation {i + 1}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}