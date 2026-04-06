import { motion, AnimatePresence } from "framer-motion";
import { Save, Check, Loader2 } from "lucide-react";

export default function SaveGameControls({ saving, lastSaved, onSave }) {
  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={() => onSave("manual")}
        disabled={saving}
        className="flex items-center gap-1.5 bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
      >
        <AnimatePresence mode="wait">
          {saving ? (
            <motion.div key="saving" initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
              <Loader2 size={16} className="text-primary" />
            </motion.div>
          ) : lastSaved ? (
            <motion.div key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <Check size={16} className="text-green-400" />
            </motion.div>
          ) : (
            <motion.div key="save" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <Save size={16} className="text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
        {saving ? "Saving..." : "Save"}
      </motion.button>

      {lastSaved && !saving && (
        <motion.span
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Saved {lastSaved.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </motion.span>
      )}
    </div>
  );
}