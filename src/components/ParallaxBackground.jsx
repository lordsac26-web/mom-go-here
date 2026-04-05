import { useEffect, useRef } from "react";
import Rellax from "rellax";

/**
 * 7-layer parallax background with dramatic depth.
 * Each layer moves at a different speed for a 3D scroll illusion.
 * Layers go from deep background (slowest) to near foreground (fastest).
 */

const LAYERS = [
  // Layer 1: Deep space — nebula glow (slowest)
  {
    speed: -7,
    className: "parallax-layer-1",
    content: (
      <>
        <div className="absolute top-[5%] left-[10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute top-[40%] right-[5%] w-[600px] h-[600px] rounded-full bg-indigo-900/15 blur-[150px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full bg-blue-900/20 blur-[100px]" />
      </>
    ),
  },
  // Layer 2: Distant stars
  {
    speed: -5,
    className: "parallax-layer-2",
    content: (
      <>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              top: `${Math.random() * 200}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          />
        ))}
      </>
    ),
  },
  // Layer 3: Mid-field stars (brighter, slightly larger)
  {
    speed: -4,
    className: "parallax-layer-3",
    content: (
      <>
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-yellow-200/60"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              top: `${Math.random() * 200}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.4 + Math.random() * 0.5,
              boxShadow: `0 0 ${4 + Math.random() * 6}px rgba(253,224,71,0.3)`,
            }}
          />
        ))}
      </>
    ),
  },
  // Layer 4: Nebula clouds — colored wisps
  {
    speed: -3,
    className: "parallax-layer-4",
    content: (
      <>
        <div className="absolute top-[15%] left-[-5%] w-[300px] h-[200px] rounded-full bg-primary/8 blur-[80px] rotate-12" />
        <div className="absolute top-[55%] right-[-10%] w-[350px] h-[180px] rounded-full bg-purple-500/8 blur-[70px] -rotate-12" />
        <div className="absolute top-[120%] left-[20%] w-[280px] h-[250px] rounded-full bg-cyan-500/6 blur-[90px]" />
        <div className="absolute top-[170%] right-[15%] w-[320px] h-[200px] rounded-full bg-primary/6 blur-[85px] rotate-6" />
      </>
    ),
  },
  // Layer 5: Geometric shapes — floating diamonds/circles
  {
    speed: -2,
    className: "parallax-layer-5",
    content: (
      <>
        <div className="absolute top-[8%] right-[15%] w-8 h-8 border border-primary/20 rotate-45" />
        <div className="absolute top-[35%] left-[8%] w-6 h-6 rounded-full border border-purple-400/15" />
        <div className="absolute top-[65%] right-[25%] w-10 h-10 border border-primary/15 rotate-12" />
        <div className="absolute top-[90%] left-[40%] w-5 h-5 rounded-full border border-cyan-400/20" />
        <div className="absolute top-[130%] right-[10%] w-7 h-7 border border-primary/15 rotate-45" />
        <div className="absolute top-[160%] left-[15%] w-9 h-9 rounded-full border border-purple-400/10" />
      </>
    ),
  },
  // Layer 6: Glowing orbs — closer, more visible
  {
    speed: -1,
    className: "parallax-layer-6",
    content: (
      <>
        <div className="absolute top-[20%] left-[5%] w-3 h-3 rounded-full bg-primary/30 shadow-[0_0_12px_rgba(245,158,11,0.3)]" />
        <div className="absolute top-[50%] right-[8%] w-2 h-2 rounded-full bg-cyan-400/25 shadow-[0_0_10px_rgba(34,211,238,0.25)]" />
        <div className="absolute top-[80%] left-[55%] w-4 h-4 rounded-full bg-purple-400/20 shadow-[0_0_14px_rgba(168,85,247,0.2)]" />
        <div className="absolute top-[140%] right-[30%] w-3 h-3 rounded-full bg-primary/25 shadow-[0_0_12px_rgba(245,158,11,0.25)]" />
      </>
    ),
  },
  // Layer 7: Near foreground — subtle light rays (fastest)
  {
    speed: 1,
    className: "parallax-layer-7",
    content: (
      <>
        <div className="absolute top-0 left-[20%] w-px h-[150%] bg-gradient-to-b from-transparent via-primary/5 to-transparent rotate-[15deg]" />
        <div className="absolute top-0 right-[30%] w-px h-[120%] bg-gradient-to-b from-transparent via-purple-400/5 to-transparent -rotate-[10deg]" />
        <div className="absolute top-[50%] left-[60%] w-px h-[100%] bg-gradient-to-b from-transparent via-cyan-400/4 to-transparent rotate-[8deg]" />
      </>
    ),
  },
];

export default function ParallaxBackground() {
  const containerRef = useRef(null);
  const rellaxRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      rellaxRef.current = new Rellax(".rellax-layer", {
        center: false,
        wrapper: null,
        round: true,
        vertical: true,
        horizontal: false,
      });
    }

    return () => {
      if (rellaxRef.current) {
        rellaxRef.current.destroy();
        rellaxRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="parallax-container"
      aria-hidden="true"
    >
      {LAYERS.map((layer, i) => (
        <div
          key={i}
          className={`rellax-layer parallax-layer ${layer.className}`}
          data-rellax-speed={layer.speed}
          data-rellax-zindex={i + 1}
        >
          {layer.content}
        </div>
      ))}
    </div>
  );
}