"use client";

import { GameBoard } from "@/components/game-board";
import { TileInfoPanel } from "@/components/game/tile-info-panel";
import { useTimeControl } from "@/components/game-header";

export default function Home() {
  const { selectedTile } = useTimeControl();

  return (
    <>
      <div className="fixed inset-0">
        <GameBoard mapWidth={15} mapHeight={15} tileSize={32} />
      </div>
      {selectedTile && (
        <TileInfoPanel tile={selectedTile} />
      )}
    </>
  );
}
