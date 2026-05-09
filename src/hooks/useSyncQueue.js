import { useEffect } from "react";
import syncQueue from "@/lib/syncQueue";

/**
 * Wires up the background sync queue:
 *  - Flushes pending items when the app comes online
 *  - Flushes once on mount if already online
 *
 * Mount this once in the Layout component.
 */
export default function useSyncQueue() {
  useEffect(() => {
    // Flush immediately if online and there are pending items
    syncQueue.flush();

    function handleOnline() {
      // Small delay to let the connection stabilize
      setTimeout(() => syncQueue.flush(), 1500);
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
}