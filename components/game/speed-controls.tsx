"use client";

import { FastForward, Gauge } from "lucide-react";
import { Speed } from "./types";
import { SpeedButton } from "./speed-button";

interface SpeedControlsProps {
  currentSpeed: Speed;
  isPaused: boolean;
  onSpeedChange: (speed: Speed) => void;
}

const SPEED_CONFIG = [
  {
    speed: 5 as Speed,
    key: "2",
    title: "Fast Speed",
    description: "Five times the simulation speed",
    icon: FastForward,
  },
  {
    speed: 20 as Speed,
    key: "3",
    title: "Ultra Fast Speed",
    description: "Twenty times the simulation speed",
    icon: Gauge,
  },
] as const;

export function SpeedControls({
  currentSpeed,
  isPaused,
  onSpeedChange,
}: SpeedControlsProps) {
  return (
    <>
      {SPEED_CONFIG.map(({ speed, key, title, description, icon }) => (
        <SpeedButton
          key={speed}
          speed={speed}
          currentSpeed={currentSpeed}
          isPaused={isPaused}
          shortcutKey={key}
          title={title}
          description={description}
          icon={icon}
          onSpeedChange={onSpeedChange}
        />
      ))}
    </>
  );
}

