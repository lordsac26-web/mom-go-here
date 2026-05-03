import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ReferenceImageUploader({ referenceUrl, onUrlChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUrlChange(file_url);
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleRemove() {
    onUrlChange(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {referenceUrl ? (
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={referenceUrl}
              alt="Reference"
              className="w-20 h-20 rounded-xl object-cover border-2 border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-primary font-bold">📷 Reference uploaded!</p>
            <button
              onClick={handleRemove}
              className="flex items-center gap-2 text-base font-bold text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl border-2 border-destructive/30 active:scale-95 transition-all"
            >
              <X size={16} /> Remove Photo
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-3 bg-secondary border-2 border-dashed border-border rounded-xl text-base font-bold text-foreground hover:border-primary active:scale-95 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              📷 Upload Reference Image
            </>
          )}
        </button>
      )}
    </div>
  );
}