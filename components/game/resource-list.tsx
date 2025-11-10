"use client";

import { useRef, useEffect, useState } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { ResourceDisplay } from "./resource-display";
import { PopulationDisplay } from "./population-display";
import { BuildingJobsDisplay } from "./building-jobs-display";
import { getResourceItems } from "./resource-config";
import { Resources } from "./types";
import { useTimeControl } from "@/components/game-header";

interface ResourceListProps {
  resources: Resources;
}

export function ResourceList({ resources }: ResourceListProps) {
  const { tileBonuses, buildingBonuses, speed, population } = useTimeControl();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerLeft, setContainerLeft] = useState<number>(0);
  
  // Safety check: ensure resources is defined
  const safeResources: Resources = resources || {
    food: 0,
    wood: 0,
    stone: 0,
    diamond: 0,
    technology: 0,
    power: 0,
  };
  
  const resourceItems = getResourceItems(safeResources);

  // Measure container width and position using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);
        setContainerLeft(rect.left);
      }
    };

    // Initial measurement
    updateDimensions();

    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);

    // Also update on scroll/resize
    window.addEventListener("scroll", updateDimensions, true);
    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateDimensions, true);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [resourceItems]);

  return (
    <ButtonGroup 
      ref={containerRef}
      orientation="horizontal" 
      className="h-10"
    >
      {resourceItems.map((resource) => (
        <ResourceDisplay 
          key={resource.key} 
          resource={resource}
          tileBonuses={tileBonuses}
          buildingBonuses={buildingBonuses}
          speed={speed}
          population={population}
          tooltipWidth={containerWidth}
          containerLeft={containerLeft}
        />
      ))}
      <PopulationDisplay
        tooltipWidth={containerWidth}
        containerLeft={containerLeft}
      />
      <BuildingJobsDisplay
        tooltipWidth={containerWidth}
        containerLeft={containerLeft}
      />
    </ButtonGroup>
  );
}
