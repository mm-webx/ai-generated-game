"use client";

import { Speed } from "./types";
import { PauseButton } from "./pause-button";
import { PlayButton } from "./play-button";
import { SpeedControls } from "./speed-controls";

interface ControlButtonsProps {
  speed: Speed;
  isPaused: boolean;
  onTogglePause: () => void;
  onSpeedChange: (speed: Speed) => void;
}

export function ControlButtons({
  speed,
  isPaused,
  onTogglePause,
  onSpeedChange,
}: ControlButtonsProps) {
  return (
    <>
      <PauseButton isPaused={isPaused} onToggle={onTogglePause} />
      <PlayButton
        speed={speed}
        isPaused={isPaused}
        onSpeedChange={onSpeedChange}
        onTogglePause={onTogglePause}
      />
      <SpeedControls
        currentSpeed={speed}
        isPaused={isPaused}
        onSpeedChange={onSpeedChange}
      />
    </>
  );
}

