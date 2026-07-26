const MAX_PARTICLES = window.innerWidth < 640 ? 28 : 54;

export default class CoinPusherFeedback {
  constructor() {
    this.particles = [];
    this.scores = [];
    this.shake = 0;
  }

  emit(event) {
    if (event.type === "coin_impact") {
      this.addBurst(event.x ?? 0.5, event.z ?? 0.45, 5, "#7dd3fc", 0.6);
      this.shake = Math.max(this.shake, 1.5);
    }
    if (event.type === "coin_dropped") this.addBurst(event.x, 0.24, 8, "#fde68a", 1);
    if (event.type === "coins_collected") {
      const count = event.count || 1;
      this.addBurst(0.5, 0.94, Math.min(18, count * 7), "#fde047", 2.4);
      this.scores.push({ life: 0.9, maxLife: 0.9, value: count, x: 0.5, z: 0.88 });
      this.shake = Math.max(this.shake, Math.min(6, count * 2.5));
    }
  }

  addBurst(x, z, count, color, speed) {
    const room = Math.max(0, MAX_PARTICLES - this.particles.length);
    for (let index = 0; index < Math.min(count, room); index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (0.3 + Math.random() * 0.7) * speed;
      this.particles.push({ x, z, vx: Math.cos(angle) * velocity, vz: Math.sin(angle) * velocity, life: 0.35 + Math.random() * 0.25, maxLife: 0.6, size: 1.5 + Math.random() * 2.5, color });
    }
  }

  step(dt) {
    this.shake = Math.max(0, this.shake - dt * 17);
    this.particles = this.particles.filter((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.z += particle.vz * dt;
      particle.vz += 0.45 * dt;
      return particle.life > 0;
    });
    this.scores = this.scores.filter((score) => {
      score.life -= dt;
      score.z -= 0.13 * dt;
      return score.life > 0;
    });
  }

  offset() {
    if (!this.shake) return { x: 0, y: 0 };
    const magnitude = this.shake * 0.65;
    return { x: (Math.random() - 0.5) * magnitude, y: (Math.random() - 0.5) * magnitude };
  }

  render(context, width, height) {
    for (const particle of this.particles) {
      const opacity = Math.max(0, particle.life / particle.maxLife);
      context.fillStyle = particle.color;
      context.globalAlpha = opacity;
      context.beginPath();
      context.arc(particle.x * width, particle.z * height, particle.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    for (const score of this.scores) {
      const progress = 1 - score.life / score.maxLife;
      context.save();
      context.globalAlpha = score.life / score.maxLife;
      context.font = "900 22px Nunito, sans-serif";
      context.textAlign = "center";
      context.lineWidth = 5;
      context.strokeStyle = "#713f12";
      context.strokeText(`+${score.value} 🪙`, score.x * width, score.z * height - progress * 10);
      context.fillStyle = "#fef08a";
      context.fillText(`+${score.value} 🪙`, score.x * width, score.z * height - progress * 10);
      context.restore();
    }
  }
}