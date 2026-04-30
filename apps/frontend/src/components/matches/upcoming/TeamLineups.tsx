"use client";

import React, { useState } from "react";
import type { FilterParamsQuery } from "@/lib/utils";
import type { MatchTeamInfo, Player, MatchTeamLineup } from "@eggosystem/types";
import {
  PlayerCard,
  PlayerComparisonSection,
  HomeAwaySidesLayout
} from "./components";
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
  const { lineups, isLoading } = useMatchTeamLineups(matchId);

  const [homeTeam, awayTeam] = orderMatchParticipantsBySideHomeLeft(teams);
  const homeTeamName = homeTeam?.name || "Team 1";
  const awayTeamName = awayTeam?.name || "Team 2";

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

  const lineupFor = (teamId: number | undefined) =>
    teamId != null && lineups?.[String(teamId)]
      ? convertApiPlayersToPlayers(lineups[String(teamId)]!.players || [])
      : [];

  const homePlayers = lineupFor(homeTeam?.id);
  const awayPlayers = lineupFor(awayTeam?.id);

  const defaultHomePlayer =
    homePlayers.length > 0 ? (homePlayers[0] ?? null) : null;
  const defaultAwayPlayer =
    awayPlayers.length > 0 ? (awayPlayers[0] ?? null) : null;

  const [userSelectedHome, setUserSelectedHome] = useState<Player | null>(null);
  const [userSelectedAway, setUserSelectedAway] = useState<Player | null>(null);

  const selectedHomePlayer = userSelectedHome ?? defaultHomePlayer;
  const selectedAwayPlayer = userSelectedAway ?? defaultAwayPlayer;

  const { playerStats: homePlayerStats, isLoading: isLoadingHomeStats } =
    usePlayerStatsWithFallback(
      selectedHomePlayer?.steamId || "",
      baseFilters.seasons?.[0]
    );

  const { playerStats: awayPlayerStats, isLoading: isLoadingAwayStats } =
    usePlayerStatsWithFallback(
      selectedAwayPlayer?.steamId || "",
      baseFilters.seasons?.[0]
    );

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

  const handleHomePlayerSelect = (player: Player) => {
    setUserSelectedHome(player);
  };

  const handleAwayPlayerSelect = (player: Player) => {
    setUserSelectedAway(player);
  };

  const lineupColumn = ({
    players,
    teamName,
    selected,
    onSelect,
    accent
  }: {
    players: Player[];
    teamName: string;
    selected: Player | null;
    onSelect: (player: Player) => void;
    accent: "orange" | "blue";
  }) => (
    <div className={accent === "orange" ? "md:pr-2" : "md:pl-2"}>
      <h3
        className={
          accent === "orange"
            ? "text-lg font-medium mb-3 text-kanaliiga-orange"
            : "text-lg font-medium mb-3 text-sky-400"
        }
      >
        {teamName}
      </h3>
      {players.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={selected?.id === player.id}
              onSelect={() => onSelect(player)}
              teamColor={accent === "orange" ? "orange" : "blue"}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No lineup data available for {teamName}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Team Lineups</h2>

        <HomeAwaySidesLayout
          home={lineupColumn({
            players: homePlayers,
            teamName: homeTeamName,
            selected: selectedHomePlayer,
            onSelect: handleHomePlayerSelect,
            accent: "orange"
          })}
          away={lineupColumn({
            players: awayPlayers,
            teamName: awayTeamName,
            selected: selectedAwayPlayer,
            onSelect: handleAwayPlayerSelect,
            accent: "blue"
          })}
          fullWidthFooter={
            selectedHomePlayer && selectedAwayPlayer ? (
              <div className="pt-2 border-t border-border/60">
                <PlayerComparisonSection
                  player1={selectedHomePlayer}
                  player2={selectedAwayPlayer}
                  player1Stats={homePlayerStats || null}
                  player2Stats={awayPlayerStats || null}
                  isLoadingPlayer1Stats={isLoadingHomeStats}
                  isLoadingPlayer2Stats={isLoadingAwayStats}
                />
              </div>
            ) : null
          }
        />
      </div>
    </div>
  );
};
