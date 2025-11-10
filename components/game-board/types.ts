import { VillageState } from "../village/types";

export interface HexCoordinate {
  q: number; // Column (x-axis)
  r: number; // Row (y-axis)
}

export type TileType =
  | "grassland" // Równiny trawiaste
  | "plains" // Równiny
  | "desert" // Pustynia
  | "tundra" // Tundra
  | "snow" // Śnieg
  | "coast" // Wybrzeże
  | "ocean" // Ocean
  | "lake" // Jezioro
  | "mountain" // Góra
  | "hill" // Wzgórze
  | "forest" // Las
  | "jungle" // Dżungla
  | "marsh"; // Bagno

export type TileVisibility = "owned" | "visible" | "hidden";

export interface ResourceBonus {
  food?: number; // per minute
  wood?: number; // per minute
  stone?: number; // per minute
  diamond?: number; // per minute
  technology?: number; // per minute
  power?: number; // per minute
}

export interface HexTile {
  coordinate: HexCoordinate;
  type: TileType;
  visibility: TileVisibility;
  owned: boolean;
  bonus?: ResourceBonus;
  isVillage?: boolean;
  villageLevel?: number;
  villageState?: VillageState; // State for AI villages
  level?: number; // Tile upgrade level (1-100)
  neighborTypes?: TileType[]; // Types of neighboring tiles for transition textures
}

export interface TileCost {
  food: number;
  wood: number;
  stone: number;
  power: number;
}

export const DEFAULT_TILE_COST: TileCost = {
  food: 10,
  wood: 5,
  stone: 2,
  power: 0,
};
