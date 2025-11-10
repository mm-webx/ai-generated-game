"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { BuildingList } from "./building-list";
import { RecruitmentPanel } from "./recruitment-panel";
import { GuildMastersPanel } from "./guild-masters-panel";
import {
  BuildingType,
  UnitType,
  GuildMasterType,
  VillageState,
  getExpForLevel,
  getTotalExpForLevel,
} from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { X } from "lucide-react";
import { ResourceBonus } from "../game-board/types";
import { Apple, TreePine, Mountain, Gem, FlaskConical, Sword } from "lucide-react";

interface VillageUpgradePanelProps {
  villageState: VillageState;
  buildingBonuses: ResourceBonus;
  onUpgradeBuilding: (buildingType: BuildingType) => void;
  onRecruitUnit: (unitType: UnitType) => void;
  onHireMaster: (masterType: GuildMasterType) => void;
  onClose: () => void;
}

const RESOURCE_ICONS = {
  food: Apple,
  wood: TreePine,
  stone: Mountain,
  diamond: Gem,
  technology: FlaskConical,
  power: Sword,
};

const RESOURCE_COLORS = {
  food: "text-green-600",
  wood: "text-amber-600",
  stone: "text-slate-600",
  diamond: "text-cyan-600",
  technology: "text-blue-600",
  power: "text-red-600",
};

export function VillageUpgradePanel({
  villageState,
  buildingBonuses,
  onUpgradeBuilding,
  onRecruitUnit,
  onHireMaster,
  onClose,
}: VillageUpgradePanelProps) {
  const [activeTab, setActiveTab] = useState<"buildings" | "recruitment" | "masters">("buildings");
  const { exp, level, buildings, units, masters } = villageState;

  // Calculate exp progress
  const expForCurrentLevel = getExpForLevel(level);
  const expProgress = exp - getTotalExpForLevel(level);
  const expProgressPercent = Math.min(100, (expProgress / expForCurrentLevel) * 100);

  // Get resource summary badges
  const getResourceSummary = () => {
    const parts: JSX.Element[] = [];
    Object.entries(buildingBonuses).forEach(([key, value]) => {
      if (value && value > 0) {
        const Icon = RESOURCE_ICONS[key as keyof typeof RESOURCE_ICONS];
        const color = RESOURCE_COLORS[key as keyof typeof RESOURCE_COLORS];
        parts.push(
          <Badge key={key} variant="secondary" className="gap-1 text-xs">
            <Icon className={`w-3 h-3 ${color}`} />
            +{value.toFixed(1)}/m
          </Badge>
        );
      }
    });
    return parts.length > 0 ? parts : null;
  };

  return (
    <Card className="w-full h-full overflow-hidden flex flex-col shadow-lg">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">Village</CardTitle>
              <Badge variant="secondary" className="text-xs">
                Lv.{level}
              </Badge>
              {getResourceSummary() && (
                <div className="flex items-center gap-1 flex-wrap">
                  {getResourceSummary()}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {/* Exp progress bar */}
      <div className="px-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CardDescription className="text-xs whitespace-nowrap">
            {expProgress.toFixed(0)} / {expForCurrentLevel.toFixed(0)} exp to Lv.{level + 1}
          </CardDescription>
          <div className="flex-1 bg-muted rounded-full h-1 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${expProgressPercent}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Tabs switcher - always visible */}
      <div className="px-4 pt-1 pb-2 flex-shrink-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "buildings" | "recruitment" | "masters")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
            <TabsTrigger value="masters">Guild Masters</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content area */}
      <CardContent className="flex-1 overflow-y-auto p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "buildings" | "recruitment" | "masters")}>
          <TabsContent value="buildings" className="mt-0">
            <BuildingList buildings={buildings} onUpgrade={onUpgradeBuilding} />
          </TabsContent>
          <TabsContent value="recruitment" className="mt-0">
            <RecruitmentPanel units={units} onRecruit={onRecruitUnit} />
          </TabsContent>
          <TabsContent value="masters" className="mt-0">
            <GuildMastersPanel masters={masters} onHireMaster={onHireMaster} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

