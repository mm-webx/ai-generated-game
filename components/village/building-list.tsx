"use client";

import { BuildingType } from "./types";
import { BuildingCard } from "./building-card";

interface BuildingListProps {
  buildings: Record<BuildingType, number>;
  onUpgrade: (buildingType: BuildingType) => void;
}

export function BuildingList({ buildings, onUpgrade }: BuildingListProps) {
  const buildingTypes: BuildingType[] = [
    "farm",
    "lumbermill",
    "quarry",
    "mine",
    "library",
    "home",
    "barracks",
    "archer_guild",
    "mage_tower",
  ];

  return (
    <div className="space-y-3">
      {buildingTypes.map((type) => (
        <BuildingCard
          key={type}
          buildingType={type}
          currentLevel={buildings[type] || 0}
          onUpgrade={onUpgrade}
        />
      ))}
    </div>
  );
}

