import React from "react";
import { type MatchHistoryItem } from "@eggosystem/types";
import { RecentMatchCard } from "./RecentMatchCard";

interface TeamRecentFormProps {
  teamName: string;
  matches: MatchHistoryItem[];
}

export const TeamRecentForm: React.FC<TeamRecentFormProps> = ({
  teamName,
  matches
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">{teamName} - Last 5 Matches</h3>
      <div className="space-y-2">
        {matches.map((match) => (
          <RecentMatchCard
            key={`${teamName}-${match.match_id}`}
            match={match}
          />
        ))}
      </div>
    </div>
  );
};
