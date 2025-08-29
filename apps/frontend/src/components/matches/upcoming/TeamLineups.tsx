"use client";

import React, { useState, useEffect } from "react";
import type { FilterParamsQuery } from "@/lib/utils";
import type { MatchTeamInfo, Player, MatchTeamLineup } from "@eggosystem/types";
import { PlayerCard, PlayerComparisonSection } from "./components";
import { useMatchTeamLineups } from "@/hooks/data/useMatchTeamLineups";
import { usePlayerStatsWithFallback } from "@/hooks/data/usePlayerStatsWithFallback";

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
  // ALL HOOKS MUST BE DECLARED AT THE TOP BEFORE ANY CONDITIONAL LOGIC

  // Fetch real lineup data
  const { lineups, isLoading } = useMatchTeamLineups(matchId);

  // State for selected players
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);

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

  // Get team names safely (teams is now an array)
  const team1Name = teams?.[0]?.name || "Team 1";
  const team2Name = teams?.[1]?.name || "Team 2";

  // Convert API data to component format - using available player data
  const convertApiPlayersToPlayers = (
    apiPlayers: MatchTeamLineup["players"]
  ): Player[] => {
    return apiPlayers.map((player, index) => {
      // Note: Detailed match statistics (rating, kd, adr, hs) are not available in lineup data
      // These would require individual player stats API calls for each player

      // Determine hot/cold streaks based on kana_rating (average rating)
      // Hot streak: kana_rating > 1.0
      // Cold streak: kana_rating < 0.7
      // Normal: kana_rating between 0.7 and 1.0
      const kana_rating = player.kana_rating || 0;

      const isHotstreak = kana_rating > 1.0;
      const isColdstreak = kana_rating < 0.7;

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
        },
        isHotstreak,
        isColdstreak: isColdstreak && !isHotstreak // Can't be both hot and cold
      };
    });
  };

  // Get real players if available
  const realTeam1Players =
    lineups && Object.keys(lineups).length > 0
      ? convertApiPlayersToPlayers(Object.values(lineups)[0]?.players || [])
      : [];

  const realTeam2Players =
    lineups && Object.keys(lineups).length > 1
      ? convertApiPlayersToPlayers(Object.values(lineups)[1]?.players || [])
      : [];

  // Use real data only - no mock data
  const team1Players = realTeam1Players;
  const team2Players = realTeam2Players;

  // Initialize with first player from each team selected by default
  useEffect(() => {
    if (team1Players.length > 0 && !selectedPlayer1) {
      setSelectedPlayer1(team1Players[0] || null);
    }
    if (team2Players.length > 0 && !selectedPlayer2) {
      setSelectedPlayer2(team2Players[0] || null);
    }
  }, [team1Players, team2Players, selectedPlayer1, selectedPlayer2]);

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
    setSelectedPlayer1(player);
  };

  const handlePlayer2Select = (player: Player) => {
    setSelectedPlayer2(player);
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
              ComparisonStats={() => (
                <div className="grid grid-cols-2 gap-8">
                  {/* Player 1 Stats */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-kanaliiga-orange">
                        {isLoadingPlayer1Stats
                          ? "Loading..."
                          : player1Stats?.kana_rating?.toFixed(2) || "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Rating
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <div className="text-lg font-semibold text-kanaliiga-orange">
                          {isLoadingPlayer1Stats
                            ? "..."
                            : player1Stats?.kd?.toFixed(2) || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">K/D</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-kanaliiga-orange">
                          {isLoadingPlayer1Stats
                            ? "..."
                            : player1Stats?.adr?.toFixed(1) || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">ADR</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-kanaliiga-orange">
                          {isLoadingPlayer1Stats
                            ? "..."
                            : player1Stats?.hs_percent?.toFixed(1) || "N/A"}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">HS%</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-kanaliiga-orange">
                          {isLoadingPlayer1Stats
                            ? "..."
                            : player1Stats?.maps_played || "0"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Maps
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Player 2 Stats */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-sky-400">
                        {isLoadingPlayer2Stats
                          ? "Loading..."
                          : player2Stats?.kana_rating?.toFixed(2) || "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Rating
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <div className="text-lg font-semibold text-sky-400">
                          {isLoadingPlayer2Stats
                            ? "..."
                            : player2Stats?.kd?.toFixed(2) || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">K/D</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-sky-400">
                          {isLoadingPlayer2Stats
                            ? "..."
                            : player2Stats?.adr?.toFixed(1) || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">ADR</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-sky-400">
                          {isLoadingPlayer2Stats
                            ? "..."
                            : player2Stats?.hs_percent?.toFixed(1) || "N/A"}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">HS%</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-sky-400">
                          {isLoadingPlayer2Stats
                            ? "..."
                            : player2Stats?.maps_played || "0"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Maps
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
