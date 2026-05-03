import { useState } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import GameBackButton from "../../components/GameBackButton";
import { base44 } from "@/api/base44Client";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useDailyMissions } from "../../hooks/useDailyMissions";
import { Download, Share2, Mail, Facebook, Twitter, Globe } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import GameInstructions from "../../components/GameInstructions";
import PromptImprover from "../../components/artstudio/PromptImprover";
import ReferenceImageUploader from "../../components/artstudio/ReferenceImageUploader";
import VariationsGrid from "../../components/artstudio/VariationsGrid";
import PromptStarters from "../../components/artstudio/PromptStarters";
import GeneratingMessages from "../../components/artstudio/GeneratingMessages";

const STYLES = [
  { label: "Realistic Photo", value: "photorealistic, high detail, professional photography" },
  { label: "Oil Painting", value: "oil painting style, rich colors, brushstrokes visible, classical art" },
  { label: "Watercolor", value: "watercolor illustration, soft edges, pastel tones, artistic" },
  { label: "Cartoon", value: "cartoon illustration, bright colors, fun, playful style" },
  { label: "Pixel Art", value: "pixel art style, retro 8-bit game aesthetic" },
  { label: "Pencil Sketch", value: "detailed pencil sketch, black and white, hand-drawn" },
  { label: "Fantasy Art", value: "fantasy art style, magical, ethereal, detailed digital art" },
  { label: "Pop Art", value: "pop art style, bold colors, comic book aesthetic, Andy Warhol inspired" },
];

const MAX_PROMPT_LENGTH = 500;

function sanitizePrompt(str) {
  return str.replace(/[\x00-\x1F\x7F]/g, " ").trim();
}

export default function AIArtStudio() {
  useGameTimer();
  const { tapVibrate, successVibrate } = useHaptics();
  const { uiClickSound, matchSound } = useGameAudio();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].value);
  const [imageUrl, setImageUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [referenceUrl, setReferenceUrl] = useState(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const { reportMissionProgress } = useDailyMissions();

  async function handleGenerate() {
    if (!prompt.trim()) return;
    tapVibrate();
    uiClickSound();

    const safePrompt = sanitizePrompt(prompt.trim()).slice(0, MAX_PROMPT_LENGTH);
    const fullPrompt = `${safePrompt}. Style: ${selectedStyle}`;

    setGenerating(true);
    try {
      const genParams = { prompt: fullPrompt };
      if (referenceUrl) {
        genParams.existing_image_urls = [referenceUrl];
      }
      const result = await base44.integrations.Core.GenerateImage(genParams);
      successVibrate();
      matchSound();
      setImageUrl(result.url);
      setHistory(prev =>
        [
          {
            prompt: safePrompt,
            style: STYLES.find(s => s.value === selectedStyle)?.label,
            url: result.url,
          },
          ...prev,
        ].slice(0, 10)
      );
    } catch (err) {
      console.error("Image generation failed:", err);
      toast.error("Image generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-art-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      uiClickSound();
      toast.success("Image downloaded!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Could not download image. Try right-clicking and saving instead.");
    }
  }

  async function handlePublishToGallery() {
    if (!imageUrl || publishing) return;
    setPublishing(true);
    try {
      const user = await base44.auth.me();
      let displayName = "Anonymous";
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]?.display_name) displayName = profiles[0].display_name;
      else if (user.full_name) displayName = user.full_name;

      await base44.entities.GalleryPost.create({
        user_email: user.email,
        artist_name: displayName,
        image_url: imageUrl,
        prompt: "",
        style: STYLES.find(s => s.value === selectedStyle)?.label || "",
        likes: [],
        like_count: 0,
        comments: [],
        comment_count: 0,
      });
      reportMissionProgress("gallery_post");
      matchSound();
      toast.success("Published to Gallery! 🎉");
    } catch (err) {
      console.error("Publish failed:", err);
      toast.error("Failed to publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My AI Art",
          text: `Check out this AI art I made: "${prompt}"`,
          url: imageUrl,
        });
      } catch (e) {
        if (e.name !== "AbortError") {
          navigator.clipboard.writeText(imageUrl);
          toast.success("Link copied to clipboard!");
        }
      }
    } else {
      navigator.clipboard.writeText(imageUrl);
      toast.success("Link copied to clipboard!");
    }
  }

  function handleNewImage() {
    if (!confirmNew) {
      setConfirmNew(true);
      return;
    }
    setPrompt("");
    setImageUrl(null);
    setReferenceUrl(null);
    setConfirmNew(false);
  }

  return (
    <div className="min-h-screen px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <GameBackButton />
        <div className="text-2xl font-black text-primary">🎨 AI Art Studio</div>
        <GameInstructions
          title="AI Art Studio"
          emoji="🎨"
          steps={[
            "Type a description of what you'd like to see — or tap an idea below for inspiration!",
            "Choose an art style — Realistic, Watercolor, Cartoon, and more.",
            "Optionally upload a photo to remix it in your chosen style.",
            "Tap 'Generate Image' and wait a few seconds for AI to create your artwork.",
            "Download your image, publish it to the Gallery, or share it!",
            "Tap 'Create Variations' to get 4 different versions of your artwork.",
            "Tap 'New Image' to start fresh with a new creation."
          ]}
        />
      </div>

      <div className="max-w-lg mx-auto">
        {/* Prompt Input */}
        <div className="bg-card border-2 border-border rounded-2xl p-5 mb-4 shadow-xl">
          <label className="block text-xl font-black text-foreground mb-2">✏️ Describe what you'd like to see</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
            placeholder="e.g. A golden retriever wearing a top hat, sitting in a field of sunflowers..."
            rows={3}
            className="w-full bg-secondary border-2 border-border rounded-xl px-4 py-3 text-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <div className="flex-1" />
            <p className="text-base text-muted-foreground font-bold">
              {prompt.length}/{MAX_PROMPT_LENGTH}
            </p>
          </div>

          {/* Prompt Starters — only show when prompt is empty */}
          {!prompt.trim() && <PromptStarters onSelect={setPrompt} />}

          {/* Prompt Improver — only show when prompt has text */}
          {prompt.trim() && <PromptImprover currentPrompt={prompt} onSelect={setPrompt} />}

          {/* Reference Image Upload */}
          <div className="mt-3 pt-3 border-t border-border">
            <label className="block text-base font-black text-foreground mb-2">📷 Remix from a photo <span className="text-muted-foreground font-bold text-sm">(optional)</span></label>
            <ReferenceImageUploader referenceUrl={referenceUrl} onUrlChange={setReferenceUrl} />
          </div>
        </div>

        {/* Style Picker */}
        <div className="bg-card border-2 border-border rounded-2xl p-5 mb-4 shadow-xl">
          <label className="block text-xl font-black text-foreground mb-3">🎭 Choose a style</label>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => { tapVibrate(); uiClickSound(); setSelectedStyle(s.value); }}
                className={`px-4 py-3 rounded-xl text-lg font-bold border-2 transition-all ${
                  selectedStyle === s.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-foreground border-border hover:border-primary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        {!generating && (
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className={`w-full text-2xl font-black py-5 rounded-2xl shadow-xl mb-5 transition-all ${
              !prompt.trim()
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground active:scale-95"
            }`}
          >
            🪄 Generate Image
          </button>
        )}

        {/* Generating Progress */}
        {generating && (
          <div className="bg-card border-2 border-primary rounded-2xl mb-5 shadow-xl">
            <GeneratingMessages />
          </div>
        )}

        {/* Generated Image with reveal animation */}
        <AnimatePresence>
          {imageUrl && !generating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-card border-2 border-primary rounded-2xl p-4 mb-5 shadow-2xl"
            >
              <img
                src={imageUrl}
                alt={prompt}
                className="w-full rounded-xl border-2 border-border"
              />
              <p className="text-center text-muted-foreground text-base mt-3 italic">"{prompt}"</p>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-1.5 bg-secondary text-foreground text-base font-bold py-3.5 rounded-xl border-2 border-border active:scale-95 transition-all"
                >
                  <Download size={18} /> Save
                </button>
                <button
                  onClick={handlePublishToGallery}
                  disabled={publishing}
                  className="flex items-center justify-center gap-1.5 bg-green-600 text-white text-base font-bold py-3.5 rounded-xl active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Globe size={18} /> {publishing ? "..." : "Publish"}
                </button>
                <button
                  onClick={handleNewImage}
                  className={`flex items-center justify-center gap-1.5 text-base font-bold py-3.5 rounded-xl transition-all active:scale-95 ${
                    confirmNew
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {confirmNew ? "Sure?" : "✨ New"}
                </button>
              </div>

              {/* Variations */}
              <VariationsGrid
                sourceUrl={imageUrl}
                prompt={sanitizePrompt(prompt.trim()).slice(0, MAX_PROMPT_LENGTH)}
                style={selectedStyle}
                onSelectVariation={(url) => {
                  setImageUrl(url);
                  setHistory(prev => [{ prompt: prompt.trim(), style: STYLES.find(s => s.value === selectedStyle)?.label, url }, ...prev].slice(0, 10));
                  toast.success("Variation selected as main image!");
                }}
              />

              {/* Share buttons — labeled for seniors */}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-base font-black text-foreground mb-2">📤 Share your creation</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 bg-secondary border-2 border-border text-foreground font-bold py-3.5 rounded-xl text-base active:scale-95 transition-all"
                  >
                    <Share2 size={18} /> Share Link
                  </button>
                  <a
                    href={`mailto:?subject=${encodeURIComponent("Check out my AI Art!")}&body=${encodeURIComponent(`I created this with AI Art Studio!\n\n${imageUrl}`)}`}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3.5 rounded-xl text-base active:scale-95 transition-all"
                  >
                    <Mail size={18} /> Email
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl text-base active:scale-95 transition-all"
                  >
                    <Facebook size={18} /> Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this AI art I made!`)}&url=${encodeURIComponent(imageUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-sky-500 text-white font-bold py-3.5 rounded-xl text-base active:scale-95 transition-all"
                  >
                    <Twitter size={18} /> Twitter
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 1 && (
          <div className="bg-card border-2 border-border rounded-2xl p-5 shadow-xl">
            <h3 className="text-xl font-black text-foreground mb-3">🖼️ Recent Creations</h3>
            <div className="grid grid-cols-2 gap-3">
              {history.slice(1).map((item, i) => (
                <div key={i} className="rounded-xl overflow-hidden border-2 border-border">
                  <img src={item.url} alt={item.prompt} className="w-full aspect-square object-cover" />
                  <div className="p-2 bg-secondary">
                    <p className="text-sm text-muted-foreground truncate">{item.prompt}</p>
                    <p className="text-sm text-primary font-bold">{item.style}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}