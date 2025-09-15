import React from "react";
import { User } from "lucide-react";
import type { Player, PlayerStatsResult } from "@eggosystem/types";
import Link from "next/link";
import { cn, createNextUrl } from "@/lib/utils";

interface PlayerStatsDisplayProps {
  playerStats: PlayerStatsResult | null;
  isLoading: boolean;
  color: "orange" | "blue";
}

interface PlayerComparisonStatsProps {
  player1Stats: PlayerStatsResult | null;
  player2Stats: PlayerStatsResult | null;
  isLoadingPlayer1Stats: boolean;
  isLoadingPlayer2Stats: boolean;
}

interface PlayerComparisonSectionProps {
  player1: Player;
  player2: Player;
  player1Stats: PlayerStatsResult | null;
  player2Stats: PlayerStatsResult | null;
  isLoadingPlayer1Stats: boolean;
  isLoadingPlayer2Stats: boolean;
}

const PlayerStatsDisplay: React.FC<PlayerStatsDisplayProps> = ({
  playerStats,
  isLoading,
  color
}) => {
  const colorClasses = {
    orange: "text-kanaliiga-orange",
    blue: "text-sky-400"
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className={`text-2xl font-bold ${colorClasses[color]}`}>
          {isLoading
            ? "Loading..."
            : playerStats?.kana_rating?.toFixed(2) || "N/A"}
        </div>
        <div className="text-sm text-muted-foreground">Rating</div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <div className={`text-lg font-semibold ${colorClasses[color]}`}>
            {isLoading ? "..." : playerStats?.kd?.toFixed(2) || "N/A"}
          </div>
          <div className="text-xs text-muted-foreground">K/D</div>
        </div>
        <div>
          <div className={`text-lg font-semibold ${colorClasses[color]}`}>
            {isLoading ? "..." : playerStats?.adr?.toFixed(1) || "N/A"}
          </div>
          <div className="text-xs text-muted-foreground">ADR</div>
        </div>
        <div>
          <div className={`text-lg font-semibold ${colorClasses[color]}`}>
            {isLoading ? "..." : playerStats?.hs_percent?.toFixed(1) || "N/A"}%
          </div>
          <div className="text-xs text-muted-foreground">HS%</div>
        </div>
        <div>
          <div className={`text-lg font-semibold ${colorClasses[color]}`}>
            {isLoading ? "..." : playerStats?.maps_played || "0"}
          </div>
          <div className="text-xs text-muted-foreground">Maps</div>
        </div>
      </div>
    </div>
  );
};

const PlayerComparisonStats: React.FC<PlayerComparisonStatsProps> = ({
  player1Stats,
  player2Stats,
  isLoadingPlayer1Stats,
  isLoadingPlayer2Stats
}) => {
  return (
    <div className="grid grid-cols-2 gap-8">
      <PlayerStatsDisplay
        playerStats={player1Stats}
        isLoading={isLoadingPlayer1Stats}
        color="orange"
      />
      <PlayerStatsDisplay
        playerStats={player2Stats}
        isLoading={isLoadingPlayer2Stats}
        color="blue"
      />
    </div>
  );
};

const PlayerComparisonPlayerCard = ({
  player,
  color
}: {
  player: Player;
  color: "orange" | "blue";
}) => {
  return (
    <div className="text-center">
      <Link
        href={createNextUrl(`/players/${player.steamId}`)}
        className="block"
      >
        <div
          className={cn(
            `rounded-lg p-4 border cursor-pointer transition-all duration-200 group`,
            color === "orange"
              ? "bg-kanaliiga-orange/20 border-kanaliiga-orange/30 hover:bg-kanaliiga-orange/30 hover:border-kanaliiga-orange/40 hover:shadow-lg hover:shadow-kanaliiga-orange/20"
              : "bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20"
          )}
        >
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-600 transition-colors">
            <User className="h-8 w-8 text-gray-400 group-hover:text-gray-300 transition-colors" />
          </div>
          <h4
            className={cn(
              "font-bold text-lg transition-colors",
              color === "orange"
                ? "text-kanaliiga-orange group-hover:text-kanaliiga-orange/90"
                : "text-blue-500 group-hover:text-blue-400"
            )}
          >
            {player.nickname}
          </h4>
        </div>
      </Link>
    </div>
  );
};

export const PlayerComparisonSection: React.FC<
  PlayerComparisonSectionProps
> = ({
  player1,
  player2,
  player1Stats,
  player2Stats,
  isLoadingPlayer1Stats,
  isLoadingPlayer2Stats
}) => {
  return (
    <div className="bg-gradient-to-r from-kanaliiga-orange/10 dark:via-gray-800/50 to-blue-500/10 p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold mb-6 text-center">
        Head to Head Comparison
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <PlayerComparisonPlayerCard player={player1} color="orange" />

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400 mb-4">VS</div>
          <PlayerComparisonStats
            player1Stats={player1Stats}
            player2Stats={player2Stats}
            isLoadingPlayer1Stats={isLoadingPlayer1Stats}
            isLoadingPlayer2Stats={isLoadingPlayer2Stats}
          />
        </div>

        <PlayerComparisonPlayerCard player={player2} color="blue" />
      </div>
    </div>
  );
};
