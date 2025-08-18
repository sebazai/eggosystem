"use client";

import React from "react";
import {
  convertSeasonToS,
  createTeamLogoUrl,
  mapToReadableNameCapitalFirst,
  type FilterParamsQuery
} from "@/lib/utils";
import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { format } from "date-fns";

interface TeamFormComparisonProps {
  teams: Record<
    string,
    {
      id?: number;
      name?: string;
      logo?: string;
      rank?: number | null;
      organization_name?: string;
      score?: number;
    }
  >;
  baseFilters: FilterParamsQuery;
}

interface MatchHistoryItem {
  match_id: number;
  date: string;
  season_name: string;
  league_name: string;
  opponent_name: string;
  opponent_logo: string;
  maps: string;
  team_score: number;
  opponent_score: number;
  result: string;
}

export const TeamFormComparison = ({ teams }: TeamFormComparisonProps) => {
  // Get team names safely - IDs not needed in this component

  // Get team names safely
  const team1Name = teams[0]?.name || "Team 1";
  const team2Name = teams[1]?.name || "Team 2";

  // Mock team match history data for demonstration
  const team1LastFive: MatchHistoryItem[] = [
    {
      match_id: 501,
      date: "2023-12-20T18:00:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Arctic Wolves",
      opponent_logo: "teams/wolves.png",
      maps: "mirage, dust2",
      team_score: 16,
      opponent_score: 11,
      result: "won"
    },
    {
      match_id: 502,
      date: "2023-12-15T19:00:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Midnight Esports",
      opponent_logo: "teams/midnight.png",
      maps: "inferno, ancient",
      team_score: 11,
      opponent_score: 16,
      result: "lost"
    },
    {
      match_id: 503,
      date: "2023-12-10T20:00:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Golden Stars",
      opponent_logo: "teams/stars.png",
      maps: "nuke",
      team_score: 16,
      opponent_score: 5,
      result: "won"
    },
    {
      match_id: 504,
      date: "2023-12-05T18:30:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Fireball Gaming",
      opponent_logo: "teams/fireball.png",
      maps: "mirage",
      team_score: 13,
      opponent_score: 13,
      result: "draw"
    },
    {
      match_id: 505,
      date: "2023-11-30T19:00:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Thunder Esports",
      opponent_logo: "teams/thunder.png",
      maps: "anubis, dust2",
      team_score: 19,
      opponent_score: 17,
      result: "won"
    }
  ];

  const team2LastFive: MatchHistoryItem[] = [
    {
      match_id: 601,
      date: "2023-12-21T18:00:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Thunder Esports",
      opponent_logo: "teams/thunder.png",
      maps: "inferno, ancient",
      team_score: 13,
      opponent_score: 16,
      result: "lost"
    },
    {
      match_id: 602,
      date: "2023-12-16T19:00:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Golden Stars",
      opponent_logo: "teams/stars.png",
      maps: "nuke, mirage",
      team_score: 16,
      opponent_score: 12,
      result: "won"
    },
    {
      match_id: 603,
      date: "2023-12-11T20:00:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Fireball Gaming",
      opponent_logo: "teams/fireball.png",
      maps: "mirage",
      team_score: 16,
      opponent_score: 10,
      result: "won"
    },
    {
      match_id: 604,
      date: "2023-12-06T18:30:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Midnight Esports",
      opponent_logo: "teams/midnight.png",
      maps: "anubis, dust2",
      team_score: 14,
      opponent_score: 16,
      result: "lost"
    },
    {
      match_id: 605,
      date: "2023-12-01T19:00:00Z",
      season_name: "Spring 2023",
      league_name: "Divari",
      opponent_name: "Phoenix Gaming",
      opponent_logo: "teams/phoenix.png",
      maps: "mirage, nuke",
      team_score: 16,
      opponent_score: 14,
      result: "won"
    }
  ];

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Recent Form</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Team 1 Recent Form */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              {team1Name} - Last 5 Matches
            </h3>
            {team1LastFive.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No recent matches found
              </div>
            ) : (
              <div className="space-y-2">
                {team1LastFive.map((match) => (
                  <RecentMatchCard
                    key={`team1-${match.match_id}`}
                    match={match}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Team 2 Recent Form */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              {team2Name} - Last 5 Matches
            </h3>
            {team2LastFive.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No recent matches found
              </div>
            ) : (
              <div className="space-y-2">
                {team2LastFive.map((match) => (
                  <RecentMatchCard
                    key={`team2-${match.match_id}`}
                    match={match}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Recent Match Card component
interface RecentMatchCardProps {
  match: MatchHistoryItem;
}

const RecentMatchCard: React.FC<RecentMatchCardProps> = ({ match }) => {
  const isWin = match.result === "won";
  const isDraw = match.result === "draw";
  const formattedDate = format(new Date(match.date), "dd.MM.yyyy");

  return (
    <div className="p-3 border-b border-gray-800/20 last:border-b-0">
      <div className="flex justify-between items-center flex-wrap">
        <div className="flex items-center mr-2">
          <NextImageFallback
            src={createTeamLogoUrl(match.opponent_logo)}
            alt={match.opponent_name}
            width={24}
            height={24}
            className="rounded-full mr-2"
          />
          <span className="text-xs sm:text-sm font-medium truncate max-w-[110px] sm:max-w-none">
            {match.opponent_name}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm">
            <span className={isWin ? "text-green-500" : "text-red-500"}>
              {match.team_score}
            </span>
            -
            <span className={!isWin ? "text-green-500" : "text-red-500"}>
              {match.opponent_score}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              isWin
                ? "bg-green-500/20 text-green-500"
                : isDraw
                  ? "bg-yellow-500/20 text-yellow-500"
                  : "bg-red-500/20 text-red-500"
            }`}
          >
            {isWin ? "W" : isDraw ? "D" : "L"}
          </span>
        </div>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {convertSeasonToS(match.season_name)} {match.league_name} -{" "}
        {match.maps
          .split(", ")
          .map((name: string) => mapToReadableNameCapitalFirst(name))
          .join(", ")}
      </div>
    </div>
  );
};
