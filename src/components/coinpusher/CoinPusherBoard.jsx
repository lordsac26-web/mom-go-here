import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import CoinPusherEngine from "./engine/CoinPusherEngine";
import { BOARD_CONFIG } from "./engine/boardConfig";
import { renderCoinPusher } from "./renderer/CoinPusherRenderer";

const CoinPusherBoard = forwardRef(function CoinPusherBoard({ dropX, onCollect }, ref) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const onCollectRef = useRef(onCollect);
  const dropXRef = useRef(dropX);

  onCollectRef.current = onCollect;
  dropXRef.current = dropX;

  if (!engineRef.current) {
    engineRef.current = new CoinPusherEngine((event) => {
      if (event.type === "coins_collected") onCollectRef.current?.(event.count);
    });
    engineRef.current.seed();
  }

  useImperativeHandle(ref, () => ({
    dropCoin: (x) => engineRef.current?.drop(x),
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    let frameId = 0;
    let lastTime = performance.now();
    let accumulator = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * density);
      canvas.height = Math.round(bounds.height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const frame = (time) => {
      accumulator = Math.min(accumulator + (time - lastTime) / 1000, 0.1);
      lastTime = time;
      while (accumulator >= BOARD_CONFIG.fixedStep) {
        engineRef.current.step(BOARD_CONFIG.fixedStep);
        accumulator -= BOARD_CONFIG.fixedStep;
      }
      const bounds = canvas.getBoundingClientRect();
      renderCoinPusher(context, bounds.width, bounds.height, engineRef.current, dropXRef.current);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-label="Coin pusher machine" className="h-full w-full rounded-2xl border-2 border-sky-400/60 shadow-[0_0_30px_rgba(14,165,233,0.22),inset_0_0_28px_rgba(56,189,248,0.16)] touch-none" />;
});

export default CoinPusherBoard;