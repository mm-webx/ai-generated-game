"use client";

import { useState, useEffect, useRef } from "react";
import { ButtonGroupText } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResourceItem } from "./resource-config";
import { ResourceBonus } from "@/components/game-board/types";
import { Speed } from "./types";

interface ResourceDisplayProps {
  resource: ResourceItem;
  tileBonuses: ResourceBonus;
  buildingBonuses: ResourceBonus;
  speed: Speed;
  population?: number;
  tooltipWidth?: number;
  containerLeft?: number;
}

// Village base production rates per minute at 1x speed
const VILLAGE_BASE_RATES: Record<string, number> = {
  food: 5,
  wood: 3,
  stone: 1,
  diamond: 0,
  technology: 0,
  power: 0,
};

export function ResourceDisplay({
  resource,
  tileBonuses,
  buildingBonuses,
  speed,
  population = 0,
  tooltipWidth = 0,
  containerLeft = 0,
}: ResourceDisplayProps) {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [alignOffset, setAlignOffset] = useState<number>(0);
  const buttonRef = useRef<HTMLDivElement>(null);

  const {
    icon: Icon,
    label,
    value,
    color,
    description,
    formula,
    explanation,
    key,
  } = resource;

  // Safety check: ensure value is a number
  const safeValue = typeof value === "number" ? value : 0;

  // Calculate production rate per minute
  // Village base production + tile bonuses + building bonuses - population cost (for food)
  const villageBase = VILLAGE_BASE_RATES[key] || 0;
  const tileBonus = tileBonuses[key as keyof ResourceBonus] || 0;
  const buildingBonus = buildingBonuses[key as keyof ResourceBonus] || 0;
  const totalBonus = tileBonus + buildingBonus;

  let productionPerMinute: number;
  if (key === "food") {
    productionPerMinute = (villageBase + totalBonus - population) * speed;
  } else {
    productionPerMinute = (villageBase + totalBonus) * speed;
  }

  const roundedProduction = Math.floor(productionPerMinute);

  // Calculate alignOffset to align tooltip to container left edge
  useEffect(() => {
    if (!buttonRef.current || containerLeft === 0) return;

    const updateAlignOffset = () => {
      if (buttonRef.current) {
        const triggerRect = buttonRef.current.getBoundingClientRect();
        // Calculate offset: container left - trigger left
        const offset = containerLeft - triggerRect.left;
        setAlignOffset(offset);
      }
    };

    updateAlignOffset();

    // Update on scroll/resize
    window.addEventListener("scroll", updateAlignOffset, true);
    window.addEventListener("resize", updateAlignOffset);

    return () => {
      window.removeEventListener("scroll", updateAlignOffset, true);
      window.removeEventListener("resize", updateAlignOffset);
    };
  }, [containerLeft]);

  // Handle Shift key for detailed view - global listener
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

    // Also check shiftKey state on mouse move for better UX
    const handleMouseMove = (e: MouseEvent) => {
      setIsShiftPressed(e.shiftKey);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ButtonGroupText
          ref={buttonRef}
          className="bg-card border-border font-mono cursor-default h-10 flex items-center gap-2 px-3 min-w-[5rem]"
        >
          <Icon className={`w-4 h-4 ${color}`} />
          {isShiftPressed && roundedProduction !== 0 ? (
            <span
              className={`text-lg font-semibold tracking-tight tabular-nums min-w-[4ch] text-right ${
                roundedProduction > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {roundedProduction > 0 ? "+" : ""}
              {roundedProduction}
            </span>
          ) : (
            <span
              className={`text-lg font-semibold tracking-tight tabular-nums text-foreground min-w-[4ch] text-right ${
                roundedProduction <= 0 ? "text-red-500" : ""
              }`}
            >
              {Math.floor(safeValue).toLocaleString()}
            </span>
          )}
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
            {label}
          </div>

          {isShiftPressed ? (
            // Detailed breakdown when Shift is pressed
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="font-medium text-popover-foreground">
                Production Breakdown:
              </div>
              <div className="space-y-1 pl-2 border-l-2 border-border">
                {(villageBase > 0 || productionPerMinute < 0) && (
                  <div className="flex justify-between">
                    <span>Village Base:</span>
                    <span
                      className={`font-mono ${
                        villageBase > 0
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {villageBase >= 0 ? "+" : ""}
                      {villageBase.toFixed(1)}/m × {speed}x ={" "}
                      {villageBase >= 0 ? "+" : ""}
                      {(villageBase * speed).toFixed(1)}/m
                    </span>
                  </div>
                )}
                {(tileBonus > 0 || productionPerMinute < 0) && (
                  <div className="flex justify-between">
                    <span>Tile Bonuses:</span>
                    <span
                      className={`font-mono ${
                        tileBonus > 0
                          ? "text-blue-500"
                          : tileBonus < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tileBonus >= 0 ? "+" : ""}
                      {tileBonus.toFixed(1)}/m × {speed}x ={" "}
                      {tileBonus >= 0 ? "+" : ""}
                      {(tileBonus * speed).toFixed(1)}/m
                    </span>
                  </div>
                )}
                {(buildingBonus > 0 || productionPerMinute < 0) && (
                  <div className="flex justify-between">
                    <span>Building Bonuses:</span>
                    <span
                      className={`font-mono ${
                        buildingBonus > 0
                          ? "text-purple-500"
                          : buildingBonus < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {buildingBonus >= 0 ? "+" : ""}
                      {buildingBonus.toFixed(1)}/m × {speed}x ={" "}
                      {buildingBonus >= 0 ? "+" : ""}
                      {(buildingBonus * speed).toFixed(1)}/m
                    </span>
                  </div>
                )}
                {key === "food" &&
                  (population > 0 || productionPerMinute < 0) && (
                    <div className="flex justify-between">
                      <span>Population Cost:</span>
                      <span className="font-mono text-red-500">
                        -{population}/m × {speed}x = -
                        {(population * speed).toFixed(0)}/m
                      </span>
                    </div>
                  )}
                <div className="flex justify-between pt-1 border-t border-border/50 font-semibold">
                  <span>Total:</span>
                  <span
                    className={`font-mono ${
                      productionPerMinute >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {productionPerMinute >= 0 ? "+" : ""}
                    {productionPerMinute.toFixed(1)}/m
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground/70 pt-1">
                Release Shift to see general info
              </div>
            </div>
          ) : (
            // General info when Shift is not pressed
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Current: {safeValue.toFixed(2)}</div>
              <div className="font-medium text-popover-foreground mt-1.5">
                Production: {roundedProduction > 0 ? "+" : ""}
                {roundedProduction}/minute
              </div>
              <div className="font-medium text-popover-foreground mt-1.5">
                {description}
              </div>
              <div className="font-mono text-[10px] bg-background/50 px-1.5 py-1 rounded mt-1">
                {formula}
              </div>
              <div className="mt-1.5 leading-relaxed">{explanation}</div>
              <div className="text-[10px] text-muted-foreground/70 pt-1">
                Hold Shift for detailed breakdown
              </div>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
