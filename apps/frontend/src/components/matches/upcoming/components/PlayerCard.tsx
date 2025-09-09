import React from "react";
import { User, Flag } from "lucide-react";
import type { Player, TeamColor } from "@eggosystem/types";

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
  teamColor: TeamColor;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected,
  onSelect,
  teamColor
}) => {
  const colorClasses = {
    orange: {
      selected:
        "bg-kanaliiga-orange/10 shadow-lg shadow-kanaliiga-orange/30 hover:bg-kanaliiga-orange/15 hover:shadow-kanaliiga-orange/40",
      hover:
        "hover:bg-kanaliiga-orange/5 hover:shadow-md hover:shadow-kanaliiga-orange/40",
      border: ""
    },
    blue: {
      selected:
        "bg-blue-500/10 shadow-lg shadow-blue-400/30 hover:bg-blue-500/15 hover:shadow-blue-400/40",
      hover: "hover:bg-blue-500/5 hover:shadow-md hover:shadow-blue-400/40",
      border: ""
    }
  };

  return (
    <div
      className="cursor-pointer transition-all duration-200 w-full group"
      onClick={onSelect}
    >
      <div
        className={`relative rounded-lg transition-all duration-200 ${
          isSelected
            ? colorClasses[teamColor].selected
            : `${colorClasses[teamColor].hover} ${colorClasses[teamColor].border}`
        }`}
      >
        <div className="h-24 sm:h-28 bg-gray-700 rounded-t-lg flex items-center justify-center group-hover:bg-gray-600 transition-colors">
          <User className="h-12 w-12 text-gray-400 group-hover:text-gray-300 transition-colors" />
        </div>

        {/* Country flag indicator */}
        <div className="absolute bottom-1 right-1 bg-black/70 rounded p-0.5 group-hover:bg-black/80 transition-colors">
          <Flag className="h-3 w-3 text-gray-300 group-hover:text-gray-200 transition-colors" />
        </div>

        <div
          className={`${
            teamColor === "orange"
              ? "bg-kanaliiga-orange/80 group-hover:bg-kanaliiga-orange/90"
              : "bg-blue-500/80 group-hover:bg-blue-500/90"
          } text-center py-1 text-xs font-medium rounded-b-lg transition-colors`}
        >
          {player.nickname}
        </div>
      </div>
    </div>
  );
};
