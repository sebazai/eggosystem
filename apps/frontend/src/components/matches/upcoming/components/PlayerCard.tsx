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
      selected: "bg-kanaliiga-orange/10 shadow-lg shadow-kanaliiga-orange/30",
      hover: "hover:bg-kanaliiga-orange/5",
      border: ""
    },
    blue: {
      selected: "bg-blue-500/10 shadow-lg shadow-blue-400/30",
      hover: "hover:bg-blue-500/5",
      border: ""
    }
  };

  return (
    <div className="cursor-pointer transition-all w-full" onClick={onSelect}>
      <div
        className={`relative rounded-lg ${
          isSelected
            ? colorClasses[teamColor].selected
            : `${colorClasses[teamColor].hover} ${colorClasses[teamColor].border}`
        }`}
      >
        <div className="h-24 sm:h-28 bg-gray-700 rounded-t-lg flex items-center justify-center">
          <User className="h-12 w-12 text-gray-400" />
        </div>

        {/* Country flag indicator */}
        <div className="absolute bottom-1 right-1 bg-black/70 rounded p-0.5">
          <Flag className="h-3 w-3 text-gray-300" />
        </div>

        <div
          className={`${
            teamColor === "orange" ? "bg-kanaliiga-orange/80" : "bg-blue-500/80"
          } text-center py-1 text-xs font-medium rounded-b-lg`}
        >
          {player.nickname}
        </div>
      </div>
    </div>
  );
};
