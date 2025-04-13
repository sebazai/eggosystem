"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface MapFilterProps {
  activeMapIds: number[];
}

interface MapInfo {
  id: number;
  name: string;
}

// CS2 maps
const MAPS: MapInfo[] = [
  { id: 1, name: "Dust2" },
  { id: 2, name: "Inferno" },
  { id: 3, name: "Mirage" },
  { id: 4, name: "Nuke" },
  { id: 5, name: "Ancient" },
  { id: 6, name: "Anubis" },
  { id: 7, name: "Overpass" },
  { id: 8, name: "Vertigo" },
  { id: 9, name: "Train" }
];

export const MapFilter: React.FC<MapFilterProps> = ({ activeMapIds }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleMapToggle = (mapId: number) => {
    const params = new URLSearchParams(searchParams.toString());

    // Clear existing map_ids
    params.delete("map_ids");

    // If map is already active, remove it
    const newMapIds = activeMapIds.includes(mapId)
      ? activeMapIds.filter((id) => id !== mapId)
      : [...activeMapIds, mapId];

    // Add selected map_ids
    newMapIds.forEach((id) => params.append("map_ids", id.toString()));

    // Update URL
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-6">
      <h2 className="text-kanaliiga-orange text-xl font-bold mb-4">
        Filter stats by map
      </h2>
      <div className="flex flex-wrap gap-2">
        {MAPS.map((map) => (
          <Button
            key={map.id}
            variant={activeMapIds.includes(map.id) ? "default" : "outline"}
            onClick={() => handleMapToggle(map.id)}
            className="text-sm"
          >
            {map.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
