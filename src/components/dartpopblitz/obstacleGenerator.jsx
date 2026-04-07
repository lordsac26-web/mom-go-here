import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

/**
 * Obstacle types:
 * - platform:  Horizontal bar that slides left ↔ right. Darts bounce off.
 * - spinner:   Rotating blade centered at a point. Darts are destroyed on contact.
 * - pendulum:  Swinging arm that sweeps an arc. Darts are destroyed on contact.
 */

/**
 * Generate obstacles for a preset.
 * obstacleConfig is an array of { type, ... } from the preset.
 */
export function generateObstacles(config) {
  if (!config || config.length === 0) return [];

  const usableTop = 100;
  const usableBot = GAME_HEIGHT - 160;
  const rowCount = config.length;
  const rowH = (usableBot - usableTop) / (rowCount + 1);

  return config.map((def, i) => {
    const baseY = usableTop + rowH * (i + 1);
    const baseX = GAME_WIDTH * (0.25 + Math.random() * 0.5);

    if (def.type === "platform") {
      return {
        id: i,
        type: "platform",
        x: baseX,
        y: baseY,
        width: def.width || 80,
        height: 10,
        speed: def.speed || 1.2,
        direction: Math.random() > 0.5 ? 1 : -1,
        minX: 30,
        maxX: GAME_WIDTH - 30,
        color: "#64748b",
        borderColor: "#94a3b8",
      };
    }

    if (def.type === "spinner") {
      return {
        id: i,
        type: "spinner",
        x: baseX,
        y: baseY,
        armLength: def.armLength || 50,
        armWidth: 8,
        angle: Math.random() * Math.PI * 2,
        speed: def.speed || 0.03,
        color: "#dc2626",
        bladeColor: "#f87171",
      };
    }

    if (def.type === "pendulum") {
      return {
        id: i,
        type: "pendulum",
        pivotX: baseX,
        pivotY: baseY - 40,
        armLength: def.armLength || 60,
        bobRadius: def.bobRadius || 12,
        angle: 0,
        maxAngle: def.maxAngle || Math.PI / 3,
        speed: def.speed || 0.025,
        phase: Math.random() * Math.PI * 2,
        color: "#7c3aed",
        bobColor: "#a78bfa",
      };
    }

    return null;
  }).filter(Boolean);
}

/**
 * Update obstacle positions each frame.
 */
export function updateObstacles(obstacles) {
  return obstacles.map(o => {
    if (o.type === "platform") {
      let newX = o.x + o.speed * o.direction;
      let dir = o.direction;
      if (newX - o.width / 2 < o.minX) { newX = o.minX + o.width / 2; dir = 1; }
      if (newX + o.width / 2 > o.maxX) { newX = o.maxX - o.width / 2; dir = -1; }
      return { ...o, x: newX, direction: dir };
    }

    if (o.type === "spinner") {
      return { ...o, angle: o.angle + o.speed };
    }

    if (o.type === "pendulum") {
      return { ...o, phase: o.phase + o.speed };
    }

    return o;
  });
}

/**
 * Check if a dart collides with any obstacle.
 * Returns true if the dart should be destroyed.
 */
export function checkDartObstacleCollision(dart, obstacles) {
  for (const o of obstacles) {
    if (o.type === "platform") {
      // Axis-aligned rect collision
      const left = o.x - o.width / 2;
      const right = o.x + o.width / 2;
      const top = o.y - o.height / 2;
      const bottom = o.y + o.height / 2;
      if (dart.x >= left && dart.x <= right && dart.y >= top && dart.y <= bottom) {
        return { hit: true, obstacle: o };
      }
    }

    if (o.type === "spinner") {
      // Two arm endpoints from center
      const endpoints = [
        { x: o.x + Math.cos(o.angle) * o.armLength, y: o.y + Math.sin(o.angle) * o.armLength },
        { x: o.x - Math.cos(o.angle) * o.armLength, y: o.y - Math.sin(o.angle) * o.armLength },
      ];
      // Check point-to-line-segment distance
      if (pointToSegmentDist(dart.x, dart.y, endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y) < o.armWidth + 6) {
        return { hit: true, obstacle: o };
      }
    }

    if (o.type === "pendulum") {
      const swingAngle = Math.sin(o.phase) * o.maxAngle;
      const bobX = o.pivotX + Math.sin(swingAngle) * o.armLength;
      const bobY = o.pivotY + Math.cos(swingAngle) * o.armLength;
      // Check arm line
      if (pointToSegmentDist(dart.x, dart.y, o.pivotX, o.pivotY, bobX, bobY) < 6) {
        return { hit: true, obstacle: o };
      }
      // Check bob circle
      const dx = dart.x - bobX;
      const dy = dart.y - bobY;
      if (Math.sqrt(dx * dx + dy * dy) < o.bobRadius + 6) {
        return { hit: true, obstacle: o };
      }
    }
  }
  return { hit: false };
}

/** Point-to-segment distance */
function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

/**
 * Draw all obstacles on canvas.
 */
export function drawObstacles(ctx, obstacles, time) {
  obstacles.forEach(o => {
    ctx.save();

    if (o.type === "platform") {
      const left = o.x - o.width / 2;
      const top = o.y - o.height / 2;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(left + 2, top + 3, o.width, o.height);

      // Platform body
      ctx.fillStyle = o.color;
      ctx.fillRect(left, top, o.width, o.height);
      ctx.strokeStyle = o.borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, o.width, o.height);

      // Warning stripes
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, o.width, o.height);
      ctx.clip();
      ctx.strokeStyle = "rgba(234,179,8,0.5)";
      ctx.lineWidth = 3;
      for (let sx = left - o.height; sx < left + o.width + o.height; sx += 12) {
        ctx.beginPath();
        ctx.moveTo(sx, top);
        ctx.lineTo(sx + o.height, top + o.height);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (o.type === "spinner") {
      // Center hub glow
      ctx.beginPath();
      ctx.arc(o.x, o.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220,38,38,0.3)";
      ctx.fill();

      // Blade
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angle);
      ctx.fillStyle = o.bladeColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, o.armLength, o.armWidth / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = o.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Second blade (cross pattern)
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = o.bladeColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, o.armLength * 0.6, o.armWidth / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = o.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center bolt
      ctx.rotate(-Math.PI / 2 - o.angle);
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (o.type === "pendulum") {
      const swingAngle = Math.sin(o.phase) * o.maxAngle;
      const bobX = o.pivotX + Math.sin(swingAngle) * o.armLength;
      const bobY = o.pivotY + Math.cos(swingAngle) * o.armLength;

      // Pivot
      ctx.beginPath();
      ctx.arc(o.pivotX, o.pivotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#475569";
      ctx.fill();

      // Arm
      ctx.beginPath();
      ctx.moveTo(o.pivotX, o.pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Bob shadow
      ctx.beginPath();
      ctx.arc(bobX + 2, bobY + 3, o.bobRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fill();

      // Bob
      ctx.beginPath();
      ctx.arc(bobX, bobY, o.bobRadius, 0, Math.PI * 2);
      ctx.fillStyle = o.bobColor;
      ctx.fill();
      ctx.strokeStyle = o.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Highlight
      ctx.beginPath();
      ctx.arc(bobX - o.bobRadius * 0.3, bobY - o.bobRadius * 0.3, o.bobRadius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fill();

      // Warning emoji
      ctx.font = `${o.bobRadius}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⚡", bobX, bobY);
    }

    ctx.restore();
  });
}