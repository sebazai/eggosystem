import React from "react";
import { type MatchHistoryItem } from "@eggosystem/types";

interface TeamRecentFormProps {
  teamName: string;
  matches: MatchHistoryItem[];
  RecentMatchCard: React.ComponentType<{ match: MatchHistoryItem }>;
}

export const TeamRecentForm: React.FC<TeamRecentFormProps> = ({
  teamName,
  matches,
  RecentMatchCard
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">{teamName} - Last 5 Matches</h3>
      {matches.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No recent matches found
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <RecentMatchCard
              key={`${teamName}-${match.match_id}`}
              match={match}
            />
          ))}
        </div>
      )}
    </div>
  );
};
