/**
 * IndexedDB-based offline cache for app content.
 * Stores scripture, daily verses, game data, and user profiles
 * so core features remain accessible without internet.
 *
 * API:
 *   offlineCache.get(store, key)       → cached value or null
 *   offlineCache.set(store, key, data) → void
 *   offlineCache.getAll(store)         → array of all values
 *   offlineCache.remove(store, key)    → void
 *   offlineCache.clear(store)          → void
 */

const DB_NAME = "momgohere-offline";
const DB_VERSION = 2;

const STORES = {
  scripture: "scripture",
  dailyVerse: "dailyVerse",
  userProfile: "userProfile",
  gameScores: "gameScores",
  dailyMissions: "dailyMissions",
  generic: "generic",
  syncQueue: "syncQueue",
};

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.values(STORES).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          // syncQueue uses autoIncrement keys for ordered processing
          if (name === "syncQueue") {
            db.createObjectStore(name, { keyPath: "id", autoIncrement: true });
          } else {
            db.createObjectStore(name);
          }
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function get(storeName, key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function set(storeName, key, data) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Silently fail — offline cache is best-effort
  }
}

async function getAll(storeName) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

async function remove(storeName, key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

async function clear(storeName) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

const offlineCache = { get, set, getAll, remove, clear, STORES };
export default offlineCache;