"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pause } from "lucide-react";

interface PauseButtonProps {
  isPaused: boolean;
  onToggle: () => void;
}

export function PauseButton({ isPaused, onToggle }: PauseButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={onToggle} variant="outline" className="h-10">
          <Pause
            className={`w-4 h-4 ${isPaused ? "text-primary" : ""}`}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-popover text-popover-foreground border border-border shadow-lg p-3 max-w-[200px]"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-sm text-popover-foreground">
              {isPaused ? "Resume" : "Pause"}
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background/80 border border-border rounded text-muted-foreground shrink-0">
              `
            </kbd>
          </div>
          <div className="text-xs text-muted-foreground">
            {isPaused
              ? "Continue the simulation"
              : "Pause the simulation"}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

