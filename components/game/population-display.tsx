"use client";

import { useState, useEffect, useRef } from "react";
import { ButtonGroupText } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users } from "lucide-react";
import { useTimeControl } from "@/components/game-header";

interface PopulationDisplayProps {
  tooltipWidth?: number;
  containerLeft?: number;
}

export function PopulationDisplay({
  tooltipWidth = 0,
  containerLeft = 0,
}: PopulationDisplayProps) {
  const { population, maxPopulation, villageLevel } = useTimeControl();
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [alignOffset, setAlignOffset] = useState<number>(0);
  const buttonRef = useRef<HTMLDivElement>(null);

  const isAtLimit = population >= maxPopulation;
  const colorClass = isAtLimit ? "text-red-500" : "text-purple-600";

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

  const populationPercentage = maxPopulation > 0 
    ? Math.round((population / maxPopulation) * 100) 
    : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ButtonGroupText
          ref={buttonRef}
          className="bg-card border-border font-mono cursor-default h-10 flex items-center gap-2 px-3 min-w-[5rem]"
        >
          <Users className={`w-4 h-4 ${colorClass}`} />
          <span className="text-lg font-semibold tracking-tight tabular-nums text-foreground min-w-[4ch] text-right">
            {population}/{maxPopulation}
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
            Population
          </div>

          {isShiftPressed ? (
            // Detailed breakdown when Shift is pressed
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="font-medium text-popover-foreground">
                Population Details:
              </div>
              <div className="space-y-1 pl-2 border-l-2 border-border">
                <div className="flex justify-between">
                  <span>Current Population:</span>
                  <span className="font-mono text-blue-500">
                    {population}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Max Population:</span>
                  <span className="font-mono text-foreground">
                    {maxPopulation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity Used:</span>
                  <span className={`font-mono ${
                    isAtLimit ? "text-red-500" : "text-green-500"
                  }`}>
                    {populationPercentage}%
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/50">
                  <span>Village Level:</span>
                  <span className="font-mono text-foreground">
                    Level {villageLevel}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/50">
                  <span>Food Consumption:</span>
                  <span className="font-mono text-red-500">
                    -{population}/minute
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
              <div>
                Current: <span className="font-semibold text-popover-foreground">{population}</span> / <span className="font-semibold text-popover-foreground">{maxPopulation}</span>
              </div>
              <div className="font-medium text-popover-foreground mt-1.5">
                Capacity: {populationPercentage}% used
              </div>
              <div className="font-medium text-popover-foreground mt-1.5">
                Each person consumes 1 food per minute
              </div>
              <div className="mt-1.5 leading-relaxed">
                Population represents the number of people in your village. 
                {isAtLimit && (
                  <span className="text-red-500 font-semibold"> You have reached maximum capacity!</span>
                )}
                {!isAtLimit && (
                  <span> Upgrade your village to increase maximum population.</span>
                )}
              </div>
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
