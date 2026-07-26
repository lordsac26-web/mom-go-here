const sprites = new Map();

function makeCanvas(size) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(size, size);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

export function getCoinSprite(radius) {
  const size = Math.max(24, Math.round(radius * 2.6));
  if (sprites.has(size)) return sprites.get(size);

  const canvas = makeCanvas(size);
  const context = canvas.getContext("2d");
  const center = size / 2;
  const coinRadius = size * 0.37;
  const face = context.createRadialGradient(center - coinRadius * 0.35, center - coinRadius * 0.4, coinRadius * 0.08, center, center, coinRadius);
  face.addColorStop(0, "#fff9d8");
  face.addColorStop(0.28, "#fde68a");
  face.addColorStop(0.58, "#fbbf24");
  face.addColorStop(0.82, "#d97706");
  face.addColorStop(1, "#78350f");

  context.shadowColor = "rgba(0,0,0,0.55)";
  context.shadowBlur = size * 0.05;
  context.shadowOffsetY = size * 0.035;
  context.beginPath();
  context.arc(center, center, coinRadius, 0, Math.PI * 2);
  context.fillStyle = face;
  context.fill();
  context.shadowColor = "transparent";

  context.lineWidth = Math.max(1, size * 0.04);
  context.strokeStyle = "rgba(120,53,15,0.85)";
  context.beginPath();
  context.arc(center, center, coinRadius * 0.78, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = "rgba(255,255,255,0.4)";
  context.beginPath();
  context.arc(center - coinRadius * 0.08, center - coinRadius * 0.08, coinRadius * 0.54, Math.PI * 1.12, Math.PI * 1.78);
  context.stroke();

  sprites.set(size, canvas);
  return canvas;
}