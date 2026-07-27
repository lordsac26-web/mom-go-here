import { BOARD_CONFIG } from "../engine/boardConfig";

function metalGradient(context, x0, y0, x1, y1, stops) {
  const gradient = context.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  return gradient;
}

function drawRivet(context, x, y, radius) {
  const rivet = context.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 1, x, y, radius);
  rivet.addColorStop(0, "#e2e8f0");
  rivet.addColorStop(0.7, "#64748b");
  rivet.addColorStop(1, "#1e293b");
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = rivet;
  context.fill();
}

export function renderMachine(context, width, height, engine, dropX) {
  const railWidth = Math.max(12, width * 0.042);
  const inset = railWidth + 3;
  const plateHeight = engine.plateFront * height;
  const cabinet = context.createRadialGradient(width * 0.5, height * 0.35, width * 0.05, width * 0.5, height * 0.52, height * 0.92);
  cabinet.addColorStop(0, "#24445b");
  cabinet.addColorStop(0.6, "#122334");
  cabinet.addColorStop(1, "#07111d");
  context.fillStyle = cabinet;
  context.fillRect(0, 0, width, height);

  const leftRail = metalGradient(context, 0, 0, railWidth, 0, [[0, "#0f172a"], [0.35, "#94a3b8"], [0.57, "#334155"], [1, "#020617"]]);
  context.fillStyle = leftRail;
  context.fillRect(0, 0, railWidth, height);
  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.fillStyle = leftRail;
  context.fillRect(0, 0, railWidth, height);
  context.restore();

  context.fillStyle = "rgba(14,165,233,0.18)";
  context.fillRect(inset, 0, width - inset * 2, height);
  context.fillStyle = "rgba(255,255,255,0.08)";
  context.fillRect(inset, 0, width - inset * 2, 3);

  const plate = metalGradient(context, 0, 0, 0, plateHeight, [[0, "#0c4a6e"], [0.28, "#38bdf8"], [0.82, "#0369a1"], [1, "#082f49"]]);
  context.fillStyle = plate;
  context.fillRect(inset, 0, width - inset * 2, plateHeight);
  context.fillStyle = "rgba(255,255,255,0.55)";
  context.fillRect(inset, plateHeight - 3, width - inset * 2, 3);
  context.fillStyle = "rgba(2,6,23,0.38)";
  context.fillRect(inset, plateHeight, width - inset * 2, 8);
  context.fillStyle = "rgba(186,230,253,0.12)";
  context.fillRect(inset, Math.max(0, plateHeight - height * 0.12), width - inset * 2, height * 0.08);

  const lampY = 13;
  for (let x = inset + 12; x < width - inset; x += 24) {
    const intensity = 0.6 + Math.sin(engine.elapsed * 3 + x) * 0.25;
    context.fillStyle = `rgba(125, 211, 252, ${intensity})`;
    context.shadowColor = "#38bdf8";
    context.shadowBlur = 8;
    context.beginPath();
    context.arc(x, lampY, 2.5, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowColor = "transparent";

  BOARD_CONFIG.pegs.forEach((peg) => {
    const x = peg.x * width;
    const y = peg.z * height;
    const radius = BOARD_CONFIG.pegRadius * 2 * width;
    context.beginPath();
    context.arc(x + 2, y + 3, radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(0,0,0,0.55)";
    context.fill();
    const face = context.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 1, x, y, radius);
    face.addColorStop(0, "#f1f5f9");
    face.addColorStop(0.58, "#94a3b8");
    face.addColorStop(1, "#334155");
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = face;
    context.fill();
  });

  if (!engine.gateOpen) {
    const { gate } = BOARD_CONFIG;
    const gateWidth = gate.width * width;
    const gateHeight = Math.max(10, gate.height * height);
    const gateX = gate.x * width - gateWidth / 2;
    const gateY = gate.z * height - gateHeight / 2;
    context.save();
    context.shadowColor = "#facc15";
    context.shadowBlur = 14;
    context.fillStyle = "#a16207";
    context.fillRect(gateX, gateY, gateWidth, gateHeight);
    context.fillStyle = "#fde047";
    context.fillRect(gateX + 3, gateY + 3, gateWidth - 6, 3);
    context.shadowColor = "transparent";
    context.fillStyle = "#fff7ed";
    context.font = "900 12px Nunito, sans-serif";
    context.textAlign = "center";
    context.fillText(`GATE ${engine.gateHits}/${gate.hitsToOpen}`, gate.x * width, gateY - 7);
    context.restore();
  }

  context.save();
  const shelfMarkerY = plateHeight - (BOARD_CONFIG.physics.pusherHeight / BOARD_CONFIG.worldSize) * height * 0.7;
  context.translate(dropX * width, shelfMarkerY);
  context.shadowColor = "#38bdf8";
  context.shadowBlur = 14;
  context.fillStyle = "#bae6fd";
  context.beginPath();
  context.moveTo(0, 15);
  context.lineTo(-9, 0);
  context.lineTo(9, 0);
  context.closePath();
  context.fill();
  context.restore();

  const chute = metalGradient(context, 0, height - 22, 0, height, [[0, "#fef08a"], [0.3, "#ca8a04"], [1, "#713f12"]]);
  context.fillStyle = chute;
  context.fillRect(0, height - 16, width, 16);
  context.fillStyle = "rgba(2,6,23,0.55)";
  context.fillRect(inset, height - 28, width - inset * 2, 13);

  [inset * 0.5, width - inset * 0.5].forEach((x) => {
    [28, height * 0.42, height - 32].forEach((y) => drawRivet(context, x, y, 3));
  });
}

export function renderGlass(context, width, height) {
  const glow = context.createLinearGradient(0, 0, width, height);
  glow.addColorStop(0, "rgba(255,255,255,0.17)");
  glow.addColorStop(0.2, "rgba(255,255,255,0.03)");
  glow.addColorStop(0.55, "rgba(255,255,255,0)");
  glow.addColorStop(1, "rgba(56,189,248,0.1)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.11)";
  context.fillRect(width * 0.08, 0, width * 0.045, height * 0.62);
}