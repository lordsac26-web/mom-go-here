import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// ── Rate-limit resilience ──────────────────────────────────────────────
// Many widgets fetch from the SDK simultaneously on page mount, which can
// trip the server's rate limiter (HTTP 429 → "Rate limit exceeded").
// We transparently wrap entity methods so any rate-limited call retries
// with exponential backoff + jitter instead of throwing immediately.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isRateLimit(err) {
  const msg = (err?.message || "").toLowerCase();
  return err?.status === 429 || err?.response?.status === 429 || msg.includes("rate limit");
}

function withRetry(fn, { retries = 4, baseDelay = 400 } = {}) {
  return async (...args) => {
    let attempt = 0;
    for (;;) {
      try {
        return await fn(...args);
      } catch (err) {
        if (!isRateLimit(err) || attempt >= retries) throw err;
        const delay = baseDelay * 2 ** attempt + Math.random() * 250;
        attempt++;
        await sleep(delay);
      }
    }
  };
}

// Wrap the read/write methods most commonly fired in bursts.
const WRAPPED_METHODS = ["list", "filter", "get", "create", "update", "delete", "bulkCreate"];
if (base44?.entities) {
  for (const entity of Object.values(base44.entities)) {
    for (const method of WRAPPED_METHODS) {
      if (typeof entity?.[method] === "function") {
        entity[method] = withRetry(entity[method].bind(entity));
      }
    }
  }
}