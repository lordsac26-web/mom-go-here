import { X, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

export default function MemoryViewer({ entry, onClose, onPrev, onNext, hasPrev, hasNext }) {
  if (!entry) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 active:bg-white/20">
            <X size={24} className="text-white" />
          </button>
          <p className="text-white/80 text-sm font-bold">
            {moment(entry.entry_date).format("MMMM D, YYYY")}
          </p>
          <div className="w-10" />
        </div>

        {/* Photo area */}
        <div
          className="flex-1 flex items-center justify-center relative overflow-hidden min-h-0 px-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nav arrows */}
          {hasPrev && (
            <button
              onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 active:bg-white/25"
            >
              <ChevronLeft size={28} className="text-white" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 active:bg-white/25"
            >
              <ChevronRight size={28} className="text-white" />
            </button>
          )}

          {entry.photo_url ? (
            <motion.img
              key={entry.id}
              src={entry.photo_url}
              alt="Memory"
              className="max-w-full max-h-full object-contain rounded-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-48">
              <span className="text-8xl">📝</span>
            </div>
          )}
        </div>

        {/* Text overlay at bottom */}
        <div
          className="shrink-0 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] max-h-[40%] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {entry.prompt && (
            <div className="flex items-start gap-2 mb-2">
              <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-base text-primary italic font-semibold leading-snug">"{entry.prompt}"</p>
            </div>
          )}
          {entry.memory_text && (
            <p className="text-lg text-white leading-relaxed">{entry.memory_text}</p>
          )}
          <p className="text-sm text-white/50 mt-3 font-bold">
            {moment(entry.entry_date).format("dddd, MMMM D, YYYY · h:mm A")}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}