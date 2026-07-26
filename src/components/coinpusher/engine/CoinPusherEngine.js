import Matter from "matter-js";
import { BOARD_CONFIG } from "./boardConfig";

const { Bodies, Body, Composite, Engine, Events, Sleeping, World } = Matter;
const COIN_LABEL = "pusher-coin";
const PEG_LABEL = "pusher-peg";

export default class CoinPusherEngine {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.coins = [];
    this.pool = [];
    this.nextId = 1;
    this.elapsed = 0;
    this.plateFront = 0.1;
    this.lastImpactAt = -1;
    this.engine = Engine.create({ gravity: { x: 0, y: BOARD_CONFIG.physics.gravity, scale: 0.001 } });
    this.world = this.engine.world;
    this.createMachineBodies();
    this.handleCollisions();
  }

  createMachineBodies() {
    const size = BOARD_CONFIG.worldSize;
    const { wallThickness, pusherHeight } = BOARD_CONFIG.physics;
    const staticOptions = { isStatic: true, friction: 0.3, restitution: 0.04 };
    this.pusher = Bodies.rectangle(size / 2, 85, size - wallThickness * 2, pusherHeight, { ...staticOptions, label: "pusher-plate" });
    const walls = [
      Bodies.rectangle(wallThickness / 2, size / 2, wallThickness, size * 1.2, staticOptions),
      Bodies.rectangle(size - wallThickness / 2, size / 2, wallThickness, size * 1.2, staticOptions),
      Bodies.rectangle(size / 2, -wallThickness / 2, size, wallThickness, staticOptions),
    ];
    const pegs = BOARD_CONFIG.pegs.map(({ x, z }) => Bodies.circle(x * size, z * size, BOARD_CONFIG.pegRadius * size, { ...staticOptions, label: PEG_LABEL, restitution: 0.45 }));
    World.add(this.world, [this.pusher, ...walls, ...pegs]);
  }

  handleCollisions() {
    Events.on(this.engine, "collisionStart", ({ pairs }) => {
      if (this.elapsed - this.lastImpactAt < 0.045) return;
      const impact = pairs.find(({ bodyA, bodyB }) => (bodyA.label === COIN_LABEL && bodyB.label === PEG_LABEL) || (bodyB.label === COIN_LABEL && bodyA.label === PEG_LABEL));
      if (impact) {
        const coin = impact.bodyA.label === COIN_LABEL ? impact.bodyA : impact.bodyB;
        this.lastImpactAt = this.elapsed;
        this.onEvent?.({ type: "coin_impact", x: coin.position.x / BOARD_CONFIG.worldSize, z: coin.position.y / BOARD_CONFIG.worldSize });
      }
    });
  }

  seed() {
    for (let index = 0; index < 16; index += 1) this.spawn(0.15 + Math.random() * 0.7, 0.42 + Math.random() * 0.43, false);
  }

  drop(x) {
    if (this.coins.length < BOARD_CONFIG.maxCoins) {
      const pusherFront = this.pusher.position.y + BOARD_CONFIG.physics.pusherHeight / 2 + BOARD_CONFIG.coinRadius * BOARD_CONFIG.worldSize * 1.25;
      this.spawn(x, Math.min(0.86, pusherFront / BOARD_CONFIG.worldSize), true);
      this.onEvent?.({ type: "coin_dropped", x });
    }
  }

  spawn(xFraction, zFraction, isDrop) {
    const size = BOARD_CONFIG.worldSize;
    const radius = BOARD_CONFIG.coinRadius * size;
    const x = Math.max(radius + BOARD_CONFIG.physics.wallThickness, Math.min(size - radius - BOARD_CONFIG.physics.wallThickness, xFraction * size));
    const y = zFraction * size;
    const coin = this.pool.pop() || { body: Bodies.circle(x, y, radius, this.coinOptions()), lift: 0 };

    if (coin.body.isSleeping) Sleeping.set(coin.body, false);
    Body.setPosition(coin.body, { x, y });
    Body.setVelocity(coin.body, { x: (Math.random() - 0.5) * 1.6, y: isDrop ? 2.4 : 0 });
    Body.setAngularVelocity(coin.body, (Math.random() - 0.5) * 0.08);
    coin.body.angle = 0;
    coin.id = this.nextId++;
    coin.lift = isDrop ? 82 : 0;
    coin.x = xFraction;
    coin.z = zFraction;
    coin.y = coin.lift;
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
    this.movePusher();
    Engine.update(this.engine, dt * 1000);
    this.syncCoins(dt);
    this.collectOverflow();
  }

  movePusher() {
    const { pusherTravelStart, pusherTravelDistance, pusherSpeed } = BOARD_CONFIG.physics;
    const cycle = (1 - Math.cos(this.elapsed * pusherSpeed)) / 2;
    const y = pusherTravelStart + cycle * pusherTravelDistance;
    Body.setPosition(this.pusher, { x: BOARD_CONFIG.worldSize / 2, y });
    this.plateFront = y / BOARD_CONFIG.worldSize;
  }

  syncCoins(dt) {
    const size = BOARD_CONFIG.worldSize;
    const radius = BOARD_CONFIG.coinRadius * size;
    for (const coin of this.coins) {
      coin.x = coin.body.position.x / size;
      coin.z = coin.body.position.y / size;
      coin.lift = Math.max(0, coin.lift - dt * 310);
      coin.y = coin.lift;
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