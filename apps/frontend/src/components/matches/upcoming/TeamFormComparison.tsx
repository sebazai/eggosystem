"use client";

import React from "react";
import { type FilterParamsQuery } from "@/lib/utils";
import type { MatchTeamInfo, MatchHistoryItem } from "@eggosystem/types";
import { TeamRecentForm } from "./components";
import { useFilteredTeamMatchHistory } from "@/hooks/data/filtered/useFilteredTeamMatchHistory";

interface TeamFormComparisonProps {
  teams: MatchTeamInfo[];
  baseFilters: FilterParamsQuery;
}

export const TeamFormComparison = ({
  teams,
  baseFilters
}: TeamFormComparisonProps) => {
  // Get team IDs and names
  const team1Id = teams?.[0]?.id;
  const team2Id = teams?.[1]?.id;
  const team1Name = teams?.[0]?.name || "Team 1";
  const team2Name = teams?.[1]?.name || "Team 2";

  // Fetch real match history data - only if we have valid team IDs
  const { teamMatchHistory: team1History, isLoading: isLoadingTeam1 } =
    useFilteredTeamMatchHistory({
      teamId: team1Id || 0,
      filterQueryParams: baseFilters,
      enabled: !!team1Id && team1Id > 0
    });

  const { teamMatchHistory: team2History, isLoading: isLoadingTeam2 } =
    useFilteredTeamMatchHistory({
      teamId: team2Id || 0,
      filterQueryParams: baseFilters,
      enabled: !!team2Id && team2Id > 0
    });

  // Fallback: fetch without season filters if filtered results are empty
  const fallbackFilters = {
    seasons: null,
    leagues: null,
    stages: null,
    teams: null,
    maps: null
  };

  const {
    teamMatchHistory: team1HistoryFallback,
    isLoading: isLoadingTeam1Fallback
  } = useFilteredTeamMatchHistory({
    teamId: team1Id || 0,
    filterQueryParams: fallbackFilters,
    enabled:
      !!team1Id &&
      team1Id > 0 &&
      (!team1History || team1History.length === 0) &&
      !isLoadingTeam1
  });

  const {
    teamMatchHistory: team2HistoryFallback,
    isLoading: isLoadingTeam2Fallback
  } = useFilteredTeamMatchHistory({
    teamId: team2Id || 0,
    filterQueryParams: fallbackFilters,
    enabled:
      !!team2Id &&
      team2Id > 0 &&
      (!team2History || team2History.length === 0) &&
      !isLoadingTeam2
  });

  // Use fallback data if primary data is empty
  const finalTeam1History =
    team1History && team1History.length > 0
      ? team1History
      : team1HistoryFallback;
  const finalTeam2History =
    team2History && team2History.length > 0
      ? team2History
      : team2HistoryFallback;

  // Show loading state (including fallback loading)
  const isLoading =
    isLoadingTeam1 ||
    isLoadingTeam2 ||
    ((!team1History || team1History.length === 0) && isLoadingTeam1Fallback) ||
    ((!team2History || team2History.length === 0) && isLoadingTeam2Fallback);

  if (isLoading) {
    return (
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Recent Form</h2>
          <div className="text-center py-8">Loading recent matches...</div>
        </div>
      </div>
    );
  }

  // Check if we have real data (not empty arrays)
  const hasTeam1Data = finalTeam1History && finalTeam1History.length > 0;
  const hasTeam2Data = finalTeam2History && finalTeam2History.length > 0;

  // Convert API data to component format and get last 5 matches (only if we have real data)
  const team1LastFive: MatchHistoryItem[] = hasTeam1Data
    ? finalTeam1History.slice(0, 5).map((match) => ({
        match_id: match.match_id,
        date: match.date,
        season_name: match.season_name,
        league_name: match.league_name,
        opponent_name: match.opponent_name,
        opponent_logo: match.opponent_logo,
        maps: match.maps || "Unknown",
        team_score: match.team_score,
        opponent_score: match.opponent_score,
        result: match.result as "win" | "loss" | "draw"
      }))
    : [];

  const team2LastFive: MatchHistoryItem[] = hasTeam2Data
    ? finalTeam2History.slice(0, 5).map((match) => ({
        match_id: match.match_id,
        date: match.date,
        season_name: match.season_name,
        league_name: match.league_name,
        opponent_name: match.opponent_name,
        opponent_logo: match.opponent_logo,
        maps: match.maps || "Unknown",
        team_score: match.team_score,
        opponent_score: match.opponent_score,
        result: match.result as "win" | "loss" | "draw"
      }))
    : [];

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Recent Form</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {hasTeam1Data ? (
            <TeamRecentForm teamName={team1Name} matches={team1LastFive} />
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">{team1Name}</h3>
              <p>No match history available</p>
            </div>
          )}
          {hasTeam2Data ? (
            <TeamRecentForm teamName={team2Name} matches={team2LastFive} />
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">{team2Name}</h3>
              <p>No match history available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
