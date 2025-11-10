import { Resources } from "../game/types";
import { LucideIcon } from "lucide-react";
import {
  Wheat,
  Trees,
  Hammer,
  Gem,
  BookOpen,
  Home,
  Sword,
  BowArrow,
  Sparkles,
} from "lucide-react";

export type BuildingType =
  | "farm"
  | "lumbermill"
  | "quarry"
  | "mine"
  | "library"
  | "home"
  | "barracks"
  | "archer_guild"
  | "mage_tower";

export type UnitType = "warrior" | "archer" | "mage";

export type GuildMasterType = "farmer" | "lumberjack" | "stonemason" | "miner" | "scholar";

export interface GuildMaster {
  type: GuildMasterType;
  name: string;
  description: string;
  icon: LucideIcon;
  cost: Resources;
  bonusPercent: number; // Percentage bonus to resource production (e.g., 10 = 10%)
  resourceType: keyof Resources; // Which resource this master boosts
}

export interface Building {
  id: string;
  type: BuildingType;
  level: number;
  name: string;
  description: string;
  icon: LucideIcon;
  maxLevel: number;
  // Cost to build (level 1) or upgrade
  cost: (level: number) => Resources;
  // Exp gained when building/upgrading
  expGain: (level: number) => number;
  // Build time in seconds (increases with level)
  buildTime: (level: number) => number;
  // Resource bonuses per level
  resourceBonus?: (level: number) => Partial<Resources>;
  // Population limit increase (for homes)
  populationBonus?: (level: number) => number;
  // Can recruit units (for military buildings)
  canRecruit?: boolean;
  unitType?: UnitType;
}

export interface Unit {
  type: UnitType;
  name: string;
  description: string;
  icon: LucideIcon;
  cost: Resources;
  populationCost: number;
  powerBonus: number; // Power generated per unit
  researchPoints: number; // Research points generated per unit
}

export interface VillageState {
  exp: number;
  level: number;
  buildings: Record<BuildingType, number>; // Building type -> level
  units: Record<UnitType, number>; // Unit type -> count
  masters: Record<GuildMasterType, number>; // Guild master type -> count
  buildingQueue?: Partial<Record<BuildingType, { startGameTime: number; endGameTime: number }>>; // Buildings currently being built (using game time)
}

export const BUILDING_DEFINITIONS: Record<BuildingType, Omit<Building, "id" | "level">> = {
  farm: {
    type: "farm",
    name: "Farm",
    description: "Increases food production",
    icon: Wheat,
    maxLevel: 10,
    cost: (level) => ({
      food: 0,
      wood: Math.floor(10 * Math.pow(1.5, level - 1)),
      stone: Math.floor(5 * Math.pow(1.5, level - 1)),
      diamond: 0,
      technology: 0,
      power: 0,
    }),
    expGain: (level) => Math.floor(10 * level),
    buildTime: (level) => Math.floor(30 * Math.pow(1.2, level - 1)), // Base 30s, grows with level
    resourceBonus: (level) => ({
      food: level * 2,
    }),
  },
  lumbermill: {
    type: "lumbermill",
    name: "Lumbermill",
    description: "Increases wood production",
    icon: Trees,
    maxLevel: 10,
    cost: (level) => ({
      food: 0,
      wood: Math.floor(8 * Math.pow(1.5, level - 1)),
      stone: Math.floor(8 * Math.pow(1.5, level - 1)),
      diamond: 0,
      technology: 0,
      power: 0,
    }),
    expGain: (level) => Math.floor(10 * level),
    buildTime: (level) => Math.floor(30 * Math.pow(1.2, level - 1)),
    resourceBonus: (level) => ({
      wood: level * 1.5,
    }),
  },
  quarry: {
    type: "quarry",
    name: "Quarry",
    description: "Increases stone production",
    icon: Hammer,
    maxLevel: 10,
    cost: (level) => ({
      food: 0,
      wood: Math.floor(12 * Math.pow(1.5, level - 1)),
      stone: Math.floor(6 * Math.pow(1.5, level - 1)),
      diamond: 0,
      technology: 0,
      power: 0,
    }),
    expGain: (level) => Math.floor(12 * level),
    buildTime: (level) => Math.floor(35 * Math.pow(1.2, level - 1)),
    resourceBonus: (level) => ({
      stone: level * 1,
    }),
  },
  mine: {
    type: "mine",
    name: "Mine",
    description: "Increases diamond production",
    icon: Gem,
    maxLevel: 10,
    cost: (level) => ({
      food: 0,
      wood: Math.floor(15 * Math.pow(1.5, level - 1)),
      stone: Math.floor(20 * Math.pow(1.5, level - 1)),
      diamond: 0,
      technology: 0,
      power: 0,
    }),
    expGain: (level) => Math.floor(15 * level),
    buildTime: (level) => Math.floor(45 * Math.pow(1.2, level - 1)),
    resourceBonus: (level) => ({
      diamond: level * 0.5,
    }),
  },
  library: {
    type: "library",
    name: "Library",
    description: "Increases technology production",
    icon: BookOpen,
    maxLevel: 10,
    cost: (level) => ({
      food: 0,
      wood: Math.floor(20 * Math.pow(1.5, level - 1)),
      stone: Math.floor(15 * Math.pow(1.5, level - 1)),
      diamond: Math.floor(2 * Math.pow(1.5, level - 1)),
      technology: 0,
      power: 0,
    }),
    expGain: (level) => Math.floor(20 * level),
    buildTime: (level) => Math.floor(50 * Math.pow(1.2, level - 1)),
    resourceBonus: (level) => ({
      technology: level * 0.3,
    }),
  },
  home: {
    type: "home",
    name: "Home",
    description: "Increases population limit",
    icon: Home,
    maxLevel: 10,
    cost: (level) => ({
      food: Math.floor(15 * Math.pow(1.5, level - 1)),
      wood: Math.floor(20 * Math.pow(1.5, level - 1)),
      stone: Math.floor(10 * Math.pow(1.5, level - 1)),
      diamond: 0,
      technology: 0,
      power: 0,
    }),
    expGain: (level) => Math.floor(8 * level),
    buildTime: (level) => Math.floor(40 * Math.pow(1.2, level - 1)),
    populationBonus: (level) => level * 5,
  },
  barracks: {
    type: "barracks",
    name: "Barracks",
    description: "Train warriors to defend your village",
    icon: Sword,
    maxLevel: 5,
    cost: (level) => ({
      food: Math.floor(30 * Math.pow(1.5, level - 1)),
      wood: Math.floor(25 * Math.pow(1.5, level - 1)),
      stone: Math.floor(20 * Math.pow(1.5, level - 1)),
      diamond: 0,
      technology: 0,
      power: 0,
    }),
    expGain: (level) => Math.floor(25 * level),
    buildTime: (level) => Math.floor(60 * Math.pow(1.2, level - 1)),
    resourceBonus: (level) => ({
      technology: level,
    }),
    canRecruit: true,
    unitType: "warrior",
  },
  archer_guild: {
    type: "archer_guild",
    name: "Archer Guild",
    description: "Train archers to defend your village",
    icon: BowArrow,
    maxLevel: 5,
    cost: (level) => ({
      food: Math.floor(25 * Math.pow(1.5, level - 1)),
      wood: Math.floor(30 * Math.pow(1.5, level - 1)),
      stone: Math.floor(15 * Math.pow(1.5, level - 1)),
      diamond: 0,
      technology: 0,
      power: 0,
    }),
    expGain: (level) => Math.floor(25 * level),
    buildTime: (level) => Math.floor(60 * Math.pow(1.2, level - 1)),
    resourceBonus: (level) => ({
      technology: level,
    }),
    canRecruit: true,
    unitType: "archer",
  },
  mage_tower: {
    type: "mage_tower",
    name: "Mage Tower",
    description: "Train mages to defend your village",
    icon: Sparkles,
    maxLevel: 5,
    cost: (level) => ({
      food: Math.floor(20 * Math.pow(1.5, level - 1)),
      wood: Math.floor(20 * Math.pow(1.5, level - 1)),
      stone: Math.floor(30 * Math.pow(1.5, level - 1)),
      diamond: Math.floor(5 * Math.pow(1.5, level - 1)),
      technology: Math.floor(10 * Math.pow(1.5, level - 1)),
      power: 0,
    }),
    expGain: (level) => Math.floor(30 * level),
    buildTime: (level) => Math.floor(75 * Math.pow(1.2, level - 1)),
    resourceBonus: (level) => ({
      technology: level,
    }),
    canRecruit: true,
    unitType: "mage",
  },
};

export const UNIT_DEFINITIONS: Record<UnitType, Unit> = {
  warrior: {
    type: "warrior",
    name: "Warrior",
    description: "Melee combat unit - generates 1 power",
    icon: Sword,
    cost: {
      food: 10,
      wood: 5,
      stone: 3,
      diamond: 0,
      technology: 0,
      power: 0,
    },
    populationCost: 1,
    powerBonus: 1,
    researchPoints: 1,
  },
  archer: {
    type: "archer",
    name: "Archer",
    description: "Ranged combat unit - generates 3 power",
    icon: BowArrow,
    cost: {
      food: 15,
      wood: 12,
      stone: 8,
      diamond: 0,
      technology: 0,
      power: 0,
    },
    populationCost: 1,
    powerBonus: 3,
    researchPoints: 2,
  },
  mage: {
    type: "mage",
    name: "Mage",
    description: "Magic combat unit - generates 5 power",
    icon: Sparkles,
    cost: {
      food: 8,
      wood: 8,
      stone: 8,
      diamond: 1,
      technology: 0,
      power: 0,
    },
    populationCost: 1,
    powerBonus: 5,
    researchPoints: 3,
  },
};

// Calculate exp needed for next level
export function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Calculate total exp needed to reach a level
export function getTotalExpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getExpForLevel(i);
  }
  return total;
}

export const GUILD_MASTER_DEFINITIONS: Record<GuildMasterType, GuildMaster> = {
  farmer: {
    type: "farmer",
    name: "Master Farmer",
    description: "Increases food production by 2% per master",
    icon: Wheat,
    cost: {
      food: 50,
      wood: 20,
      stone: 10,
      diamond: 0,
      technology: 0,
      power: 0,
    },
    bonusPercent: 2,
    resourceType: "food",
  },
  lumberjack: {
    type: "lumberjack",
    name: "Master Lumberjack",
    description: "Increases wood production by 2% per master",
    icon: Trees,
    cost: {
      food: 30,
      wood: 50,
      stone: 15,
      diamond: 0,
      technology: 0,
      power: 0,
    },
    bonusPercent: 2,
    resourceType: "wood",
  },
  stonemason: {
    type: "stonemason",
    name: "Master Stonemason",
    description: "Increases stone production by 2% per master",
    icon: Hammer,
    cost: {
      food: 25,
      wood: 30,
      stone: 50,
      diamond: 0,
      technology: 0,
      power: 0,
    },
    bonusPercent: 2,
    resourceType: "stone",
  },
  miner: {
    type: "miner",
    name: "Master Miner",
    description: "Increases diamond production by 2% per master",
    icon: Gem,
    cost: {
      food: 40,
      wood: 40,
      stone: 40,
      diamond: 5,
      technology: 0,
      power: 0,
    },
    bonusPercent: 2,
    resourceType: "diamond",
  },
  scholar: {
    type: "scholar",
    name: "Master Scholar",
    description: "Increases technology production by 2% per master",
    icon: BookOpen,
    cost: {
      food: 30,
      wood: 40,
      stone: 30,
      diamond: 3,
      technology: 20,
      power: 0,
    },
    bonusPercent: 2,
    resourceType: "technology",
  },
};

