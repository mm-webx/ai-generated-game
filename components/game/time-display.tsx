"use client";

import { useState } from "react";
import { ButtonGroupText } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, RotateCcw, Coins } from "lucide-react";
import { useTimeControl } from "@/components/game-header";

interface TimeDisplayProps {
  time: string;
}

export function TimeDisplay({ time }: TimeDisplayProps) {
  const { resetGame, isPaused, togglePause, setResources } = useTimeControl();
  const [wasPausedBeforeOpen, setWasPausedBeforeOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Opening dropdown - pause if not already paused
      setWasPausedBeforeOpen(isPaused);
      if (!isPaused) {
        togglePause();
      }
    } else {
      // Closing dropdown - restore previous pause state
      if (!wasPausedBeforeOpen && isPaused) {
        togglePause();
      }
    }
  };

  const handleAddTestResources = () => {
    setResources((prev) => ({
      food: prev.food + 1000,
      wood: prev.wood + 1000,
      stone: prev.stone + 1000,
      diamond: prev.diamond + 1000,
      technology: prev.technology + 1000,
      power: prev.power + 1000,
    }));
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <ButtonGroupText className="bg-card border-border font-mono h-10 flex items-center cursor-pointer hover:bg-accent">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-lg font-semibold tracking-tight tabular-nums text-foreground">
            {time}
          </span>
        </ButtonGroupText>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleAddTestResources();
          }}
          className="cursor-pointer"
        >
          <Coins className="w-4 h-4" />
          Add 1000 Resources (Test)
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => {
            e.preventDefault();
            resetGame();
          }}
          className="cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Game
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
