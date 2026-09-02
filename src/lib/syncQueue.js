/**
 * Background Sync Queue
 *
 * Captures entity create/update operations when offline and replays them
 * in order once the connection is restored.
 *
 * Each queued item:
 *   { id (auto), entity, action ("create"|"update"), payload, recordId?, timestamp }
 *
 * Usage:
 *   import syncQueue from "@/lib/syncQueue";
 *   await syncQueue.enqueue("GameScore", "create", { score: 100, ... });
 *   await syncQueue.enqueue("PlayerXP", "update", { total_xp: 500 }, recordId);
 *   await syncQueue.flush();           // process all pending items
 *   const count = await syncQueue.pendingCount();
 */

import offlineCache from "./offlineCache";
import { base44 } from "@/api/base44Client";

const STORE = offlineCache.STORES.syncQueue;

let _flushing = false;
const _listeners = new Set();

/** Subscribe to sync status changes. Returns unsubscribe function. */
function onStatusChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function _notify(status) {
  _listeners.forEach(fn => fn(status));
}

function isNetworkError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return !navigator.onLine || message.includes("network") || message.includes("fetch") || message.includes("timeout") || message.includes("connection");
}

/** Add an operation to the offline queue. */
async function enqueue(entity, action, payload, recordId = null) {
  try {
    const db = await _openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).add({
        entity,
        action,
        payload,
        recordId,
        timestamp: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    _notify({ queued: true });
  } catch {
    // Best-effort — if IndexedDB fails, the operation is lost
  }
}

/** Count pending items. */
async function pendingCount() {
  try {
    const db = await _openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/** Get all pending items (ordered by auto-increment id). */
async function _getAll() {
  try {
    const db = await _openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/** Remove a single item by id. */
async function _remove(id) {
  try {
    const db = await _openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

/** Process all queued operations sequentially. */
async function flush() {
  if (_flushing || !navigator.onLine) return;
  _flushing = true;

  const items = await _getAll();
  if (items.length === 0) {
    _flushing = false;
    return;
  }

  _notify({ syncing: true, total: items.length, completed: 0 });

  let completed = 0;
  for (const item of items) {
    try {
      const entityApi = base44.entities[item.entity];
      if (!entityApi) {
        // Unknown entity — discard
        await _remove(item.id);
        completed++;
        continue;
      }

      if (item.action === "create") {
        await entityApi.create(item.payload);
      } else if (item.action === "update" && item.recordId) {
        await entityApi.update(item.recordId, item.payload);
      }

      await _remove(item.id);
      completed++;
      _notify({ syncing: true, total: items.length, completed });
    } catch (err) {
      console.warn(`Sync failed for ${item.entity}.${item.action}:`, err);
      // Stop processing — will retry on next flush
      break;
    }
  }

  _flushing = false;
  const remaining = await pendingCount();
  _notify({ syncing: false, total: 0, completed: 0, remaining });
}

/** Helper — reuses offlineCache's shared DB connection (which handles upgrades) */
function _openDB() {
  return offlineCache._openDB();
}

/**
 * Wrapper for entity operations that gracefully falls back to the sync queue
 * when the network is unavailable.
 *
 *   await syncQueue.safeCreate("GameScore", { score: 100 });
 *   await syncQueue.safeUpdate("PlayerXP", recordId, { total_xp: 500 });
 */
async function safeCreate(entity, payload) {
  if (!navigator.onLine) {
    await enqueue(entity, "create", payload);
    return null;
  }
  try {
    return await base44.entities[entity].create(payload);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    await enqueue(entity, "create", payload);
    return null;
  }
}

async function safeUpdate(entity, recordId, payload) {
  if (!navigator.onLine) {
    await enqueue(entity, "update", payload, recordId);
    return null;
  }
  try {
    return await base44.entities[entity].update(recordId, payload);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    await enqueue(entity, "update", payload, recordId);
    return null;
  }
}

const syncQueue = {
  enqueue,
  flush,
  pendingCount,
  onStatusChange,
  safeCreate,
  safeUpdate,
};

export default syncQueue;