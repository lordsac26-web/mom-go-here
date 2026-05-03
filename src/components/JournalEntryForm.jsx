import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useDailyMissions } from "../hooks/useDailyMissions";
import { Camera, Sparkles, Send, X, Image, Upload } from "lucide-react";
import { toast } from "sonner";
import CameraCapture from "./CameraCapture";

const PROMPTS = [
  "What made you smile today?",
  "Describe a moment you're grateful for.",
  "What's something new you tried today?",
  "Share a favorite memory from this week.",
  "What are you looking forward to?",
  "Describe something beautiful you saw today.",
  "What's one thing you learned recently?",
  "Who made your day better today?",
];

export default function JournalEntryForm({ onSaved, onCancel }) {
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const { reportMissionProgress } = useDailyMissions();

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!text.trim() && !photo) {
      toast.error("Write a memory or add a photo!");
      return;
    }
    setSaving(true);
    const user = await base44.auth.me();
    let photo_url = null;

    if (photo) {
      const result = await base44.integrations.Core.UploadFile({ file: photo });
      photo_url = result.file_url;
    }

    const newEntry = await base44.entities.JournalEntry.create({
      user_email: user.email,
      photo_url,
      memory_text: text.trim(),
      prompt,
      entry_date: new Date().toISOString(),
    });

    setSaving(false);
    reportMissionProgress("journal");
    toast.success("Memory saved! 💛");
    onSaved(newEntry);
  }

  return (
    <div className="bg-card border-2 border-primary rounded-2xl p-5 shadow-xl">
      {/* Prompt */}
      <div className="flex items-start gap-2 mb-4">
        <Sparkles size={22} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xl font-bold text-primary italic">"{prompt}"</p>
      </div>

      {/* Photo section */}
      {photoPreview ? (
        <div className="relative mb-4">
          <img src={photoPreview} alt="Preview" className="w-full rounded-xl border-2 border-border max-h-64 object-cover" />
          <button
            onClick={() => { setPhoto(null); setPhotoPreview(null); }}
            className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="flex gap-3 mb-4">
          {/* Take Photo button */}
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-2 bg-secondary border-2 border-dashed border-border rounded-xl py-5 cursor-pointer hover:border-primary transition-colors"
          >
            <Camera size={28} className="text-primary" />
            <span className="text-base font-bold text-muted-foreground">Take Photo</span>
          </button>
          {/* Choose from gallery */}
          <label className="flex-1 flex flex-col items-center justify-center gap-2 bg-secondary border-2 border-dashed border-border rounded-xl py-5 cursor-pointer hover:border-primary transition-colors">
            <Upload size={28} className="text-muted-foreground" />
            <span className="text-base font-bold text-muted-foreground">Upload Photo</span>
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCapture
        open={cameraOpen}
        onCapture={(file, preview) => {
          setPhoto(file);
          setPhotoPreview(preview);
          setCameraOpen(false);
        }}
        onClose={() => setCameraOpen(false)}
      />

      {/* Text area */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your memory here..."
        rows={3}
        className="w-full bg-secondary border-2 border-border rounded-xl px-4 py-3 text-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none mb-4"
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-secondary text-foreground text-xl font-bold py-4 rounded-xl border-2 border-border"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 text-xl font-black py-4 rounded-xl flex items-center justify-center gap-2 ${
            saving ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={20} /> Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}