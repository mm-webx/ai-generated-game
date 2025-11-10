"use client";

import { Button } from "../ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-row items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomIn}
        className="h-8 w-8"
        disabled={zoom >= 3}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <div className="text-xs text-center text-muted-foreground px-2 py-1 min-w-[3rem]">
        {Math.round(zoom * 100)}%
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomOut}
        className="h-8 w-8"
        disabled={zoom <= 0.5}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        className="h-8 w-8"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

