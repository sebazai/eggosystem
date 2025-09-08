import React from "react";
import { format } from "date-fns";
import { NextImageFallback } from "@/components/layout/NextImageFallback";
import {
  convertSeasonToS,
  createTeamLogoUrl,
  mapToReadableNameCapitalFirst
} from "@/lib/utils";
import type { MatchHistoryItem } from "@eggosystem/types";

interface RecentMatchCardProps {
  match: MatchHistoryItem;
}

export const RecentMatchCard: React.FC<RecentMatchCardProps> = ({ match }) => {
  const isWin = match.result === "win";
  const isDraw = match.result === "draw";
  const formattedDate = format(new Date(match.date), "dd.MM.yyyy");

  return (
    <div className="bg-card rounded-lg p-4 border">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <NextImageFallback
            src={
              match.opponent_logo
                ? createTeamLogoUrl(match.opponent_logo)
                : "/team-images/nologo.png"
            }
            alt={match.opponent_name}
            width={32}
            height={32}
            className="rounded-full mr-3 p-1"
          />
          <div>
            <span className="text-sm font-medium block">
              {match.opponent_name}
            </span>
            <span className="text-xs">vs {formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div className="text-lg font-bold">
              <span className={isWin ? "text-green-400" : "text-red-400"}>
                {match.team_score}
              </span>
              <span className="mx-1">-</span>
              <span className={!isWin ? "text-green-400" : "text-red-400"}>
                {match.opponent_score}
              </span>
            </div>
          </div>

          <div
            className={`text-sm font-bold px-3 py-1 rounded-full ${
              isWin
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : isDraw
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {isWin ? "WIN" : isDraw ? "DRAW" : "LOSS"}
          </div>
        </div>
      </div>

      <div className="text-xs border-t pt-2">
        <span className="text-kanaliiga-orange/80">
          {convertSeasonToS(match.season_name)} {match.league_name}
        </span>
        <span className="mx-2">•</span>
        <span>
          {match.maps
            .split(", ")
            .map((name: string) => mapToReadableNameCapitalFirst(name))
            .join(", ")}
        </span>
      </div>
    </div>
  );
};
