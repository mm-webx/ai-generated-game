"use client";

import { HexTile as HexTileType, TileCost } from "./types";
import { hexToPixel } from "./utils";
import { getTransitionTextureId } from "./texture-utils";

interface HexTileProps {
  tile: HexTileType;
  size: number;
  onTileClick: (tile: HexTileType) => void;
  onTileHover: (tile: HexTileType | null) => void;
  canAfford: boolean;
  cost: TileCost;
}

const TILE_COLORS: Record<HexTileType["type"], string> = {
  grassland: "fill-green-500",
  plains: "fill-yellow-100",
  desert: "fill-amber-200",
  tundra: "fill-slate-200",
  snow: "fill-slate-50",
  coast: "fill-cyan-200",
  ocean: "fill-blue-700",
  lake: "fill-blue-500",
  mountain: "fill-stone-700",
  hill: "fill-stone-500",
  forest: "fill-green-800",
  jungle: "fill-green-900",
  marsh: "fill-teal-500",
};

// Additional shadow/glow effects for certain tiles
const TILE_EFFECTS: Record<HexTileType["type"], string> = {
  grassland: "drop-shadow-[0_1px_2px_rgba(34,197,94,0.3)]",
  plains: "drop-shadow-[0_1px_2px_rgba(254,240,138,0.3)]",
  desert: "drop-shadow-[0_1px_2px_rgba(252,211,77,0.3)]",
  tundra: "drop-shadow-[0_1px_2px_rgba(148,163,184,0.3)]",
  snow: "drop-shadow-[0_1px_2px_rgba(241,245,249,0.4)]",
  coast: "drop-shadow-[0_1px_2px_rgba(103,232,249,0.3)]",
  ocean: "drop-shadow-[0_2px_4px_rgba(37,99,235,0.4)]",
  lake: "drop-shadow-[0_2px_4px_rgba(96,165,250,0.4)]",
  mountain: "drop-shadow-[0_2px_4px_rgba(87,83,78,0.5)]",
  hill: "drop-shadow-[0_1px_3px_rgba(120,113,108,0.4)]",
  forest: "drop-shadow-[0_2px_4px_rgba(21,128,61,0.4)]",
  jungle: "drop-shadow-[0_2px_4px_rgba(22,101,52,0.5)]",
  marsh: "drop-shadow-[0_1px_3px_rgba(45,212,191,0.3)]",
};

const TILE_STROKES: Record<HexTileType["visibility"], string> = {
  owned: "stroke-blue-500 stroke-2",
  visible: "stroke-yellow-400 stroke-1",
  hidden: "stroke-gray-900 stroke-1",
};

// Helper function to check if tile type has texture pattern
function getTexturePattern(type: HexTileType["type"]): boolean {
  return [
    "forest",
    "jungle",
    "mountain",
    "hill",
    "desert",
    "snow",
    "ocean",
    "coast",
    "marsh",
  ].includes(type);
}

export function HexTile({
  tile,
  size,
  onTileClick,
  onTileHover,
  canAfford,
  cost,
}: HexTileProps) {
  const { x, y } = hexToPixel(tile.coordinate.q, tile.coordinate.r, size);

  // Calculate hexagon points (relative to center)
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // Start at top
    const px = size * Math.cos(angle);
    const py = size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  const pointsString = points.join(" ");

  const fillColor = TILE_COLORS[tile.type];
  const strokeClass = TILE_STROKES[tile.visibility];
  const opacity = tile.visibility === "hidden" ? 0.25 : 1;

  const isClickable = (!tile.owned && tile.visibility === "visible" && canAfford) || (tile.owned && tile.isVillage);
  const canClaim = !tile.owned && tile.visibility === "visible" && canAfford;
  const cursorClass = isClickable
    ? "cursor-pointer hover:opacity-80"
    : "cursor-default";

  // Determine texture pattern to use
  const baseTextureId = getTexturePattern(tile.type) ? `texture-${tile.type}` : null;
  const transitionTextureId = tile.neighborTypes && tile.neighborTypes.length > 0
    ? getTransitionTextureId(tile.type, tile.neighborTypes)
    : null;
  const textureId = transitionTextureId || baseTextureId;

  const handleClick = () => {
    if (isClickable) {
      onTileClick(tile);
    }
  };

  const handleMouseEnter = () => {
    onTileHover(tile);
  };

  const handleMouseLeave = () => {
    onTileHover(null);
  };

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={cursorClass}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
          {/* Outer glow effect for claimable tiles */}
          {canClaim && (
            <polygon
              points={pointsString}
              fill="none"
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth={size * 0.15}
              opacity={0.6}
              style={{
                filter: "blur(4px)",
              }}
            />
          )}

          {/* Base hexagon with texture pattern */}
          <polygon
            points={pointsString}
            className={`${fillColor} ${strokeClass} ${TILE_EFFECTS[tile.type]}`}
            style={{ opacity }}
            fill={textureId ? `url(#${textureId})` : undefined}
          />

          {/* Inner glow effect for claimable tiles */}
          {canClaim && (
            <polygon
              points={pointsString}
              fill="none"
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth={size * 0.08}
              opacity={0.8}
              style={{
                filter: "blur(2px)",
              }}
            />
          )}

          {/* Inner border for depth */}
          <polygon
            points={pointsString}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={size * 0.05}
            opacity={opacity * 0.5}
          />

          {/* Additional overlay for depth */}
          {tile.type === "mountain" && (
            <>
              <polygon
                points={pointsString}
                fill="rgba(0,0,0,0.1)"
                opacity={opacity * 0.5}
              />
              {/* Mountain peaks */}
              <polygon
                points={`${-size * 0.2},${-size * 0.2} ${0},${-size * 0.4} ${size * 0.2},${-size * 0.2}`}
                fill="rgba(255,255,255,0.2)"
                opacity={opacity}
              />
            </>
          )}
          {tile.type === "ocean" && (
            <>
              <polygon
                points={pointsString}
                fill="rgba(255,255,255,0.05)"
                opacity={opacity}
              />
              {/* Wave patterns */}
              <path
                d={`M ${-size * 0.4},${size * 0.1} Q ${-size * 0.2},${size * 0.2} ${0},${size * 0.1} T ${size * 0.4},${size * 0.1}`}
                stroke="rgba(255,255,255,0.2)"
                fill="none"
                strokeWidth={size * 0.05}
                opacity={opacity}
              />
            </>
          )}
          {tile.type === "forest" && (
            <>
              {/* Tree trunks */}
              <rect
                x={-size * 0.15}
                y={size * 0.1}
                width={size * 0.1}
                height={size * 0.2}
                fill="rgba(101,67,33,0.4)"
                opacity={opacity}
              />
              <rect
                x={size * 0.05}
                y={size * 0.15}
                width={size * 0.1}
                height={size * 0.15}
                fill="rgba(101,67,33,0.4)"
                opacity={opacity}
              />
              {/* Tree tops */}
              <circle
                cx={-size * 0.1}
                cy={size * 0.05}
                r={size * 0.15}
                fill="rgba(34,197,94,0.3)"
                opacity={opacity}
              />
              <circle
                cx={size * 0.1}
                cy={size * 0.1}
                r={size * 0.12}
                fill="rgba(34,197,94,0.3)"
                opacity={opacity}
              />
            </>
          )}
          {tile.type === "grassland" && (
            <>
              {/* Grass blades */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1={-size * 0.3 + (i * size * 0.15)}
                  y1={size * 0.1}
                  x2={-size * 0.3 + (i * size * 0.15)}
                  y2={size * 0.2}
                  stroke="rgba(34,197,94,0.4)"
                  strokeWidth={size * 0.03}
                  opacity={opacity}
                />
              ))}
            </>
          )}
          {tile.type === "desert" && (
            <>
              {/* Sand dunes */}
              <ellipse
                cx={-size * 0.2}
                cy={size * 0.1}
                rx={size * 0.2}
                ry={size * 0.1}
                fill="rgba(255,255,255,0.2)"
                opacity={opacity}
              />
              <ellipse
                cx={size * 0.2}
                cy={size * 0.15}
                rx={size * 0.15}
                ry={size * 0.08}
                fill="rgba(255,255,255,0.15)"
                opacity={opacity}
              />
            </>
          )}
          {tile.type === "lake" && (
            <>
              {/* Ripples */}
              <circle
                cx={-size * 0.2}
                cy={size * 0.1}
                r={size * 0.15}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={size * 0.02}
                opacity={opacity}
              />
              <circle
                cx={size * 0.2}
                cy={-size * 0.1}
                r={size * 0.12}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={size * 0.02}
                opacity={opacity}
              />
            </>
          )}
          {tile.type === "hill" && (
            <>
              {/* Hill contour */}
              <ellipse
                cx={0}
                cy={size * 0.1}
                rx={size * 0.35}
                ry={size * 0.15}
                fill="rgba(0,0,0,0.1)"
                opacity={opacity}
              />
            </>
          )}

          {tile.visibility === "hidden" && (
            <polygon points={pointsString} className="fill-black opacity-60" />
          )}
          
          {/* Village visualization */}
          {tile.isVillage && (
            <g>
              {/* Village house icon */}
              <rect
                x={-size * 0.25}
                y={-size * 0.15}
                width={size * 0.5}
                height={size * 0.3}
                className="fill-amber-700 opacity-90"
                rx={size * 0.05}
              />
              {/* Roof */}
              <polygon
                points={`${-size * 0.3},${-size * 0.15} ${0},${-size * 0.35} ${size * 0.3},${-size * 0.15}`}
                className="fill-red-700 opacity-90"
              />
              {/* Door */}
              <rect
                x={-size * 0.08}
                y={size * 0.05}
                width={size * 0.16}
                height={size * 0.2}
                className="fill-amber-900 opacity-90"
              />
              {/* Village level badge */}
              {tile.villageLevel && (
                <g>
                  <circle
                    cx={size * 0.35}
                    cy={-size * 0.35}
                    r={size * 0.2}
                    className="fill-yellow-500 opacity-95"
                  />
                  <text
                    x={size * 0.35}
                    y={-size * 0.3}
                    textAnchor="middle"
                    className="fill-black pointer-events-none"
                    fontSize={Math.max(10, size * 0.35)}
                    fontWeight="bold"
                  >
                    {tile.villageLevel}
                  </text>
                </g>
              )}
            </g>
          )}
          
          {tile.owned && !tile.isVillage && (
            <circle
              cx="0"
              cy="0"
              r={size * 0.3}
              className="fill-blue-600 opacity-80"
            />
          )}
          
          {/* Level badge for owned tiles and visible unowned tiles */}
          {tile.level && tile.level > 0 && (tile.owned || tile.visibility === "visible") && (
            <g>
              <circle
                cx={size * 0.35}
                cy={tile.owned ? size * 0.35 : -size * 0.35}
                r={size * 0.18}
                className={tile.owned ? "fill-purple-600 opacity-95" : "fill-yellow-600 opacity-80"}
              />
              <text
                x={size * 0.35}
                y={tile.owned ? size * 0.4 : -size * 0.3}
                textAnchor="middle"
                className="fill-white pointer-events-none"
                fontSize={Math.max(9, size * 0.3)}
                fontWeight="bold"
                style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
              >
                Lv.{tile.level}
              </text>
            </g>
          )}
          
          {/* Resource icons for owned tiles */}
          {tile.owned && tile.bonus && size > 20 && (
            <g opacity={opacity}>
              {tile.bonus.food && tile.bonus.food > 0 && (
                <g transform={`translate(${-size * 0.25}, ${-size * 0.15})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r={size * 0.12}
                    fill="rgba(34,197,94,0.8)"
                    stroke="white"
                    strokeWidth={size * 0.02}
                  />
                  <text
                    x="0"
                    y={size * 0.03}
                    textAnchor="middle"
                    className="fill-white pointer-events-none"
                    fontSize={Math.max(8, size * 0.2)}
                    fontWeight="bold"
                  >
                    🍖
                  </text>
                </g>
              )}
              {tile.bonus.wood && tile.bonus.wood > 0 && (
                <g transform={`translate(${size * 0.25}, ${-size * 0.15})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r={size * 0.12}
                    fill="rgba(217,119,6,0.8)"
                    stroke="white"
                    strokeWidth={size * 0.02}
                  />
                  <text
                    x="0"
                    y={size * 0.03}
                    textAnchor="middle"
                    className="fill-white pointer-events-none"
                    fontSize={Math.max(8, size * 0.2)}
                    fontWeight="bold"
                  >
                    🪵
                  </text>
                </g>
              )}
              {tile.bonus.stone && tile.bonus.stone > 0 && (
                <g transform={`translate(${0}, ${size * 0.2})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r={size * 0.12}
                    fill="rgba(148,163,184,0.8)"
                    stroke="white"
                    strokeWidth={size * 0.02}
                  />
                  <text
                    x="0"
                    y={size * 0.03}
                    textAnchor="middle"
                    className="fill-white pointer-events-none"
                    fontSize={Math.max(8, size * 0.2)}
                    fontWeight="bold"
                  >
                    ⛏️
                  </text>
                </g>
              )}
            </g>
          )}
          
          {tile.owned && tile.bonus && (
            <g>
              {(tile.bonus.food || tile.bonus.wood || tile.bonus.stone) && size <= 20 && (
                <text
                  x="0"
                  y={size * 0.2}
                  textAnchor="middle"
                  className="fill-white pointer-events-none"
                  fontSize={Math.max(8, size * 0.3)}
                  fontWeight="bold"
                  style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {[
                    tile.bonus.food && `+${tile.bonus.food.toFixed(1)}F`,
                    tile.bonus.wood && `+${tile.bonus.wood.toFixed(1)}W`,
                    tile.bonus.stone && `+${tile.bonus.stone.toFixed(1)}S`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </text>
              )}
            </g>
          )}
          {/* Pulsing indicator for claimable tiles */}
          {canClaim && (
            <>
              {/* Outer pulsing ring */}
              <circle
                cx="0"
                cy="0"
                r={size * 0.4}
                fill="none"
                stroke="rgba(59, 130, 246, 0.4)"
                strokeWidth={size * 0.05}
                opacity={0.6}
                style={{
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              {/* Inner pulsing circle */}
              <circle
                cx="0"
                cy="0"
                r={size * 0.25}
                fill="rgba(59, 130, 246, 0.3)"
                opacity={0.5}
                style={{
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
            </>
          )}
          
          {/* Clickable indicator for owned village */}
          {tile.owned && tile.isVillage && (
            <circle
              cx="0"
              cy="0"
              r={size * 0.25}
              className="fill-yellow-400 opacity-50 animate-pulse"
            />
          )}
        </g>
  );
}
