import { getFrameById } from "./frameDefinitions";

/**
 * Renders an image inside a decorative CSS frame.
 * Used in both the Art Studio preview and the Gallery.
 */
export default function FramedImage({ src, alt, frameId, className = "" }) {
  const frame = getFrameById(frameId);

  if (!frameId || frameId === "none") {
    return (
      <img
        src={src}
        alt={alt || "Artwork"}
        className={`w-full rounded-xl border-2 border-border ${className}`}
        loading="lazy"
      />
    );
  }

  const hasCorners = frame.cornerStyle === "ornate";

  return (
    <div
      className={`relative ${className}`}
      style={{
        padding: frame.borderWidth,
        background: frame.outerBg,
        borderRadius: 16,
        boxShadow: frame.shadow,
      }}
    >
      {/* Inner mat / liner */}
      <div
        style={{
          padding: Math.max(2, frame.borderWidth * 0.2),
          background: "rgba(0,0,0,0.15)",
          borderRadius: 10,
        }}
      >
        <img
          src={src}
          alt={alt || "Artwork"}
          className="w-full rounded-lg"
          style={{ display: "block" }}
          loading="lazy"
        />
      </div>

      {/* Corner ornaments for ornate frames */}
      {hasCorners && (
        <>
          <CornerOrnament position="top-left" color={frame.borderColor} />
          <CornerOrnament position="top-right" color={frame.borderColor} />
          <CornerOrnament position="bottom-left" color={frame.borderColor} />
          <CornerOrnament position="bottom-right" color={frame.borderColor} />
        </>
      )}
    </div>
  );
}

function CornerOrnament({ position, color }) {
  const posMap = {
    "top-left": { top: 2, left: 2 },
    "top-right": { top: 2, right: 2 },
    "bottom-left": { bottom: 2, left: 2 },
    "bottom-right": { bottom: 2, right: 2 },
  };

  return (
    <div
      className="absolute w-5 h-5 pointer-events-none"
      style={{
        ...posMap[position],
        borderRadius: 3,
        background: `radial-gradient(circle at center, rgba(255,255,255,0.5), ${color})`,
        opacity: 0.7,
      }}
    />
  );
}