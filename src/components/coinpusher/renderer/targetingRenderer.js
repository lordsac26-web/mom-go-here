import { BOARD_CONFIG } from "../engine/boardConfig";

export function renderAttackLane(context, width, height, engine, dropX) {
  const x = dropX * width;
  const barrierX = engine.barrier?.position.x / BOARD_CONFIG.worldSize * width;
  const barrierWidth = engine.barrier
    ? (engine.barrier.bounds.max.x - engine.barrier.bounds.min.x) / BOARD_CONFIG.worldSize * width
    : 0;
  const isAligned = barrierX && Math.abs(x - barrierX) <= barrierWidth / 2;
  context.save();
  context.strokeStyle = isAligned ? "rgba(251, 146, 60, 0.78)" : "rgba(186, 230, 253, 0.5)";
  context.lineWidth = isAligned ? 3 : 2;
  context.setLineDash([7, 7]);
  context.beginPath();
  context.moveTo(x, engine.plateFront * height);
  context.lineTo(x, height * 0.88);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = isAligned ? "#fb923c" : "#bae6fd";
  context.font = "900 11px Nunito, sans-serif";
  context.textAlign = "center";
  context.fillText(isAligned ? "ATTACK LINE" : "DROP LINE", x, height * 0.88);
  context.restore();
}