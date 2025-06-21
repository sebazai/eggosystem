import React from "react";
import { usePlayerTrophies } from "../../hooks/data/usePlayerTrophies";
import { createNextUrl } from "@/lib/utils";
import Image from "next/image";

interface PlayerTrophiesProps {
  steamId: string;
}

export const PlayerTrophies = ({ steamId }: PlayerTrophiesProps) => {
  const { data, isLoading, error } = usePlayerTrophies(steamId);

  if (isLoading) return <div className="p-4">Loading trophies...</div>;
  if (error) return null;
  if (!data) return null;

  // Get rank image based on rank and subrank
  const getRankImage = (rank: string, subrank: number) => {
    if (rank === "TOP_COCK") {
      return createNextUrl("/images/ranks/topcock.png");
    }

    const rankLower = rank.toLowerCase();
    return createNextUrl(`/images/ranks/${rankLower}${subrank}.png`);
  };

  // Get rank alt text description
  const getRankDescription = (rank: string, subrank: number) => {
    if (rank === "TOP_COCK") {
      return "TOP COCK";
    }

    return `${rank} ${subrank}`;
  };

  const rankImage = getRankImage(data.rank, data.subrank);
  const rankDescription = getRankDescription(data.rank, data.subrank);

  return (
    <div className="bg-card p-3 rounded-lg mb-4">
      <h2 className="text-base font-bold mb-3">Trophies</h2>
      <div className="flex gap-3 items-center flex-wrap">
        {/* Kanarank trophy */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image
                src={rankImage}
                alt={rankDescription}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                title={rankDescription}
              />
            </div>

            {/* Show position for top 50 players */}
            {data.is_top50 && data.position && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-black">
                {data.position}
              </div>
            )}
          </div>
          <span className="text-xs mt-1">Kanarank</span>
        </div>
      </div>
    </div>
  );
};
