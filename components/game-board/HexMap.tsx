"use client";

import React from "react";
import { HexTile as HexTileType, TileCost, TileType } from "./types";
import { HexTile } from "./HexTile";
import { calculateTileClaimCost, calculateVillageClaimCost } from "./utils";

// Generate transition texture patterns for terrain combinations
function generateTransitionPatterns() {
  const patterns: React.ReactElement[] = [];
  const createdPatterns = new Set<string>();

  // Common transition combinations
  const commonTransitions: Array<[TileType, TileType]> = [
    ["grassland", "forest"],
    ["grassland", "plains"],
    ["grassland", "desert"],
    ["grassland", "marsh"],
    ["forest", "jungle"],
    ["forest", "mountain"],
    ["forest", "hill"],
    ["plains", "desert"],
    ["desert", "mountain"],
    ["mountain", "hill"],
    ["coast", "ocean"],
    ["coast", "grassland"],
    ["coast", "plains"],
    ["lake", "grassland"],
    ["lake", "forest"],
    ["marsh", "grassland"],
    ["marsh", "forest"],
    ["tundra", "snow"],
    ["tundra", "grassland"],
    ["snow", "mountain"],
  ];

  commonTransitions.forEach(([type1, type2]) => {
    const patternId1 = `transition-${type1}-${type2}`;
    const patternId2 = `transition-${type2}-${type1}`;
    
    // Create blended pattern for type1 transitioning to type2
    if (!createdPatterns.has(patternId1)) {
      createdPatterns.add(patternId1);
      patterns.push(
        <pattern
          key={patternId1}
          id={patternId1}
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Base pattern from type1 */}
          {getBasePatternElements(type1)}
          {/* Transition elements from type2 */}
          {getTransitionElements(type2, type1)}
        </pattern>
      );
    }

    // Create blended pattern for type2 transitioning to type1
    if (!createdPatterns.has(patternId2)) {
      createdPatterns.add(patternId2);
      patterns.push(
        <pattern
          key={patternId2}
          id={patternId2}
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Base pattern from type2 */}
          {getBasePatternElements(type2)}
          {/* Transition elements from type1 */}
          {getTransitionElements(type1, type2)}
        </pattern>
      );
    }
  });

  return patterns;
}

function getBasePatternElements(type: TileType): React.ReactElement[] {
  const elements: React.ReactElement[] = [];
  
  switch (type) {
    case "forest":
      elements.push(<circle key="1" cx="10" cy="10" r="1.5" fill="rgba(0,0,0,0.15)" />);
      elements.push(<circle key="2" cx="20" cy="15" r="1" fill="rgba(0,0,0,0.1)" />);
      break;
    case "grassland":
      elements.push(<line key="1" x1="5" y1="15" x2="5" y2="20" stroke="rgba(34,197,94,0.3)" strokeWidth="0.5" />);
      elements.push(<line key="2" x1="15" y1="15" x2="15" y2="20" stroke="rgba(34,197,94,0.3)" strokeWidth="0.5" />);
      break;
    case "desert":
      elements.push(<circle key="1" cx="10" cy="10" r="1" fill="rgba(255,255,255,0.25)" />);
      elements.push(<circle key="2" cx="25" cy="20" r="0.8" fill="rgba(255,255,255,0.2)" />);
      break;
    case "mountain":
      elements.push(<polygon key="1" points="10,20 12,15 14,20" fill="rgba(0,0,0,0.2)" />);
      break;
    case "coast":
      elements.push(<circle key="1" cx="15" cy="15" r="1" fill="rgba(255,255,255,0.25)" />);
      elements.push(<path key="2" d="M 5,20 Q 10,18 15,20" stroke="rgba(255,255,255,0.2)" fill="none" strokeWidth="0.5" />);
      break;
    case "ocean":
      elements.push(<path key="1" d="M 5,15 Q 10,13 15,15 T 25,15" stroke="rgba(255,255,255,0.15)" fill="none" strokeWidth="0.5" />);
      break;
    case "marsh":
      elements.push(<ellipse key="1" cx="12" cy="15" rx="2" ry="1.5" fill="rgba(0,0,0,0.12)" />);
      break;
    case "snow":
      elements.push(<circle key="1" cx="10" cy="10" r="0.5" fill="rgba(255,255,255,0.5)" />);
      elements.push(<circle key="2" cx="25" cy="15" r="0.6" fill="rgba(255,255,255,0.4)" />);
      break;
    case "tundra":
      elements.push(<circle key="1" cx="10" cy="15" r="0.8" fill="rgba(255,255,255,0.3)" />);
      break;
    case "hill":
      elements.push(<ellipse key="1" cx="20" cy="20" rx="3" ry="2" fill="rgba(0,0,0,0.1)" />);
      break;
    case "jungle":
      elements.push(<circle key="1" cx="8" cy="8" r="1.8" fill="rgba(0,0,0,0.2)" />);
      elements.push(<circle key="2" cx="25" cy="18" r="1.2" fill="rgba(0,0,0,0.15)" />);
      break;
    case "lake":
      elements.push(<circle key="1" cx="15" cy="15" r="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />);
      break;
    case "plains":
      elements.push(<circle key="1" cx="10" cy="15" r="0.5" fill="rgba(0,0,0,0.05)" />);
      break;
  }
  
  return elements;
}

function getTransitionElements(fromType: TileType, toType: TileType): React.ReactElement[] {
  const elements: React.ReactElement[] = [];
  
  // Add subtle transition elements on edges
  // These create a gradient-like effect
  if (fromType === "forest" && toType === "grassland") {
    elements.push(<circle key="t1" cx="30" cy="15" r="1" fill="rgba(34,197,94,0.2)" opacity="0.5" />);
    elements.push(<line key="t2" x1="30" y1="18" x2="30" y2="22" stroke="rgba(34,197,94,0.2)" strokeWidth="0.5" opacity="0.5" />);
  } else if (fromType === "grassland" && toType === "forest") {
    elements.push(<circle key="t1" cx="30" cy="12" r="1.2" fill="rgba(0,0,0,0.1)" opacity="0.5" />);
  } else if (fromType === "desert" && toType === "grassland") {
    elements.push(<line key="t1" x1="30" y1="18" x2="30" y2="22" stroke="rgba(34,197,94,0.2)" strokeWidth="0.5" opacity="0.5" />);
  } else if (fromType === "coast" && toType === "grassland") {
    elements.push(<line key="t1" x1="30" y1="18" x2="30" y2="22" stroke="rgba(34,197,94,0.2)" strokeWidth="0.5" opacity="0.5" />);
    elements.push(<circle key="t2" cx="30" cy="15" r="0.8" fill="rgba(255,255,255,0.1)" opacity="0.3" />);
  } else if (fromType === "mountain" && toType === "forest") {
    elements.push(<circle key="t1" cx="30" cy="15" r="1" fill="rgba(0,0,0,0.1)" opacity="0.5" />);
    elements.push(<polygon key="t2" points="28,20 30,18 32,20" fill="rgba(0,0,0,0.08)" opacity="0.5" />);
  } else if (fromType === "marsh" && toType === "grassland") {
    elements.push(<line key="t1" x1="30" y1="18" x2="30" y2="22" stroke="rgba(34,197,94,0.2)" strokeWidth="0.5" opacity="0.5" />);
    elements.push(<ellipse key="t2" cx="30" cy="15" rx="1.5" ry="1" fill="rgba(0,0,0,0.08)" opacity="0.3" />);
  }
  
  return elements;
}

interface HexMapProps {
  tiles: HexTileType[];
  tileSize: number;
  zoom: number;
  panX: number;
  panY: number;
  onTileClick: (tile: HexTileType) => void;
  onTileHover: (tile: HexTileType | null) => void;
  canAfford: (cost: TileCost) => boolean;
}

export function HexMap({
  tiles,
  tileSize,
  zoom,
  panX,
  panY,
  onTileClick,
  onTileHover,
  canAfford,
}: HexMapProps) {
  // Calculate bounding box for SVG
  const minQ = Math.min(...tiles.map((t) => t.coordinate.q));
  const maxQ = Math.max(...tiles.map((t) => t.coordinate.q));
  const minR = Math.min(...tiles.map((t) => t.coordinate.r));
  const maxR = Math.max(...tiles.map((t) => t.coordinate.r));

  // Approximate SVG dimensions with padding (no top padding)
  const padding = tileSize * 2;
  const topPadding = 0;
  const width = (maxQ - minQ + 1) * tileSize * Math.sqrt(3) + padding * 2;
  const height = (maxR - minR + 1) * tileSize * 1.5 + topPadding + padding;
  const offsetX = -minQ * tileSize * Math.sqrt(3) + padding;
  const offsetY = -minR * tileSize * 1.5 + topPadding;

  return (
    <div className="w-full h-full bg-slate-900">
        <svg
          width={width}
          height={height}
          className="block"
          style={{ 
            minWidth: "100%", 
            minHeight: "100%",
          }}
        >
          <defs>
            {/* Glow filter for claimable tiles */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Inner glow filter */}
            <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feOffset in="blur" dx="0" dy="0"/>
              <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k2="-1" k3="1"/>
            </filter>
            {/* Pulse animation */}
            <style>
              {`
                @keyframes pulse {
                  0%, 100% {
                    opacity: 0.4;
                  }
                  50% {
                    opacity: 0.8;
                  }
                }
              `}
            </style>
            {/* Texture patterns for different tile types */}
            {generateTransitionPatterns()}
            <pattern
              id="texture-forest"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="5" cy="5" r="1" fill="rgba(0,0,0,0.1)" />
              <circle cx="15" cy="8" r="1.5" fill="rgba(0,0,0,0.15)" />
              <circle cx="10" cy="15" r="1" fill="rgba(0,0,0,0.1)" />
            </pattern>
            <pattern
              id="texture-jungle"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="5" cy="5" r="1.5" fill="rgba(0,0,0,0.2)" />
              <circle cx="15" cy="10" r="1" fill="rgba(0,0,0,0.15)" />
              <circle cx="8" cy="15" r="1.2" fill="rgba(0,0,0,0.18)" />
            </pattern>
            <pattern
              id="texture-mountain"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <polygon points="5,15 8,10 11,15" fill="rgba(0,0,0,0.2)" />
              <polygon points="12,15 14,12 16,15" fill="rgba(0,0,0,0.15)" />
            </pattern>
            <pattern
              id="texture-hill"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <ellipse cx="10" cy="12" rx="3" ry="2" fill="rgba(0,0,0,0.1)" />
            </pattern>
            <pattern
              id="texture-desert"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="7" cy="7" r="1" fill="rgba(255,255,255,0.3)" />
              <circle cx="14" cy="12" r="0.8" fill="rgba(255,255,255,0.25)" />
            </pattern>
            <pattern
              id="texture-snow"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="5" cy="5" r="0.5" fill="rgba(255,255,255,0.6)" />
              <circle cx="15" cy="8" r="0.6" fill="rgba(255,255,255,0.5)" />
              <circle cx="10" cy="15" r="0.5" fill="rgba(255,255,255,0.6)" />
            </pattern>
            <pattern
              id="texture-ocean"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 2,10 Q 5,8 8,10 T 14,10 T 18,10"
                stroke="rgba(255,255,255,0.2)"
                fill="none"
                strokeWidth="0.5"
              />
              <path
                d="M 0,15 Q 4,13 8,15 T 16,15"
                stroke="rgba(255,255,255,0.15)"
                fill="none"
                strokeWidth="0.5"
              />
            </pattern>
            <pattern
              id="texture-coast"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="8" cy="8" r="1" fill="rgba(255,255,255,0.3)" />
              <path
                d="M 2,12 Q 6,10 10,12"
                stroke="rgba(255,255,255,0.25)"
                fill="none"
                strokeWidth="0.5"
              />
            </pattern>
            <pattern
              id="texture-marsh"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <ellipse cx="6" cy="8" rx="2" ry="1.5" fill="rgba(0,0,0,0.15)" />
              <ellipse
                cx="14"
                cy="12"
                rx="1.5"
                ry="1"
                fill="rgba(0,0,0,0.12)"
              />
            </pattern>
          </defs>
          <g transform={`translate(${offsetX + panX}, ${offsetY + panY}) scale(${zoom})`}>
            {tiles.map((tile) => {
              const tileCost = !tile.owned 
                ? (tile.isVillage 
                    ? calculateVillageClaimCost(tile.level || 0)
                    : calculateTileClaimCost(tile.level || 0))
                : { food: 0, wood: 0, stone: 0, power: 0 };
              return (
                <HexTile
                  key={`${tile.coordinate.q},${tile.coordinate.r}`}
                  tile={tile}
                  size={tileSize}
                  onTileClick={onTileClick}
                  onTileHover={onTileHover}
                  canAfford={canAfford(tileCost)}
                  cost={tileCost}
                />
              );
            })}
          </g>
        </svg>
      </div>
  );
}
