"use client";

import React, { useState, useMemo } from "react";
import type { FilterParamsQuery } from "@/lib/utils";
import type { MatchTeamInfo, Player, MatchTeamLineup } from "@eggosystem/types";
import { PlayerCard, PlayerComparisonSection } from "./components";
import { useMatchTeamLineups } from "@/hooks/data/useMatchTeamLineups";
import { usePlayerStatsWithFallback } from "@/hooks/data/usePlayerStatsWithFallback";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";

interface TeamLineupsProps {
  teams: MatchTeamInfo[];
  baseFilters: FilterParamsQuery;
  matchId: number;
}

export const TeamLineups = ({
  teams,
  matchId,
  baseFilters
}: TeamLineupsProps) => {
  // Fetch real lineup data
  const { lineups, isLoading } = useMatchTeamLineups(matchId);

  const teamsOrdered = orderMatchParticipantsBySideHomeLeft(teams);

  // Get team names safely (teams is now an array)
  const team1Name = teamsOrdered[0]?.name || "Team 1";
  const team2Name = teamsOrdered[1]?.name || "Team 2";

  // Convert API data to component format - using available player data
  const convertApiPlayersToPlayers = (
    apiPlayers: MatchTeamLineup["players"]
  ): Player[] => {
    return apiPlayers.map((player, index) => {
      return {
        id: index + 1,
        steamId: player.steam_id,
        name: player.name,
        nickname: player.nickname,
        stats: {
          // Detailed statistics not available in lineup API response
          rating: undefined,
          kd: undefined,
          adr: undefined,
          hs: undefined,
          games_played: player.games_played || 0,
          maps_played: player.maps_played || 0,
          kana_rating: player.kana_rating || 0,
          faceit_level: player.faceit_level || 0,
          faceit_elo: player.faceit_elo || 0,
          cs2_rank: player.cs2_rank || 0,
          cs_hours: player.cs_hours || 0
        }
      };
    });
  };

  // Get real players if available
  const lineupFor = (teamId: number | undefined) =>
    teamId != null && lineups?.[String(teamId)]
      ? convertApiPlayersToPlayers(lineups[String(teamId)]!.players || [])
      : [];

  const realTeam1Players = lineupFor(teamsOrdered[0]?.id);

  const realTeam2Players = lineupFor(teamsOrdered[1]?.id);

  // Use real data only - no mock data
  const team1Players = realTeam1Players;
  const team2Players = realTeam2Players;

  // Calculate default players during render (not in state)
  const defaultPlayer1 = useMemo(() => {
    return team1Players.length > 0 ? team1Players[0] : null;
  }, [team1Players]);
  const defaultPlayer2 = useMemo(() => {
    return team2Players.length > 0 ? team2Players[0] : null;
  }, [team2Players]);

  // Only store user selections in state - defaults are calculated during render
  const [userSelectedPlayer1, setUserSelectedPlayer1] = useState<Player | null>(
    null
  );
  const [userSelectedPlayer2, setUserSelectedPlayer2] = useState<Player | null>(
    null
  );

  // Calculate effective selected players during render (use default if user hasn't selected)
  // This follows React best practice: calculate during render, don't sync in Effects
  const selectedPlayer1 = userSelectedPlayer1 ?? defaultPlayer1;
  const selectedPlayer2 = userSelectedPlayer2 ?? defaultPlayer2;

  // Fetch real statistics for selected players with fallback logic
  const { playerStats: player1Stats, isLoading: isLoadingPlayer1Stats } =
    usePlayerStatsWithFallback(
      selectedPlayer1?.steamId || "",
      baseFilters.seasons?.[0] // Use first season from baseFilters
    );

  const { playerStats: player2Stats, isLoading: isLoadingPlayer2Stats } =
    usePlayerStatsWithFallback(
      selectedPlayer2?.steamId || "",
      baseFilters.seasons?.[0] // Use first season from baseFilters
    );

  // NOW SAFE TO HAVE CONDITIONAL RETURNS AFTER ALL HOOKS ARE DECLARED

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Team Lineups</h2>
          <div className="text-center py-8">Loading team lineups...</div>
        </div>
      </div>
    );
  }

  // Click handlers for player selection
  const handlePlayer1Select = (player: Player) => {
    setUserSelectedPlayer1(player);
  };

  const handlePlayer2Select = (player: Player) => {
    setUserSelectedPlayer2(player);
  };

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Team Lineups</h2>

        {/* Team 1 Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-kanaliiga-orange">
            {team1Name}
          </h3>
          {team1Players.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {team1Players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayer1?.id === player.id}
                  onSelect={() => handlePlayer1Select(player)}
                  teamColor="orange"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No lineup data available for {team1Name}</p>
            </div>
          )}
        </div>

        {/* Player Comparison Section */}
        {selectedPlayer1 && selectedPlayer2 && (
          <div className="mb-6">
            <PlayerComparisonSection
              player1={selectedPlayer1}
              player2={selectedPlayer2}
              player1Stats={player1Stats || null}
              player2Stats={player2Stats || null}
              isLoadingPlayer1Stats={isLoadingPlayer1Stats}
              isLoadingPlayer2Stats={isLoadingPlayer2Stats}
            />
          </div>
        )}

        {/* Team 2 Section */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-sky-400">{team2Name}</h3>
          {team2Players.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {team2Players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayer2?.id === player.id}
                  onSelect={() => handlePlayer2Select(player)}
                  teamColor="blue"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No lineup data available for {team2Name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
