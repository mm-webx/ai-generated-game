"use client";

import { useState, useEffect } from "react";
import { Building, BUILDING_DEFINITIONS } from "./types";
import { Resources } from "../game/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ButtonGroup } from "../ui/button-group";
import { useTimeControl } from "../game-header";
import { Apple, TreePine, Mountain, Gem, FlaskConical, Sword, Clock } from "lucide-react";

interface BuildingCardProps {
  buildingType: Building["type"];
  currentLevel: number;
  onUpgrade: (buildingType: Building["type"]) => void;
}

const RESOURCE_ICONS = {
  food: Apple,
  wood: TreePine,
  stone: Mountain,
  diamond: Gem,
  technology: FlaskConical,
  power: Sword,
};

export function BuildingCard({
  buildingType,
  currentLevel,
  onUpgrade,
}: BuildingCardProps) {
  const { resources, villageState, buildingJobs, maxBuildingJobs, gameTime, speed } = useTimeControl();
  const buildingDef = BUILDING_DEFINITIONS[buildingType];
  const Icon = buildingDef.icon;
  const nextLevel = currentLevel + 1;
  const isMaxLevel = currentLevel >= buildingDef.maxLevel;
  const upgradeCost = buildingDef.cost(nextLevel);
  const expGain = buildingDef.expGain(nextLevel);
  const buildTime = buildingDef.buildTime(nextLevel);
  const isBuilding = villageState.buildingQueue?.[buildingType] !== undefined;
  const buildInfo = villageState.buildingQueue?.[buildingType];
  const hasAvailableJob = buildingJobs < maxBuildingJobs;
  
  // Calculate remaining build time
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  
  useEffect(() => {
    if (!buildInfo) {
      setRemainingTime(null);
      return;
    }
    
    const updateRemainingTime = () => {
      // Timer shows remaining game time (in game seconds)
      // If building starts at 00:23 and ends at 00:53, timer shows remaining time until 00:53
      // When speed increases, game time accelerates, so timer counts down faster
      if (buildInfo.endGameTime) {
        const remainingGameSeconds = Math.max(0, buildInfo.endGameTime - gameTime);
        setRemainingTime(Math.ceil(remainingGameSeconds));
      } else {
        setRemainingTime(null);
      }
    };
    
    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 100);
    
    return () => clearInterval(interval);
  }, [buildInfo, gameTime]);

  const canAfford = (cost: Resources) => {
    return (
      resources.food >= cost.food &&
      resources.wood >= cost.wood &&
      resources.stone >= cost.stone &&
      resources.diamond >= cost.diamond &&
      resources.technology >= cost.technology &&
      resources.power >= cost.power
    );
  };

  const affordable = canAfford(upgradeCost);

  // Resource colors for exp badges and icons
  const RESOURCE_COLORS = {
    food: "bg-green-500/20 text-green-600 border-green-500/30",
    wood: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    stone: "bg-slate-500/20 text-slate-600 border-slate-500/30",
    diamond: "bg-cyan-500/20 text-cyan-600 border-cyan-500/30",
    technology: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    power: "bg-red-500/20 text-red-600 border-red-500/30",
  };

  const RESOURCE_ICON_COLORS = {
    food: "text-green-600",
    wood: "text-amber-600",
    stone: "text-slate-600",
    diamond: "text-cyan-600",
    technology: "text-blue-600",
    power: "text-red-600",
  };

  // Determine exp badge color based on building type
  const getExpBadgeColor = () => {
    switch (buildingType) {
      case "farm":
        return RESOURCE_COLORS.food;
      case "lumbermill":
        return RESOURCE_COLORS.wood;
      case "quarry":
        return RESOURCE_COLORS.stone;
      case "mine":
        return RESOURCE_COLORS.diamond;
      case "library":
        return RESOURCE_COLORS.technology;
      case "barracks":
      case "archer_guild":
      case "mage_tower":
        return RESOURCE_COLORS.power;
      default:
        return "bg-purple-500/20 text-purple-600 border-purple-500/30";
    }
  };

  // Determine icon color based on primary resource bonus
  const getIconColor = () => {
    if (buildingDef.resourceBonus) {
      const bonus = buildingDef.resourceBonus(nextLevel);
      // Find the resource with the highest bonus value
      const resourceEntries = Object.entries(bonus).filter(([_, value]) => value && value > 0) as Array<[keyof typeof bonus, number]>;
      
      if (resourceEntries.length > 0) {
        // Sort by value descending and get the first (highest) one
        resourceEntries.sort((a, b) => (b[1] || 0) - (a[1] || 0));
        const primaryResource = resourceEntries[0][0];
        return RESOURCE_ICON_COLORS[primaryResource] || "text-muted-foreground";
      }
    }
    
    // Fallback based on building type
    switch (buildingType) {
      case "farm":
        return RESOURCE_ICON_COLORS.food;
      case "lumbermill":
        return RESOURCE_ICON_COLORS.wood;
      case "quarry":
        return RESOURCE_ICON_COLORS.stone;
      case "mine":
        return RESOURCE_ICON_COLORS.diamond;
      case "library":
        return RESOURCE_ICON_COLORS.technology;
      case "barracks":
      case "archer_guild":
      case "mage_tower":
        return RESOURCE_ICON_COLORS.power;
      case "home":
        return "text-purple-600"; // Home increases population, use purple
      default:
        return "text-muted-foreground";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const formatCost = (cost: Resources) => {
    const parts: JSX.Element[] = [];
    if (cost.food > 0) {
      const Icon = RESOURCE_ICONS.food;
      const hasEnough = resources.food >= cost.food;
      parts.push(
        <Badge
          key="food"
          variant="outline"
          className={`gap-1 text-xs ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
        >
          <Icon className="w-3 h-3 text-green-500" />
          {cost.food}
        </Badge>
      );
    }
    if (cost.wood > 0) {
      const Icon = RESOURCE_ICONS.wood;
      const hasEnough = resources.wood >= cost.wood;
      parts.push(
        <Badge
          key="wood"
          variant="outline"
          className={`gap-1 text-xs ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
        >
          <Icon className="w-3 h-3 text-amber-600" />
          {cost.wood}
        </Badge>
      );
    }
    if (cost.stone > 0) {
      const Icon = RESOURCE_ICONS.stone;
      const hasEnough = resources.stone >= cost.stone;
      parts.push(
        <Badge
          key="stone"
          variant="outline"
          className={`gap-1 text-xs ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
        >
          <Icon className="w-3 h-3 text-slate-400" />
          {cost.stone}
        </Badge>
      );
    }
    if (cost.diamond > 0) {
      const Icon = RESOURCE_ICONS.diamond;
      const hasEnough = resources.diamond >= cost.diamond;
      parts.push(
        <Badge
          key="diamond"
          variant="outline"
          className={`gap-1 text-xs ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
        >
          <Icon className="w-3 h-3 text-cyan-500" />
          {cost.diamond}
        </Badge>
      );
    }
    if (cost.technology > 0) {
      const Icon = RESOURCE_ICONS.technology;
      const hasEnough = resources.technology >= cost.technology;
      parts.push(
        <Badge
          key="technology"
          variant="outline"
          className={`gap-1 text-xs ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
        >
          <Icon className="w-3 h-3 text-blue-500" />
          {cost.technology}
        </Badge>
      );
    }
    if (cost.power > 0) {
      const Icon = RESOURCE_ICONS.power;
      const hasEnough = resources.power >= cost.power;
      parts.push(
        <Badge
          key="power"
          variant="outline"
          className={`gap-1 text-xs ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
        >
          <Icon className="w-3 h-3 text-red-500" />
          {cost.power}
        </Badge>
      );
    }
    // Add build time badge
    parts.push(
      <Badge
        key="buildTime"
        variant="outline"
        className="gap-1 text-xs"
      >
        <Clock className="w-3 h-3 text-muted-foreground" />
        {formatTime(buildTime)}
      </Badge>
    );
    return parts.length > 0 ? (
      <div className="flex flex-wrap items-center gap-1.5">{parts}</div>
    ) : null;
  };

  const getBonusText = (level: number) => {
    if (buildingDef.resourceBonus) {
      const bonus = buildingDef.resourceBonus(level);
      const parts: JSX.Element[] = [];
      if (bonus.food) {
        const Icon = RESOURCE_ICONS.food;
        parts.push(
          <Badge key="food" variant="secondary" className="gap-1.5">
            <Icon className="w-3 h-3 text-green-500" />
            <span className="text-green-500">
              +{bonus.food.toFixed(1)}/m
            </span>
          </Badge>
        );
      }
      if (bonus.wood) {
        const Icon = RESOURCE_ICONS.wood;
        parts.push(
          <Badge key="wood" variant="secondary" className="gap-1.5">
            <Icon className="w-3 h-3 text-amber-600" />
            <span className="text-amber-600">
              +{bonus.wood.toFixed(1)}/m
            </span>
          </Badge>
        );
      }
      if (bonus.stone) {
        const Icon = RESOURCE_ICONS.stone;
        parts.push(
          <Badge key="stone" variant="secondary" className="gap-1.5">
            <Icon className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">
              +{bonus.stone.toFixed(1)}/m
            </span>
          </Badge>
        );
      }
      if (bonus.diamond) {
        const Icon = RESOURCE_ICONS.diamond;
        parts.push(
          <Badge key="diamond" variant="secondary" className="gap-1.5">
            <Icon className="w-3 h-3 text-cyan-500" />
            <span className="text-cyan-500">
              +{bonus.diamond.toFixed(1)}/m
            </span>
          </Badge>
        );
      }
      if (bonus.technology) {
        const Icon = RESOURCE_ICONS.technology;
        parts.push(
          <Badge key="technology" variant="secondary" className="gap-1.5">
            <Icon className="w-3 h-3 text-blue-500" />
            <span className="text-blue-500">
              +{bonus.technology.toFixed(1)}/m
            </span>
          </Badge>
        );
      }
      return parts.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">{parts}</div>
      ) : null;
    }
    if (buildingDef.populationBonus) {
      const bonus = buildingDef.populationBonus(level);
      return (
        <Badge variant="secondary" className="gap-1.5">
          <span className="text-purple-600">+{bonus} population limit</span>
        </Badge>
      );
    }
    return null;
  };

  const getPrimaryBonusBadge = (level: number) => {
    if (buildingDef.resourceBonus) {
      const bonus = buildingDef.resourceBonus(level);
      // Find the resource with the highest bonus value
      const resourceEntries = Object.entries(bonus).filter(([_, value]) => value && value > 0) as Array<[keyof typeof bonus, number]>;
      
      if (resourceEntries.length > 0) {
        // Sort by value descending and get the first (highest) one
        resourceEntries.sort((a, b) => (b[1] || 0) - (a[1] || 0));
        const [resourceType, value] = resourceEntries[0];
        const Icon = RESOURCE_ICONS[resourceType as keyof typeof RESOURCE_ICONS];
        const color = RESOURCE_COLORS[resourceType as keyof typeof RESOURCE_COLORS];
        
        return (
          <Badge 
            variant="outline" 
            className={`text-xs font-semibold ${color} rounded-l-md rounded-r-none h-8 inline-flex items-center justify-center`}
          >
            <Icon className="w-3 h-3" />
            +{value.toFixed(1)}/m
          </Badge>
        );
      }
    }
    if (buildingDef.populationBonus) {
      const bonus = buildingDef.populationBonus(level);
      return (
        <Badge 
          variant="outline" 
          className="text-xs font-semibold bg-purple-500/20 text-purple-600 border-purple-500/30 rounded-l-md rounded-r-none h-8 inline-flex items-center justify-center"
        >
          +{bonus} pop
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${getIconColor()}`} />
            <div>
              <CardTitle className="text-base">{buildingDef.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {buildingDef.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentLevel > 0 && getBonusText(currentLevel) && (
              <div className="flex flex-wrap items-center gap-1">
                {getBonusText(currentLevel)}
              </div>
            )}
            <Badge variant="secondary" className="text-xs">
              Lv.{currentLevel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isMaxLevel && (
          <>
            <div className="flex items-center gap-2 flex-wrap pt-0">
              <span className="text-xs font-medium text-muted-foreground">Cost:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {formatCost(upgradeCost)}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full">
              <ButtonGroup className="flex-1">
                <Button
                  onClick={() => onUpgrade(buildingType)}
                  disabled={!affordable || isMaxLevel || isBuilding || !hasAvailableJob}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  {isMaxLevel ? "Max Level" : isBuilding && remainingTime !== null ? `Building... ${formatTime(remainingTime)}` : !affordable ? "Insufficient resources" : !hasAvailableJob ? "No building jobs available" : `Upgrade to Lv.${nextLevel}`}
                </Button>
              </ButtonGroup>
              {!isMaxLevel && !isBuilding && (
                <ButtonGroup>
                  {getPrimaryBonusBadge(nextLevel)}
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-semibold ${getExpBadgeColor()} rounded-r-md rounded-l-none border-l-0 h-8 inline-flex items-center justify-center`}
                  >
                    +{expGain} exp
                  </Badge>
                </ButtonGroup>
              )}
            </div>
          </>
        )}
        {isMaxLevel && (
          <div className="text-xs text-muted-foreground text-center py-2">
            Maximum level reached
          </div>
        )}
      </CardContent>
    </Card>
  );
}
