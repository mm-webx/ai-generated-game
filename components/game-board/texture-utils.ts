import { TileType } from "./types";

/**
 * Generate transition texture pattern ID based on tile type and neighbor types
 * Returns the first matching transition pattern, prioritizing the most common neighbor
 */
export function getTransitionTextureId(
  tileType: TileType,
  neighborTypes: TileType[]
): string | null {
  if (!neighborTypes || neighborTypes.length === 0) {
    return null;
  }

  // Get unique neighbor types
  const uniqueNeighbors = Array.from(new Set(neighborTypes));
  
  // If only one neighbor type, use simple transition
  if (uniqueNeighbors.length === 1) {
    return `transition-${tileType}-${uniqueNeighbors[0]}`;
  }
  
  // For multiple neighbors, use the first one (most common)
  // In the future, we could create multi-neighbor transition patterns
  return `transition-${tileType}-${uniqueNeighbors[0]}`;
}

