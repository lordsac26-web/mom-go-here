import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { WS_THEMES } from "./themes";

export default function ThemePanel({ open, onClose, currentTheme, onSelectTheme }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 pb-8 max-h-[70vh] overflow-y-auto"
            style={{ background: "#1a1a2e" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-black text-white">🎨 Color Theme</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(WS_THEMES).map(([key, theme]) => {
                const isActive = key === currentTheme;
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { onSelectTheme(key); onClose(); }}
                    className={`rounded-2xl p-3 border-2 transition-all ${
                      isActive ? "border-white shadow-lg scale-105" : "border-transparent"
                    }`}
                    style={{ background: theme.bg }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{theme.emoji}</span>
                      <span className="text-lg font-black" style={{ color: theme.cellText }}>{theme.name}</span>
                    </div>
                    {/* Mini preview: 3x3 grid */}
                    <div className="grid grid-cols-3 gap-1 mx-auto w-fit">
                      {["A","B","C","D","E","F","G","H","I"].map((l, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                          style={{
                            background: i === 4 ? theme.selected : i >= 6 ? theme.found : theme.cell,
                            color: i === 4 ? theme.selectedText : i >= 6 ? theme.foundText : theme.cellText,
                          }}
                        >
                          {l}
                        </div>
                      ))}
                    </div>
                    {isActive && (
                      <div className="text-center mt-2 text-xs font-bold" style={{ color: theme.selected }}>
                        ✓ Active
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}