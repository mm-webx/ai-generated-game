"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Speed, Resources } from "./game/types";
import { ResourceBonus } from "./game-board/types";
import { HexTile } from "./game-board/types";
import { TimeDisplay } from "./game/time-display";
import { ControlButtons } from "./game/control-buttons";
import { ResourceList } from "./game/resource-list";
import { TileInfoPanel } from "./game/tile-info-panel";
import {
  BuildingType,
  UnitType,
  GuildMasterType,
  VillageState,
  BUILDING_DEFINITIONS,
  getTotalExpForLevel,
  UNIT_DEFINITIONS,
  GUILD_MASTER_DEFINITIONS,
} from "./village/types";
import { VillageUpgradePanel } from "./village/village-upgrade-panel";

interface TimeControlContextType {
  isPaused: boolean;
  speed: Speed;
  gameTime: number;
  resources: Resources;
  population: number;
  maxPopulation: number;
  buildingJobs: number;
  maxBuildingJobs: number;
  villageLevel: number;
  villageState: VillageState;
  tileBonuses: ResourceBonus;
  buildingBonuses: ResourceBonus;
  selectedTile: HexTile | null;
  isVillagePanelOpen: boolean;
  setResources: React.Dispatch<React.SetStateAction<Resources>>;
  setPopulation: React.Dispatch<React.SetStateAction<number>>;
  setMaxPopulation: React.Dispatch<React.SetStateAction<number>>;
  setMaxBuildingJobs: React.Dispatch<React.SetStateAction<number>>;
  setVillageLevel: React.Dispatch<React.SetStateAction<number>>;
  setVillageState: React.Dispatch<React.SetStateAction<VillageState>>;
  setTileBonuses: (bonuses: ResourceBonus) => void;
  setSelectedTile: (tile: HexTile | null) => void;
  setIsVillagePanelOpen: (open: boolean) => void;
  togglePause: () => void;
  handleSpeedChange: (speed: Speed) => void;
  formatTime: (seconds: number) => string;
  resetGame: () => void;
  gameOver: boolean;
  resetGameFromGameOver: () => void;
}

const TimeControlContext = createContext<TimeControlContextType | undefined>(
  undefined
);

const STORAGE_KEY = "village-game-state";

// Initial state values
const getInitialResources = (): Resources => ({
  food: 20,
  wood: 10,
  stone: 5,
  diamond: 0,
  technology: 0,
  power: 0,
});

const getInitialVillageState = (): VillageState => ({
  exp: 0,
  level: 1,
  buildings: {
    farm: 0,
    lumbermill: 0,
    quarry: 0,
    mine: 0,
    library: 0,
    home: 0,
    barracks: 0,
    archer_guild: 0,
    mage_tower: 0,
  },
  units: {
    warrior: 0,
    archer: 0,
    mage: 0,
  },
  masters: {
    farmer: 0,
    lumberjack: 0,
    stonemason: 0,
    miner: 0,
    scholar: 0,
  },
  buildingQueue: {},
});

interface GameState {
  resources: Resources;
  population: number;
  maxPopulation: number;
  maxBuildingJobs: number;
  villageLevel: number;
  villageState: VillageState;
  gameTime: number;
  speed: Speed;
  isPaused: boolean;
}

export function TimeControlProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage
  const loadGameState = (): GameState | null => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load game state:", error);
    }
    return null;
  };

  const savedState = loadGameState();

  const [isPaused, setIsPaused] = useState(savedState?.isPaused ?? false);
  const [speed, setSpeed] = useState<Speed>(savedState?.speed ?? 1);
  const [gameTime, setGameTime] = useState(savedState?.gameTime ?? 0);
  const [resources, setResources] = useState<Resources>(
    savedState?.resources ?? getInitialResources()
  );
  const [population, setPopulation] = useState(savedState?.population ?? 1);
  const [maxPopulation, setMaxPopulation] = useState(
    savedState?.maxPopulation ?? 5
  );
  const [maxBuildingJobs, setMaxBuildingJobs] = useState(
    savedState?.maxBuildingJobs ?? 1
  );
  const [villageLevel, setVillageLevel] = useState(
    savedState?.villageLevel ?? 1
  );
  const [villageState, setVillageState] = useState<VillageState>(() => {
    const saved = savedState?.villageState ?? getInitialVillageState();
    // Migrate old buildingQueue format if needed
    if (saved.buildingQueue) {
      const migratedQueue: Partial<
        Record<BuildingType, { startGameTime: number; endGameTime: number }>
      > = {};
      Object.entries(saved.buildingQueue).forEach(
        ([key, value]: [string, unknown]) => {
          if (
            value &&
            typeof value === "object" &&
            "startGameTime" in value &&
            "endGameTime" in value
          ) {
            migratedQueue[key as BuildingType] = {
              startGameTime: (value as { startGameTime: number }).startGameTime,
              endGameTime: (value as { endGameTime: number }).endGameTime,
            };
          }
        }
      );
      return { ...saved, buildingQueue: migratedQueue } as VillageState;
    }
    return saved;
  });
  const [tileBonuses, setTileBonuses] = useState<ResourceBonus>({});
  const [buildingBonuses, setBuildingBonuses] = useState<ResourceBonus>({});
  const [selectedTile, setSelectedTile] = useState<HexTile | null>(null);
  const [isVillagePanelOpen, setIsVillagePanelOpen] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Update game time based on speed and pause state
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setGameTime((prev) => {
        const newGameTime = prev + speed * 0.1;

        // Check for completed buildings using the new game time
        if (villageState.buildingQueue) {
          const queue = villageState.buildingQueue;
          const completedBuildings: BuildingType[] = [];

          Object.entries(queue).forEach(([buildingType, buildInfo]) => {
            if (
              buildInfo &&
              buildInfo.endGameTime &&
              newGameTime >= buildInfo.endGameTime
            ) {
              completedBuildings.push(buildingType as BuildingType);
            }
          });

          // Process completed buildings
          if (completedBuildings.length > 0) {
            completedBuildings.forEach((buildingType) => {
              const buildingDef = BUILDING_DEFINITIONS[buildingType];
              const currentLevel = villageState.buildings[buildingType] || 0;
              const nextLevel = currentLevel + 1;
              const expGain = buildingDef.expGain(nextLevel);

              setVillageState((prev) => ({
                ...prev,
                exp: prev.exp + expGain,
                buildings: {
                  ...prev.buildings,
                  [buildingType]: nextLevel,
                },
                buildingQueue: Object.fromEntries(
                  Object.entries(prev.buildingQueue || {}).filter(
                    ([key]) => key !== buildingType
                  )
                ) as Partial<
                  Record<
                    BuildingType,
                    {
                      startGameTime: number;
                      endGameTime: number;
                    }
                  >
                >,
              }));
            });
          }
        }

        return newGameTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, speed, villageState.buildingQueue, villageState.buildings]);

  // Calculate building bonuses and unit power generation
  useEffect(() => {
    const bonuses: ResourceBonus = {};

    // Calculate building bonuses
    Object.entries(villageState.buildings).forEach(([type, level]) => {
      if (level > 0) {
        const buildingDef = BUILDING_DEFINITIONS[type as BuildingType];
        if (buildingDef.resourceBonus) {
          const bonus = buildingDef.resourceBonus(level);
          Object.entries(bonus).forEach(([key, value]) => {
            bonuses[key as keyof ResourceBonus] =
              (bonuses[key as keyof ResourceBonus] || 0) + (value || 0);
          });
        }
      }
    });

    // Apply guild master percentage bonuses
    Object.entries(villageState.masters).forEach(([masterType, count]) => {
      if (count > 0) {
        const masterDef =
          GUILD_MASTER_DEFINITIONS[masterType as GuildMasterType];
        const resourceType = masterDef.resourceType;
        const baseBonus = bonuses[resourceType] || 0;
        const percentageBonus =
          (baseBonus * masterDef.bonusPercent * count) / 100;
        bonuses[resourceType] = (bonuses[resourceType] || 0) + percentageBonus;
      }
    });

    // Calculate unit power generation
    let totalPower = 0;
    Object.entries(villageState.units).forEach(([type, count]) => {
      if (count > 0) {
        const unitDef = UNIT_DEFINITIONS[type as UnitType];
        totalPower += unitDef.powerBonus * count;
      }
    });

    // Add power from units to bonuses
    if (totalPower > 0) {
      bonuses.power = totalPower;
    }

    setBuildingBonuses(bonuses);
  }, [villageState.buildings, villageState.units, villageState.masters]);

  // Update max population based on homes
  useEffect(() => {
    const basePopulation = 5;
    const homeLevel = villageState.buildings.home || 0;
    const buildingDef = BUILDING_DEFINITIONS.home;
    const populationBonus =
      homeLevel > 0 && buildingDef.populationBonus
        ? buildingDef.populationBonus(homeLevel)
        : 0;
    setMaxPopulation(basePopulation + populationBonus);
  }, [villageState.buildings.home]);

  // Update village level based on exp
  useEffect(() => {
    let newLevel = 1;
    while (villageState.exp >= getTotalExpForLevel(newLevel + 1)) {
      newLevel++;
    }
    if (newLevel !== villageState.level) {
      setVillageState((prev) => ({ ...prev, level: newLevel }));
      setVillageLevel(newLevel);
    }
  }, [villageState.exp, villageState.level]);

  // Update resources based on village base production + tile bonuses + building bonuses - population food cost
  useEffect(() => {
    if (isPaused || gameOver) return;

    const interval = setInterval(() => {
      setResources((prev) => {
        // Village base production: 5 food, 3 wood, 1 stone per minute
        // Calculate food production: village base + tile bonuses + building bonuses - population cost
        // Each person costs -1 food per minute
        const totalFoodBonus =
          (tileBonuses.food || 0) + (buildingBonuses.food || 0);
        const foodProduction =
          ((5 + totalFoodBonus - population) / 600) * speed;

        const newFood = Math.max(0, prev.food + foodProduction);

        return {
          ...prev,
          // Village base production rates per minute at 1x speed
          // Per 100ms: (rate / 60) * 0.1 * speed
          // Plus tile bonuses: (bonus / 60) * 0.1 * speed
          // Plus building bonuses: (bonus / 60) * 0.1 * speed
          // Minus population cost: (population / 60) * 0.1 * speed
          food: newFood,
          wood:
            prev.wood +
            ((3 + (tileBonuses.wood || 0) + (buildingBonuses.wood || 0)) /
              600) *
              speed,
          stone:
            prev.stone +
            ((1 + (tileBonuses.stone || 0) + (buildingBonuses.stone || 0)) /
              600) *
              speed,
          diamond:
            prev.diamond +
            (((tileBonuses.diamond || 0) + (buildingBonuses.diamond || 0)) /
              600) *
              speed,
          technology:
            prev.technology +
            (((tileBonuses.technology || 0) +
              (buildingBonuses.technology || 0)) /
              600) *
              speed,
          power: prev.power + ((buildingBonuses.power || 0) / 600) * speed, // Power from units
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [
    isPaused,
    speed,
    tileBonuses,
    buildingBonuses,
    population,
    gameOver,
    villageState.buildingQueue,
  ]);

  // Check for game over conditions
  useEffect(() => {
    if (gameOver || isPaused) return;

    const totalFoodBonus =
      (tileBonuses.food || 0) + (buildingBonuses.food || 0);
    const foodProductionPerMinute = 5 + totalFoodBonus - population;
    const hasFarmBuilding = villageState.buildingQueue?.farm !== undefined;

    // Game over if:
    // 1. Food is 0 or less
    // 2. Food production is 0 or negative
    // 3. No farms are being built that could increase food production
    if (
      resources.food <= 0 &&
      foodProductionPerMinute <= 0 &&
      !hasFarmBuilding
    ) {
      setGameOver(true);
      setIsPaused(true);
    }
  }, [
    resources.food,
    tileBonuses.food,
    buildingBonuses.food,
    population,
    villageState.buildingQueue,
    gameOver,
    isPaused,
  ]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "`":
        case "Backquote":
          event.preventDefault();
          setIsPaused((prev) => !prev);
          break;
        case "1":
          event.preventDefault();
          setSpeed(1);
          setIsPaused(false);
          break;
        case "2":
          event.preventDefault();
          setSpeed(5);
          setIsPaused(false);
          break;
        case "3":
          event.preventDefault();
          setSpeed(20);
          setIsPaused(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: Speed) => {
    setSpeed(newSpeed);
    setIsPaused(false);
  }, []);

  // Save game state to localStorage every 10 seconds
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saveGameState = () => {
      try {
        const state: GameState = {
          resources,
          population,
          maxPopulation,
          maxBuildingJobs,
          villageLevel,
          villageState,
          gameTime,
          speed,
          isPaused,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save game state:", error);
      }
    };

    // Save immediately on mount
    saveGameState();

    // Then save every 10 seconds
    const interval = setInterval(saveGameState, 10000);

    return () => clearInterval(interval);
  }, [
    resources,
    population,
    maxPopulation,
    maxBuildingJobs,
    villageLevel,
    villageState,
    gameTime,
    speed,
    isPaused,
  ]);

  // Reset game function
  const resetGame = useCallback(() => {
    if (typeof window === "undefined") return;
    if (
      confirm(
        "Are you sure you want to reset the game? All progress will be lost."
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("village-game-tiles");
      window.location.reload();
    }
  }, []);

  const resetGameFromGameOver = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("village-game-tiles");
    window.location.reload();
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }, []);

  // Calculate current building jobs (active builds)
  const buildingJobs = villageState.buildingQueue
    ? Object.keys(villageState.buildingQueue).length
    : 0;

  return (
    <TimeControlContext.Provider
      value={{
        isPaused,
        speed,
        gameTime,
        resources,
        population,
        maxPopulation,
        buildingJobs,
        maxBuildingJobs,
        villageLevel,
        villageState,
        tileBonuses,
        buildingBonuses,
        selectedTile,
        isVillagePanelOpen,
        setResources,
        setPopulation,
        setMaxPopulation,
        setMaxBuildingJobs,
        setVillageLevel,
        setVillageState,
        setTileBonuses,
        setSelectedTile,
        setIsVillagePanelOpen,
        togglePause,
        handleSpeedChange,
        formatTime,
        resetGame,
        gameOver,
        resetGameFromGameOver,
      }}
    >
      {children}
    </TimeControlContext.Provider>
  );
}

export function useTimeControl() {
  const context = useContext(TimeControlContext);
  if (context === undefined) {
    throw new Error("useTimeControl must be used within a TimeControlProvider");
  }
  return context;
}

export function GameHeader() {
  const {
    isPaused,
    speed,
    gameTime,
    resources,
    selectedTile,
    villageState,
    buildingBonuses,
    isVillagePanelOpen,
    population,
    maxPopulation,
    maxBuildingJobs,
    villageLevel,
    setResources,
    setVillageState,
    setPopulation,
    setIsVillagePanelOpen,
    togglePause,
    handleSpeedChange,
    formatTime,
    gameOver,
    resetGameFromGameOver,
  } = useTimeControl();

  const handleUpgradeBuilding = (buildingType: BuildingType) => {
    const currentLevel = villageState.buildings[buildingType] || 0;
    const buildingDef = BUILDING_DEFINITIONS[buildingType];
    const nextLevel = currentLevel + 1;

    if (nextLevel > buildingDef.maxLevel) return;

    const cost = buildingDef.cost(nextLevel);
    const currentBuildingJobs = villageState.buildingQueue
      ? Object.keys(villageState.buildingQueue).length
      : 0;

    // Check if can afford, not already building, and has available building job slot
    if (
      resources.food >= cost.food &&
      resources.wood >= cost.wood &&
      resources.stone >= cost.stone &&
      resources.diamond >= cost.diamond &&
      resources.technology >= cost.technology &&
      resources.power >= cost.power &&
      !villageState.buildingQueue?.[buildingType] &&
      currentBuildingJobs < maxBuildingJobs
    ) {
      // Deduct resources
      setResources((prev) => ({
        food: prev.food - cost.food,
        wood: prev.wood - cost.wood,
        stone: prev.stone - cost.stone,
        diamond: prev.diamond - cost.diamond,
        technology: prev.technology - cost.technology,
        power: prev.power - cost.power,
      }));

      // Add to building queue (using game time)
      // buildTime is in game seconds (not real seconds)
      // If game time is 00:23 and buildTime is 30s, building completes at 00:53
      // When speed increases, game time accelerates, so building completes faster in real time
      const buildTime = buildingDef.buildTime(nextLevel); // buildTime in game seconds
      const startGameTime = gameTime;
      const endGameTime = startGameTime + buildTime; // endGameTime in game seconds

      setVillageState((prev) => ({
        ...prev,
        buildingQueue: {
          ...(prev.buildingQueue || {}),
          [buildingType]: {
            startGameTime,
            endGameTime,
          },
        },
      }));
    }
  };

  const handleRecruitUnit = (unitType: UnitType) => {
    const unitDef = UNIT_DEFINITIONS[unitType];

    // Check if can afford and has population space
    if (
      resources.food >= unitDef.cost.food &&
      resources.wood >= unitDef.cost.wood &&
      resources.stone >= unitDef.cost.stone &&
      resources.diamond >= unitDef.cost.diamond &&
      resources.technology >= unitDef.cost.technology &&
      resources.power >= unitDef.cost.power &&
      population + unitDef.populationCost <= maxPopulation
    ) {
      // Deduct resources
      setResources((prev) => ({
        food: prev.food - unitDef.cost.food,
        wood: prev.wood - unitDef.cost.wood,
        stone: prev.stone - unitDef.cost.stone,
        diamond: prev.diamond - unitDef.cost.diamond,
        technology: prev.technology - unitDef.cost.technology,
        power: prev.power - unitDef.cost.power,
      }));

      // Add unit and increase population
      setVillageState((prev) => ({
        ...prev,
        units: {
          ...prev.units,
          [unitType]: (prev.units[unitType] || 0) + 1,
        },
      }));

      setPopulation((prev) => prev + unitDef.populationCost);
    }
  };

  const handleHireMaster = (masterType: GuildMasterType) => {
    const masterDef = GUILD_MASTER_DEFINITIONS[masterType];

    // Check if can afford
    if (
      resources.food >= masterDef.cost.food &&
      resources.wood >= masterDef.cost.wood &&
      resources.stone >= masterDef.cost.stone &&
      resources.diamond >= masterDef.cost.diamond &&
      resources.technology >= masterDef.cost.technology &&
      resources.power >= masterDef.cost.power
    ) {
      // Deduct resources
      setResources((prev) => ({
        food: prev.food - masterDef.cost.food,
        wood: prev.wood - masterDef.cost.wood,
        stone: prev.stone - masterDef.cost.stone,
        diamond: prev.diamond - masterDef.cost.diamond,
        technology: prev.technology - masterDef.cost.technology,
        power: prev.power - masterDef.cost.power,
      }));

      // Add master
      setVillageState((prev) => ({
        ...prev,
        masters: {
          ...prev.masters,
          [masterType]: (prev.masters[masterType] || 0) + 1,
        },
      }));
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-start">
        {/* Left side - Time and Controls */}
        <div className="px-4 pt-3 flex flex-col gap-3">
          <ButtonGroup orientation="horizontal" className="h-10">
            <TimeDisplay time={formatTime(gameTime)} />
            <ControlButtons
              speed={speed}
              isPaused={isPaused}
              onTogglePause={togglePause}
              onSpeedChange={handleSpeedChange}
            />
          </ButtonGroup>

          {/* Tile Info Panel */}
          {selectedTile && <TileInfoPanel tile={selectedTile} />}
        </div>

        {/* Right side - Resources and Village Panel */}
        <div className="px-4 pt-3 flex flex-col gap-2 relative">
          <ResourceList resources={resources} />

          {/* Village Upgrade Panel */}
          {isVillagePanelOpen && (
            <div className="absolute top-[calc(100%+0.5rem)] right-4 w-[calc(100%-2rem)] min-w-[200px] h-[calc(100vh-12rem)] overflow-hidden z-50">
              <VillageUpgradePanel
                villageState={villageState}
                buildingBonuses={buildingBonuses}
                onUpgradeBuilding={handleUpgradeBuilding}
                onRecruitUnit={handleRecruitUnit}
                onHireMaster={handleHireMaster}
                onClose={() => setIsVillagePanelOpen(false)}
              />
            </div>
          )}
        </div>
      </header>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-destructive">
                Game Over!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-semibold">
                You starved your villagers! Food reached zero.
              </p>

              {/* Calculate Score */}
              {(() => {
                // Calculate spent resources from buildings
                const spentResources = {
                  food: 0,
                  wood: 0,
                  stone: 0,
                  diamond: 0,
                  technology: 0,
                  power: 0,
                };

                // Sum building costs
                Object.entries(villageState.buildings).forEach(
                  ([type, level]) => {
                    for (let l = 1; l <= level; l++) {
                      const cost =
                        BUILDING_DEFINITIONS[type as BuildingType].cost(l);
                      spentResources.food += cost.food;
                      spentResources.wood += cost.wood;
                      spentResources.stone += cost.stone;
                      spentResources.diamond += cost.diamond;
                      spentResources.technology += cost.technology;
                      spentResources.power += cost.power;
                    }
                  }
                );

                // Sum unit costs
                Object.entries(villageState.units).forEach(([type, count]) => {
                  const unitCost = UNIT_DEFINITIONS[type as UnitType].cost;
                  spentResources.food += unitCost.food * count;
                  spentResources.wood += unitCost.wood * count;
                  spentResources.stone += unitCost.stone * count;
                  spentResources.diamond += unitCost.diamond * count;
                  spentResources.technology += unitCost.technology * count;
                  spentResources.power += unitCost.power * count;
                });

                // Sum master costs
                Object.entries(villageState.masters).forEach(
                  ([type, count]) => {
                    const masterCost =
                      GUILD_MASTER_DEFINITIONS[type as GuildMasterType].cost;
                    spentResources.food += masterCost.food * count;
                    spentResources.wood += masterCost.wood * count;
                    spentResources.stone += masterCost.stone * count;
                    spentResources.diamond += masterCost.diamond * count;
                    spentResources.technology += masterCost.technology * count;
                    spentResources.power += masterCost.power * count;
                  }
                );

                // Calculate positive points
                const villageLevelPoints = villageLevel * 100;
                const expPoints = Math.floor(villageState.exp);
                const buildingLevelsPoints =
                  Object.values(villageState.buildings).reduce(
                    (sum, level) => sum + level,
                    0
                  ) * 50;
                const unitsPoints =
                  Object.values(villageState.units).reduce(
                    (sum, count) => sum + count,
                    0
                  ) * 25;
                const mastersPoints =
                  Object.values(villageState.masters).reduce(
                    (sum, count) => sum + count,
                    0
                  ) * 30;
                const spentResourcesPoints =
                  Math.floor(spentResources.food) * 0.1 +
                  Math.floor(spentResources.wood) * 0.2 +
                  Math.floor(spentResources.stone) * 0.3 +
                  Math.floor(spentResources.diamond) * 2 +
                  Math.floor(spentResources.technology) * 1 +
                  Math.floor(spentResources.power) * 0.5;

                // Negative points: time (in seconds)
                const timePenalty = Math.floor(gameTime);

                // Final score
                const totalScore =
                  villageLevelPoints +
                  expPoints +
                  buildingLevelsPoints +
                  unitsPoints +
                  mastersPoints +
                  Math.floor(spentResourcesPoints) -
                  timePenalty;

                return (
                  <div className="space-y-4">
                    {/* Final Score Display */}
                    <div className="bg-muted/50 rounded-lg p-6 text-center border-2 border-destructive/20">
                      <div className="text-sm text-muted-foreground mb-2">
                        Your Score:
                      </div>
                      <div className="text-5xl font-bold text-foreground">
                        {Math.floor(totalScore).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        points
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="space-y-2 text-xs">
                      <div className="font-semibold text-sm border-b pb-1">
                        Score Breakdown:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Village Level:
                          </span>
                          <span className="font-mono text-green-500">
                            +{villageLevelPoints.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Experience:
                          </span>
                          <span className="font-mono text-green-500">
                            +{expPoints.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Building Levels:
                          </span>
                          <span className="font-mono text-green-500">
                            +{buildingLevelsPoints.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Units:</span>
                          <span className="font-mono text-green-500">
                            +{unitsPoints.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Guild Masters:
                          </span>
                          <span className="font-mono text-green-500">
                            +{mastersPoints.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Spent Resources:
                          </span>
                          <span className="font-mono text-green-500">
                            +{Math.floor(spentResourcesPoints).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between col-span-2 border-t pt-1 mt-1">
                          <span className="text-muted-foreground">
                            Game Time (Penalty):
                          </span>
                          <span className="font-mono text-red-500">
                            -{timePenalty.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Statistics */}
              <div className="space-y-4">
                {/* Game Time Section */}
                <div className="space-y-2">
                  <div className="font-semibold text-base border-b pb-2">
                    Game Time:
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Game Time:</span>
                    <span className="font-mono font-semibold">
                      {formatTime(gameTime)}
                    </span>
                  </div>
                </div>

                {/* Village Statistics Section */}
                <div className="space-y-2">
                  <div className="font-semibold text-base border-b pb-2">
                    Village Statistics:
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Village Level:
                        </span>
                        <span className="font-mono font-semibold">
                          Lv.{villageLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Experience:
                        </span>
                        <span className="font-mono font-semibold">
                          {Math.floor(villageState.exp).toLocaleString()} exp
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Population:
                        </span>
                        <span className="font-mono font-semibold">
                          {population} / {maxPopulation}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Building Levels:
                        </span>
                        <span className="font-mono font-semibold">
                          {Object.values(villageState.buildings).reduce(
                            (sum, level) => sum + level,
                            0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Units:</span>
                        <span className="font-mono font-semibold">
                          {Object.values(villageState.units).reduce(
                            (sum, count) => sum + count,
                            0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Guild Masters:
                        </span>
                        <span className="font-mono font-semibold">
                          {Object.values(villageState.masters).reduce(
                            (sum, count) => sum + count,
                            0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Buildings in Queue:
                        </span>
                        <span className="font-mono font-semibold">
                          {villageState.buildingQueue
                            ? Object.keys(villageState.buildingQueue).length
                            : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="font-semibold text-sm mb-2">
                    Building Details:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(villageState.buildings).map(
                      ([type, level]) =>
                        level > 0 && (
                          <div key={type} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {BUILDING_DEFINITIONS[type as BuildingType].name}:
                            </span>
                            <span className="font-mono">Lv.{level}</span>
                          </div>
                        )
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="font-semibold text-sm mb-2">
                    Unit Details:
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(villageState.units).map(
                      ([type, count]) =>
                        count > 0 && (
                          <div key={type} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {UNIT_DEFINITIONS[type as UnitType].name}:
                            </span>
                            <span className="font-mono">{count}</span>
                          </div>
                        )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button onClick={resetGameFromGameOver} variant="default">
                  Start New Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </TooltipProvider>
  );
}
