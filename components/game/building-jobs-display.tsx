"use client";

import { useState, useEffect, useRef } from "react";
import { ButtonGroupText } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Hammer } from "lucide-react";
import { useTimeControl } from "@/components/game-header";
import { BUILDING_DEFINITIONS, BuildingType } from "@/components/village/types";

interface BuildingJobsDisplayProps {
  tooltipWidth?: number;
  containerLeft?: number;
}

export function BuildingJobsDisplay({
  tooltipWidth = 0,
  containerLeft = 0,
}: BuildingJobsDisplayProps) {
  const { buildingJobs, maxBuildingJobs, villageState, gameTime, speed } = useTimeControl();
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [alignOffset, setAlignOffset] = useState<number>(0);
  const [remainingTimes, setRemainingTimes] = useState<Record<string, number>>({});
  const buttonRef = useRef<HTMLDivElement>(null);

  const isAtLimit = buildingJobs >= maxBuildingJobs;
  const colorClass = isAtLimit ? "text-red-500" : "text-blue-500";

  // Update remaining times for all buildings in queue
  useEffect(() => {
    if (!villageState.buildingQueue || Object.keys(villageState.buildingQueue).length === 0) {
      setRemainingTimes({});
      return;
    }

    const updateRemainingTimes = () => {
      const times: Record<string, number> = {};
      Object.entries(villageState.buildingQueue || {}).forEach(([buildingType, buildInfo]) => {
        if (buildInfo && buildInfo.endGameTime) {
          // Timer shows remaining game time (in game seconds)
          // If building starts at 00:23 and ends at 00:53, timer shows remaining time until 00:53
          // When speed increases, game time accelerates, so timer counts down faster
          const remainingGameSeconds = Math.max(0, buildInfo.endGameTime - gameTime);
          times[buildingType] = Math.ceil(remainingGameSeconds);
        }
      });
      setRemainingTimes(times);
    };

    updateRemainingTimes();
    const interval = setInterval(updateRemainingTimes, 1000);

    return () => clearInterval(interval);
  }, [villageState.buildingQueue, gameTime]);

  // Calculate alignOffset to align tooltip to container left edge
  useEffect(() => {
    if (!buttonRef.current || containerLeft === 0) return;

    const updateAlignOffset = () => {
      if (buttonRef.current) {
        const triggerRect = buttonRef.current.getBoundingClientRect();
        const offset = containerLeft - triggerRect.left;
        setAlignOffset(offset);
      }
    };

    updateAlignOffset();
    window.addEventListener("scroll", updateAlignOffset, true);
    window.addEventListener("resize", updateAlignOffset);

    return () => {
      window.removeEventListener("scroll", updateAlignOffset, true);
      window.removeEventListener("resize", updateAlignOffset);
    };
  }, [containerLeft]);

  // Handle Shift key for detailed view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const buildingJobsPercentage =
    maxBuildingJobs > 0 ? Math.round((buildingJobs / maxBuildingJobs) * 100) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const getBuildingList = () => {
    if (!villageState.buildingQueue || Object.keys(villageState.buildingQueue).length === 0) {
      return null;
    }

    return Object.entries(villageState.buildingQueue).map(([buildingType, buildInfo]) => {
      if (!buildInfo) return null;
      const buildingDef = BUILDING_DEFINITIONS[buildingType as BuildingType];
      const currentLevel = villageState.buildings[buildingType as BuildingType] || 0;
      const nextLevel = currentLevel + 1;
      const remaining = remainingTimes[buildingType] ?? 0;

      return (
        <div key={buildingType} className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0">
          <span className="text-xs">
            {buildingDef.name} → Lv.{nextLevel}
          </span>
          <span className="font-mono text-xs text-foreground">
            {formatTime(remaining)}
          </span>
        </div>
      );
    }).filter(Boolean);
  };

  const buildingList = getBuildingList();
  
  // Get the minimum remaining time (nearest completion)
  const getNearestCompletionTime = () => {
    if (Object.keys(remainingTimes).length === 0) return null;
    const times = Object.values(remainingTimes).filter(t => t > 0);
    if (times.length === 0) return null;
    return Math.min(...times);
  };
  
  const nearestTime = getNearestCompletionTime();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ButtonGroupText
          ref={buttonRef}
          className="bg-card border-border font-mono cursor-default h-10 flex items-center gap-2 px-3 min-w-[5rem]"
        >
          <Hammer className={`w-4 h-4 ${colorClass}`} />
          <span className="text-lg font-semibold tracking-tight tabular-nums text-foreground min-w-[4ch] text-right">
            {isAtLimit && nearestTime !== null
              ? formatTime(nearestTime)
              : isShiftPressed && buildingJobs > 0 && buildingList && buildingList.length > 0
              ? formatTime(Math.max(...Object.values(remainingTimes)))
              : `${buildingJobs}/${maxBuildingJobs}`}
          </span>
        </ButtonGroupText>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        alignOffset={alignOffset}
        sideOffset={8}
        className="bg-popover text-popover-foreground border border-border shadow-lg p-3"
        style={tooltipWidth > 0 ? { width: `${tooltipWidth}px` } : undefined}
      >
        <div className="space-y-2">
          <div className="font-semibold text-sm text-popover-foreground">
            Building Jobs
          </div>

          {isShiftPressed ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Active Builds:</span>
                <span className="font-mono text-foreground">{buildingJobs}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Building Jobs:</span>
                <span className="font-mono text-foreground">{maxBuildingJobs}</span>
              </div>
              {buildingList && buildingList.length > 0 && (
                <div className="pt-2 space-y-1">
                  <div className="font-medium text-popover-foreground">Building:</div>
                  {buildingList}
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-border/50">
                <span>Usage:</span>
                <span className="font-mono text-foreground">
                  {buildingJobsPercentage}%
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground/70 pt-1">
                Release Shift to see general info
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between items-center gap-4">
                <span>Active / Max</span>
                <span className="font-mono text-foreground">
                  {buildingJobs} / {maxBuildingJobs}
                </span>
              </div>
              {buildingList && buildingList.length > 0 && (
                <div className="pt-2 space-y-1">
                  <div className="font-medium text-popover-foreground">Building:</div>
                  {buildingList}
                </div>
              )}
              <div className="text-[10px] text-muted-foreground/70 pt-1">
                Hold Shift for details
              </div>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

