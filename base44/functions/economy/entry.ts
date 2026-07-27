import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  STARTER_BALANCE, BALLOON_SKINS, WHEEL_THEMES, DART_POWERUPS, coinsForStars,
  PUSHER_DROP_COST, PUSHER_MAX_PAYOUT_PER_CALL,
} from '../../shared/economyConfig.ts';

const DAILY_LOGIN_REWARDS = [2000, 3000, 4000, 5000, 7500, 10000, 25000];
const DAILY_WHEEL_PRIZES = [
  { type: 'coins', value: 500 }, { type: 'xp', value: 25 }, { type: 'coins', value: 1000 }, { type: 'xp', value: 50 },
  { type: 'coins', value: 2500 }, { type: 'xp', value: 10 }, { type: 'coins', value: 5000 }, { type: 'xp', value: 100 },
];
const XP_LEVELS = [0, 100, 250, 500, 850, 1300, 1900, 2700, 3700, 5000, 6600, 8500, 10800, 13500, 16800, 20500, 25000, 30500, 37000, 45000, 55000, 67000, 82000, 100000, 125000];

function levelForXp(totalXp: number) {
  return XP_LEVELS.reduce((level, threshold, index) => totalXp >= threshold ? index + 1 : level, 1);
}

async function getCoins(base44, email) {
  const rows = await base44.asServiceRole.entities.PlayerCoins.filter({ user_email: email });
  if (rows[0]) return rows[0];
  return base44.asServiceRole.entities.PlayerCoins.create({ user_email: email, balance: STARTER_BALANCE, total_earned: STARTER_BALANCE, total_spent: 0 });
}

async function getInventory(base44, email) {
  const rows = await base44.asServiceRole.entities.PlayerInventory.filter({ user_email: email });
  if (rows[0]) return rows[0];
  return base44.asServiceRole.entities.PlayerInventory.create({ user_email: email, owned_balloon_skins: ['default'], owned_wheel_themes: ['default'], dart_powerups: {}, active_balloon_skin: 'default', active_wheel_theme: 'default' });
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const email = user.email;
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'award') {
      const stars = Math.max(1, Math.min(3, Math.round(Number(body.stars) || 1)));
      const amount = coinsForStars(stars, Number(body.base) || 20);
      const rec = await getCoins(base44, email);
      const newBalance = (rec.balance ?? 0) + amount;
      await base44.asServiceRole.entities.PlayerCoins.update(rec.id, { balance: newBalance, total_earned: (rec.total_earned ?? 0) + amount });
      return Response.json({ awarded: amount, balance: newBalance });
    }

    if (action === 'purchase') {
      const { category, itemId } = body;
      let price: number | null = null;
      if (category === 'balloon') price = BALLOON_SKINS[itemId]?.price ?? null;
      else if (category === 'wheel') price = WHEEL_THEMES[itemId]?.price ?? null;
      else if (category === 'powerup') price = DART_POWERUPS[itemId]?.price ?? null;
      if (price === null) return Response.json({ error: 'Unknown item' }, { status: 400 });

      const inv = await getInventory(base44, email);
      if (category === 'balloon' && (inv.owned_balloon_skins ?? []).includes(itemId)) return Response.json({ error: 'Already owned' }, { status: 400 });
      if (category === 'wheel' && (inv.owned_wheel_themes ?? []).includes(itemId)) return Response.json({ error: 'Already owned' }, { status: 400 });
      if (category === 'powerup' && ((inv.dart_powerups ?? {})[itemId] ?? 0) >= DART_POWERUPS[itemId].maxOwn) return Response.json({ error: 'Max owned' }, { status: 400 });

      const rec = await getCoins(base44, email);
      const balance = rec.balance ?? 0;
      if (balance < price) return Response.json({ error: 'Insufficient funds', balance }, { status: 402 });
      const newBalance = balance - price;
      await base44.asServiceRole.entities.PlayerCoins.update(rec.id, { balance: newBalance, total_spent: (rec.total_spent ?? 0) + price });

      const invPatch: Record<string, unknown> = {};
      if (category === 'balloon') { invPatch.owned_balloon_skins = [...(inv.owned_balloon_skins ?? ['default']), itemId]; invPatch.active_balloon_skin = itemId; }
      else if (category === 'wheel') { invPatch.owned_wheel_themes = [...(inv.owned_wheel_themes ?? ['default']), itemId]; invPatch.active_wheel_theme = itemId; }
      else { invPatch.dart_powerups = { ...(inv.dart_powerups ?? {}), [itemId]: ((inv.dart_powerups ?? {})[itemId] ?? 0) + 1 }; }
      await base44.asServiceRole.entities.PlayerInventory.update(inv.id, invPatch);
      return Response.json({ balance: newBalance, inventory: { ...inv, ...invPatch } });
    }

    if (action === 'daily_login') {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const records = await base44.asServiceRole.entities.DailyLoginBonus.filter({ user_email: email });
      const existing = records[0];
      if (existing?.last_claim_date === today) return Response.json({ error: 'Already claimed today' }, { status: 409 });
      const streak = existing?.last_claim_date === yesterday ? (existing.current_streak ?? 0) + 1 : 1;
      const amount = DAILY_LOGIN_REWARDS[(streak - 1) % DAILY_LOGIN_REWARDS.length];
      const dailyLogin = {
        user_email: email, current_streak: streak, best_streak: Math.max(existing?.best_streak ?? 0, streak), last_claim_date: today,
        total_claimed: (existing?.total_claimed ?? 0) + amount, total_days_claimed: (existing?.total_days_claimed ?? 0) + 1,
      };
      if (existing) await base44.asServiceRole.entities.DailyLoginBonus.update(existing.id, dailyLogin);
      else await base44.asServiceRole.entities.DailyLoginBonus.create(dailyLogin);
      const rec = await getCoins(base44, email);
      const balance = (rec.balance ?? 0) + amount;
      await base44.asServiceRole.entities.PlayerCoins.update(rec.id, { balance, total_earned: (rec.total_earned ?? 0) + amount });
      return Response.json({ credited: amount, balance, dailyLogin });
    }

    if (action === 'daily_wheel') {
      const today = new Date().toISOString().slice(0, 10);
      const records = await base44.asServiceRole.entities.DailyWheelSpin.filter({ user_email: email });
      const existing = records[0];
      if (existing?.last_spin_date === today) return Response.json({ error: 'Already spun today' }, { status: 409 });
      const prize = DAILY_WHEEL_PRIZES[Math.floor(Math.random() * DAILY_WHEEL_PRIZES.length)];
      const dailyWheel = {
        user_email: email, last_spin_date: today, total_spins: (existing?.total_spins ?? 0) + 1,
        total_coins_won: (existing?.total_coins_won ?? 0) + (prize.type === 'coins' ? prize.value : 0),
        total_xp_won: (existing?.total_xp_won ?? 0) + (prize.type === 'xp' ? prize.value : 0),
      };
      if (existing) await base44.asServiceRole.entities.DailyWheelSpin.update(existing.id, dailyWheel);
      else await base44.asServiceRole.entities.DailyWheelSpin.create(dailyWheel);

      let balance = null;
      if (prize.type === 'coins') {
        const rec = await getCoins(base44, email);
        balance = (rec.balance ?? 0) + prize.value;
        await base44.asServiceRole.entities.PlayerCoins.update(rec.id, { balance, total_earned: (rec.total_earned ?? 0) + prize.value });
      } else {
        const xpRecords = await base44.asServiceRole.entities.PlayerXP.filter({ user_email: email });
        const xpRecord = xpRecords[0];
        const totalXp = (xpRecord?.total_xp ?? 0) + prize.value;
        const xpPatch = { total_xp: totalXp, level: levelForXp(totalXp) };
        if (xpRecord) await base44.asServiceRole.entities.PlayerXP.update(xpRecord.id, xpPatch);
        else await base44.asServiceRole.entities.PlayerXP.create({ user_email: email, ...xpPatch });
      }
      return Response.json({ prize, balance, dailyWheel });
    }

    if (action === 'pusher') {
      const rec = await getCoins(base44, email);
      const balance = rec.balance ?? 0;
      if (body.mode === 'balance') return Response.json({ balance });
      if (body.mode === 'drop') {
        const count = Math.max(1, Math.min(3, Math.round(Number(body.count) || 1)));
        const cost = PUSHER_DROP_COST * count;
        if (balance < cost) return Response.json({ error: 'Insufficient funds', balance }, { status: 402 });
        const newBalance = balance - cost;
        await base44.asServiceRole.entities.PlayerCoins.update(rec.id, { balance: newBalance, total_spent: (rec.total_spent ?? 0) + cost });
        return Response.json({ balance: newBalance, dropped: count });
      }
      if (body.mode === 'payout') {
        const count = Math.max(0, Math.min(PUSHER_MAX_PAYOUT_PER_CALL, Math.round(Number(body.count) || 0)));
        if (count <= 0) return Response.json({ balance });
        const newBalance = balance + count;
        await base44.asServiceRole.entities.PlayerCoins.update(rec.id, { balance: newBalance, total_earned: (rec.total_earned ?? 0) + count });
        return Response.json({ awarded: count, balance: newBalance });
      }
      return Response.json({ error: 'Bad pusher mode' }, { status: 400 });
    }

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
      } else return Response.json({ error: 'Bad category' }, { status: 400 });
      await base44.asServiceRole.entities.PlayerInventory.update(inv.id, patch);
      return Response.json({ inventory: { ...inv, ...patch } });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}