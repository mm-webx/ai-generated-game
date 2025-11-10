"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";
import { Speed } from "./types";

interface SpeedButtonProps {
  speed: Speed;
  currentSpeed: Speed;
  isPaused: boolean;
  shortcutKey: string;
  title: string;
  description: string;
  icon: LucideIcon;
  onSpeedChange: (speed: Speed) => void;
}

export function SpeedButton({
  speed,
  currentSpeed,
  isPaused,
  shortcutKey,
  title,
  description,
  icon: Icon,
  onSpeedChange,
}: SpeedButtonProps) {
  const isActive = speed === currentSpeed && !isPaused;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => onSpeedChange(speed)}
          variant="outline"
          className="h-10"
        >
          <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-popover text-popover-foreground border border-border shadow-lg p-3 max-w-[200px]"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-sm text-popover-foreground">
              {title}
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background/80 border border-border rounded text-muted-foreground shrink-0">
              {shortcutKey}
            </kbd>
          </div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

