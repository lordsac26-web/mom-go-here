import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FRAMES from "./frameDefinitions";
import FramedImage from "./FramedImage";

/**
 * Full-screen frame picker overlay.
 * Shows a preview of the current image in the selected frame,
 * plus a scrollable grid of 20 frame options.
 */
export default function FramePicker({ imageUrl, selectedFrameId, onSelect, onClose }) {
  const [previewId, setPreviewId] = useState(selectedFrameId || "none");

  function handleConfirm() {
    onSelect(previewId);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <X size={24} className="text-foreground" />
        </button>
        <h2 className="text-xl font-black text-foreground">🖼️ Choose a Frame</h2>
        <button
          onClick={handleConfirm}
          className="bg-primary text-primary-foreground font-bold text-base px-4 py-2 rounded-xl active:scale-95 transition-all"
        >
          Done ✓
        </button>
      </div>

      {/* Preview */}
      <div className="flex-shrink-0 flex items-center justify-center px-6 py-4 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="w-full max-w-[260px]">
          <FramedImage
            src={imageUrl}
            alt="Frame preview"
            frameId={previewId}
          />
        </div>
      </div>

      {/* Frame label */}
      <div className="text-center py-2 bg-card border-b border-border">
        <span className="text-base font-bold text-primary">
          {FRAMES.find(f => f.id === previewId)?.emoji}{" "}
          {FRAMES.find(f => f.id === previewId)?.label}
        </span>
      </div>

      {/* Frame grid — scrollable */}
      <div className="flex-1 overflow-y-auto bg-background px-4 py-3 pb-6">
        <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
          {FRAMES.map(frame => {
            const isSelected = previewId === frame.id;
            return (
              <button
                key={frame.id}
                onClick={() => setPreviewId(frame.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all active:scale-95 ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {/* Mini frame preview */}
                <div className="w-full aspect-square rounded-lg overflow-hidden">
                  {frame.id === "none" ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-2xl">🚫</span>
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        padding: Math.min(frame.borderWidth * 0.5, 6),
                        background: frame.outerBg,
                        borderRadius: 6,
                        boxShadow: frame.shadow,
                      }}
                    >
                      <div
                        className="w-full h-full rounded"
                        style={{
                          background: "rgba(0,0,0,0.15)",
                          padding: 1,
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight text-center">
                  {frame.emoji} {frame.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}