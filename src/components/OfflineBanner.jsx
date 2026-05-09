import { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import syncQueue from "@/lib/syncQueue";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true);
      setShowReconnected(false);
    }

    function handleOnline() {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const unsubSync = syncQueue.onStatusChange((status) => {
      if (status.syncing) {
        setSyncStatus(status);
      } else {
        // Show "done" briefly then hide
        if (status.remaining === 0) {
          setSyncStatus({ done: true });
          setTimeout(() => setSyncStatus(null), 2500);
        } else {
          setSyncStatus(null);
        }
      }
    });

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      unsubSync();
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.625rem)" }}
        >
          <WifiOff size={18} />
          <span className="text-sm font-bold">You're offline — progress is saved locally</span>
        </motion.div>
      )}
      {showReconnected && !isOffline && !syncStatus && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.625rem)" }}
        >
          <Wifi size={18} />
          <span className="text-sm font-bold">Back online!</span>
        </motion.div>
      )}
      {syncStatus?.syncing && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.625rem)" }}
        >
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm font-bold">
            Syncing progress… {syncStatus.completed}/{syncStatus.total}
          </span>
        </motion.div>
      )}
      {syncStatus?.done && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.625rem)" }}
        >
          <Wifi size={18} />
          <span className="text-sm font-bold">✅ All progress synced!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}