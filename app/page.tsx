"use client";

import { GameBoard } from "@/components/game-board";
import { TileInfoPanel } from "@/components/game/tile-info-panel";
import { useTimeControl } from "@/components/game-header";
import { DEFAULT_TILE_COST } from "@/components/game-board/types";

export default function Home() {
  const { selectedTile, resources } = useTimeControl();
  
  const canAfford = (cost: typeof DEFAULT_TILE_COST) => {
    return (
      resources.food >= cost.food &&
      resources.wood >= cost.wood &&
      resources.stone >= cost.stone
    );
  };

  return (
    <>
      <div className="fixed inset-0">
        <GameBoard mapWidth={15} mapHeight={15} tileSize={32} />
      </div>
      {selectedTile && (
        <TileInfoPanel
          tile={selectedTile}
          tileCost={DEFAULT_TILE_COST}
          canAfford={canAfford(DEFAULT_TILE_COST)}
        />
      )}
    </>
  );
}
