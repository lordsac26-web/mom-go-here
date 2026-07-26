import { BOARD_CONFIG } from "./boardConfig";

export default class CoinPusherEngine {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.coins = [];
    this.pool = [];
    this.nextId = 1;
    this.elapsed = 0;
    this.plateFront = 0.1;
  }

  seed() {
    for (let index = 0; index < 16; index += 1) {
      this.spawn(0.15 + Math.random() * 0.7, 0.52 + Math.random() * 0.4, 0);
    }
  }

  drop(x) {
    if (this.coins.length < BOARD_CONFIG.maxCoins) this.spawn(x, 0.27, 110);
  }

  spawn(x, z, y) {
    const coin = this.pool.pop() || {};
    Object.assign(coin, {
      id: this.nextId++,
      x: Math.max(BOARD_CONFIG.coinRadius, Math.min(1 - BOARD_CONFIG.coinRadius, x)),
      z,
      y,
      vx: 0,
      vy: 0,
      vz: y > 0 ? BOARD_CONFIG.fallSpeed : 0,
      settled: y === 0,
      spin: Math.random() * 360,
      pegMask: 0,
    });
    this.coins.push(coin);
  }

  step(dt) {
    this.elapsed += dt;
    this.plateFront = 0.08 + ((Math.sin(this.elapsed * 1.5) + 1) / 2) * 0.2;

    for (const coin of this.coins) this.updateCoin(coin, dt);
    this.resolvePusher();
    this.resolveCoinSpacing();
    this.collectOverflow();
  }

  updateCoin(coin, dt) {
    if (coin.y > 0) {
      coin.vy += BOARD_CONFIG.gravity * dt;
      coin.y -= coin.vy * dt;
      coin.z += coin.vz * dt;
      coin.x += coin.vx * dt;
      coin.vx *= BOARD_CONFIG.friction;

      BOARD_CONFIG.pegs.forEach((peg, index) => {
        const bit = 1 << index;
        const collisionDistance = BOARD_CONFIG.coinRadius + BOARD_CONFIG.pegRadius;
        if ((coin.pegMask & bit) || Math.abs(coin.z - peg.z) >= collisionDistance || Math.abs(coin.x - peg.x) >= collisionDistance) return;
        coin.pegMask |= bit;
        const direction = coin.x === peg.x ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(coin.x - peg.x);
        coin.vx = direction * BOARD_CONFIG.bounceStrength + (Math.random() - 0.5) * 0.1;
      });

      if (coin.y <= 0) Object.assign(coin, { y: 0, vy: 0, vz: 0, vx: 0, settled: true });
    }

    coin.x = Math.max(BOARD_CONFIG.coinRadius, Math.min(1 - BOARD_CONFIG.coinRadius, coin.x));
    coin.spin += dt * 30;
  }

  resolvePusher() {
    for (const coin of this.coins) {
      if (coin.settled && coin.z < this.plateFront + BOARD_CONFIG.coinRadius) coin.z = this.plateFront + BOARD_CONFIG.coinRadius;
    }
  }

  resolveCoinSpacing() {
    const sorted = [...this.coins].sort((a, b) => b.z - a.z);
    for (let front = 0; front < sorted.length; front += 1) {
      for (let back = front + 1; back < sorted.length; back += 1) {
        const leading = sorted[front];
        const trailing = sorted[back];
        if (!leading.settled || !trailing.settled || Math.abs(leading.x - trailing.x) > BOARD_CONFIG.minGap) continue;
        const gap = leading.z - trailing.z;
        if (gap >= 0 && gap < BOARD_CONFIG.minGap) leading.z += (BOARD_CONFIG.minGap - gap) * 0.5;
      }
    }
  }

  collectOverflow() {
    let collected = 0;
    for (let index = this.coins.length - 1; index >= 0; index -= 1) {
      if (this.coins[index].z <= 1) continue;
      this.pool.push(this.coins[index]);
      this.coins.splice(index, 1);
      collected += 1;
    }
    if (collected) this.onEvent?.({ type: "coins_collected", count: collected });
  }
}