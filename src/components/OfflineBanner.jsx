import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

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

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
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
          <span className="text-sm font-bold">You're offline — showing cached content</span>
        </motion.div>
      )}
      {showReconnected && !isOffline && (
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
    </AnimatePresence>
  );
}