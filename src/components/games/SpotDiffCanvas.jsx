import { useRef, useEffect, useState, useCallback } from "react";

const CANVAS_W = 600;
const CANVAS_H = 400;

export default function SpotDiffCanvas({ puzzle, found, onFound, onMiss, tapped }) {
  const origRef = useRef(null);
  const modRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // Load the base image and draw both canvases
  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      drawCanvases(img);
      setLoaded(true);
    };
    img.onerror = () => {
      // Draw a placeholder if image fails
      imgRef.current = null;
      drawPlaceholders();
      setLoaded(true);
    };
    img.src = puzzle.baseImage;
  }, [puzzle]);

  // Redraw when found changes
  useEffect(() => {
    if (imgRef.current && loaded) {
      drawCanvases(imgRef.current);
    }
  }, [found, loaded]);

  function drawPlaceholders() {
    [origRef, modRef].forEach(ref => {
      const ctx = ref.current?.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#e2b714";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Image loading...", CANVAS_W / 2, CANVAS_H / 2);
    });
  }

  function drawCanvases(img) {
    // Draw original (clean)
    const origCtx = origRef.current?.getContext("2d");
    if (origCtx) {
      origCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      origCtx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
    }

    // Draw modified (with differences painted on)
    const modCtx = modRef.current?.getContext("2d");
    if (modCtx) {
      modCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      modCtx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);

      // Apply each difference as a colored region
      puzzle.differences.forEach(d => {
        // Draw the difference (a subtle blended shape)
        modCtx.save();
        modCtx.globalAlpha = 0.7;
        modCtx.fillStyle = d.color;
        // Use rounded rect for more natural look
        modCtx.beginPath();
        const r = 8;
        modCtx.moveTo(d.x + r, d.y);
        modCtx.lineTo(d.x + d.w - r, d.y);
        modCtx.quadraticCurveTo(d.x + d.w, d.y, d.x + d.w, d.y + r);
        modCtx.lineTo(d.x + d.w, d.y + d.h - r);
        modCtx.quadraticCurveTo(d.x + d.w, d.y + d.h, d.x + d.w - r, d.y + d.h);
        modCtx.lineTo(d.x + r, d.y + d.h);
        modCtx.quadraticCurveTo(d.x, d.y + d.h, d.x, d.y + d.h - r);
        modCtx.lineTo(d.x, d.y + r);
        modCtx.quadraticCurveTo(d.x, d.y, d.x + r, d.y);
        modCtx.closePath();
        modCtx.fill();
        modCtx.restore();

        // If found, draw a green circle marker on both
        if (found.includes(d.id)) {
          [origCtx, modCtx].forEach(ctx => {
            if (!ctx) return;
            ctx.save();
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 3]);
            const cx = d.x + d.w / 2;
            const cy = d.y + d.h / 2;
            const rx = d.w / 2 + 8;
            const ry = d.h / 2 + 8;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            // Checkmark
            ctx.setLineDash([]);
            ctx.fillStyle = "#22c55e";
            ctx.font = "bold 20px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("✓", cx, cy + 7);
            ctx.restore();
          });
        }
      });
    }
  }

  // Handle click/tap on the modified canvas
  const handleModClick = useCallback((e) => {
    const rect = modRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if click is within any unfound difference
    for (const d of puzzle.differences) {
      if (found.includes(d.id)) continue;
      // Add some padding for easier tapping
      const pad = 15;
      if (
        clickX >= d.x - pad && clickX <= d.x + d.w + pad &&
        clickY >= d.y - pad && clickY <= d.y + d.h + pad
      ) {
        onFound(d.id);
        return;
      }
    }

    // Miss
    onMiss(clickX, clickY);
  }, [puzzle, found, onFound, onMiss]);

  // Handle touch on the modified canvas
  const handleModTouch = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = modRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const clickX = (touch.clientX - rect.left) * scaleX;
    const clickY = (touch.clientY - rect.top) * scaleY;

    for (const d of puzzle.differences) {
      if (found.includes(d.id)) continue;
      const pad = 15;
      if (
        clickX >= d.x - pad && clickX <= d.x + d.w + pad &&
        clickY >= d.y - pad && clickY <= d.y + d.h + pad
      ) {
        onFound(d.id);
        return;
      }
    }
    onMiss(clickX, clickY);
  }, [puzzle, found, onFound, onMiss]);

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      {/* Original image label */}
      <div>
        <p className="text-center text-base font-black text-foreground mb-1">📷 Original</p>
        <canvas
          ref={origRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full rounded-xl border-2 border-border"
          style={{ imageRendering: "auto" }}
        />
      </div>

      {/* Modified image — clickable */}
      <div>
        <p className="text-center text-base font-black text-primary mb-1">🔍 Tap the differences here!</p>
        <div className="relative">
          <canvas
            ref={modRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full rounded-xl border-4 border-primary cursor-pointer"
            style={{ imageRendering: "auto" }}
            onClick={handleModClick}
            onTouchStart={handleModTouch}
          />

          {/* Miss feedback */}
          {tapped && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${(tapped.x / CANVAS_W) * 100}%`,
                top: `${(tapped.y / CANVAS_H) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="text-3xl animate-ping">❌</div>
            </div>
          )}
        </div>
      </div>

      {!loaded && (
        <div className="text-center py-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-2">Loading puzzle...</p>
        </div>
      )}
    </div>
  );
}