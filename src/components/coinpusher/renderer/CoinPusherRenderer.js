import { BOARD_CONFIG } from "../engine/boardConfig";

function circle(context, x, y, radius, fill) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.fill();
}

export function renderCoinPusher(context, width, height, engine, dropX) {
  context.clearRect(0, 0, width, height);
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#1e293b");
  background.addColorStop(1, "#0f172a");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const railWidth = Math.max(10, width * 0.035);
  context.fillStyle = "#475569";
  context.fillRect(0, 0, railWidth, height);
  context.fillRect(width - railWidth, 0, railWidth, height);

  const plateHeight = engine.plateFront * height;
  const plate = context.createLinearGradient(0, 0, 0, plateHeight);
  plate.addColorStop(0, "#0369a1");
  plate.addColorStop(1, "#7dd3fc");
  context.fillStyle = plate;
  context.fillRect(railWidth, 0, width - railWidth * 2, plateHeight);
  context.fillStyle = "rgba(255,255,255,0.45)";
  context.fillRect(railWidth, plateHeight - 3, width - railWidth * 2, 3);

  BOARD_CONFIG.pegs.forEach((peg) => {
    const x = peg.x * width;
    const y = peg.z * height;
    const radius = BOARD_CONFIG.pegRadius * 2 * width;
    circle(context, x + 1, y + 2, radius, "rgba(0,0,0,0.45)");
    circle(context, x, y, radius, "#94a3b8");
    circle(context, x - radius * 0.22, y - radius * 0.24, radius * 0.3, "#e2e8f0");
  });

  engine.coins.forEach((coin) => {
    const radius = BOARD_CONFIG.coinRadius * width;
    const x = coin.x * width;
    const y = coin.z * height - coin.y;
    circle(context, x + 2, y + 4 + coin.y * 0.05, radius, "rgba(0,0,0,0.48)");
    const face = context.createRadialGradient(x - radius * 0.28, y - radius * 0.34, radius * 0.1, x, y, radius);
    face.addColorStop(0, "#fef3c7");
    face.addColorStop(0.4, "#fde047");
    face.addColorStop(0.72, "#f59e0b");
    face.addColorStop(1, "#92400e");
    circle(context, x, y, radius, face);
    context.lineWidth = Math.max(1, radius * 0.08);
    context.strokeStyle = "rgba(120,53,15,0.65)";
    context.beginPath();
    context.arc(x, y, radius * 0.72, 0, Math.PI * 2);
    context.stroke();
  });

  const markerY = engine.plateFront * height;
  context.save();
  context.translate(dropX * width, markerY);
  context.fillStyle = "#7dd3fc";
  context.shadowColor = "#38bdf8";
  context.shadowBlur = 10;
  context.beginPath();
  context.moveTo(0, 15);
  context.lineTo(-9, 0);
  context.lineTo(9, 0);
  context.closePath();
  context.fill();
  context.restore();

  const ledge = context.createLinearGradient(0, height - 16, 0, height);
  ledge.addColorStop(0, "rgba(253,224,71,0.35)");
  ledge.addColorStop(1, "rgba(250,204,21,0.8)");
  context.fillStyle = ledge;
  context.fillRect(0, height - 14, width, 14);
}