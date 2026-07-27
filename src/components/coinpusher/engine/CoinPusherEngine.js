import Matter from "matter-js";
import { BOARD_CONFIG } from "./boardConfig";

const { Bodies, Body, Composite, Engine, Events, Sleeping, World } = Matter;
const COIN_LABEL = "pusher-coin";
const PEG_LABEL = "pusher-peg";
const BARRIER_LABEL = "coin-barrier";
const LIP_LABEL = "collection-lip";

export default class CoinPusherEngine {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.coins = [];
    this.pool = [];
    this.nextId = 1;
    this.elapsed = 0;
    this.plateFront = 0.1;
    this.pusherDirection = 0;
    this.lastImpactAt = -1;
    this.barrier = null;
    this.barrierHealth = 0;
    this.barrierMaxHealth = 0;
    this.nextBarrierAt = 0;
    this.engine = Engine.create({ gravity: { x: 0, y: BOARD_CONFIG.physics.gravity, scale: 0.001 } });
    this.world = this.engine.world;
    this.createMachineBodies();
    this.handleCollisions();
  }

  createMachineBodies() {
    const size = BOARD_CONFIG.worldSize;
    const { wallThickness, pusherHeight } = BOARD_CONFIG.physics;
    const staticOptions = { isStatic: true, friction: 0.3, restitution: 0.04 };
    this.pusher = Bodies.rectangle(size / 2, BOARD_CONFIG.physics.pusherTravelStart, size - wallThickness * 2, pusherHeight, { ...staticOptions, label: "pusher-plate" });
    const walls = [
      Bodies.rectangle(wallThickness / 2, size / 2, wallThickness, size * 1.2, staticOptions),
      Bodies.rectangle(size - wallThickness / 2, size / 2, wallThickness, size * 1.2, staticOptions),
      Bodies.rectangle(size / 2, -wallThickness / 2, size, wallThickness, staticOptions),
    ];
    const pegs = BOARD_CONFIG.pegs.map(({ x, z }) => Bodies.circle(x * size, z * size, BOARD_CONFIG.pegRadius * size, { ...staticOptions, label: PEG_LABEL, restitution: 0.45 }));
    const { frontLip } = BOARD_CONFIG;
    this.frontLip = Bodies.rectangle(size / 2, frontLip.z * size, size - wallThickness * 2, frontLip.height * size, { ...staticOptions, isSensor: true, label: LIP_LABEL });
    World.add(this.world, [this.pusher, ...walls, ...pegs, this.frontLip]);
    this.spawnBarrier();
  }

  handleCollisions() {
    Events.on(this.engine, "collisionStart", ({ pairs }) => {
      const impact = pairs.find(({ bodyA, bodyB }) => (bodyA.label === COIN_LABEL && bodyB.label === PEG_LABEL) || (bodyB.label === COIN_LABEL && bodyA.label === PEG_LABEL));
      if (impact && this.elapsed - this.lastImpactAt >= 0.045) {
        const coin = impact.bodyA.label === COIN_LABEL ? impact.bodyA : impact.bodyB;
        this.lastImpactAt = this.elapsed;
        this.onEvent?.({ type: "coin_impact", x: coin.position.x / BOARD_CONFIG.worldSize, z: coin.position.y / BOARD_CONFIG.worldSize });
      }
      const barrierImpact = pairs.find(({ bodyA, bodyB }) => (bodyA.label === COIN_LABEL && bodyB.label === BARRIER_LABEL) || (bodyB.label === COIN_LABEL && bodyA.label === BARRIER_LABEL));
      if (barrierImpact && this.barrier) {
        const coin = barrierImpact.bodyA.label === COIN_LABEL ? barrierImpact.bodyA : barrierImpact.bodyB;
        this.damageBarrier(coin);
      }
    });
  }

  spawnBarrier() {
    const { barrier } = BOARD_CONFIG;
    const size = BOARD_CONFIG.worldSize;
    const health = barrier.minHealth + Math.floor(Math.random() * (barrier.maxHealth - barrier.minHealth + 1));
    const x = (0.27 + Math.random() * 0.46) * size;
    const y = (barrier.minZ + Math.random() * (barrier.maxZ - barrier.minZ)) * size;
    this.barrier = Bodies.rectangle(x, y, barrier.width * size, barrier.height * size, { isStatic: true, friction: 0.42, restitution: 0.08, label: BARRIER_LABEL });
    this.barrierHealth = health;
    this.barrierMaxHealth = health;
    World.add(this.world, this.barrier);
    this.onEvent?.({ type: "barrier_spawned", x: x / size, z: y / size, health });
  }

  damageBarrier(coin) {
    const speed = Math.hypot(coin.velocity.x, coin.velocity.y);
    const damage = Math.max(1, Math.min(3, Math.round(speed / 2)));
    this.barrierHealth = Math.max(0, this.barrierHealth - damage);
    this.onEvent?.({ type: "barrier_hit", x: coin.position.x / BOARD_CONFIG.worldSize, z: coin.position.y / BOARD_CONFIG.worldSize, damage, health: this.barrierHealth, maxHealth: this.barrierMaxHealth });
    if (this.barrierHealth > 0) return;
    Composite.remove(this.world, this.barrier);
    this.barrier = null;
    this.nextBarrierAt = this.elapsed + BOARD_CONFIG.barrier.respawnSeconds;
    this.onEvent?.({ type: "barrier_broken" });
  }

  seed() {
    for (let index = 0; index < 16; index += 1) this.spawn(0.15 + Math.random() * 0.7, 0.42 + Math.random() * 0.43, false);
  }

  drop(x) {
    if (this.coins.length < BOARD_CONFIG.maxCoins) {
      const shelfSlot = this.getShelfSlot(x);
      this.spawn(shelfSlot.x, 0, true, shelfSlot);
      this.onEvent?.({ type: "coin_dropped", x: shelfSlot.x });
    }
  }

  getShelfSlot(x) {
    const radius = BOARD_CONFIG.coinRadius;
    const shelfCoins = this.coins.filter((coin) => coin.loading && Math.abs(coin.x - x) < radius * 1.3);
    const stackLevel = shelfCoins.length < BOARD_CONFIG.physics.maxStackHeight ? shelfCoins.length : 0;
    const shiftedX = shelfCoins.length >= BOARD_CONFIG.physics.maxStackHeight
      ? x + (x <= 0.5 ? radius * 2.2 : -radius * 2.2)
      : x;
    return { x: Math.max(0.15, Math.min(0.85, shiftedX)), loading: true, stackLevel };
  }

  spawn(xFraction, zFraction, isDrop, { loading = false, stackLevel = 0 } = {}) {
    const size = BOARD_CONFIG.worldSize;
    const radius = BOARD_CONFIG.coinRadius * size;
    const x = Math.max(radius + BOARD_CONFIG.physics.wallThickness, Math.min(size - radius - BOARD_CONFIG.physics.wallThickness, xFraction * size));
    const y = zFraction * size;
    const coin = this.pool.pop() || { body: Bodies.circle(x, y, radius, this.coinOptions()), lift: 0 };

    if (coin.body.isSleeping) Sleeping.set(coin.body, false);
    Body.setStatic(coin.body, loading);
    Body.setPosition(coin.body, { x, y: loading ? this.pusher.position.y : y });
    Body.setVelocity(coin.body, { x: loading ? 0 : (Math.random() - 0.5) * 1.6, y: loading ? 0 : (isDrop ? 2.4 : 0) });
    Body.setAngularVelocity(coin.body, loading ? 0 : (Math.random() - 0.5) * 0.08);
    coin.body.angle = 0;
    coin.id = this.nextId++;
    coin.lift = isDrop ? 82 : 0;
    coin.loading = loading;
    coin.stackLevel = stackLevel;
    coin.stackAnchor = null;
    coin.x = xFraction;
    coin.z = loading ? this.pusher.position.y / size : zFraction;
    coin.y = coin.lift + stackLevel * radius * BOARD_CONFIG.physics.stackLayerLift;
    coin.spin = 0;
    this.coins.push(coin);
    World.add(this.world, coin.body);
  }

  coinOptions() {
    return {
      label: COIN_LABEL,
      friction: BOARD_CONFIG.physics.coinFriction,
      frictionAir: BOARD_CONFIG.physics.coinAirFriction,
      restitution: BOARD_CONFIG.physics.coinRestitution,
      density: 0.002,
      slop: 0.02,
    };
  }

  step(dt) {
    this.elapsed += dt;
    if (!this.barrier && this.elapsed >= this.nextBarrierAt) this.spawnBarrier();
    this.movePusher();
    Engine.update(this.engine, dt * 1000);
    this.syncCoins(dt);
    this.collectOverflow();
  }

  movePusher() {
    const { pusherTravelStart, pusherTravelDistance, pusherSpeed, pusherHeight } = BOARD_CONFIG.physics;
    const cycle = (1 - Math.cos(this.elapsed * pusherSpeed)) / 2;
    const y = pusherTravelStart + cycle * pusherTravelDistance;
    this.pusherDirection = y - this.pusher.position.y;
    Body.setPosition(this.pusher, { x: BOARD_CONFIG.worldSize / 2, y });
    this.plateFront = (y + pusherHeight / 2) / BOARD_CONFIG.worldSize;
  }

  syncCoins(dt) {
    const size = BOARD_CONFIG.worldSize;
    const radius = BOARD_CONFIG.coinRadius * size;
    const { pusherHeight, pusherTravelStart, pusherTravelDistance, pusherReleaseProgress } = BOARD_CONFIG.physics;
    const releaseLine = pusherTravelStart + pusherTravelDistance * pusherReleaseProgress;
    for (const coin of this.coins) {
      coin.lift = Math.max(0, coin.lift - dt * 310);
      if (coin.loading) {
        Body.setPosition(coin.body, { x: coin.x * size, y: this.pusher.position.y - pusherHeight * 0.2 });
        if (coin.lift === 0 && this.pusherDirection < 0 && this.pusher.position.y <= releaseLine) {
          coin.loading = false;
          Body.setStatic(coin.body, false);
          const releaseY = this.pusher.position.y + pusherHeight / 2 + radius * 1.1;
          Body.setPosition(coin.body, { x: coin.x * size, y: releaseY });
          coin.stackAnchor = coin.stackLevel > 0 ? { x: coin.x * size, y: releaseY } : null;
          Body.setVelocity(coin.body, { x: (Math.random() - 0.5) * 0.35, y: 1.1 });
        }
      }
      coin.x = coin.body.position.x / size;
      coin.z = coin.body.position.y / size;
      if (coin.stackAnchor && Math.hypot(coin.body.position.x - coin.stackAnchor.x, coin.body.position.y - coin.stackAnchor.y) > radius * 1.6) {
        coin.stackLevel = 0;
        coin.stackAnchor = null;
      }
      coin.y = coin.lift + coin.stackLevel * radius * BOARD_CONFIG.physics.stackLayerLift;
      coin.spin = (coin.body.angle * 180) / Math.PI;
      if (coin.body.position.x < radius) Body.setPosition(coin.body, { x: radius, y: coin.body.position.y });
      if (coin.body.position.x > size - radius) Body.setPosition(coin.body, { x: size - radius, y: coin.body.position.y });
    }
  }

  collectOverflow() {
    let count = 0;
    for (let index = this.coins.length - 1; index >= 0; index -= 1) {
      const coin = this.coins[index];
      if (coin.body.position.y <= BOARD_CONFIG.physics.collectionLine) continue;
      Composite.remove(this.world, coin.body);
      this.coins.splice(index, 1);
      this.pool.push(coin);
      count += 1;
    }
    if (count) this.onEvent?.({ type: "coins_collected", count });
  }

  destroy() {
    Events.off(this.engine);
    World.clear(this.world, false);
    Engine.clear(this.engine);
  }
}