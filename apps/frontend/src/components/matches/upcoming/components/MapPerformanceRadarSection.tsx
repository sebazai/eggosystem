import React from "react";
import type { TeamMapStats } from "@eggosystem/types";
import { CombinedMapPerformanceRadar } from "../CombinedMapPerformanceRadar";

interface MapPerformanceRadarSectionProps {
  team1MapStats: TeamMapStats[];
  team2MapStats: TeamMapStats[];
  team1Name: string;
  team2Name: string;
}

export const MapPerformanceRadarSection: React.FC<
  MapPerformanceRadarSectionProps
> = ({ team1MapStats, team2MapStats, team1Name, team2Name }) => {
  return (
    <div className="mb-6 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-4 text-center text-kanaliiga-orange uppercase">
        Map Win Rate Comparison
      </h3>
      <div className="max-w-3xl mx-auto">
        <CombinedMapPerformanceRadar
          team1MapStats={team1MapStats}
          team2MapStats={team2MapStats}
          team1Name={team1Name}
          team2Name={team2Name}
        />
      </div>
    </div>
  );
};
