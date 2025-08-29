import React from "react";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Player } from "@eggosystem/types";

interface PlayerComparisonSectionProps {
  player1: Player;
  player2: Player;
  ComparisonStats: React.ComponentType<{
    player1: Player;
    player2: Player;
  }>;
}

export const PlayerComparisonSection: React.FC<
  PlayerComparisonSectionProps
> = ({ player1, player2, ComparisonStats }) => {
  const router = useRouter();

  const handlePlayer1Click = () => {
    router.push(`/players/${player1.steamId}`);
  };

  const handlePlayer2Click = () => {
    router.push(`/players/${player2.steamId}`);
  };

  return (
    <div className="bg-gradient-to-r from-kanaliiga-orange/10 via-gray-800/50 to-blue-500/10 p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold mb-6 text-center">
        Head to Head Comparison
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Player 1 Info */}
        <div className="text-center">
          <div
            className="bg-kanaliiga-orange/20 rounded-lg p-4 border border-kanaliiga-orange/30 cursor-pointer hover:bg-kanaliiga-orange/30 transition-colors"
            onClick={handlePlayer1Click}
          >
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="font-bold text-kanaliiga-orange text-lg">
              {player1.nickname}
            </h4>
            <p className="text-sm text-gray-300">{player1.name}</p>
          </div>
        </div>

        {/* VS and Stats Comparison */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400 mb-4">VS</div>
          <ComparisonStats player1={player1} player2={player2} />
        </div>

        {/* Player 2 Info */}
        <div className="text-center">
          <div
            className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30 cursor-pointer hover:bg-blue-500/30 transition-colors"
            onClick={handlePlayer2Click}
          >
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="font-bold text-blue-400 text-lg">
              {player2.nickname}
            </h4>
            <p className="text-sm text-gray-300">{player2.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
