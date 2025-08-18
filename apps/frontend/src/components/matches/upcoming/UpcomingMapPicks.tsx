import React from "react";
import type { MatchInfo } from "@eggosystem/types";
import { createNextUrl } from "@/lib/utils";

interface UpcomingMapPicksProps {
  matchInfo: MatchInfo;
}

export const UpcomingMapPicks = ({ matchInfo }: UpcomingMapPicksProps) => {
  // Default map names to use for visual placeholders
  const defaultMapNames = ["dust2", "nuke", "mirage"];
  const bestOf = matchInfo.best_of || 1;

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-3 text-kanaliiga-orange uppercase">
        Maps
      </h3>
      {Array.from({ length: bestOf }).map((_, index) => {
        // Use either the default map or cycle through defaults if we have more maps than defaults
        const mapName = defaultMapNames[index % defaultMapNames.length];

        return (
          <div
            key={index}
            className="relative flex flex-1 min-h-16 items-center overflow-hidden rounded-md my-2 border border-gray-800"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${createNextUrl(`/images/maps/${mapName}.png`)})`,
                filter: "brightness(0.4)"
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />

            <div className="absolute top-1 left-2 text-xs text-kanaliiga-orange font-semibold z-10 uppercase">
              {`MAP ${index + 1}`}
            </div>

            <div className="flex items-center gap-1 p-3 z-10 w-full justify-center mt-2">
              <span className="text-lg font-black text-center text-white">
                TBA
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
