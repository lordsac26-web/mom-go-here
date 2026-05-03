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

    // Basic validation
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
        <div className="relative inline-block">
          <img
            src={referenceUrl}
            alt="Reference"
            className="w-20 h-20 rounded-xl object-cover border-2 border-primary"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg"
          >
            <X size={14} />
          </button>
          <p className="text-[10px] text-primary font-bold mt-1 text-center">Reference</p>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary border-2 border-dashed border-border rounded-xl text-sm font-bold text-foreground hover:border-primary active:scale-95 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              📷 Upload Reference Image
            </>
          )}
        </button>
      )}
    </div>
  );
}