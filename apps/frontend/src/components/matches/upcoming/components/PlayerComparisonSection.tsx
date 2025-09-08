import React from "react";
import { User } from "lucide-react";
import type { Player } from "@eggosystem/types";
import Link from "next/link";

interface PlayerComparisonSectionProps {
  player1: Player;
  player2: Player;
  ComparisonStats: React.ComponentType<{
    player1: Player;
    player2: Player;
  }>;
}

const PlayerComparisonPlayerCard = ({ player }: { player: Player }) => {
  return (
    <div className="text-center">
      <Link
        className="bg-kanaliiga-orange/20 rounded-lg p-4 border border-kanaliiga-orange/30 cursor-pointer hover:bg-kanaliiga-orange/30 transition-colors block"
        href={`/players/${player.steamId}`}
      >
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h4 className="font-bold text-kanaliiga-orange text-lg">
          {player.nickname}
        </h4>
      </Link>
    </div>
  );
};

export const PlayerComparisonSection: React.FC<
  PlayerComparisonSectionProps
> = ({ player1, player2, ComparisonStats }) => {
  return (
    <div className="bg-gradient-to-r from-kanaliiga-orange/10 dark:via-gray-800/50 to-blue-500/10 p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold mb-6 text-center">
        Head to Head Comparison
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <PlayerComparisonPlayerCard player={player1} />

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400 mb-4">VS</div>
          <ComparisonStats player1={player1} player2={player2} />
        </div>

        <PlayerComparisonPlayerCard player={player2} />
      </div>
    </div>
  );
};
