import { HexCoordinate, HexTile, ResourceBonus, TileType } from "./types";
import { VillageState } from "../village/types";

/**
 * Convert hex coordinates to pixel coordinates
 * Uses offset coordinates (odd-r layout)
 */
export function hexToPixel(
  q: number,
  r: number,
  size: number
): { x: number; y: number } {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * (3 / 2) * r;
  return { x, y };
}

/**
 * Get all neighbors of a hex tile
 */
export function getHexNeighbors(hex: HexCoordinate): HexCoordinate[] {
  const directions: HexCoordinate[] = [
    { q: 1, r: 0 }, // East
    { q: 1, r: -1 }, // Northeast
    { q: 0, r: -1 }, // Northwest
    { q: -1, r: 0 }, // West
    { q: -1, r: 1 }, // Southwest
    { q: 0, r: 1 }, // Southeast
  ];

  return directions.map((dir) => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r,
  }));
}

/**
 * Calculate distance between two hex coordinates
 */
export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
}

/**
 * Calculate cube coordinates distance (more accurate)
 */
export function hexDistanceCube(a: HexCoordinate, b: HexCoordinate): number {
  const aS = -a.q - a.r;
  const bS = -b.q - b.r;
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(aS - bS)) / 2;
}

/**
 * Get all tiles within a certain distance from a center tile
 */
export function getTilesInRange(
  center: HexCoordinate,
  range: number,
  allTiles: Map<string, HexTile>
): HexTile[] {
  const tiles: HexTile[] = [];

  for (let q = -range; q <= range; q++) {
    const r1 = Math.max(-range, -q - range);
    const r2 = Math.min(range, -q + range);
    for (let r = r1; r <= r2; r++) {
      const coord: HexCoordinate = { q: center.q + q, r: center.r + r };
      const distance = hexDistanceCube(center, coord);
      if (distance <= range) {
        const key = hexKey(coord);
        const tile = allTiles.get(key);
        if (tile) {
          tiles.push(tile);
        }
      }
    }
  }

  return tiles;
}

/**
 * Generate a key for a hex coordinate
 */
export function hexKey(coord: HexCoordinate): string {
  return `${coord.q},${coord.r}`;
}

/**
 * Get base resource bonuses for a tile type (level 1)
 */
export function getTileBonus(type: TileType): ResourceBonus {
  switch (type) {
    case "grassland":
      return { food: 1, wood: 0.5 }; // Level 1: +1 food, +0.5 wood per minute
    case "plains":
      return { food: 0.5, stone: 0.5 }; // Level 1: +0.5 food, +0.5 stone per minute
    case "desert":
      return { stone: 0.5 }; // Level 1: +0.5 stone per minute
    case "tundra":
      return { food: 0.5 }; // Level 1: +0.5 food per minute
    case "snow":
      return {}; // No bonus
    case "coast":
      return { food: 1 }; // Level 1: +1 food per minute
    case "ocean":
      return { food: 0.5 }; // Level 1: +0.5 food per minute
    case "lake":
      return { food: 1.5 }; // Level 1: +1.5 food per minute
    case "mountain":
      return { stone: 1.5 }; // Level 1: +1.5 stone per minute
    case "hill":
      return { stone: 1, wood: 0.5 }; // Level 1: +1 stone, +0.5 wood per minute
    case "forest":
      return { wood: 1.5 }; // Level 1: +1.5 wood per minute
    case "jungle":
      return { food: 0.5, wood: 1 }; // Level 1: +0.5 food, +1 wood per minute
    case "marsh":
      return { food: 1, wood: 0.5 }; // Level 1: +1 food, +0.5 wood per minute
    default:
      return {};
  }
}

/**
 * Calculate resource bonuses for a tile based on type and level
 * Every 5 levels gives a bonus multiplier
 */
export function calculateTileBonus(type: TileType, level: number = 1): ResourceBonus {
  const baseBonus = getTileBonus(type);
  
  // Calculate multiplier: base + (level - 1) * 0.1 + bonus every 5 levels
  const levelMultiplier = 1 + (level - 1) * 0.1;
  const milestoneBonus = Math.floor((level - 1) / 5) * 0.2; // Extra 20% every 5 levels
  const totalMultiplier = levelMultiplier + milestoneBonus;
  
  const result: ResourceBonus = {};
  
  if (baseBonus.food) {
    result.food = Math.round(baseBonus.food * totalMultiplier * 10) / 10;
  }
  if (baseBonus.wood) {
    result.wood = Math.round(baseBonus.wood * totalMultiplier * 10) / 10;
  }
  if (baseBonus.stone) {
    result.stone = Math.round(baseBonus.stone * totalMultiplier * 10) / 10;
  }
  if (baseBonus.diamond) {
    result.diamond = Math.round(baseBonus.diamond * totalMultiplier * 10) / 10;
  }
  if (baseBonus.technology) {
    result.technology = Math.round(baseBonus.technology * totalMultiplier * 10) / 10;
  }
  
  return result;
}

/**
 * Calculate upgrade cost for a tile based on type and current level
 */
export function calculateUpgradeCost(type: TileType, currentLevel: number): TileCost {
  const baseCost = {
    food: 5,
    wood: 3,
    stone: 1,
  };
  
  // Cost increases with level: base * (1 + level * 0.15)
  const costMultiplier = 1 + currentLevel * 0.15;
  
  // Different tile types have different cost focuses
  const typeMultipliers: Record<TileType, { food: number; wood: number; stone: number }> = {
    grassland: { food: 1.0, wood: 1.2, stone: 0.8 },
    plains: { food: 1.1, wood: 0.9, stone: 1.2 },
    desert: { food: 1.3, wood: 0.7, stone: 1.0 },
    tundra: { food: 1.2, wood: 1.0, stone: 0.9 },
    snow: { food: 1.5, wood: 1.1, stone: 1.1 },
    coast: { food: 1.0, wood: 1.3, stone: 0.9 },
    ocean: { food: 0.9, wood: 1.4, stone: 1.0 },
    lake: { food: 0.8, wood: 1.2, stone: 1.1 },
    mountain: { food: 1.2, wood: 1.1, stone: 0.7 },
    hill: { food: 1.1, wood: 1.0, stone: 0.9 },
    forest: { food: 1.1, wood: 0.8, stone: 1.2 },
    jungle: { food: 1.0, wood: 0.9, stone: 1.1 },
    marsh: { food: 1.0, wood: 1.1, stone: 1.0 },
  };
  
  const multipliers = typeMultipliers[type];
  
  return {
    food: Math.round(baseCost.food * costMultiplier * multipliers.food),
    wood: Math.round(baseCost.wood * costMultiplier * multipliers.wood),
    stone: Math.round(baseCost.stone * costMultiplier * multipliers.stone),
  };
}

/**
 * Calculate tile level based on distance from village
 * Level = distance * 5
 */
export function calculateTileLevelFromDistance(distance: number): number {
  return distance * 5;
}

/**
 * Calculate power cost to claim a tile based on its level
 */
export function calculateTilePowerCost(level: number): number {
  // Base power cost increases with level
  // Level 5 (distance 1) = 5 power
  // Level 10 (distance 2) = 15 power
  // Level 15 (distance 3) = 30 power
  // Formula: level * (level / 5) = level^2 / 5
  return Math.floor((level * level) / 5);
}

/**
 * Calculate tile cost including power based on level
 */
export function calculateTileClaimCost(level: number): TileCost {
  const baseCost = {
    food: 10,
    wood: 5,
    stone: 2,
  };
  
  // Cost increases with level
  const costMultiplier = 1 + (level / 5) * 0.2; // 20% increase per 5 levels
  
  return {
    food: Math.floor(baseCost.food * costMultiplier),
    wood: Math.floor(baseCost.wood * costMultiplier),
    stone: Math.floor(baseCost.stone * costMultiplier),
    power: calculateTilePowerCost(level),
  };
}

/**
 * Calculate village claim cost (100x power cost)
 */
export function calculateVillageClaimCost(level: number): TileCost {
  const baseCost = calculateTileClaimCost(level);
  return {
    ...baseCost,
    power: baseCost.power * 100, // 100x power cost for villages
  };
}

/**
 * Generate village positions spread across the map
 * Ensures minimum 50 level spread and avoids water/mountain tiles
 */
export function generateVillagePositions(
  mapWidth: number,
  mapHeight: number,
  playerVillageCoord: HexCoordinate
): HexCoordinate[] {
  const villagePositions: HexCoordinate[] = [];
  const invalidTypes: TileType[] = ["ocean", "coast", "lake", "mountain"];
  const maxAttempts = 1000;
  
  // Target levels for villages (spread evenly with min 50 level difference)
  const targetLevels = [10, 60, 110, 160, 210, 260, 310]; // 7 villages
  
  for (const targetLevel of targetLevels) {
    const targetDistance = Math.floor(targetLevel / 5); // Convert level to distance
    
    let bestPos: HexCoordinate | null = null;
    let bestDistance = Infinity;
    
    // Try to find a position close to target distance
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate random position in a ring around the target distance
      const angle = Math.random() * Math.PI * 2;
      const distanceVariation = (Math.random() - 0.5) * 2; // -1 to 1
      const distance = Math.max(1, targetDistance + distanceVariation);
      
      const q = Math.round(Math.cos(angle) * distance);
      const r = Math.round(Math.sin(angle) * distance);
      
      // Check bounds
      if (Math.abs(q) > mapWidth || Math.abs(r) > mapHeight) continue;
      
      const coord: HexCoordinate = { q, r };
      const tileType = generateTileType(q, r);
      
      // Skip invalid tile types
      if (invalidTypes.includes(tileType)) continue;
      
      // Check distance from player village
      const actualDistance = hexDistanceCube(playerVillageCoord, coord);
      const actualLevel = calculateTileLevelFromDistance(actualDistance);
      
      // Check if too close to other villages (min 3 hex distance)
      const tooClose = villagePositions.some((vPos) => {
        const dist = hexDistanceCube(vPos, coord);
        return dist < 3;
      });
      
      if (tooClose) continue;
      
      // Check if level is close enough to target
      const levelDiff = Math.abs(actualLevel - targetLevel);
      if (levelDiff < bestDistance) {
        bestDistance = levelDiff;
        bestPos = coord;
      }
      
      // If we found a good match (within 10 levels), use it
      if (levelDiff < 10) {
        break;
      }
    }
    
    if (bestPos) {
      villagePositions.push(bestPos);
    }
  }
  
  return villagePositions;
}

/**
 * Generate village state based on distance from player village
 * Further villages have higher levels and more upgrades
 */
export function generateVillageState(distance: number): VillageState {
  // Base level increases with distance
  const baseLevel = Math.max(1, Math.floor(distance / 2));
  const exp = baseLevel * 100; // Some exp based on level
  
  // Buildings get upgrades based on distance
  const buildingUpgrades = Math.floor(distance / 3);
  
  return {
    exp: exp,
    level: baseLevel,
    buildings: {
      farm: Math.min(5, buildingUpgrades),
      lumbermill: Math.min(5, buildingUpgrades),
      quarry: Math.min(5, buildingUpgrades),
      mine: Math.min(3, Math.floor(buildingUpgrades / 2)),
      library: Math.min(3, Math.floor(buildingUpgrades / 2)),
      home: Math.min(5, buildingUpgrades),
      barracks: Math.min(3, Math.floor(buildingUpgrades / 2)),
      archer_guild: Math.min(2, Math.floor(buildingUpgrades / 3)),
      mage_tower: Math.min(2, Math.floor(buildingUpgrades / 4)),
    },
    units: {
      warrior: Math.floor(buildingUpgrades * 2),
      archer: Math.floor(buildingUpgrades),
      mage: Math.floor(buildingUpgrades / 2),
    },
  };
}
export function generateTileType(q: number, r: number): TileType {
  // Calculate distance from center
  const distance = Math.sqrt(q * q + r * r);

  // Use position for deterministic generation
  const seed = (q * 73856093) ^ (r * 19349663);
  const value = Math.abs(Math.sin(seed)) * 100;
  const altSeed = Math.abs(Math.cos(seed * 0.7)) * 100;

  // Ocean/Coast near edges
  if (distance > 12) {
    if (value < 60) return "ocean";
    return "coast";
  }

  // Lakes scattered around
  if (value < 5 && distance > 3) return "lake";

  // Mountains in clusters
  if (value > 85 && altSeed > 70) return "mountain";

  // Hills near mountains
  if (value > 75 && altSeed > 60) return "hill";

  // Water features
  if (value < 15) return "coast";

  // Cold biomes (north/south)
  if (Math.abs(r) > 8) {
    if (value < 30) return "snow";
    if (value < 50) return "tundra";
  }

  // Hot biomes (equator)
  if (Math.abs(r) < 3) {
    if (value < 25) return "desert";
    if (value < 40) return "jungle";
  }

  // Forests and jungles
  if (value > 70) {
    if (altSeed > 50) return "jungle";
    return "forest";
  }

  // Marsh in low areas
  if (value < 20 && altSeed < 30) return "marsh";

  // Default to plains or grassland
  if (value < 50) return "plains";
  return "grassland";
}
