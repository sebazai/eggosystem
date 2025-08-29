import React from "react";
import type { MatchInfo, MatchTeamInfo } from "@eggosystem/types";

// Local interface with teams as array instead of object
interface ProcessedMatchInfo extends Omit<MatchInfo, "teams"> {
  teams: MatchTeamInfo[];
}
import { createNextUrl } from "@/lib/utils";

interface UpcomingMapPicksProps {
  matchInfo: ProcessedMatchInfo;
}

export const UpcomingMapPicks = ({ matchInfo }: UpcomingMapPicksProps) => {
  const bestOf = matchInfo.best_of || 1;

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-3 text-kanaliiga-orange uppercase">
        Maps
      </h3>
      {Array.from({ length: bestOf }).map((_, index) => {
        return (
          <div
            key={index}
            className="relative flex flex-1 min-h-10 items-center overflow-hidden rounded my-1 border-1 border-transparent hover:border-1 hover:border-kanaliiga-orange"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${createNextUrl(`/images/maps/dust2.png`)})`,
                filter: "brightness(0.6)"
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-l from-white/60 via-white/30 dark:from-black/60 dark:via-black/30 to-transparent" />

            <div className="absolute bottom-1 left-1 right-1 text-xs text-white sm:text-sm font-semibold z-10">
              TBA
            </div>

            <div className="flex items-center gap-1 p-3 z-10 w-full justify-end">
              <span className="text-lg w-6 font-black text-center text-white">
                -
              </span>
              <span className="text-md text-white">-</span>
              <span className="text-lg w-6 font-black text-center text-white">
                -
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
