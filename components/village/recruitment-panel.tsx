"use client";

import { UnitType, UNIT_DEFINITIONS } from "./types";
import { Resources } from "../game/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useTimeControl } from "../game-header";
import { Apple, TreePine, Mountain, Gem, FlaskConical, Sword } from "lucide-react";

interface RecruitmentPanelProps {
  units: Record<UnitType, number>;
  onRecruit: (unitType: UnitType) => void;
}

const RESOURCE_ICONS = {
  food: Apple,
  wood: TreePine,
  stone: Mountain,
  diamond: Gem,
  technology: FlaskConical,
  power: Sword,
};

export function RecruitmentPanel({
  units,
  onRecruit,
}: RecruitmentPanelProps) {
  const { resources, population, maxPopulation } = useTimeControl();

  const canAfford = (cost: Resources, populationCost: number) => {
    return (
      resources.food >= cost.food &&
      resources.wood >= cost.wood &&
      resources.stone >= cost.stone &&
      resources.diamond >= cost.diamond &&
      resources.technology >= cost.technology &&
      resources.power >= cost.power &&
      population + populationCost <= maxPopulation
    );
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
          className={`gap-1 text-xs px-1.5 py-0 ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
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
          className={`gap-1 text-xs px-1.5 py-0 ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
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
          className={`gap-1 text-xs px-1.5 py-0 ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
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
          className={`gap-1 text-xs px-1.5 py-0 ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
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
          className={`gap-1 text-xs px-1.5 py-0 ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
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
          className={`gap-1 text-xs px-1.5 py-0 ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
        >
          <Icon className="w-3 h-3 text-red-500" />
          {cost.power}
        </Badge>
      );
    }
    return parts.length > 0 ? (
      <div className="flex flex-wrap items-center gap-1">{parts}</div>
    ) : null;
  };

  const unitTypes: UnitType[] = ["warrior", "archer", "mage"];

  return (
    <div className="space-y-3">
      {unitTypes.map((unitType) => {
        const unitDef = UNIT_DEFINITIONS[unitType];
        const Icon = unitDef.icon;
        const count = units[unitType] || 0;
        const affordable = canAfford(unitDef.cost, unitDef.populationCost);
        const hasSpace = population + unitDef.populationCost <= maxPopulation;

        return (
          <Card key={unitType}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-sm">{unitDef.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {unitDef.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Cost:</span>
                  <div className="mt-1 flex flex-wrap gap-1">{formatCost(unitDef.cost)}</div>
                </div>
                <div className="mt-1">
                  <span className="font-medium">Population:</span> {unitDef.populationCost}
                </div>
                <div className="mt-1">
                  <span className="font-medium">Power Generation:</span> <span className="text-red-500">+{unitDef.powerBonus}/m</span>
                </div>
              </div>
              <Button
                onClick={() => onRecruit(unitType)}
                disabled={!affordable || !hasSpace}
                className="w-full"
                size="sm"
                variant="default"
              >
                {!affordable ? (
                  <span className="flex items-center gap-2">
                    <span>Insufficient resources</span>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <FlaskConical className="w-3 h-3 text-blue-500" />
                      +{unitDef.researchPoints} research
                    </Badge>
                  </span>
                ) : !hasSpace ? (
                  "Not enough population"
                ) : (
                  `Recruit ${unitDef.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

