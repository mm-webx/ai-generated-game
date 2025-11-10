"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useTimeControl } from "../game-header";
import { GuildMasterType, GUILD_MASTER_DEFINITIONS } from "./types";
import { Resources } from "../game/types";
import { Apple, TreePine, Mountain, Gem, FlaskConical } from "lucide-react";

interface GuildMastersPanelProps {
  masters: Record<GuildMasterType, number>;
  onHireMaster: (masterType: GuildMasterType) => void;
}

const RESOURCE_ICONS = {
  food: Apple,
  wood: TreePine,
  stone: Mountain,
  diamond: Gem,
  technology: FlaskConical,
};

const RESOURCE_COLORS: Record<keyof Resources, string> = {
  food: "text-green-600",
  wood: "text-amber-600",
  stone: "text-slate-600",
  diamond: "text-cyan-600",
  technology: "text-blue-600",
  power: "text-red-600",
};

export function GuildMastersPanel({
  masters,
  onHireMaster,
}: GuildMastersPanelProps) {
  const { resources } = useTimeControl();

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

  const formatCost = (cost: Resources) => {
    const parts: React.ReactElement[] = [];
    if (cost.food > 0) {
      const Icon = RESOURCE_ICONS.food;
      const hasEnough = resources.food >= cost.food;
      parts.push(
        <Badge
          key="food"
          variant="outline"
          className={`gap-1 text-xs ${
            !hasEnough ? "border-destructive text-destructive" : ""
          }`}
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
          className={`gap-1 text-xs ${
            !hasEnough ? "border-destructive text-destructive" : ""
          }`}
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
          className={`gap-1 text-xs ${
            !hasEnough ? "border-destructive text-destructive" : ""
          }`}
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
          className={`gap-1 text-xs ${
            !hasEnough ? "border-destructive text-destructive" : ""
          }`}
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
          className={`gap-1 text-xs ${
            !hasEnough ? "border-destructive text-destructive" : ""
          }`}
        >
          <Icon className="w-3 h-3 text-blue-500" />
          {cost.technology}
        </Badge>
      );
    }
    return parts.length > 0 ? (
      <div className="flex flex-wrap items-center gap-1.5">{parts}</div>
    ) : null;
  };

  const masterTypes: GuildMasterType[] = [
    "farmer",
    "lumberjack",
    "stonemason",
    "miner",
    "scholar",
  ];

  return (
    <div className="space-y-3">
      {masterTypes.map((masterType) => {
        const masterDef = GUILD_MASTER_DEFINITIONS[masterType];
        const Icon = masterDef.icon;
        const count = masters[masterType] || 0;
        const affordable = canAfford(masterDef.cost);
        const totalBonusPercent = count * masterDef.bonusPercent;

        return (
          <Card key={masterType}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-5 h-5 ${
                      RESOURCE_COLORS[masterDef.resourceType]
                    }`}
                  />
                  <div>
                    <CardTitle className="text-base">
                      {masterDef.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {masterDef.description}
                    </CardDescription>
                  </div>
                </div>
                {count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Bonus:</span>{" "}
                  <span className="text-green-600">
                    +{totalBonusPercent}% to {masterDef.resourceType} production
                  </span>
                </div>
                {count > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">Current:</span> {count} master
                    {count !== 1 ? "s" : ""} ({masterDef.bonusPercent}% each)
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Cost:
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {formatCost(masterDef.cost)}
                </div>
              </div>
              <Button
                onClick={() => onHireMaster(masterType)}
                disabled={!affordable}
                className="w-full"
                size="sm"
                variant="default"
              >
                {!affordable
                  ? "Insufficient resources"
                  : `Hire ${masterDef.name}`}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
