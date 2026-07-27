import { BOARD_CONFIG } from "../engine/boardConfig";
import { getCoinSprite } from "./coinSprites";
import { renderBarrier, renderGlass, renderMachine } from "./machineRenderer";

function renderCoins(context, width, height, coins) {
  const radius = BOARD_CONFIG.coinRadius * width;
  const sprite = getCoinSprite(radius);
  const spriteSize = radius * 2.6;

  coins.forEach((coin) => {
    const x = coin.x * width;
    const y = coin.z * height - coin.y;
    context.save();
    context.translate(x, y);
    context.rotate((coin.spin * Math.PI) / 180);
    context.drawImage(sprite, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
    context.restore();
  });
}

export function renderCoinPusher(context, width, height, engine, dropX, feedback) {
  context.clearRect(0, 0, width, height);
  const offset = feedback?.offset() || { x: 0, y: 0 };
  context.save();
  context.translate(offset.x, offset.y);
  renderMachine(context, width, height, engine, dropX);
  renderCoins(context, width, height, engine.coins);
  renderBarrier(context, width, height, engine);
  context.restore();
  feedback?.render(context, width, height);
  renderGlass(context, width, height);
}