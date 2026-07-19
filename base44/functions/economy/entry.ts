import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import {
  STARTER_BALANCE, BALLOON_SKINS, WHEEL_THEMES, DART_POWERUPS, coinsForStars,
} from '../../shared/economyConfig.ts';

// Server-authoritative coin economy.
//   action "award":    { stars }  -> server computes coins from the star rating and credits them.
//   action "purchase": { category, itemId } -> server validates catalog price + balance, deducts, grants item.
// PlayerCoins / PlayerInventory are read-only from the client, so all mutations funnel through here.

// Load-or-create the player's coin record (service role — RLS-agnostic).
async function getCoins(base44: any, email: string) {
  const rows = await base44.asServiceRole.entities.PlayerCoins.filter({ user_email: email });
  if (rows[0]) return rows[0];
  return await base44.asServiceRole.entities.PlayerCoins.create({
    user_email: email, balance: STARTER_BALANCE, total_earned: STARTER_BALANCE, total_spent: 0,
  });
}

async function getInventory(base44: any, email: string) {
  const rows = await base44.asServiceRole.entities.PlayerInventory.filter({ user_email: email });
  if (rows[0]) return rows[0];
  return await base44.asServiceRole.entities.PlayerInventory.create({
    user_email: email,
    owned_balloon_skins: ['default'], owned_wheel_themes: ['default'],
    dart_powerups: {}, active_balloon_skin: 'default', active_wheel_theme: 'default',
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const email = user.email;

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── Award coins for a game win (amount computed server-side from stars) ──
    if (action === 'award') {
      const stars = Math.max(1, Math.min(3, Math.round(Number(body.stars) || 1)));
      const amount = coinsForStars(stars, Number(body.base) || 20);
      const rec = await getCoins(base44, email);
      const newBalance = (rec.balance ?? 0) + amount;
      await base44.asServiceRole.entities.PlayerCoins.update(rec.id, {
        balance: newBalance,
        total_earned: (rec.total_earned ?? 0) + amount,
      });
      return Response.json({ awarded: amount, balance: newBalance });
    }

    // ── Shop purchase (price + balance validated server-side) ──
    if (action === 'purchase') {
      const { category, itemId } = body;

      let price: number | null = null;
      if (category === 'balloon') price = BALLOON_SKINS[itemId]?.price ?? null;
      else if (category === 'wheel') price = WHEEL_THEMES[itemId]?.price ?? null;
      else if (category === 'powerup') price = DART_POWERUPS[itemId]?.price ?? null;

      if (price === null) return Response.json({ error: 'Unknown item' }, { status: 400 });

      const inv = await getInventory(base44, email);

      // Reject re-buying an already-owned cosmetic; enforce power-up stack cap.
      if (category === 'balloon' && (inv.owned_balloon_skins ?? []).includes(itemId)) {
        return Response.json({ error: 'Already owned' }, { status: 400 });
      }
      if (category === 'wheel' && (inv.owned_wheel_themes ?? []).includes(itemId)) {
        return Response.json({ error: 'Already owned' }, { status: 400 });
      }
      if (category === 'powerup') {
        const owned = (inv.dart_powerups ?? {})[itemId] ?? 0;
        const cap = DART_POWERUPS[itemId].maxOwn;
        if (owned >= cap) return Response.json({ error: 'Max owned' }, { status: 400 });
      }

      const rec = await getCoins(base44, email);
      const balance = rec.balance ?? 0;
      if (balance < price) return Response.json({ error: 'Insufficient funds', balance }, { status: 402 });

      // Deduct then grant.
      const newBalance = balance - price;
      await base44.asServiceRole.entities.PlayerCoins.update(rec.id, {
        balance: newBalance,
        total_spent: (rec.total_spent ?? 0) + price,
      });

      const invPatch: Record<string, unknown> = {};
      if (category === 'balloon') {
        invPatch.owned_balloon_skins = [...(inv.owned_balloon_skins ?? ['default']), itemId];
        invPatch.active_balloon_skin = itemId;
      } else if (category === 'wheel') {
        invPatch.owned_wheel_themes = [...(inv.owned_wheel_themes ?? ['default']), itemId];
        invPatch.active_wheel_theme = itemId;
      } else if (category === 'powerup') {
        const current = inv.dart_powerups ?? {};
        invPatch.dart_powerups = { ...current, [itemId]: (current[itemId] ?? 0) + 1 };
      }
      await base44.asServiceRole.entities.PlayerInventory.update(inv.id, invPatch);

      return Response.json({ balance: newBalance, inventory: { ...inv, ...invPatch } });
    }

    // ── Credit coins from daily wheel / daily-login bonus ──
    // Amount is clamped to a daily-reward ceiling so a tampered client can't
    // request an arbitrary payout. These sources are already once-per-day gated
    // by their own tracking entities.
    if (action === 'credit') {
      const MAX_DAILY_CREDIT = 25000;
      const amount = Math.max(0, Math.min(MAX_DAILY_CREDIT, Math.round(Number(body.amount) || 0)));
      if (amount <= 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });
      const rec = await getCoins(base44, email);
      const newBalance = (rec.balance ?? 0) + amount;
      await base44.asServiceRole.entities.PlayerCoins.update(rec.id, {
        balance: newBalance,
        total_earned: (rec.total_earned ?? 0) + amount,
      });
      return Response.json({ credited: amount, balance: newBalance });
    }

    // ── Equip an already-owned cosmetic (no coin change, but write is server-side) ──
    if (action === 'equip') {
      const { category, itemId } = body;
      const inv = await getInventory(base44, email);
      const patch: Record<string, unknown> = {};
      if (category === 'balloon') {
        if (!(inv.owned_balloon_skins ?? ['default']).includes(itemId)) return Response.json({ error: 'Not owned' }, { status: 400 });
        patch.active_balloon_skin = itemId;
      } else if (category === 'wheel') {
        if (!(inv.owned_wheel_themes ?? ['default']).includes(itemId)) return Response.json({ error: 'Not owned' }, { status: 400 });
        patch.active_wheel_theme = itemId;
      } else {
        return Response.json({ error: 'Bad category' }, { status: 400 });
      }
      await base44.asServiceRole.entities.PlayerInventory.update(inv.id, patch);
      return Response.json({ inventory: { ...inv, ...patch } });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});