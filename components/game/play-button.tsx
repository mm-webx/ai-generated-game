"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Play } from "lucide-react";
import { Speed } from "./types";

interface PlayButtonProps {
  speed: Speed;
  isPaused: boolean;
  onSpeedChange: (speed: Speed) => void;
  onTogglePause: () => void;
}

export function PlayButton({
  speed,
  isPaused,
  onSpeedChange,
  onTogglePause,
}: PlayButtonProps) {
  const handleClick = () => {
    if (isPaused) {
      onTogglePause();
    }
    onSpeedChange(1);
  };

  const isActive = speed === 1 && !isPaused;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={handleClick} variant="outline" className="h-10">
          <Play className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-popover text-popover-foreground border border-border shadow-lg p-3 max-w-[200px]"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-sm text-popover-foreground">
              Normal Speed
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background/80 border border-border rounded text-muted-foreground shrink-0">
              1
            </kbd>
          </div>
          <div className="text-xs text-muted-foreground">
            Set to normal speed (1x)
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

