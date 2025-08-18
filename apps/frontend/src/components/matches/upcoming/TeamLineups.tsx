"use client";

import React, { useState, useEffect } from "react";
import type { FilterParamsQuery } from "@/lib/utils";
import { User, Flag, Flame, Snowflake } from "lucide-react";

interface TeamLineupsProps {
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

interface Player {
  id: number;
  name: string;
  nickname: string;
  countryCode?: string;
  avatar?: string;
  isHotstreak?: boolean;
  isColdstreak?: boolean;
  stats?: Record<string, number>;
}

export const TeamLineups = ({ teams }: TeamLineupsProps) => {
  // Get team names safely - IDs not needed in this component

  // Get team names safely
  const team1Name = teams[0]?.name || "Team 1";
  const team2Name = teams[1]?.name || "Team 2";

  // Mock players data for demonstration
  const team1Players: Player[] = [
    {
      id: 101,
      name: "John Smith",
      nickname: "JSmith",
      countryCode: "FI",
      isHotstreak: true,
      stats: {
        rating: 1.28,
        kd: 1.32,
        adr: 88.5,
        kpr: 0.78,
        impact: 1.25,
        hs: 48.2
      }
    },
    {
      id: 102,
      name: "Michael Johnson",
      nickname: "mikey",
      countryCode: "FI",
      stats: {
        rating: 1.08,
        kd: 1.12,
        adr: 76.3,
        kpr: 0.65,
        impact: 1.05,
        hs: 52.7
      }
    },
    {
      id: 103,
      name: "Robert Brown",
      nickname: "rBrown",
      countryCode: "SE",
      isColdstreak: true,
      stats: {
        rating: 0.87,
        kd: 0.92,
        adr: 68.4,
        kpr: 0.56,
        impact: 0.84,
        hs: 44.9
      }
    },
    {
      id: 104,
      name: "Daniel Wilson",
      nickname: "dWilson",
      countryCode: "FI",
      stats: {
        rating: 1.18,
        kd: 1.23,
        adr: 82.1,
        kpr: 0.72,
        impact: 1.15,
        hs: 50.5
      }
    },
    {
      id: 105,
      name: "David Taylor",
      nickname: "DaveTay",
      countryCode: "NO",
      stats: {
        rating: 1.04,
        kd: 1.08,
        adr: 74.9,
        kpr: 0.64,
        impact: 1.02,
        hs: 47.3
      }
    }
  ];

  const team2Players: Player[] = [
    {
      id: 201,
      name: "James Anderson",
      nickname: "JAnderson",
      countryCode: "SE",
      isHotstreak: true,
      stats: {
        rating: 1.32,
        kd: 1.38,
        adr: 91.2,
        kpr: 0.82,
        impact: 1.29,
        hs: 51.8
      }
    },
    {
      id: 202,
      name: "Thomas White",
      nickname: "TWhite",
      countryCode: "FI",
      stats: {
        rating: 1.14,
        kd: 1.19,
        adr: 79.4,
        kpr: 0.69,
        impact: 1.12,
        hs: 49.6
      }
    },
    {
      id: 203,
      name: "Christopher Harris",
      nickname: "CHarris",
      countryCode: "NO",
      stats: {
        rating: 1.09,
        kd: 1.13,
        adr: 77.8,
        kpr: 0.67,
        impact: 1.07,
        hs: 48.1
      }
    },
    {
      id: 204,
      name: "Mark Lewis",
      nickname: "MLewis",
      countryCode: "FI",
      isColdstreak: true,
      stats: {
        rating: 0.91,
        kd: 0.95,
        adr: 70.2,
        kpr: 0.58,
        impact: 0.88,
        hs: 45.7
      }
    },
    {
      id: 205,
      name: "William Clark",
      nickname: "WClark",
      countryCode: "FI",
      stats: {
        rating: 1.01,
        kd: 1.05,
        adr: 73.6,
        kpr: 0.62,
        impact: 0.98,
        hs: 46.9
      }
    }
  ];

  // State for selected players
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);

  // Initialize with first player from each team selected by default
  useEffect(() => {
    if (team1Players.length > 0 && !selectedPlayer1) {
      setSelectedPlayer1(team1Players[0]);
    }
    if (team2Players.length > 0 && !selectedPlayer2) {
      setSelectedPlayer2(team2Players[0]);
    }
  }, [team1Players, team2Players, selectedPlayer1, selectedPlayer2]);

  // Click handlers for player selection
  const selectPlayer1 = (player: Player) => {
    setSelectedPlayer1(player);
  };

  const selectPlayer2 = (player: Player) => {
    setSelectedPlayer2(player);
  };

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Team Lineups</h2>

        <div className="flex flex-col lg:flex-row">
          {/* Team 1 Lineup */}
          <div>
            <h3 className="text-lg font-medium mb-2">{team1Name}</h3>
            <div className="flex flex-wrap gap-2">
              {team1Players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayer1?.id === player.id}
                  onSelect={() => selectPlayer1(player)}
                />
              ))}
            </div>
          </div>

          {/* Player vs Player Comparison (shown when both players are selected) */}
          {selectedPlayer1 && selectedPlayer2 && (
            <div className="mt-6 lg:mt-0 lg:mx-4 flex-1 flex flex-col justify-center">
              <div className="bg-kanaliiga-light-brown/10 p-3 rounded-md">
                <h3 className="text-lg font-medium mb-3 text-center">
                  Head to Head
                </h3>

                <div className="flex items-center justify-between mb-2">
                  <div className="text-center">
                    <span className="font-bold text-kanaliiga-orange">
                      {selectedPlayer1.nickname}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-blue-500">
                      {selectedPlayer2.nickname}
                    </span>
                  </div>
                </div>

                {/* Stats Comparison */}
                <ComparisonStats
                  player1={selectedPlayer1}
                  player2={selectedPlayer2}
                />
              </div>
            </div>
          )}

          {/* Team 2 Lineup */}
          <div>
            <h3 className="text-lg font-medium mb-2">{team2Name}</h3>
            <div className="flex flex-wrap gap-2">
              {team2Players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayer2?.id === player.id}
                  onSelect={() => selectPlayer2(player)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected,
  onSelect
}) => {
  return (
    <div
      className={`cursor-pointer transition-all ${
        isSelected
          ? "ring-2 ring-kanaliiga-orange"
          : "hover:bg-kanaliiga-light-brown/10"
      }`}
      onClick={onSelect}
    >
      <div className="relative w-20 sm:w-24">
        <div className="h-20 sm:h-24 bg-gray-700 flex items-center justify-center">
          <User className="h-10 w-10 text-gray-400" />
        </div>

        {/* Country flag indicator */}
        <div className="absolute bottom-0 right-0 bg-black/50 p-0.5">
          <Flag className="h-3 w-3" />
        </div>

        {/* Hot streak indicator */}
        {player.isHotstreak && (
          <div className="absolute -top-1 -right-1">
            <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
          </div>
        )}

        {/* Cold streak indicator */}
        {player.isColdstreak && (
          <div className="absolute -top-1 -right-1">
            <Snowflake className="h-6 w-6 text-blue-400 fill-blue-400" />
          </div>
        )}

        <div className="bg-black/80 text-white text-center py-1 text-xs">
          {player.nickname}
        </div>
      </div>
    </div>
  );
};

interface ComparisonStatsProps {
  player1: Player;
  player2: Player;
}

const ComparisonStats: React.FC<ComparisonStatsProps> = ({
  player1,
  player2
}) => {
  const stats = [
    { label: "Rating", key: "rating" },
    { label: "K/D Ratio", key: "kd" },
    { label: "ADR", key: "adr" },
    { label: "KPR", key: "kpr" },
    { label: "Impact", key: "impact" },
    { label: "HS%", key: "hs", format: (val: number) => `${val}%` }
  ];

  return (
    <div className="space-y-2">
      {stats.map((stat) => (
        <StatRow
          key={stat.key}
          label={stat.label}
          value1={player1.stats?.[stat.key] || 0}
          value2={player2.stats?.[stat.key] || 0}
          format={stat.format}
        />
      ))}
    </div>
  );
};

interface StatRowProps {
  label: string;
  value1: number;
  value2: number;
  format?: (val: number) => string;
}

const StatRow: React.FC<StatRowProps> = ({
  label,
  value1,
  value2,
  format = (val) => val.toFixed(2)
}) => {
  const winner = value1 > value2 ? 1 : value1 < value2 ? 2 : 0;

  return (
    <div className="flex items-center text-sm">
      {/* Value 1 */}
      <div className="flex-1 text-right">
        <span
          className={
            winner === 1 ? "text-green-500 font-semibold" : "text-white"
          }
        >
          {format(value1)}
        </span>
      </div>

      {/* Label */}
      <div className="px-3 text-xs text-muted-foreground">{label}</div>

      {/* Value 2 */}
      <div className="flex-1 text-left">
        <span
          className={
            winner === 2 ? "text-green-500 font-semibold" : "text-white"
          }
        >
          {format(value2)}
        </span>
      </div>
    </div>
  );
};
