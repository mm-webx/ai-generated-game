"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  HexTile,
  HexCoordinate,
  TileCost,
  DEFAULT_TILE_COST,
  ResourceBonus,
} from "./types";
import { HexMap } from "./HexMap";
import { ZoomControls } from "./zoom-controls";
import {
  getHexNeighbors,
  hexKey,
  generateTileType,
  getTilesInRange,
  getTileBonus,
  calculateTileBonus,
  calculateUpgradeCost,
  hexDistanceCube,
  calculateTileLevelFromDistance,
  calculateTileClaimCost,
  calculateVillageClaimCost,
  generateVillagePositions,
  generateVillageState,
} from "./utils";
import { useTimeControl } from "@/components/game-header";

interface GameBoardProps {
  mapWidth?: number;
  mapHeight?: number;
  tileSize?: number;
  tileCost?: TileCost;
}

export function GameBoard({
  mapWidth = 15,
  mapHeight = 15,
  tileSize = 30,
  tileCost = DEFAULT_TILE_COST,
}: GameBoardProps) {
  const { resources, setResources, setTileBonuses, setSelectedTile, villageLevel, setIsVillagePanelOpen } = useTimeControl();
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

const TILES_STORAGE_KEY = "village-game-tiles";

  // Generate initial map
  const initialTiles = useMemo(() => {
    const tiles = new Map<string, HexTile>();
    const playerVillageCoord: HexCoordinate = { q: 0, r: 0 };

    // Generate hexagonal grid
    for (let q = -mapWidth; q <= mapWidth; q++) {
      const r1 = Math.max(-mapHeight, -q - mapHeight);
      const r2 = Math.min(mapHeight, -q + mapHeight);
      for (let r = r1; r <= r2; r++) {
        const coord: HexCoordinate = { q, r };
        const key = hexKey(coord);
        const distance = hexDistanceCube(playerVillageCoord, coord);
        const level = calculateTileLevelFromDistance(distance);
        const tileType = generateTileType(q, r);
        tiles.set(key, {
          coordinate: coord,
          type: tileType,
          visibility: "hidden",
          owned: false,
          level: level,
          bonus: calculateTileBonus(tileType, level),
        });
      }
    }

    // Generate 7 AI villages spread across the map
    const aiVillagePositions = generateVillagePositions(mapWidth, mapHeight, playerVillageCoord);
    aiVillagePositions.forEach((aiVillageCoord) => {
      const key = hexKey(aiVillageCoord);
      const tile = tiles.get(key);
      if (tile) {
        const distance = hexDistanceCube(playerVillageCoord, aiVillageCoord);
        const level = calculateTileLevelFromDistance(distance);
        const villageState = generateVillageState(distance);
        tiles.set(key, {
          ...tile,
          type: "grassland", // Villages are always on grassland
          isVillage: true,
          villageLevel: villageState.level,
          villageState: villageState,
          level: level,
          bonus: { food: 5, wood: 3, stone: 1 }, // Village base production
        });
      }
    });

    // Calculate neighbor types for transition textures
    tiles.forEach((tile, key) => {
      const neighbors = getHexNeighbors(tile.coordinate);
      const neighborTypes: TileType[] = [];
      neighbors.forEach((neighborCoord) => {
        const neighborKey = hexKey(neighborCoord);
        const neighbor = tiles.get(neighborKey);
        if (neighbor && neighbor.type !== tile.type) {
          neighborTypes.push(neighbor.type);
        }
      });
      tile.neighborTypes = neighborTypes;
    });

    return tiles;
  }, [mapWidth, mapHeight]);

  // Initialize tiles with consistent server/client state
  // Use a constant initial villageLevel to avoid hydration mismatch
  const getInitialTiles = useCallback((): Map<string, HexTile> => {
    const centerKey = hexKey({ q: 0, r: 0 });
    const centerTile = initialTiles.get(centerKey);
    if (centerTile) {
      const newTiles = new Map(initialTiles);
      const updatedCenter = {
        ...centerTile,
        owned: true,
        visibility: "owned" as const,
        isVillage: true,
        villageLevel: 1, // Use constant initial value to avoid hydration mismatch
        type: "grassland", // Village is always on grassland
        level: 1, // Village starts at level 1
        bonus: { food: 5, wood: 3, stone: 1 }, // Village base production
      };
      newTiles.set(centerKey, updatedCenter);

      // Make tiles in range 2 visible (owned + 2 more rings)
      const visibleTiles = getTilesInRange(
        updatedCenter.coordinate,
        2,
        newTiles
      );
      visibleTiles.forEach((visibleTile) => {
        if (!visibleTile.owned) {
          const visibleKey = hexKey(visibleTile.coordinate);
          const currentTile = newTiles.get(visibleKey);
          if (currentTile) {
            newTiles.set(visibleKey, { ...currentTile, visibility: "visible" });
          }
        }
      });

      // Make all villages visible regardless of distance
      newTiles.forEach((tile, key) => {
        if (tile.isVillage && !tile.owned) {
          newTiles.set(key, { ...tile, visibility: "visible" });
        }
      });

      return newTiles;
    }
    return initialTiles;
  }, [initialTiles]);

  const [tiles, setTiles] = useState<Map<string, HexTile>>(() => getInitialTiles());

  // Load tiles from localStorage after mount (client-only)
  useEffect(() => {
    try {
      const savedTiles = localStorage.getItem(TILES_STORAGE_KEY);
      if (savedTiles) {
        const tilesArray = JSON.parse(savedTiles) as HexTile[];
        const tilesMap = new Map<string, HexTile>();
        tilesArray.forEach((tile) => {
          tilesMap.set(hexKey(tile.coordinate), tile);
        });
        setTiles(tilesMap);
      }
    } catch (error) {
      console.error("Failed to load tiles from localStorage:", error);
    }
  }, []);

  // Save tiles to localStorage every 10 seconds
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const saveTiles = () => {
      try {
        const tilesArray = Array.from(tiles.values());
        localStorage.setItem(TILES_STORAGE_KEY, JSON.stringify(tilesArray));
      } catch (error) {
        console.error("Failed to save tiles to localStorage:", error);
      }
    };

    // Save immediately on mount
    saveTiles();

    // Then save every 10 seconds
    const interval = setInterval(saveTiles, 10000);

    return () => clearInterval(interval);
  }, [tiles]);

  // Check if player can afford tile cost
  const canAfford = useCallback(
    (cost: TileCost) => {
      return (
        resources.food >= cost.food &&
        resources.wood >= cost.wood &&
        resources.stone >= cost.stone &&
        resources.power >= cost.power
      );
    },
    [resources.food, resources.wood, resources.stone, resources.power]
  );

  // Helper function to update neighbor types for tiles
  const updateNeighborTypes = useCallback((tilesMap: Map<string, HexTile>, coord: HexCoordinate) => {
    const affectedCoords = new Set<HexCoordinate>();
    affectedCoords.add(coord);
    getHexNeighbors(coord).forEach(nCoord => affectedCoords.add(nCoord));
    
    affectedCoords.forEach(affectedCoord => {
      const key = hexKey(affectedCoord);
      const affectedTile = tilesMap.get(key);
      if (affectedTile) {
        const neighbors = getHexNeighbors(affectedCoord);
        const neighborTypes: TileType[] = [];
        neighbors.forEach((neighborCoord) => {
          const neighborKey = hexKey(neighborCoord);
          const neighbor = tilesMap.get(neighborKey);
          if (neighbor && neighbor.type !== affectedTile.type) {
            neighborTypes.push(neighbor.type);
          }
        });
        affectedTile.neighborTypes = neighborTypes;
      }
    });
  }, []);

  // Handle tile hover
  const handleTileHover = useCallback(
    (tile: HexTile | null) => {
      setSelectedTile(tile);
    },
    [setSelectedTile]
  );

  // Handle tile click - claim new tiles or upgrade owned tiles
  const handleTileClick = useCallback(
    (tile: HexTile) => {
      // Don't handle clicks if we just dragged
      if (hasDragged) {
        return;
      }

      // If village tile is clicked, open village panel
      if (tile.owned && tile.isVillage) {
        setIsVillagePanelOpen(true);
        return;
      }

      // If tile is owned, try to upgrade it
      if (tile.owned && !tile.isVillage) {
        const currentLevel = tile.level || 1;
        if (currentLevel >= 100) return; // Max level reached
        
        const upgradeCost = calculateUpgradeCost(tile.type, currentLevel);
        
        // Check if can afford upgrade
        if (
          resources.food >= upgradeCost.food &&
          resources.wood >= upgradeCost.wood &&
          resources.stone >= upgradeCost.stone
        ) {
          // Deduct resources
          setResources((prev) => ({
            ...prev,
            food: prev.food - upgradeCost.food,
            wood: prev.wood - upgradeCost.wood,
            stone: prev.stone - upgradeCost.stone,
          }));

          // Upgrade the tile
          const newTiles = new Map(tiles);
          const newLevel = currentLevel + 1;
          const newBonus = calculateTileBonus(tile.type, newLevel);
          
          newTiles.set(hexKey(tile.coordinate), {
            ...tile,
            level: newLevel,
            bonus: newBonus,
          });

          updateNeighborTypes(newTiles, tile.coordinate);
          setTiles(newTiles);
        }
        return;
      }

      // Original logic for claiming new tiles or villages
      if (tile.owned || tile.visibility !== "visible") {
        return;
      }

      // Check if tile is adjacent to owned tile (or if it's a village, can claim from anywhere visible)
      if (!tile.isVillage) {
        const neighbors = getHexNeighbors(tile.coordinate);
        const hasOwnedNeighbor = neighbors.some((neighborCoord) => {
          const neighborKey = hexKey(neighborCoord);
          const neighbor = tiles.get(neighborKey);
          return neighbor?.owned;
        });

        if (!hasOwnedNeighbor) {
          return; // Can only claim tiles adjacent to owned tiles
        }
      }

      // Calculate cost based on tile level (distance-based)
      const tileLevel = tile.level || 0;
      const claimCost = tile.isVillage 
        ? calculateVillageClaimCost(tileLevel) // 100x power for villages
        : calculateTileClaimCost(tileLevel);

      // Check if can afford
      if (!canAfford(claimCost)) {
        return;
      }

      // Deduct resources including power
      setResources((prev) => ({
        ...prev,
        food: prev.food - claimCost.food,
        wood: prev.wood - claimCost.wood,
        stone: prev.stone - claimCost.stone,
        power: prev.power - claimCost.power,
      }));

      // Update tiles
      const newTiles = new Map(tiles);

      // Claim the tile or village - keep its distance-based level
      const claimedTile = {
        ...tile,
        owned: true,
        visibility: "owned" as const,
        // If claiming a village, merge its state with player's village state
        // Otherwise keep the level (already set based on distance)
        bonus: calculateTileBonus(tile.type, tileLevel),
      };
      
      // If claiming a village, transfer its village state
      if (tile.isVillage && tile.villageState) {
        // TODO: Merge village state with player's village state
        // For now, just claim it
      }
      
      newTiles.set(hexKey(tile.coordinate), claimedTile);

      // Update visibility: owned tiles + 2 rings visible
      const ownedTiles = Array.from(newTiles.values()).filter((t) => t.owned);

      // Reset visibility for all tiles
      newTiles.forEach((t, key) => {
        if (!t.owned) {
          newTiles.set(key, { ...t, visibility: "hidden" });
        }
      });

      // Make owned tiles and their neighbors visible
      ownedTiles.forEach((ownedTile) => {
        // Owned tiles are visible
        newTiles.set(hexKey(ownedTile.coordinate), {
          ...ownedTile,
          visibility: "owned",
        });

        // Get tiles in range 2 (owned + 2 more rings)
        const visibleTiles = getTilesInRange(ownedTile.coordinate, 2, newTiles);
        visibleTiles.forEach((visibleTile) => {
          if (!visibleTile.owned) {
            const visibleKey = hexKey(visibleTile.coordinate);
            const currentTile = newTiles.get(visibleKey);
            if (currentTile && currentTile.visibility === "hidden") {
              newTiles.set(visibleKey, {
                ...currentTile,
                visibility: "visible",
              });
            }
          }
        });
      });

      // Update neighbor types for all affected tiles
      updateNeighborTypes(newTiles, tile.coordinate);

      setTiles(newTiles);
    },
    [tiles, tileCost, canAfford, resources, setResources, setIsVillagePanelOpen, hasDragged, updateNeighborTypes]
  );

  // Update village level in tiles when villageLevel changes
  useEffect(() => {
    setTiles((prevTiles) => {
      const newTiles = new Map(prevTiles);
      const centerKey = hexKey({ q: 0, r: 0 });
      const centerTile = newTiles.get(centerKey);
      if (centerTile && centerTile.isVillage) {
        newTiles.set(centerKey, {
          ...centerTile,
          villageLevel: villageLevel,
        });
      }
      return newTiles;
    });
  }, [villageLevel]);

  const tilesArray = Array.from(tiles.values());
  const ownedCount = tilesArray.filter((t) => t.owned).length;
  const visibleCount = tilesArray.filter(
    (t) => t.visibility === "visible"
  ).length;

  // Calculate and update tile bonuses whenever owned tiles change
  useEffect(() => {
    // Read current tiles state inside effect
    const currentTilesArray = Array.from(tiles.values());
    const ownedTiles = currentTilesArray.filter((t) => t.owned);
    const totalBonuses: ResourceBonus = {
      food: 0,
      wood: 0,
      stone: 0,
      diamond: 0,
      technology: 0,
    };

    ownedTiles.forEach((tile) => {
      if (tile.bonus) {
        // Village bonus is already included in base production, don't double count
        // Only count non-village tile bonuses
        if (!tile.isVillage) {
          totalBonuses.food = (totalBonuses.food || 0) + (tile.bonus.food || 0);
          totalBonuses.wood = (totalBonuses.wood || 0) + (tile.bonus.wood || 0);
          totalBonuses.stone =
            (totalBonuses.stone || 0) + (tile.bonus.stone || 0);
          totalBonuses.diamond =
            (totalBonuses.diamond || 0) + (tile.bonus.diamond || 0);
          totalBonuses.technology =
            (totalBonuses.technology || 0) + (tile.bonus.technology || 0);
        }
      }
    });

    // Remove zero values for cleaner state
    const cleanBonuses: ResourceBonus = {};
    if (totalBonuses.food && totalBonuses.food > 0)
      cleanBonuses.food = totalBonuses.food;
    if (totalBonuses.wood && totalBonuses.wood > 0)
      cleanBonuses.wood = totalBonuses.wood;
    if (totalBonuses.stone && totalBonuses.stone > 0)
      cleanBonuses.stone = totalBonuses.stone;
    if (totalBonuses.diamond && totalBonuses.diamond > 0)
      cleanBonuses.diamond = totalBonuses.diamond;
    if (totalBonuses.technology && totalBonuses.technology > 0)
      cleanBonuses.technology = totalBonuses.technology;

    setTileBonuses(cleanBonuses);
  }, [ownedCount, tiles, setTileBonuses]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Handle mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start dragging on left mouse button and not on interactive elements
    if (e.button === 0 && !(e.target as HTMLElement).closest('button, a, [role="button"]')) {
      setIsDragging(true);
      setHasDragged(false);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: panX, y: panY });
      e.preventDefault();
    }
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      // Only consider it a drag if moved more than 5 pixels
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setHasDragged(true);
      }
      setPanX(panStart.x + deltaX);
      setPanY(panStart.y + deltaY);
      e.preventDefault();
    }
  }, [isDragging, dragStart, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Reset hasDragged after a short delay to allow click handlers to check it
    setTimeout(() => setHasDragged(false), 0);
  }, []);

  // Handle mouse leave to stop dragging
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse up handler to stop dragging even if mouse leaves the component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging]);

  return (
    <div className="w-full h-full flex flex-col bg-background relative">
      {/* Minimal header overlay */}
      <div className="absolute top-2 left-2 z-10 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-4 text-sm">
          <div className="text-muted-foreground">
            Owned:{" "}
            <span className="font-semibold text-foreground">{ownedCount}</span>
          </div>
          <div className="text-muted-foreground">
            Visible:{" "}
            <span className="font-semibold text-foreground">
              {visibleCount}
            </span>
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleZoomReset}
      />

      {/* Full screen map */}
      <div 
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <HexMap
          tiles={tilesArray}
          tileSize={tileSize}
          zoom={zoom}
          panX={panX}
          panY={panY}
          onTileClick={handleTileClick}
          onTileHover={handleTileHover}
          canAfford={canAfford}
        />
      </div>
    </div>
  );
}
