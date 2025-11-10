"use client";

import { HexTile, TileCost } from "@/components/game-board/types";
import { useTimeControl } from "@/components/game-header";
import { calculateUpgradeCost, calculateTileBonus, calculateTileClaimCost, calculateVillageClaimCost } from "@/components/game-board/utils";
import {
  Apple,
  TreePine,
  Mountain,
  Gem,
  FlaskConical,
  Sword,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowUp,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

interface TileInfoPanelProps {
  tile: HexTile | null;
}

const TILE_NAMES: Record<HexTile["type"], { name: string; emoji: string }> = {
  grassland: { name: "Grassland", emoji: "🌾" },
  plains: { name: "Plains", emoji: "🌾" },
  desert: { name: "Desert", emoji: "🏜️" },
  tundra: { name: "Tundra", emoji: "🌨️" },
  snow: { name: "Snow", emoji: "❄️" },
  coast: { name: "Coast", emoji: "🏖️" },
  ocean: { name: "Ocean", emoji: "🌊" },
  lake: { name: "Lake", emoji: "💧" },
  mountain: { name: "Mountain", emoji: "⛰️" },
  hill: { name: "Hill", emoji: "⛰️" },
  forest: { name: "Forest", emoji: "🌲" },
  jungle: { name: "Jungle", emoji: "🌴" },
  marsh: { name: "Marsh", emoji: "🌿" },
};

const RESOURCE_ICONS = {
  food: Apple,
  wood: TreePine,
  stone: Mountain,
  diamond: Gem,
  technology: FlaskConical,
  power: Sword,
};

const RESOURCE_COLORS = {
  food: "text-green-500",
  wood: "text-amber-600",
  stone: "text-slate-400",
  diamond: "text-cyan-500",
  technology: "text-blue-500",
  power: "text-red-500",
};

export function TileInfoPanel({
  tile,
}: TileInfoPanelProps) {
  const { resources, setSelectedTile } = useTimeControl();
  const [isVisible, setIsVisible] = useState(false);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeouts
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    if (tile) {
      // Show with 500ms delay
      showTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 500);
    } else {
      // Hide with 250ms delay
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 250);
    }

    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [tile]);

  if (!tile || !isVisible) return null;

  const currentLevel = tile.level || 0;
  const canUpgrade = tile.owned && !tile.isVillage && currentLevel < 100;
  const upgradeCost = canUpgrade ? calculateUpgradeCost(tile.type, currentLevel) : null;
  const canAffordUpgrade = upgradeCost
    ? resources.food >= upgradeCost.food &&
      resources.wood >= upgradeCost.wood &&
      resources.stone >= upgradeCost.stone
    : false;
  const nextLevelBonus = canUpgrade ? calculateTileBonus(tile.type, currentLevel + 1) : null;

  // Calculate claim cost for unowned tiles
  const claimCost = !tile.owned ? (tile.isVillage ? calculateVillageClaimCost(currentLevel) : calculateTileClaimCost(currentLevel)) : null;
  const canAffordClaim = claimCost
    ? resources.food >= claimCost.food &&
      resources.wood >= claimCost.wood &&
      resources.stone >= claimCost.stone &&
      resources.power >= claimCost.power
    : false;

  // Collect all bonuses/resources to display
  const bonuses = tile.bonus ? Object.entries(tile.bonus).filter(([_, value]) => value && value > 0) : [];
  const nextBonuses = nextLevelBonus ? Object.entries(nextLevelBonus).filter(([_, value]) => value && value > 0) : [];

  return (
    <div className="fixed bottom-4 left-4 w-[33.333333%] z-40">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{TILE_NAMES[tile.type].emoji}</span>
              <div>
                <CardTitle className="text-xl capitalize">
                  {tile.isVillage
                    ? `Village (Level ${tile.villageLevel || 1})`
                    : `${TILE_NAMES[tile.type].name}${currentLevel > 0 ? ` (Level ${currentLevel})` : ""}`}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {tile.owned ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {tile.isVillage ? "Your Village" : "Owned"}
                      </span>
                    </>
                  ) : tile.visibility === "visible" ? (
                    <>
                      <Eye className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Hidden</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTile(null)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-start gap-4">
            {/* Production Bonus / Will Provide */}
            {bonuses.length > 0 && (
              <>
                <div className="flex items-center gap-2 min-w-fit">
                  <span className="text-sm font-semibold">
                    {tile.owned ? "Production:" : "Will Provide:"}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {bonuses.map(([key, value]) => {
                      const Icon = RESOURCE_ICONS[key as keyof typeof RESOURCE_ICONS];
                      const color = RESOURCE_COLORS[key as keyof typeof RESOURCE_COLORS];
                      return (
                        <Badge key={key} variant="secondary" className="gap-1.5">
                          <Icon className={`h-3 w-3 ${color}`} />
                          <span className={color}>
                            +{typeof value === 'number' ? value.toFixed(1) : value}/m
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            {/* Upgrade Section */}
            {canUpgrade && upgradeCost && (
              <>
                <div className="flex items-center gap-2 min-w-fit">
                  <ArrowUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">
                    Upgrade to Lv.{currentLevel + 1}:
                  </span>
                  {nextBonuses.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {nextBonuses.map(([key, value]) => {
                        const Icon = RESOURCE_ICONS[key as keyof typeof RESOURCE_ICONS];
                        const color = RESOURCE_COLORS[key as keyof typeof RESOURCE_COLORS];
                        return (
                          <Badge key={key} variant="outline" className="gap-1 text-xs">
                            <Icon className={`h-3 w-3 ${color}`} />
                            <span className={color}>
                              +{typeof value === 'number' ? value.toFixed(1) : value}/m
                            </span>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground ml-1">Cost:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.entries(upgradeCost).map(([key, cost]) => {
                      const Icon = RESOURCE_ICONS[key as keyof typeof RESOURCE_ICONS];
                      const color = RESOURCE_COLORS[key as keyof typeof RESOURCE_COLORS];
                      const hasEnough = resources[key as keyof typeof resources] >= cost;
                      return (
                        <Badge
                          key={key}
                          variant="outline"
                          className={`gap-1 text-xs ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
                        >
                          <Icon className={`h-3 w-3 ${color}`} />
                          {cost}
                        </Badge>
                      );
                    })}
                  </div>
                  {!canAffordUpgrade && (
                    <Badge variant="destructive" className="text-xs">
                      Insufficient resources
                    </Badge>
                  )}
                </div>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            {/* Cost to Claim */}
            {!tile.owned && tile.visibility === "visible" && claimCost && (
              <div className="flex items-center gap-2 min-w-fit">
                <span className="text-sm font-semibold">Cost to Claim:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Object.entries(claimCost).map(([key, cost]) => {
                    const Icon = RESOURCE_ICONS[key as keyof typeof RESOURCE_ICONS];
                    const color = RESOURCE_COLORS[key as keyof typeof RESOURCE_COLORS];
                    const hasEnough = resources[key as keyof typeof resources] >= cost;
                    return (
                      <Badge
                        key={key}
                        variant="outline"
                        className={`gap-1 text-xs ${!hasEnough ? 'border-destructive text-destructive' : ''}`}
                      >
                        <Icon className={`h-3 w-3 ${color}`} />
                        {cost}
                      </Badge>
                    );
                  })}
                </div>
                {!canAffordClaim && (
                  <Badge variant="destructive" className="text-xs">
                    Insufficient resources
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
