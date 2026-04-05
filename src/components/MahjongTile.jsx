/**
 * Authentic Mahjong tile component with CSS 3D depth and
 * clearly rendered suit markings using SVG drawings.
 *
 * Suits: Bamboo (條), Circles (筒), Characters (萬), Winds, Dragons
 */

// ─── Rendering helpers ────────────────────────────────────────

function CircleDot({ cx, cy, r = 6, color = "#1a7a4c" }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r * 0.4} fill={color} />
    </g>
  );
}

function BambooStick({ x, y, height = 18, color = "#1a7a4c" }) {
  const w = 5;
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={height} rx={2} fill={color} />
      <rect x={x - w / 2 - 1} y={y + height * 0.3} width={w + 2} height={3} rx={1} fill="#0d5c37" />
      <rect x={x - w / 2 - 1} y={y + height * 0.6} width={w + 2} height={3} rx={1} fill="#0d5c37" />
    </g>
  );
}

const CHINESE_NUMS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

function CharacterFace({ value }) {
  return (
    <g>
      <text x="24" y="22" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#c41e3a" fontFamily="serif">
        {CHINESE_NUMS[value - 1]}
      </text>
      <text x="24" y="40" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1a1a1a" fontFamily="serif">
        萬
      </text>
    </g>
  );
}

function CircleFace({ value }) {
  const positions = {
    1: [[24, 24]],
    2: [[24, 14], [24, 34]],
    3: [[24, 10], [14, 32], [34, 32]],
    4: [[14, 14], [34, 14], [14, 34], [34, 34]],
    5: [[14, 14], [34, 14], [24, 24], [14, 34], [34, 34]],
    6: [[14, 10], [34, 10], [14, 24], [34, 24], [14, 38], [34, 38]],
    7: [[14, 8], [34, 8], [24, 18], [14, 28], [34, 28], [14, 40], [34, 40]],
    8: [[14, 8], [34, 8], [14, 20], [34, 20], [14, 32], [34, 32], [24, 40], [24, 14]],
    9: [[12, 10], [24, 10], [36, 10], [12, 24], [24, 24], [36, 24], [12, 38], [24, 38], [36, 38]],
  };
  const pts = positions[value] || positions[1];
  const colors = ["#1a7a4c", "#c41e3a", "#2563eb"];
  return (
    <g>
      {pts.map((p, i) => (
        <CircleDot key={i} cx={p[0]} cy={p[1]} r={value > 6 ? 4.5 : 6} color={colors[i % colors.length]} />
      ))}
    </g>
  );
}

function BambooFace({ value }) {
  if (value === 1) {
    // Special: bird on bamboo
    return (
      <g>
        <BambooStick x={24} y={20} height={22} color="#1a7a4c" />
        <circle cx={24} cy={14} r={6} fill="#c41e3a" />
        <circle cx={22} cy={13} r={1.2} fill="white" />
      </g>
    );
  }
  const cols = value <= 3 ? 1 : value <= 6 ? 2 : 3;
  const rows = Math.ceil(value / cols);
  const sticks = [];
  let idx = 0;
  const startX = cols === 1 ? 24 : cols === 2 ? 15 : 11;
  const gapX = cols === 1 ? 0 : cols === 2 ? 18 : 13;
  const startY = rows <= 2 ? 10 : 4;
  const gapY = rows <= 2 ? 20 : 14;
  const h = rows <= 2 ? 18 : 13;

  for (let r = 0; r < rows && idx < value; r++) {
    for (let c = 0; c < cols && idx < value; c++) {
      const color = idx % 2 === 0 ? "#1a7a4c" : "#c41e3a";
      sticks.push(
        <BambooStick
          key={idx}
          x={startX + c * gapX}
          y={startY + r * gapY}
          height={h}
          color={color}
        />
      );
      idx++;
    }
  }
  return <g>{sticks}</g>;
}

function WindFace({ wind }) {
  const chars = { east: "東", south: "南", west: "西", north: "北" };
  return (
    <text x="24" y="32" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#1a1a1a" fontFamily="serif">
      {chars[wind]}
    </text>
  );
}

function DragonFace({ dragon }) {
  const map = {
    red: { char: "中", color: "#c41e3a" },
    green: { char: "發", color: "#1a7a4c" },
    white: { char: "", color: "#3b82f6" },
  };
  const d = map[dragon];
  if (dragon === "white") {
    return (
      <rect x="10" y="10" width="28" height="28" rx="3" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
    );
  }
  return (
    <text x="24" y="34" textAnchor="middle" fontSize="26" fontWeight="900" fill={d.color} fontFamily="serif">
      {d.char}
    </text>
  );
}

// ─── Tile face selector ───────────────────────────────────────

function TileFace({ tile }) {
  switch (tile.suit) {
    case "characters":
      return <CharacterFace value={tile.value} />;
    case "circles":
      return <CircleFace value={tile.value} />;
    case "bamboo":
      return <BambooFace value={tile.value} />;
    case "wind":
      return <WindFace wind={tile.value} />;
    case "dragon":
      return <DragonFace dragon={tile.value} />;
    default:
      return null;
  }
}

// ─── Main tile component ──────────────────────────────────────

export default function MahjongTile({ tile, onClick }) {
  if (tile.matched) {
    return <div className="aspect-[3/4]" />;
  }

  return (
    <button
      onClick={() => onClick(tile.id)}
      className="group relative aspect-[3/4] select-none focus:outline-none"
      aria-label={`${tile.suit} ${tile.value}`}
    >
      {/* 3D base shadow */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: "linear-gradient(135deg, #6b5c3e 0%, #4a3f2c 100%)",
          transform: "translate(3px, 3px)",
          borderRadius: "8px",
        }}
      />

      {/* Side edge (3D depth) */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: "linear-gradient(180deg, #8a7d5a 0%, #5c4f35 100%)",
          transform: "translate(2px, 2px)",
          borderRadius: "8px",
        }}
      />

      {/* Main tile face */}
      <div
        className={`relative w-full h-full rounded-lg border-2 overflow-hidden transition-all duration-150
          ${tile.selected
            ? "border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.5)] scale-110 z-20"
            : "border-amber-300/70 group-hover:scale-105 group-hover:shadow-lg group-active:scale-95"
          }`}
        style={{
          background: tile.selected
            ? "linear-gradient(145deg, #fff9e6 0%, #fef3c7 40%, #fde68a 100%)"
            : "linear-gradient(145deg, #fffef5 0%, #fefce8 40%, #fef9c3 100%)",
          boxShadow: tile.selected
            ? "inset 0 1px 2px rgba(255,255,255,0.9), 0 0 20px rgba(250,204,21,0.4)"
            : "inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.05)",
        }}
      >
        {/* Tile texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px)",
          }}
        />

        {/* SVG face */}
        <svg
          viewBox="0 0 48 48"
          className="absolute inset-0 w-full h-full p-[8%]"
        >
          <TileFace tile={tile} />
        </svg>

        {/* Selection glow ring */}
        {tile.selected && (
          <div className="absolute inset-0 rounded-lg ring-2 ring-yellow-400/60 animate-pulse" />
        )}
      </div>
    </button>
  );
}